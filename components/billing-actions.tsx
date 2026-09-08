"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { openBillingPortal, startSubscription } from "@/app/actions/billing";
import { PLANS, PLAN_IDS, type BillingInterval, type Plan, type PlanId } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDict, useLocaleTag } from "@/components/i18n-provider";
import { PLAN_CARDS_COPY } from "@/lib/marketing-copy";
import { useLocale } from "@/components/i18n-provider";

function features(plan: Plan, locale: "en" | "fr", savedBaristas: string): string[] {
  const t = PLAN_CARDS_COPY[locale];
  return [
    plan.gigsPerMonth === null ? t.unlimitedGigs : t.gigsPerMonth(plan.gigsPerMonth),
    plan.locations === 1 ? t.oneLocation : t.locations(plan.locations),
    plan.teamAccounts === 1 ? t.singleAccount : t.teamAccounts(plan.teamAccounts),
    t.directory,
    savedBaristas,
    t.referrals,
  ];
}

export function PlanPicker({
  currentPlan,
  currentInterval,
  currentPeriodEnd,
  active,
  stripeConfigured,
  hasStripeCustomer,
}: {
  currentPlan: PlanId | null;
  currentInterval: BillingInterval | null;
  currentPeriodEnd: string | null;
  active: boolean;
  stripeConfigured: boolean;
  hasStripeCustomer: boolean;
}) {
  const router = useRouter();
  const d = useDict();
  const locale = useLocale();
  const loc = useLocaleTag();
  const [interval, setInterval] = useState<BillingInterval>(currentInterval ?? "monthly");
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, plan: PlanId | null) {
    setPendingPlan(plan);
    startTransition(async () => {
      const result = await action();
      // Redirect-based flows never resolve here; only handle explicit results.
      if (result?.ok) {
        toast.success(d.settings.subActive);
        router.refresh();
      } else if (result && !result.ok && result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 flex justify-center">
        <div
          role="radiogroup"
          aria-label="Billing interval"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted p-1"
        >
          {(
            [
              ["monthly", d.settings.monthly],
              ["yearly", d.settings.yearlyFree],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={interval === value}
              onClick={() => setInterval(value)}
              className={cn(
                "pressable rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
                interval === value
                  ? "bg-surface text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.08)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="stagger grid gap-4 sm:grid-cols-3">
        {PLAN_IDS.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = active && currentPlan === planId;
          const featured = planId === "regular";
          const price = interval === "monthly" ? plan.monthlyCents : plan.yearlyCents;

          return (
            <Card
              key={planId}
              className={cn(
                "rise-in flex flex-col p-6",
                featured && "border-accent/50 border-2",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-lg font-semibold">{plan.name}</p>
                {isCurrent ? <Badge tone="success">{d.settings.currentPlan}</Badge> : null}
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">{plan.blurb}</p>

              <p className="mt-5 font-display text-3xl font-semibold">
                {formatMoney(price)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{interval === "monthly" ? d.settings.perMonthShort : d.settings.perYearShort}
                </span>
              </p>
              {interval === "yearly" ? (
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {d.settings.approxMonthly(formatMoney(Math.round(plan.yearlyCents / 12)))}
                </p>
              ) : null}

              <ul className="mt-5 space-y-2 text-sm">
                {features(plan, locale, d.settings.savedBaristas).map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-1 flex-col justify-end">
                {!active ? (
                  <Button
                    variant={featured ? "primary" : "outline"}
                    loading={pending && pendingPlan === planId}
                    disabled={pending}
                    onClick={() => run(() => startSubscription(planId, interval), planId)}
                  >
                    {d.settings.choose(plan.name)}
                  </Button>
                ) : isCurrent ? (
                  <>
                    {stripeConfigured && hasStripeCustomer ? (
                      <Button
                        variant="outline"
                        loading={pending && pendingPlan === planId}
                        disabled={pending}
                        onClick={() => run(openBillingPortal, planId)}
                      >
                        {d.settings.managePortal}
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">{d.settings.allSet}</p>
                    )}
                    {currentPeriodEnd ? (
                      <p className="mt-2 text-[13px] text-muted-foreground">
                        {d.settings.renews(formatDate(currentPeriodEnd, loc))}
                      </p>
                    ) : null}
                  </>
                ) : stripeConfigured ? (
                  <Button
                    variant="outline"
                    loading={pending && pendingPlan === planId}
                    disabled={pending}
                    onClick={() => run(openBillingPortal, planId)}
                  >
                    {d.settings.switchPortal}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    loading={pending && pendingPlan === planId}
                    disabled={pending}
                    onClick={() => run(() => startSubscription(planId, interval), planId)}
                  >
                    {d.settings.switchTo(plan.name)}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
