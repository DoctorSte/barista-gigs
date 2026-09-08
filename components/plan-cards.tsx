import { Check } from "lucide-react";
import { PLANS, type Plan } from "@/lib/plans";
import { PLAN_CARDS_COPY, type Locale } from "@/lib/marketing-copy";

function planFeatures(plan: Plan, locale: Locale): string[] {
  const t = PLAN_CARDS_COPY[locale];
  return [
    plan.gigsPerMonth ? t.gigsPerMonth(plan.gigsPerMonth) : t.unlimitedGigs,
    plan.locations === 1 ? t.oneLocation : t.locations(plan.locations),
    plan.teamAccounts === 1 ? t.singleAccount : t.teamAccounts(plan.teamAccounts),
    t.directory,
    t.referrals,
  ];
}

/** The three-plan pricing grid used on marketing pages. */
export function PlanCards({ locale = "en" }: { locale?: Locale }) {
  const t = PLAN_CARDS_COPY[locale];
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      {[PLANS.occasional, PLANS.regular, PLANS.group].map((plan) => {
        const highlighted = plan.id === "regular";
        return (
          <div
            key={plan.id}
            className={
              highlighted
                ? "hover-raise relative flex flex-col rounded-lg border border-accent bg-surface p-6 text-left"
                : "hover-raise flex flex-col rounded-lg border border-border bg-surface p-6 text-left"
            }
          >
            {highlighted ? (
              <span className="absolute -top-3 left-6 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground">
                {t.mostPopular}
              </span>
            ) : null}
            <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
            <p className="mt-3 font-display text-3xl font-semibold">
              €{plan.monthlyCents / 100}
              <span className="text-base font-normal text-muted-foreground">{t.perMonth}</span>
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {t.yearly(plan.yearlyCents / 100)}
            </p>
            <ul className="mt-5 flex flex-col gap-2 text-[14px] text-muted-foreground">
              {planFeatures(plan, locale).map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-success" strokeWidth={2.5} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
