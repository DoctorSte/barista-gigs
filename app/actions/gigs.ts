"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireShop } from "@/lib/auth";
import { notify, notifyMany } from "@/lib/notifications";
import { firstZodError, gigSchema, type ActionResult } from "@/lib/validation";
import { PLANS, isPlanId } from "@/lib/plans";
import type { AnnouncementStatus } from "@/lib/database.types";

function parseGigForm(formData: FormData) {
  const dates = formData.getAll("shiftDate").map(String);
  const startTimes = formData.getAll("shiftStart").map(String);
  const endTimes = formData.getAll("shiftEnd").map(String);
  const shifts = dates
    .map((date, index) => ({
      date,
      start: startTimes[index] ?? "",
      end: endTimes[index] ?? "",
    }))
    .sort((a, b) => `${a.date}T${a.start}`.localeCompare(`${b.date}T${b.start}`));

  const kind = String(formData.get("kind") ?? "shift");

  return gigSchema.safeParse({
    kind,
    title: formData.get("title") ?? "",
    description: formData.get("description"),
    shifts: kind === "shift" ? shifts : [],
    weeklyHours: formData.get("weeklyHours") ? Number(formData.get("weeklyHours")) : null,
    payRateCents: formData.get("payRate") ? Math.round(Number(formData.get("payRate")) * 100) : 0,
    payType: formData.get("payType"),
    requiredSkills: formData.getAll("requiredSkills"),
    isSos: kind === "shift" && formData.get("isSos") === "true",
    status: formData.get("status") ?? "open",
  });
}

// Jobs have no shift dates; starts_at/ends_at hold a 90-day visibility window
// so the open-gigs listing (which filters on ends_at) keeps working.
const JOB_LISTING_DAYS = 90;

type ParsedShift = { date: string; start: string; end: string };

