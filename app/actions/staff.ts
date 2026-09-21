"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { getSession, requireShop } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { sendEmails } from "@/lib/email";
import { addDays, dateKey, fromDateKey, toMinutes, weekDays } from "@/lib/planner";
import { emailSchema, type ActionResult } from "@/lib/validation";
import type { AvailabilityWindow, CafeStaff } from "@/lib/database.types";

// Staff contracts: weekly hours targets, default schedules, and linking a
// staff row to a real barista account. Linking always goes through an invite
// the barista accepts — a café never attaches an account unilaterally.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_RE = /^\d{2}:\d{2}$/;

function validDefaultWeek(windows: AvailabilityWindow[]): boolean {
  if (!Array.isArray(windows) || windows.length > 7) return false;
  const seen = new Set<number>();
  for (const w of windows) {
    if (!Number.isInteger(w.day) || w.day < 0 || w.day > 6 || seen.has(w.day)) return false;
    if (!HHMM_RE.test(w.start) || !HHMM_RE.test(w.end)) return false;
    if (toMinutes(w.end) <= toMinutes(w.start)) return false;
    seen.add(w.day);
  }
  return true;
}

export async function updateStaffContract(input: {
  staffId: string;
  weeklyHoursTarget: number | null;
  defaultWeek: AvailabilityWindow[];
}): Promise<ActionResult> {
  const target =
    input.weeklyHoursTarget == null ? null : Math.round(Number(input.weeklyHoursTarget));
  if (target !== null && (Number.isNaN(target) || target < 1 || target > 80)) {
    return { ok: false, error: "Weekly hours must be between 1 and 80." };
  }
  if (!validDefaultWeek(input.defaultWeek)) {
    return { ok: false, error: "That default schedule doesn't look right." };
  }
  await requireShop();
  const supabase = await createClient();
  const { error } = await supabase
    .from("cafe_staff")
    .update({ weekly_hours_target: target, default_week: input.defaultWeek })
    .eq("id", input.staffId);
  if (error) return { ok: false, error: "Could not save. Try again." };
  revalidatePath("/cafe/staff");
  revalidatePath("/cafe/planner");
  return { ok: true };
}

/**
 * Invite by email, or — when `userId` is set from account search — invite a
 * specific barista. Either way it's a token link the barista must accept.
 */
