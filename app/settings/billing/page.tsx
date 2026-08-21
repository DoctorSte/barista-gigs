import type { Metadata } from "next";
import { BadgeCheck, CreditCard } from "lucide-react";
import { requireShop } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/stripe";
import { formatDate } from "@/lib/format";
import { SUBSCRIPTION_PRICE_EUR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BillingActions } from "@/components/billing-actions";
import type { Subscription } from "@/lib/database.types";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const [{ shop }, params] = await Promise.all([requireShop(), searchParams]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("shop_id", shop.id)
    .maybeSingle();
  const subscription = data as Subscription | null;
  const active = subscription?.status === "active";
  const stripeConfigured = isStripeConfigured();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          One plan, everything included.
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

      <Card className="p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-display text-xl font-semibold">
              <CreditCard className="size-5 text-accent" />
              Café subscription
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Unlimited gig posts · applicant messaging · shop profile
            </p>
          </div>
          {active ? (
            <Badge tone="success">Active</Badge>
          ) : subscription?.status === "past_due" ? (
            <Badge tone="warning">Past due</Badge>
          ) : (
            <Badge>Inactive</Badge>
          )}
        </div>

        <p className="mt-6 font-display text-4xl font-semibold">
          €{SUBSCRIPTION_PRICE_EUR}
          <span className="text-base font-normal text-muted-foreground">/month</span>
        </p>

        {active && subscription?.current_period_end ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Renews {formatDate(subscription.current_period_end)}
          </p>
        ) : null}

        <div className="mt-6">
          <BillingActions
            active={active}
            stripeConfigured={stripeConfigured}
            hasStripeCustomer={Boolean(subscription?.stripe_customer_id)}
          />
        </div>

        {!stripeConfigured ? (
          <p className="mt-4 rounded-md bg-muted/70 px-3.5 py-2.5 text-[13px] leading-relaxed text-muted-foreground">
            Stripe isn&apos;t configured in this environment, so subscribing activates a 30-day dev
            subscription instead of charging a card. Set{" "}
            <code className="font-mono">STRIPE_SECRET_KEY</code>,{" "}
            <code className="font-mono">STRIPE_PRICE_ID</code> and{" "}
            <code className="font-mono">STRIPE_WEBHOOK_SECRET</code> to enable real billing.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
