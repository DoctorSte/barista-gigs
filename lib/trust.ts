// Reliability stats derived from confirmed shifts and reviews. Interests are
// RLS-scoped to the viewer's own gigs, so these helpers prefer the service
// role: the numbers are cross-café aggregates by design (no raw rows leak).

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";

function statsClient(fallback: SupabaseClient<Database>): SupabaseClient<Database> {
  return hasAdminClient() ? (createAdminClient() as SupabaseClient<Database>) : fallback;
}

export type BaristaTrustStats = {
  completed: number;
  noShows: number;
  /** 0-100; null until at least one shift was confirmed either way. */
  showUpRate: number | null;
  rating: number | null;
  reviewCount: number;
};

const EMPTY: BaristaTrustStats = {
  completed: 0,
  noShows: 0,
  showUpRate: null,
  rating: null,
  reviewCount: 0,
};

export async function baristaTrustStats(
  fallbackClient: SupabaseClient<Database>,
  extraIds: string[],
): Promise<Record<string, BaristaTrustStats>> {
  const stats: Record<string, BaristaTrustStats> = {};
  if (extraIds.length === 0) return stats;
  const supabase = statsClient(fallbackClient);

  const [{ data: workRows }, { data: reviewRows }] = await Promise.all([
    supabase
      .from("interests")
      .select("extra_id, work_status")
      .in("extra_id", extraIds)
      .not("work_status", "is", null),
    supabase
      .from("reviews")
      .select("rating, author_role, interests!inner(extra_id)")
      .eq("author_role", "shop")
      .in("interests.extra_id", extraIds),
  ]);

  for (const row of (workRows ?? []) as { extra_id: string; work_status: string }[]) {
    const entry = (stats[row.extra_id] ??= { ...EMPTY });
    if (row.work_status === "completed") entry.completed += 1;
    else if (row.work_status === "no_show") entry.noShows += 1;
  }
  const ratingSums: Record<string, number> = {};
  for (const row of (reviewRows ?? []) as unknown as {
    rating: number;
    interests: { extra_id: string };
  }[]) {
    const extraId = row.interests.extra_id;
    const entry = (stats[extraId] ??= { ...EMPTY });
    entry.reviewCount += 1;
    ratingSums[extraId] = (ratingSums[extraId] ?? 0) + row.rating;
  }
  for (const [extraId, entry] of Object.entries(stats)) {
    const confirmed = entry.completed + entry.noShows;
    entry.showUpRate = confirmed > 0 ? Math.round((entry.completed / confirmed) * 100) : null;
    entry.rating = entry.reviewCount > 0 ? ratingSums[extraId]! / entry.reviewCount : null;
  }
  return stats;
}

export type CafeTrustStats = { rating: number | null; reviewCount: number };

/** Average rating baristas gave this café across all its gigs. */
export async function cafeTrustStats(
  fallbackClient: SupabaseClient<Database>,
  shopId: string,
): Promise<CafeTrustStats> {
  const supabase = statsClient(fallbackClient);
  const { data } = await supabase
    .from("reviews")
    .select("rating, author_role, interests!inner(announcements!inner(shop_id))")
    .eq("author_role", "extra")
    .eq("interests.announcements.shop_id", shopId);
  const rows = (data ?? []) as { rating: number }[];
  if (rows.length === 0) return { rating: null, reviewCount: 0 };
  return {
    rating: rows.reduce((sum, r) => sum + r.rating, 0) / rows.length,
    reviewCount: rows.length,
  };
}
