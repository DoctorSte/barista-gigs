"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { getSession, requireShop } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { sendEmails, sendScheduledEmail } from "@/lib/email";
import { addDays, dateKey, fromDateKey, toHHMM, toMinutes, weekDays } from "@/lib/planner";
import { emailSchema, type ActionResult } from "@/lib/validation";
import { emailAllowed } from "@/lib/notification-prefs";
import type { NotificationPrefs } from "@/lib/database.types";
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
    await queueStaffChangeEmail(staffRow);
  }

  revalidatePath("/schedule");
  revalidatePath("/cafe/planner");
  return { ok: true };
}

export async function removeTimeOff(id: string): Promise<ActionResult> {
  const { user } = await getSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("staff_time_off")
    .select("staff_id, cafe_staff:staff_id(id, name, user_id, shop_id)")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("staff_time_off").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not remove it. Try again." };

  // Unmarking a day is an availability change too — same debounced email.
  const staffRow = (row as unknown as {
    cafe_staff: { id: string; name: string; user_id: string | null; shop_id: string } | null;
  } | null)?.cafe_staff;
  if (staffRow && user && staffRow.user_id === user.id) {
    await queueStaffChangeEmail(staffRow);
  }

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

// One email per quiet window when a linked barista edits their days off —
// toggling five times in ten minutes shouldn't send five emails. The email
// is generic ("see the planner"), so later changes inside the window ride
// along for free.
const CHANGE_EMAIL_DELAY_MS = 20 * 60 * 1000;

async function queueStaffChangeEmail(staff: { id: string; shop_id: string; name: string }) {
  if (!hasAdminClient()) return;
  try {
    const admin = createAdminClient();
    const { data: pending } = await admin
      .from("pending_staff_emails")
      .select("send_at")
      .eq("staff_id", staff.id)
      .maybeSingle();
    if (pending && new Date(pending.send_at) > new Date()) return;

    const { data: shop } = await admin
      .from("coffee_shops")
      .select("name, owner_id")
      .eq("id", staff.shop_id)
      .maybeSingle();
    if (!shop) return;
    const { data: prefs } = await admin
      .from("notification_prefs")
      .select("*")
      .eq("user_id", shop.owner_id)
      .maybeSingle();
    if (!emailAllowed(prefs as NotificationPrefs | null, "staff_time_off")) return;
    const { data: owner } = await admin.auth.admin.getUserById(shop.owner_id);
    const to = owner?.user?.email;
    if (!to) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://baristagigs.com";
    const sendAt = new Date(Date.now() + CHANGE_EMAIL_DELAY_MS);
    const sent = await sendScheduledEmail(
      {
        to,
        subject: `${staff.name} updated their availability at ${shop.name}`,
        title: `${staff.name} updated their availability`,
        body: "They changed their days off in the last few minutes. The planner always shows the current rota.",
        ctaLabel: "Open the planner",
        ctaUrl: `${appUrl}/cafe/planner`,
      },
      sendAt,
    );
    if (sent) {
      await admin
        .from("pending_staff_emails")
        .upsert({ staff_id: staff.id, send_at: sendAt.toISOString() });
    }
  } catch {
    // Best-effort; never block the change itself.
  }
}

/**
 * A linked barista backs out of an upcoming staff shift. Deliberate enough
 * to warrant a dialog on their side and an immediate email to the café —
 * with their reason, if they gave one.
 */
export async function cancelStaffShift(input: {
  plannerShiftId: string;
  reason?: string;
}): Promise<ActionResult> {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Log in first." };
  if (!hasAdminClient()) return { ok: false, error: "Try again later." };
  const admin = createAdminClient();

  const { data: shift } = await admin
    .from("planner_shifts")
    .select("id, shop_id, staff_id, date, start_min, end_min")
    .eq("id", input.plannerShiftId)
    .maybeSingle();
  if (!shift) return { ok: false, error: "That shift no longer exists." };

  const { data: staffRow } = await admin
    .from("cafe_staff")
    .select("id, name, user_id, shop_id")
    .eq("id", shift.staff_id)
    .maybeSingle();
  if (!staffRow || staffRow.user_id !== user.id || staffRow.shop_id !== shift.shop_id) {
    return { ok: false, error: "This isn't your shift." };
  }
  if (shift.date < dateKey(new Date())) {
    return { ok: false, error: "That shift is in the past." };
  }

  const { error } = await admin.from("planner_shifts").delete().eq("id", shift.id);
  if (error) return { ok: false, error: "Could not cancel the shift. Try again." };

  const { data: shop } = await admin
    .from("coffee_shops")
    .select("name, owner_id")
    .eq("id", shift.shop_id)
    .maybeSingle();
  if (shop) {
    const when = fromDateKey(shift.date).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const reason = input.reason?.trim().slice(0, 300);
    await notify(shop.owner_id, {
      type: "staff_shift_cancelled",
      title: `${staffRow.name} cancelled their shift on ${when}`,
      body: `${toHHMM(shift.start_min)}–${toHHMM(shift.end_min % 1440)}${reason ? ` — “${reason}”` : ""}`,
      href: `/cafe/planner?week=${shift.date}`,
    });
  }

  revalidatePath("/schedule");
  revalidatePath("/cafe/planner");
  return { ok: true };
}
