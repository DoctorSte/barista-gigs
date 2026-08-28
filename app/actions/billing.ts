"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOwnerShops, getOwnerSubscription, requireShop } from "@/lib/auth";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { appUrl, getStripe, isStripeConfigured } from "@/lib/stripe";
import { grantReferralRewardIfEligible } from "@/lib/referrals";
import { isPlanId, stripePriceId, type BillingInterval, type PlanId } from "@/lib/plans";
import type { ActionResult } from "@/lib/validation";
import type { Subscription } from "@/lib/database.types";

export async function getOwnSubscription(): Promise<Subscription | null> {
  await requireShop();
  return getOwnerSubscription();
}

/**
 * Starts a Stripe Checkout session for the chosen plan + interval, or — when
 * Stripe isn't configured — activates a dev subscription directly via the
 * service role.
 */
export async function startSubscription(
  plan: PlanId,
  interval: BillingInterval,
): Promise<ActionResult> {
  if (!isPlanId(plan)) {
    return { ok: false, error: "Pick a valid plan." };
  }
  if (interval !== "monthly" && interval !== "yearly") {
    return { ok: false, error: "Pick monthly or yearly billing." };
  }
  const { user, shop } = await requireShop();
  // Subscriptions are owner-level; the row always attaches to the primary location.
  const primary = (await getOwnerShops())[0] ?? shop;

  if (!isStripeConfigured()) {
    if (!hasAdminClient()) {
      return {
        ok: false,
        error:
          "Billing isn't configured. Set STRIPE_SECRET_KEY + the STRIPE_PRICE_* price ids (or SUPABASE_SERVICE_ROLE_KEY for dev mode).",
      };
    }
    const admin = createAdminClient();
    const days = interval === "monthly" ? 30 : 365;
    const periodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await admin.from("subscriptions").upsert({
      shop_id: primary.id,
      status: "active",
      plan,
      billing_interval: interval,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: "Could not activate the dev subscription." };
    await grantReferralRewardIfEligible(primary.id);
    revalidatePath("/settings/billing");
    revalidatePath("/cafe/dashboard");
    return { ok: true };
  }

  const priceId = stripePriceId(plan, interval);
  if (!priceId) {
    return { ok: false, error: "That plan isn't configured yet." };
  }

  const stripe = getStripe();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("shop_id", primary.id)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: primary.name,
      metadata: { shop_id: primary.id },
    });
    customerId = customer.id;
    await admin.from("subscriptions").upsert({
      shop_id: primary.id,
      stripe_customer_id: customerId,
      status: existing ? undefined : "inactive",
      updated_at: new Date().toISOString(),
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: appUrl("/settings/billing?checkout=success"),
    cancel_url: appUrl("/settings/billing?checkout=cancelled"),
    metadata: { shop_id: primary.id, plan, interval },
    subscription_data: { metadata: { shop_id: primary.id, plan, interval } },
  });

  if (!session.url) return { ok: false, error: "Stripe did not return a checkout URL." };
  redirect(session.url);
}

export async function openBillingPortal(): Promise<ActionResult> {
  await requireShop();
  if (!isStripeConfigured()) {
    return { ok: false, error: "Stripe isn't configured — nothing to manage." };
  }

  const subscription = await getOwnSubscription();
  if (!subscription?.stripe_customer_id) {
    return { ok: false, error: "No Stripe customer yet. Subscribe first." };
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: appUrl("/settings/billing"),
  });
  redirect(session.url);
}
