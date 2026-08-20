"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { openBillingPortal, startSubscription } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";

export function BillingActions({
  active,
  stripeConfigured,
  hasStripeCustomer,
}: {
  active: boolean;
  stripeConfigured: boolean;
  hasStripeCustomer: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      // Redirect-based flows never resolve here; only handle explicit results.
      if (result?.ok) {
        toast.success("Subscription active — you can post gigs now");
        router.refresh();
      } else if (result && !result.ok && result.error) {
        toast.error(result.error);
      }
    });
  }

  if (active) {
    return stripeConfigured && hasStripeCustomer ? (
      <Button variant="outline" loading={pending} onClick={() => run(openBillingPortal)}>
        Manage subscription
      </Button>
    ) : (
      <p className="text-sm text-muted-foreground">You&apos;re all set.</p>
    );
  }

  return (
    <Button size="lg" loading={pending} onClick={() => run(startSubscription)}>
      {stripeConfigured ? "Subscribe with Stripe" : "Activate subscription"}
    </Button>
  );
}
