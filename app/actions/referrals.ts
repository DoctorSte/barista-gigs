"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireExtra } from "@/lib/auth";
import { sendEmails } from "@/lib/email";
import { emailSchema, type ActionResult } from "@/lib/validation";

/**
 * Invites a café — or another barista — by email with the barista's referral
 * link; `audience` only picks which copy to send. The mail body is
 * fixed — the sender picks the address, not the message — and a daily cap plus
 * one-invite-per-address rule keep the form from becoming a way to send mail
 * from our domain to arbitrary people.
 */
const DAILY_LIMIT = 15;

export async function sendReferralInvite(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user, profile, extra } = await requireExtra();

  const parsed = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address", field: "email" };
  }
  const email = parsed.data;
  if (email === user.email?.toLowerCase()) {
    return { ok: false, error: "That's your own address.", field: "email" };
  }

  const toBarista = formData.get("audience") === "barista";
  const supabase = await createClient();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ data: already }, { count: sentToday }] = await Promise.all([
    supabase
      .from("referral_invites")
      .select("id")
      .eq("extra_id", extra.id)
      .eq("email", email)
      .maybeSingle(),
    supabase
      .from("referral_invites")
      .select("id", { count: "exact", head: true })
      .eq("extra_id", extra.id)
      .gte("created_at", dayAgo),
  ]);
  if (already) return { ok: false, error: "You've already invited them.", field: "email" };
  if ((sentToday ?? 0) >= DAILY_LIMIT) {
    return { ok: false, error: "That's all the invites for today — try again tomorrow." };
  }

  const { error } = await supabase
    .from("referral_invites")
    .insert({ extra_id: extra.id, email, audience: toBarista ? "barista" : "cafe" });
  if (error) return { ok: false, error: "Could not send the invite. Try again." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://baristagigs.com";
  const name = profile.display_name;
  await sendEmails([
    {
      to: email,
      subject: toBarista
        ? `${name} wants you on their Barista Gigs crew`
        : `${name} thinks you should be on Barista Gigs`,
      title: `${name} invited you to Barista Gigs`,
      body: toBarista
        ? `${name} picks up shifts through Barista Gigs and thinks you should too. Cafés in your city post the shifts they need covered; you apply with your profile, and every shift you work builds a track record cafés can see. It's free for baristas.`
        : `${name} is a freelance barista on Barista Gigs. Cafés post the shifts they need covered and fill them with baristas whose track record — shifts worked, reviews, reliability — is on their profile. Plans start at €15 a month and you can cancel anytime.`,
      ctaLabel: toBarista ? "Join their crew" : "See how it works",
      ctaUrl: `${appUrl}/r/${extra.referral_code}`,
      footer: `${name} sent you this invite from Barista Gigs. We haven't created an account for you, and we won't email you again unless you sign up.`,
    },
  ]);

  revalidatePath("/profile");
  return { ok: true };
}
