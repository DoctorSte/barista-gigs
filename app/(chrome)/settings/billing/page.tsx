import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { getOwnerSubscription, requireShop } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";
import { isPlanId } from "@/lib/plans";
import { PlanPicker } from "@/components/billing-actions";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const [, params] = await Promise.all([requireShop(), searchParams]);
  // Owner-level: one subscription covers every location.
  const subscription = await getOwnerSubscription();
  const active = subscription?.status === "active";
  const stripeConfigured = isStripeConfigured();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Pick the plan that fits your café — switch or cancel any time.
        </p>
      </div>

      {params.checkout === "success" ? (
        <div className="bubble-in mb-6 flex items-center gap-2.5 rounded-lg border border-success/25 bg-success-soft px-4 py-3 text-sm text-success">
          <BadgeCheck className="size-5 shrink-0" />
          Payment received — your subscription is being activated. This page updates within a
          minute.
        </div>
      ) : null}
      {params.checkout === "cancelled" ? (
        <div className="bubble-in mb-6 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Checkout cancelled — no charge was made.
        </div>
      ) : null}

      <PlanPicker
        currentPlan={subscription && isPlanId(subscription.plan) ? subscription.plan : null}
        currentInterval={subscription?.billing_interval ?? null}
        currentPeriodEnd={subscription?.current_period_end ?? null}
        active={active}
        stripeConfigured={stripeConfigured}
        hasStripeCustomer={Boolean(subscription?.stripe_customer_id)}
      />

      {!stripeConfigured ? (
        <p className="mt-6 rounded-md bg-muted/70 px-3.5 py-2.5 text-[13px] leading-relaxed text-muted-foreground">
          Stripe isn&apos;t configured in this environment, so choosing a plan activates a dev
          subscription instead of charging a card. Set{" "}
          <code className="font-mono">STRIPE_SECRET_KEY</code>,{" "}
          <code className="font-mono">STRIPE_WEBHOOK_SECRET</code> and the{" "}
          <code className="font-mono">STRIPE_PRICE_&lt;PLAN&gt;_&lt;INTERVAL&gt;</code> price ids to
          enable real billing.
        </p>
      ) : null}
    </div>
  );
}
