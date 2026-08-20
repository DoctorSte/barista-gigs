"use client";

import { useActionState, useState } from "react";
import { changeCity } from "@/app/actions/settings";
import type { City } from "@/lib/database.types";
import { CityPicker, type PickedCity } from "@/components/city-picker";
import { SubmitButton } from "@/components/ui/button";
import { FormError } from "@/components/form-error";

export function ChangeCityForm({
  featuredCities,
  currentSlug,
}: {
  featuredCities: City[];
  currentSlug: string | null;
}) {
  const [city, setCity] = useState<PickedCity | null>(null);
  const [state, action] = useActionState(changeCity, null);
  const error = state && !state.ok ? state : null;

  return (
    <form action={action} className="flex flex-col gap-4">
      <CityPicker featured={featuredCities} value={city} onChange={setCity} />
      <FormError message={error?.error} />
      <SubmitButton disabled={!city || city.slug === currentSlug}>
        {city && city.slug !== currentSlug ? `Move to ${city.name}` : "Pick a new city"}
      </SubmitButton>
    </form>
  );
}
