import { NextResponse } from "next/server";
import {
  searchCitiesInDb,
  slugifyCityName,
  timezoneForCountry,
  type CitySearchResult,
} from "@/lib/city";

type NominatimItem = {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  addresstype?: string;
  address?: {
    city?: string;
    town?: string;
    municipality?: string;
    country_code?: string;
  };
};

const PLACE_TYPES = new Set(["city", "town", "municipality", "village"]);

async function searchNominatim(query: string): Promise<CitySearchResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("featureType", "city");

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "BaristaGigs/1.0 (city search)" },
    next: { revalidate: 3600 },
  });
  if (!response.ok) return [];

  const items = (await response.json()) as NominatimItem[];
  const seen = new Set<string>();
  const results: CitySearchResult[] = [];

  for (const item of items) {
    if (item.addresstype && !PLACE_TYPES.has(item.addresstype)) continue;
    const name =
      item.address?.city ||
      item.address?.town ||
      item.address?.municipality ||
      item.name ||
      item.display_name?.split(",")[0]?.trim();
    const countryCode = item.address?.country_code?.toUpperCase();
    if (!name || !countryCode) continue;

    const slug = `${slugifyCityName(name)}-${countryCode.toLowerCase()}`;
    if (seen.has(slug)) continue;
    seen.add(slug);

    results.push({
      slug,
      name,
      country_code: countryCode,
      timezone: timezoneForCountry(countryCode),
      lat: Number.parseFloat(item.lat),
      lng: Number.parseFloat(item.lon),
      existing: false,
    });
  }
  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const dbHits = await searchCitiesInDb(q, 8);
  const results: CitySearchResult[] = dbHits.map((city) => ({
    slug: city.slug,
    name: city.name,
    country_code: city.country_code,
    timezone: city.timezone,
    lat: city.lat,
    lng: city.lng,
    existing: true,
  }));
  const knownNames = new Set(dbHits.map((c) => `${c.name.toLowerCase()}|${c.country_code}`));

  if (results.length < 5) {
    try {
      for (const item of await searchNominatim(q)) {
        if (knownNames.has(`${item.name.toLowerCase()}|${item.country_code}`)) continue;
        results.push(item);
        if (results.length >= 10) break;
      }
    } catch {
      // Nominatim is best-effort; DB results still stand alone.
    }
  }

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } },
  );
}
