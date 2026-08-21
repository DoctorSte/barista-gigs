import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { requireShop } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BaristasBrowser, type DirectoryBarista } from "@/components/baristas-browser";
import type { RateCard } from "@/lib/database.types";

export const metadata: Metadata = { title: "Baristas" };

type BaristaRow = {
  id: string;
  user_id: string;
  years_experience: number | null;
  hourly_rate_cents: number | null;
  currency: string;
  rates: RateCard[];
  signature_drink: string | null;
  skills: string[];
  profiles: { display_name: string; avatar_url: string | null } | null;
};

export default async function BaristasPage() {
  const { user, shop } = await requireShop();
  const supabase = await createClient();

  const { data } = await supabase
    .from("extras_profiles")
    .select(
      "id, user_id, years_experience, hourly_rate_cents, currency, rates, signature_drink, skills, profiles:user_id(display_name, avatar_url)",
    )
    .eq("city_id", shop.city_id)
    .eq("is_available", true)
    .neq("user_id", user.id)
    .order("created_at");
  const rows = (data ?? []) as unknown as BaristaRow[];

  const extraIds = rows.map((barista) => barista.id);
  const nowIso = new Date().toISOString();
  const [{ data: recData }, { data: shiftData }] = extraIds.length
    ? await Promise.all([
        supabase.from("recommendations").select("extra_id").in("extra_id", extraIds),
        // RLS only surfaces this shop's own interests, so these counts are
        // "shifts at your café", not a global tally.
        supabase
          .from("interests")
          .select("extra_id, announcements!inner(ends_at)")
          .eq("status", "accepted")
          .in("extra_id", extraIds),
      ])
    : [{ data: [] }, { data: [] }];

  const recommendationCounts = new Map<string, number>();
  for (const rec of (recData ?? []) as { extra_id: string }[]) {
    recommendationCounts.set(rec.extra_id, (recommendationCounts.get(rec.extra_id) ?? 0) + 1);
  }

  const shiftCounts = new Map<string, number>();
  for (const row of (shiftData ?? []) as unknown as {
    extra_id: string;
    announcements: { ends_at: string } | null;
  }[]) {
    if (row.announcements && row.announcements.ends_at < nowIso) {
      shiftCounts.set(row.extra_id, (shiftCounts.get(row.extra_id) ?? 0) + 1);
    }
  }

  const baristas: DirectoryBarista[] = rows.map((row) => ({
    id: row.id,
    name: row.profiles?.display_name ?? "Barista",
    avatarUrl: row.profiles?.avatar_url ?? null,
    hourlyRateCents: row.hourly_rate_cents,
    currency: row.currency,
    yearsExperience: row.years_experience,
    signatureDrink: row.signature_drink,
    skills: row.skills,
    recommendations: recommendationCounts.get(row.id) ?? 0,
    shifts: shiftCounts.get(row.id) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Baristas</h1>
        <p className="mt-1 flex items-center gap-1.5 text-[15px] text-muted-foreground">
          <MapPin className="size-4" />
          Available baristas in your city
        </p>
      </div>

      <BaristasBrowser baristas={baristas} />
    </div>
  );
}
