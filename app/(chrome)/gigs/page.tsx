import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { requireExtra } from "@/lib/auth";
import { getCityById } from "@/lib/city";
import { createClient } from "@/lib/supabase/server";
import { GigsBrowser, type BrowserGig } from "@/components/gigs-browser";
import { getDict } from "@/lib/i18n";

export const metadata: Metadata = { title: "Open gigs" };

export default async function GigsPage() {
  const { profile } = await requireExtra();
  const [city, supabase] = await Promise.all([getCityById(profile.city_id), createClient()]);

  const { data } = await supabase
    .from("announcements")
    .select("*, coffee_shops(name, address, lat, lng)")
    .eq("status", "open")
    .eq("kind", "shift")
    .eq("city_id", profile.city_id)
    .gte("ends_at", new Date().toISOString())
    .order("is_sos", { ascending: false })
    .order("starts_at");

  const gigs = (data ?? []) as unknown as BrowserGig[];
  const d = await getDict();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{d.gigs.openGigs}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-[15px] text-muted-foreground">
          <MapPin className="size-4" />
          {d.gigs.subtitle(city?.name ?? "…")}
        </p>
      </div>

      <GigsBrowser gigs={gigs} />
    </div>
  );
}
