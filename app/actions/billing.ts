"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireShop } from "@/lib/auth";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { appUrl, getStripe, isStripeConfigured } from "@/lib/stripe";
import { grantReferralRewardIfEligible } from "@/lib/referrals";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/validation";
import type { Subscription } from "@/lib/database.types";

export async function getOwnSubscription(): Promise<Subscription | null> {
  const { shop } = await requireShop();
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("shop_id", shop.id)
    .maybeSingle();
  return (data as Subscription | null) ?? null;
}

/**
 * Starts a Stripe Checkout session, or — when Stripe isn't configured —
 * activates a 30-day dev subscription directly via the service role.
 */
export async function startSubscription(): Promise<ActionResult> {
  const { user, shop } = await requireShop();

  if (!isStripeConfigured()) {
    if (!hasAdminClient()) {
      return {
        ok: false,
        error:
          "Billing isn't configured. Set STRIPE_SECRET_KEY + STRIPE_PRICE_ID (or SUPABASE_SERVICE_ROLE_KEY for dev mode).",
      };
    }
    const admin = createAdminClient();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await admin.from("subscriptions").upsert({
      shop_id: shop.id,
      status: "active",
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: "Could not activate the dev subscription." };
    await grantReferralRewardIfEligible(shop.id);
    revalidatePath("/settings/billing");
    revalidatePath("/cafe/dashboard");
    return { ok: true };
  }

  const stripe = getStripe();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("shop_id", shop.id)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: shop.name,
      metadata: { shop_id: shop.id },
    });
    customerId = customer.id;
    await admin.from("subscriptions").upsert({
      shop_id: shop.id,
      stripe_customer_id: customerId,
      status: existing ? undefined : "inactive",
      updated_at: new Date().toISOString(),
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: appUrl("/settings/billing?checkout=success"),
    cancel_url: appUrl("/settings/billing?checkout=cancelled"),
    metadata: { shop_id: shop.id },
    subscription_data: { metadata: { shop_id: shop.id } },
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
