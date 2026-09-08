"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession, requireProfile, requireShop } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import type { ActionResult } from "@/lib/validation";

/**
 * Café confirms whether an accepted barista actually worked the shift.
 * Only possible once the gig has ended; drives reliability stats and unlocks
 * reviews. Passing null clears a mistaken mark.
 */
export async function setWorkStatus(
  interestId: string,
  workStatus: "completed" | "no_show" | null,
): Promise<ActionResult> {
  if (workStatus !== "completed" && workStatus !== "no_show" && workStatus !== null) {
    return { ok: false, error: "Invalid status." };
  }
  const { shop } = await requireShop();
  const supabase = await createClient();

  const { data: interest } = await supabase
    .from("interests")
    .select("id, status, extra_id, announcement_id, announcements!inner(shop_id, title, ends_at)")
    .eq("id", interestId)
    .maybeSingle();
  const gig = interest?.announcements as unknown as {
    shop_id: string;
    title: string;
    ends_at: string;
  } | null;
  if (!interest || !gig || gig.shop_id !== shop.id) {
    return { ok: false, error: "Application not found." };
  }
  if (interest.status !== "accepted") {
    return { ok: false, error: "Only accepted baristas can be marked." };
  }
  if (new Date(gig.ends_at) > new Date()) {
    return { ok: false, error: "You can confirm the shift once it has ended." };
  }

  const { error } = await supabase
    .from("interests")
    .update({
      work_status: workStatus,
      work_status_at: workStatus ? new Date().toISOString() : null,
    })
    .eq("id", interestId);
  if (error) return { ok: false, error: "Could not update the shift. Try again." };

  if (workStatus === "completed") {
    try {
      const { data: extraProfile } = await supabase
        .from("extras_profiles")
        .select("user_id")
        .eq("id", interest.extra_id)
        .maybeSingle();
      if (extraProfile) {
        await notify(extraProfile.user_id, {
          type: "shift_completed",
          title: `${shop.name} confirmed your shift on “${gig.title}”`,
          body: "It now counts toward your track record — leave the café a review back.",
          href: "/applications",
        });
      }
    } catch {
      // Best-effort.
    }
  }

  revalidatePath(`/cafe/gigs/${interest.announcement_id}`);
  revalidatePath("/applications");
  return { ok: true };
}

/** Either side reviews the other after a completed shift. One review per side. */
export async function leaveReview(
  interestId: string,
  rating: number,
  comment: string,
): Promise<ActionResult> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Pick a rating from 1 to 5." };
  }
  const trimmed = comment.trim().slice(0, 500);
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("reviews").insert({
    interest_id: interestId,
    author_role: profile.role,
    rating,
    comment: trimmed || null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "You've already reviewed this shift." };
    // RLS rejections surface as a generic insert failure.
    return { ok: false, error: "Reviews open once the café confirms the shift." };
  }

  // Best-effort: tell the other side.
  try {
    const { user } = await getSession();
    const { data: interest } = await supabase
      .from("interests")
      .select(
        "extra_id, announcement_id, announcements!inner(title, shop_id, coffee_shops(name, owner_id)), extras_profiles!inner(user_id)",
      )
      .eq("id", interestId)
      .maybeSingle();
    const gig = interest?.announcements as unknown as {
      title: string;
      shop_id: string;
      coffee_shops: { name: string; owner_id: string } | null;
    } | null;
    const extraUser = (interest?.extras_profiles as unknown as { user_id: string } | null)
      ?.user_id;
    if (interest && gig?.coffee_shops && extraUser && user) {
      const recipient = profile.role === "shop" ? extraUser : gig.coffee_shops.owner_id;
      const authorName = profile.role === "shop" ? gig.coffee_shops.name : profile.display_name;
      await notify(recipient, {
        type: "new_review",
        title: `${authorName} left you a ${rating}-star review`,
        body: trimmed || undefined,
        href:
          profile.role === "shop" ? "/applications" : `/cafe/gigs/${interest.announcement_id}`,
      });
    }
  } catch {
    // Best-effort.
  }

  revalidatePath("/applications");
  return { ok: true };
}
