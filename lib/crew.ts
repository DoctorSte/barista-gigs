// Crew milestones: the status a barista earns for bringing other baristas in.
// Thresholds live here; the names are translated (d.crew.tiers).

export const CREW_TIERS = [1, 3, 5, 10] as const;

export type CrewTier = {
  /** 0 before the first milestone, else the index into CREW_TIERS, +1. */
  reached: number;
  /** Size of the next milestone, or null once every one is earned. */
  next: number | null;
  /** How many more baristas to reach it. */
  toGo: number;
  /** 0–100 progress towards the next milestone (100 when all are earned). */
  percent: number;
};

export function crewTier(count: number): CrewTier {
  const reached = CREW_TIERS.filter((tier) => count >= tier).length;
  const next = CREW_TIERS[reached] ?? null;
  if (next === null) return { reached, next: null, toGo: 0, percent: 100 };
  const floor = reached === 0 ? 0 : CREW_TIERS[reached - 1]!;
  return {
    reached,
    next,
    toGo: next - count,
    percent: Math.round(((count - floor) / (next - floor)) * 100),
  };
}