export async function inviteStaff(input: {
  staffId: string;
  email?: string;
  extraUserId?: string;
}): Promise<ActionResult> {
  const { shop } = await requireShop();
  if (!hasAdminClient()) return { ok: false, error: "Invites aren't available right now." };
  const admin = createAdminClient();

  const { data: staffRow } = await admin
    .from("cafe_staff")
    .select("id, shop_id, name, user_id")
    .eq("id", input.staffId)
    .eq("shop_id", shop.id)
    .maybeSingle();
  if (!staffRow) return { ok: false, error: "That staff member no longer exists." };
  if (staffRow.user_id) return { ok: false, error: "They already have a linked account." };

  let email: string | null = null;
  let notifyUserId: string | null = null;

  if (input.extraUserId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", input.extraUserId)
      .maybeSingle();
    if (!profile || profile.role !== "extra") {
      return { ok: false, error: "That barista account wasn't found." };
    }
    const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
    email = authUser?.user?.email ?? null;
    notifyUserId = profile.id;
  } else {
    const parsed = emailSchema.safeParse(
      String(input.email ?? "")
        .trim()
        .toLowerCase(),
    );
    if (!parsed.success) return { ok: false, error: "Enter a valid email address" };
    email = parsed.data;
    // If that address already has an account, ping them in-app too.
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
    notifyUserId = users?.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
  }

  const token = randomUUID().replace(/-/g, "");
  const { error } = await admin
    .from("cafe_staff")
    .update({ invite_email: email, invite_token: token })
    .eq("id", staffRow.id);
  if (error) return { ok: false, error: "Could not create the invite. Try again." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://baristagigs.com";
  const joinUrl = `${appUrl}/staff/join/${token}`;
  if (email) {
    await sendEmails([
      {
        to: email,
        subject: `${shop.name} added you to their staff planner`,
        title: `${shop.name} wants to plan your shifts on Barista Gigs`,
        body: `${shop.name} schedules their team on Barista Gigs. Accept to see your rota, your hours, and mark days you're off — free, always.`,
        ctaLabel: "View and accept",
        ctaUrl: joinUrl,
        footer: `${shop.name} sent this from Barista Gigs. We won't email you again unless you accept.`,
      },
    ]);
  }
  if (notifyUserId) {
    await notify(notifyUserId, {
      type: "team_invite",
      title: `${shop.name} added you to their staff planner`,
      body: "Accept to see your rota and mark your days off.",
      href: `/staff/join/${token}`,
    });
  }

  revalidatePath("/cafe/staff");
  return { ok: true };
}

export async function revokeStaffInvite(staffId: string): Promise<ActionResult> {
  await requireShop();
  const supabase = await createClient();
  const { error } = await supabase
    .from("cafe_staff")
    .update({ invite_email: null, invite_token: null })
    .eq("id", staffId);
  if (error) return { ok: false, error: "Could not revoke the invite." };
  revalidatePath("/cafe/staff");
  return { ok: true };
}

export async function unlinkStaff(staffId: string): Promise<ActionResult> {
  await requireShop();
  const supabase = await createClient();
  const { error } = await supabase
    .from("cafe_staff")
    .update({ user_id: null, invite_email: null, invite_token: null })
    .eq("id", staffId);
  if (error) return { ok: false, error: "Could not unlink the account." };
  revalidatePath("/cafe/staff");
  return { ok: true };
}

/** Barista-side: search is café-side; acceptance is here, via the token. */
export async function acceptStaffInvite(token: string): Promise<ActionResult> {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Log in first." };
  if (!hasAdminClient()) return { ok: false, error: "Invites aren't available right now." };
  const admin = createAdminClient();

  const { data: staffRow } = await admin
    .from("cafe_staff")
    .select("id, shop_id, name, user_id")
    .eq("invite_token", token)
    .maybeSingle();
  if (!staffRow) return { ok: false, error: "This invite link isn't valid." };
  if (staffRow.user_id) return { ok: false, error: "This invite was already used." };

  const { data: extra } = await admin
    .from("extras_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!extra) {
    return { ok: false, error: "Staff links are for barista accounts — log in as a barista." };
  }

  const { error } = await admin
    .from("cafe_staff")
    .update({ user_id: user.id, invite_email: null, invite_token: null })
    .eq("id", staffRow.id)
    .is("user_id", null);
  if (error) return { ok: false, error: "Could not accept the invite. Try again." };

  const { data: shop } = await admin
    .from("coffee_shops")
    .select("name, owner_id")
    .eq("id", staffRow.shop_id)
    .maybeSingle();
  if (shop) {
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    await notify(shop.owner_id, {
      type: "team_joined",
      title: `${profile?.display_name ?? staffRow.name} linked their account to your staff planner`,
      body: "They can now see their rota and mark days off.",
      href: "/cafe/staff",
    });
  }

  revalidatePath("/schedule");
  return { ok: true };
}

/**
 * Materializes every staff member's default week into the visible week.
 * Skips shifts that already exist at the same time and days marked off, so
 * re-running is safe.
 */
export async function applyDefaultWeek(
  weekStart: string,
): Promise<ActionResult<{ created: number }>> {
  if (!DATE_RE.test(weekStart)) return { ok: false, error: "Pick a valid week." };
  const { shop } = await requireShop();
  const supabase = await createClient();
  const days = weekDays(weekStart);

  const [{ data: staff }, { data: existing }, { data: timeOff }] = await Promise.all([
    supabase.from("cafe_staff").select("id, default_week").eq("shop_id", shop.id),
    supabase
      .from("planner_shifts")
      .select("staff_id, date, start_min, end_min")
      .eq("shop_id", shop.id)
      .in("date", days),
    supabase
      .from("staff_time_off")
      .select("staff_id, date")
      .eq("shop_id", shop.id)
      .in("date", days),
  ]);

  const taken = new Set(
    (existing ?? []).map((row) => `${row.staff_id}|${row.date}|${row.start_min}|${row.end_min}`),
  );
  const off = new Set((timeOff ?? []).map((row) => `${row.staff_id}|${row.date}`));
  const monday = fromDateKey(weekStart);

  const rows: {
    shop_id: string;
    staff_id: string;
    date: string;
    start_min: number;
    end_min: number;
  }[] = [];
  for (const person of (staff ?? []) as Pick<CafeStaff, "id" | "default_week">[]) {
    for (const window of person.default_week ?? []) {
      const date = dateKey(addDays(monday, window.day));
      const startMin = toMinutes(window.start);
      const endMin = toMinutes(window.end);
      if (off.has(`${person.id}|${date}`)) continue;
      if (taken.has(`${person.id}|${date}|${startMin}|${endMin}`)) continue;
      rows.push({
        shop_id: shop.id,
        staff_id: person.id,
        date,
        start_min: startMin,
        end_min: endMin,
      });
    }
  }

  if (rows.length === 0) return { ok: true, data: { created: 0 } };
  const { error } = await supabase.from("planner_shifts").insert(rows);
  if (error) return { ok: false, error: "Could not fill the week. Try again." };
  revalidatePath("/cafe/planner");
  return { ok: true, data: { created: rows.length } };
}

/** Both sides can call these — RLS decides who may touch which rows. */
export async function markTimeOff(input: {
  staffId: string;
  date: string;
  note?: string;
}): Promise<ActionResult> {
  if (!DATE_RE.test(input.date)) return { ok: false, error: "Pick a valid date." };
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Log in first." };
  const supabase = await createClient();

  const { data: staffRow } = await supabase
    .from("cafe_staff")
    .select("id, shop_id, name, user_id")
    .eq("id", input.staffId)
    .maybeSingle();
  if (!staffRow) return { ok: false, error: "That staff row wasn't found." };

  const { error } = await supabase.from("staff_time_off").insert({
    shop_id: staffRow.shop_id,
    staff_id: staffRow.id,
    date: input.date,
    note: input.note?.trim().slice(0, 200) || null,
  });
  if (error) return { ok: false, error: "Could not mark that day — is it already marked?" };

  // A barista marking themselves off should reach the café before the shift
  // does: notify the owner.
  if (staffRow.user_id === user.id && hasAdminClient()) {
    const admin = createAdminClient();
    const { data: shop } = await admin
      .from("coffee_shops")
      .select("name, owner_id")
      .eq("id", staffRow.shop_id)
      .maybeSingle();
    if (shop) {
      await notify(shop.owner_id, {
        type: "staff_time_off",
        title: `${staffRow.name} marked ${input.date} as off`,
        body: input.note?.trim() ? `“${input.note.trim().slice(0, 140)}”` : undefined,
        href: `/cafe/planner?week=${input.date}`,
      });
    }
  }

  revalidatePath("/schedule");
  revalidatePath("/cafe/planner");
  return { ok: true };
}

export async function removeTimeOff(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("staff_time_off").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not remove it. Try again." };
  revalidatePath("/schedule");
  revalidatePath("/cafe/planner");
  return { ok: true };
}

/** Café-side account search, scoped by the same RLS the baristas browser uses. */
export async function searchBaristas(
  query: string,
): Promise<ActionResult<{ userId: string; name: string; avatarUrl: string | null }[]>> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { ok: true, data: [] };
  await requireShop();
  const supabase = await createClient();
  const { data } = await supabase
    .from("extras_profiles")
    .select("user_id, profiles:user_id(display_name, avatar_url)")
    .limit(30);
  const rows = (data ?? []) as unknown as {
    user_id: string;
    profiles: { display_name: string; avatar_url: string | null } | null;
  }[];
  const needle = trimmed.toLowerCase();
  return {
    ok: true,
    data: rows
      .filter((row) => row.profiles?.display_name.toLowerCase().includes(needle))
      .slice(0, 6)
      .map((row) => ({
        userId: row.user_id,
        name: row.profiles?.display_name ?? "Barista",
        avatarUrl: row.profiles?.avatar_url ?? null,
      })),
  };
}
