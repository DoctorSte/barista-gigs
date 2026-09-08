import { Check } from "lucide-react";
import { PLANS, type Plan } from "@/lib/plans";

function planFeatures(plan: Plan): string[] {
  return [
    plan.gigsPerMonth ? `${plan.gigsPerMonth} gigs a month` : "Unlimited gigs",
    plan.locations === 1 ? "1 location" : `Up to ${plan.locations} locations`,
    plan.teamAccounts === 1 ? "Single account" : `${plan.teamAccounts} team accounts`,
    "Barista directory",
    "Referral free months",
  ];
}

/** The three-plan pricing grid used on marketing pages. */
export function PlanCards() {
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
                Most popular
              </span>
            ) : null}
            <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
            <p className="mt-3 font-display text-3xl font-semibold">
              €{plan.monthlyCents / 100}
              <span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              or €{plan.yearlyCents / 100}/year — 2 months free
            </p>
            <ul className="mt-5 flex flex-col gap-2 text-[14px] text-muted-foreground">
              {planFeatures(plan).map((feature) => (
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
