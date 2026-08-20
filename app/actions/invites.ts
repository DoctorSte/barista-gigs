"use server";

import { createClient } from "@/lib/supabase/server";
import { requireShop } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import type { ActionResult } from "@/lib/validation";

export async function inviteToGig(extraId: string, gigId: string): Promise<ActionResult> {
  const { shop } = await requireShop();
  const supabase = await createClient();

  const { data: gig } = await supabase
    .from("announcements")
    .select("id, title, status")
    .eq("id", gigId)
    .eq("shop_id", shop.id)
    .maybeSingle();
  if (!gig) return { ok: false, error: "Gig not found." };
  if (gig.status !== "open") return { ok: false, error: "This gig is no longer open." };

  const { data: extraData } = await supabase
    .from("extras_profiles")
    .select("id, user_id")
    .eq("id", extraId)
    .maybeSingle();
  const extra = extraData as { id: string; user_id: string } | null;
  if (!extra) return { ok: false, error: "Could not find that barista." };

  // As the gig owner we can see their application if they already sent one.
  const { data: existing } = await supabase
    .from("interests")
    .select("id")
    .eq("announcement_id", gigId)
    .eq("extra_id", extraId)
    .maybeSingle();
  if (existing) return { ok: false, error: "They already applied to this gig." };

  await notify(extra.user_id, {
    type: "gig_invite",
    title: `${shop.name} invited you to apply`,
    body: gig.title,
    href: `/gigs/${gigId}`,
  });

  return { ok: true };
}
