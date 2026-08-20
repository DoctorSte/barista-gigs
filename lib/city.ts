import { cache } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { citySelectionSchema } from "@/lib/validation";
import type { City } from "@/lib/database.types";

export type CitySearchResult = {
  slug: string;
  name: string;
  country_code: string;
  timezone: string;
  lat: number | null;
  lng: number | null;
  existing: boolean;
};

const COUNTRY_TIMEZONES: Record<string, string> = {
  AT: "Europe/Vienna",
  BE: "Europe/Brussels",
  CH: "Europe/Zurich",
  DE: "Europe/Berlin",
  DK: "Europe/Copenhagen",
  ES: "Europe/Madrid",
  FR: "Europe/Paris",
  GB: "Europe/London",
  IE: "Europe/Dublin",
  IT: "Europe/Rome",
  NL: "Europe/Amsterdam",
  NO: "Europe/Oslo",
  PL: "Europe/Warsaw",
  PT: "Europe/Lisbon",
  SE: "Europe/Stockholm",
  US: "America/New_York",
  CA: "America/Toronto",
  AU: "Australia/Sydney",
};

export function slugifyCityName(name: string, countryCode?: string) {
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const cc = countryCode?.toLowerCase();
  if (!base) return cc ? `city-${cc}` : "city";
  return base;
}

export function timezoneForCountry(countryCode: string) {
  return COUNTRY_TIMEZONES[countryCode.toUpperCase()] ?? "UTC";
}

export async function resolveCityId(
  picked: z.infer<typeof citySelectionSchema>,
): Promise<string> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", picked.slug)
    .maybeSingle();
  if (existing) return existing.id;

  // New cities come from search; RLS allows no public inserts, so use the
  // service role. Fails closed if the key isn't configured.
  if (!hasAdminClient()) {
    throw new Error("That city isn't available yet. Pick one of the featured cities.");
  }
  const admin = createAdminClient();
  const { data: created, error } = await admin
    .from("cities")
    .insert({
      slug: picked.slug,
      name: picked.name,
      country_code: picked.countryCode.toUpperCase(),
      timezone: picked.timezone,
      lat: picked.lat ?? null,
      lng: picked.lng ?? null,
      source: "search",
      is_featured: false,
      is_active: true,
    })
    .select("id")
    .single();
  if (error || !created) throw new Error("Could not add that city. Try another.");
  return created.id;
}

export const getFeaturedCities = cache(async (): Promise<City[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("name");
  return (data as City[] | null) ?? [];
});

export const getCityById = cache(async (id: string): Promise<City | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("cities").select("*").eq("id", id).maybeSingle();
  return (data as City | null) ?? null;
});

export async function searchCitiesInDb(query: string, limit = 8): Promise<City[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("*")
    .eq("is_active", true)
    .ilike("name", `${query}%`)
    .order("is_featured", { ascending: false })
    .order("name")
    .limit(limit);
  return (data as City[] | null) ?? [];
}
