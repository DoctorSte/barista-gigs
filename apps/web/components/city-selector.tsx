"use client";

import type { City } from "@barista-gigs/shared";
import { setCityAction } from "@/app/actions/auth";

export function CitySelector({
  cities,
  selectedSlug,
}: {
  cities: City[];
  selectedSlug: string;
}) {
  return (
    <form action={setCityAction}>
      <label className="sr-only" htmlFor="city">
        City
      </label>
      <select
        id="city"
        name="slug"
        defaultValue={selectedSlug}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800"
      >
        {cities.map((city) => (
          <option key={city.id} value={city.slug}>
            {city.name}
          </option>
        ))}
      </select>
    </form>
  );
}
