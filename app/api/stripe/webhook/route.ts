import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantReferralRewardIfEligible } from "@/lib/referrals";
import { isPlanId, planForPriceId, type BillingInterval, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";

function mapStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "inactive";
    default:
      return "inactive";
  }
}

function periodEnd(subscription: Stripe.Subscription): string | null {
  const end = subscription.items.data[0]?.current_period_end;
  return end ? new Date(end * 1000).toISOString() : null;
}

/**
 * Resolve which plan + interval a Stripe subscription is on: prefer the price
 * id on the subscription item, fall back to the checkout metadata. Returns
 * only the columns we could resolve so an unresolvable subscription never
 * overwrites the stored plan with defaults.
 */
function planColumns(
  subscription: Stripe.Subscription,
): { plan?: PlanId; billing_interval?: BillingInterval } {
  const priceId = subscription.items.data[0]?.price?.id;
  const resolved = priceId ? planForPriceId(priceId) : null;
  if (resolved) return { plan: resolved.plan, billing_interval: resolved.interval };

  const metaPlan = subscription.metadata.plan;
  if (isPlanId(metaPlan)) {
    const metaInterval = subscription.metadata.interval;
    return metaInterval === "monthly" || metaInterval === "yearly"
      ? { plan: metaPlan, billing_interval: metaInterval }
      : { plan: metaPlan };
  }
  return {};
}

async function upsertFromSubscription(subscription: Stripe.Subscription) {
  const shopId = subscription.metadata.shop_id;
  const admin = createAdminClient();

  if (shopId) {
    await admin.from("subscriptions").upsert({
      shop_id: shopId,
      stripe_customer_id:
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      stripe_subscription_id: subscription.id,
      status: mapStatus(subscription.status),
      current_period_end: periodEnd(subscription),
      ...planColumns(subscription),
      updated_at: new Date().toISOString(),
    });
    if (mapStatus(subscription.status) === "active") {
      await grantReferralRewardIfEligible(shopId);
    }
    return;
  }

  // Fall back to matching by customer id when metadata is missing.
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  await admin
    .from("subscriptions")
    .update({
      stripe_subscription_id: subscription.id,
      status: mapStatus(subscription.status),
      current_period_end: periodEnd(subscription),
      ...planColumns(subscription),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          typeof session.subscription === "string" ? session.subscription : session.subscription.id,
        );
        if (!subscription.metadata.shop_id && session.metadata?.shop_id) {
          subscription.metadata.shop_id = session.metadata.shop_id;
        }
        await upsertFromSubscription(subscription);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await upsertFromSubscription(event.data.object);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
