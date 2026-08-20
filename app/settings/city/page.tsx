import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getCityById, getFeaturedCities } from "@/lib/city";
import { Card } from "@/components/ui/card";
import { ChangeCityForm } from "@/components/change-city-form";

export const metadata: Metadata = { title: "City" };

export default async function CitySettingsPage() {
  const { profile } = await requireProfile();
  const [city, featuredCities] = await Promise.all([
    getCityById(profile.city_id),
    getFeaturedCities(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Your city</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Gigs and profiles are matched within your city.
        </p>
      </div>

      <Card className="p-8">
        <p className="flex items-center gap-2 font-display text-xl font-semibold">
          <MapPin className="size-5 text-accent" />
          {city ? `${city.name}, ${city.country_code}` : "No city set"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.role === "shop"
            ? "Moving your shop closes any draft or open gigs. Filled gigs and message threads are kept."
            : "Moving withdraws your pending applications. Accepted gigs and message threads are kept."}
        </p>

        <div className="mt-6">
          <ChangeCityForm featuredCities={featuredCities} currentSlug={city?.slug ?? null} />
        </div>
      </Card>
    </div>
  );
}
