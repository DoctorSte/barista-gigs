export type PlanId = "occasional" | "regular" | "group";
export type BillingInterval = "monthly" | "yearly";

export type Plan = {
  id: PlanId;
  name: string;
  monthlyCents: number;
  yearlyCents: number;
  /** null = unlimited **/
  gigsPerMonth: number | null;
  locations: number;
  teamAccounts: number;
  blurb: string;
};

export const PLANS: Record<PlanId, Plan> = {
  occasional: {
    id: "occasional",
    name: "Occasional",
    monthlyCents: 15_00,
    yearlyCents: 149_00,
    gigsPerMonth: 3,
    locations: 1,
    teamAccounts: 1,
    blurb: "For cafés that need a hand a few times a year.",
  },
  regular: {
    id: "regular",
    name: "Regular",
    monthlyCents: 25_00,
    yearlyCents: 249_00,
    gigsPerMonth: null,
    locations: 1,
    teamAccounts: 3,
    blurb: "Unlimited gigs for one busy café.",
  },
  group: {
    id: "group",
    name: "Group",
    monthlyCents: 49_00,
    yearlyCents: 499_00,
    gigsPerMonth: null,
    locations: 3,
    teamAccounts: 10,
    blurb: "For small groups running up to three locations.",
  },
};

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && value in PLANS;
}

/** Server-only: resolve the Stripe price id for a plan + interval from env. */
export function stripePriceId(plan: PlanId, interval: BillingInterval): string | null {
  return process.env[`STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`] ?? null;
}

/** Server-only: reverse-map a Stripe price id to plan + interval. */
export function planForPriceId(
  priceId: string,
): { plan: PlanId; interval: BillingInterval } | null {
  for (const plan of PLAN_IDS) {
    for (const interval of ["monthly", "yearly"] as const) {
      if (stripePriceId(plan, interval) === priceId) return { plan, interval };
    }
  }
  // The pre-plans €29/month price maps to the old default.
  if (process.env.STRIPE_PRICE_ID && priceId === process.env.STRIPE_PRICE_ID) {
    return { plan: "regular", interval: "monthly" };
  }
  return null;
}
