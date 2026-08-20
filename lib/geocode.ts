// Server-only: address → coordinates via Nominatim (same service as city search).

type NominatimHit = { lat: string; lon: string };

export async function geocodeAddress(
  address: string,
  cityName?: string | null,
): Promise<{ lat: number; lng: number } | null> {
  const query = cityName ? `${address}, ${cityName}` : address;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "BaristaGigs/1.0 (geocoding)" },
      next: { revalidate: 86400 },
    });
    if (!response.ok) return null;
    const hits = (await response.json()) as NominatimHit[];
    const hit = hits[0];
    if (!hit) return null;
    const lat = Number.parseFloat(hit.lat);
    const lng = Number.parseFloat(hit.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