// An end time at or before the start means the shift runs past midnight.
function shiftBounds(shift: ParsedShift) {
  const start = new Date(`${shift.date}T${shift.start}`);
  let end = new Date(`${shift.date}T${shift.end}`);
  if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function shiftSpan(shifts: ParsedShift[]) {
  const bounds = shifts.map(shiftBounds);
  const startsAt = new Date(Math.min(...bounds.map((b) => b.start.getTime())));
  const endsAt = new Date(Math.max(...bounds.map((b) => b.end.getTime())));
  return { startsAt, endsAt };
}

function defaultTitle(shifts: ParsedShift[]) {
  const first = new Date(`${shifts[0].date}T00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return shifts.length === 1
    ? `Barista shift · ${first}`
    : `${shifts.length} barista shifts · from ${first}`;
}

function listingSpanAndTitle(data: {
  kind: "shift" | "full_time" | "part_time";
  shifts: ParsedShift[];
  title: string;
}) {
  if (data.kind === "shift") {
    const { startsAt, endsAt } = shiftSpan(data.shifts);
    return { startsAt, endsAt, title: data.title || defaultTitle(data.shifts) };
  }
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + JOB_LISTING_DAYS * 24 * 60 * 60 * 1000);
  return {
    startsAt,
    endsAt,
    title: data.title || (data.kind === "full_time" ? "Full-time barista" : "Part-time barista"),
  };
}

const SUBSCRIPTION_HINT =
  "You need an active subscription to post gigs. Head to Billing to activate one.";

export async function createGig(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user, shop } = await requireShop();
  const parsed = parseGigForm(formData);
  if (!parsed.success) {
    const { message, field } = firstZodError(parsed.error);
    return { ok: false, error: message, field };
  }

  const { startsAt, endsAt, title } = listingSpanAndTitle(parsed.data);
  const supabase = await createClient();

  // Plan limit: the Occasional plan caps listings per rolling year. Posting
  // already requires an active subscription via RLS, so no status check here;
  // a missing row is treated as the default "regular" plan.
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("shop_id", shop.id)
    .maybeSingle();
  const planId = subscription?.plan;
  const plan = PLANS[isPlanId(planId) ? planId : "regular"];
  if (plan.gigsPerYear !== null) {
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shop.id)
      .gte("created_at", yearAgo);
    if ((count ?? 0) >= plan.gigsPerYear) {
      return {
        ok: false,
        error:
          "You've used all 6 listings on the Occasional plan this year — upgrade to Regular for unlimited gigs.",
      };
    }
  }

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      shop_id: shop.id,
      city_id: shop.city_id,
      title,
      description: parsed.data.description,
      kind: parsed.data.kind,
      weekly_hours: parsed.data.kind === "shift" ? null : parsed.data.weeklyHours,
      is_sos: parsed.data.isSos,
      shifts: parsed.data.shifts,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      pay_rate_cents: parsed.data.payRateCents,
      pay_type: parsed.data.payType,
      required_skills: parsed.data.requiredSkills,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error || !data) {
    // 42501 = RLS violation — the insert policy requires an active subscription.
    if (error?.code === "42501") return { ok: false, error: SUBSCRIPTION_HINT };
    return { ok: false, error: "Could not create the gig. Try again." };
  }

  // Best-effort follow-ups; never fail the publish because of them.
  try {
    if (parsed.data.isSos && parsed.data.status === "open") {
      // SOS blast: ping every available barista in the city (cap for sanity).
      const { data: extras } = await supabase
        .from("extras_profiles")
        .select("user_id")
        .eq("city_id", shop.city_id)
        .eq("is_available", true)
        .neq("user_id", user.id)
        .limit(100);
      await notifyMany(
        (extras ?? []).map((row) => row.user_id as string),
        {
          type: "sos_gig",
          title: `SOS — ${shop.name} needs urgent cover`,
          body: title,
          href: `/gigs/${data.id}`,
        },
      );
    }

    // Rebooking: auto-invite the barista this gig was posted for.
    const inviteExtraId = formData.get("inviteExtraId");
    if (typeof inviteExtraId === "string" && inviteExtraId) {
      const { data: extra } = await supabase
        .from("extras_profiles")
        .select("user_id")
        .eq("id", inviteExtraId)
        .maybeSingle();
      if (extra) {
        await notify(extra.user_id as string, {
          type: "gig_invite",
          title: `${shop.name} wants you back`,
          body: title,
          href: `/gigs/${data.id}`,
        });
      }
    }
  } catch {
    // ignore
  }

  revalidatePath("/cafe/dashboard");
  redirect(`/cafe/gigs/${data.id}`);
}

export async function updateGig(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { shop } = await requireShop();
  const gigId = formData.get("gigId");
  if (typeof gigId !== "string") return { ok: false, error: "Missing gig" };

  const parsed = parseGigForm(formData);
  if (!parsed.success) {
    const { message, field } = firstZodError(parsed.error);
    return { ok: false, error: message, field };
  }

  const { startsAt, endsAt, title } = listingSpanAndTitle(parsed.data);
  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({
      title,
      description: parsed.data.description,
      kind: parsed.data.kind,
      weekly_hours: parsed.data.kind === "shift" ? null : parsed.data.weeklyHours,
      is_sos: parsed.data.isSos,
      shifts: parsed.data.shifts,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      pay_rate_cents: parsed.data.payRateCents,
      pay_type: parsed.data.payType,
      required_skills: parsed.data.requiredSkills,
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", gigId)
    .eq("shop_id", shop.id);

  if (error) return { ok: false, error: "Could not save the gig. Try again." };

  revalidatePath("/cafe/dashboard");
  revalidatePath(`/cafe/gigs/${gigId}`);
  return { ok: true };
}

export async function setGigStatus(gigId: string, status: AnnouncementStatus): Promise<ActionResult> {
  const { shop } = await requireShop();
  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", gigId)
    .eq("shop_id", shop.id);

  if (error) return { ok: false, error: "Could not update the gig status." };

  revalidatePath("/cafe/dashboard");
  revalidatePath(`/cafe/gigs/${gigId}`);
  return { ok: true };
}

export async function decideInterest(
  interestId: string,
  decision: "accepted" | "declined",
): Promise<ActionResult<{ conversationId?: string }>> {
  const { shop } = await requireShop();
  const supabase = await createClient();

  const { data: interest } = await supabase
    .from("interests")
    .select("id, extra_id, announcement_id, announcements!inner(shop_id)")
    .eq("id", interestId)
    .maybeSingle();

  if (!interest || (interest.announcements as unknown as { shop_id: string }).shop_id !== shop.id) {
    return { ok: false, error: "Application not found" };
  }

  const { error } = await supabase
    .from("interests")
    .update({ status: decision })
    .eq("id", interestId);
  if (error) return { ok: false, error: "Could not update the application." };

  let conversationId: string | undefined;
  if (decision === "accepted") {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("announcement_id", interest.announcement_id)
      .eq("extra_id", interest.extra_id)
      .maybeSingle();

    if (existing) {
      conversationId = existing.id;
    } else {
      const { data: created } = await supabase
        .from("conversations")
        .insert({
          announcement_id: interest.announcement_id,
          shop_id: shop.id,
          extra_id: interest.extra_id,
        })
        .select("id")
        .single();
      conversationId = created?.id;
    }
  }

  // Best-effort: tell the barista about the decision. Never let a notification
  // failure change the outcome of the decision itself.
  try {
    const [{ data: extraProfile }, { data: gig }] = await Promise.all([
      supabase
        .from("extras_profiles")
        .select("user_id")
        .eq("id", interest.extra_id)
        .maybeSingle(),
      supabase
        .from("announcements")
        .select("title")
        .eq("id", interest.announcement_id)
        .maybeSingle(),
    ]);
    if (extraProfile && gig) {
      if (decision === "accepted") {
        await notify(extraProfile.user_id, {
          type: "application_accepted",
          title: `You're in — accepted for “${gig.title}”`,
          href: conversationId
            ? `/messages/${conversationId}`
            : `/gigs/${interest.announcement_id}`,
        });
      } else {
        await notify(extraProfile.user_id, {
          type: "application_declined",
          title: `Application update for “${gig.title}”`,
          body: "The café went with someone else this time.",
          href: `/gigs/${interest.announcement_id}`,
        });
      }
    }
  } catch {
    // Skip notifying when the lookup fails.
  }

  revalidatePath(`/cafe/gigs/${interest.announcement_id}`);
  revalidatePath("/messages");
  return { ok: true, data: { conversationId } };
}
