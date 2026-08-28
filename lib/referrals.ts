// Referral rewards: when a referred café activates its subscription for the
// first time, the referring café earns one free month. With Stripe configured
// the reward is a credit worth one month of the referrer's own plan on their
// next invoice; in dev mode the referrer's subscription period is extended by
// 30 days instead.

import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { notify } from "@/lib/notifications";
import { PLANS, isPlanId } from "@/lib/plans";

export async function grantReferralRewardIfEligible(subscribedShopId: string): Promise<void> {
  if (!hasAdminClient()) return;
  const admin = createAdminClient();

  try {
    const { data: shop } = await admin
      .from("coffee_shops")
      .select("id, name, referred_by, referral_reward_granted")
      .eq("id", subscribedShopId)
      .maybeSingle();
    if (!shop?.referred_by || shop.referral_reward_granted) return;

    // Claim the reward first so concurrent webhook deliveries can't double-grant.
    const { data: claimed } = await admin
      .from("coffee_shops")
      .update({ referral_reward_granted: true })
      .eq("id", shop.id)
      .eq("referral_reward_granted", false)
      .select("id");
    if (!claimed || claimed.length === 0) return;

    const { data: referrer } = await admin
      .from("coffee_shops")
      .select("id, name, owner_id")
      .eq("id", shop.referred_by)
      .maybeSingle();
    if (!referrer) return;

    // Owner-level lookup: the subscription may live on any of the referrer's locations.
    const { data: referrerShops } = await admin
      .from("coffee_shops")
      .select("id")
      .eq("owner_id", referrer.owner_id);
    const { data: referrerSubs } = await admin
      .from("subscriptions")
      .select("*")
      .in(
        "shop_id",
        (referrerShops ?? []).map((s) => s.id),
      );
    const referrerSub =
      (referrerSubs ?? []).find((s) => s.status === "active") ?? (referrerSubs ?? [])[0] ?? null;

    if (isStripeConfigured() && referrerSub?.stripe_customer_id) {
      // One free month of the referrer's own plan, as a negative balance =
      // credit automatically applied to the next invoice.
      const referrerPlan = PLANS[isPlanId(referrerSub.plan) ? referrerSub.plan : "regular"];
      await getStripe().customers.createBalanceTransaction(referrerSub.stripe_customer_id, {
        amount: -referrerPlan.monthlyCents,
        currency: "eur",
        description: `Referral reward — ${shop.name} subscribed`,
      });
    } else {
      // Dev / no-Stripe path: extend (or start) the referrer's period by 30 days.
      const base =
        referrerSub?.current_period_end && new Date(referrerSub.current_period_end) > new Date()
          ? new Date(referrerSub.current_period_end)
          : new Date();
      await admin.from("subscriptions").upsert({
        shop_id: referrer.id,
        status: "active",
        current_period_end: new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    await notify(referrer.owner_id, {
      type: "referral_reward",
      title: `${shop.name} subscribed — you earned a free month`,
      body: "Thanks for spreading the word. The free month is applied to your billing automatically.",
      href: "/settings/billing",
    });
  } catch {
    // Rewards are best-effort; never break the subscription flow.
  }
}
