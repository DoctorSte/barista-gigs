"use client";

import { useActionState, useState } from "react";
import { addLocation } from "@/app/actions/locations";
import type { City } from "@/lib/database.types";
import { CityPicker, type PickedCity } from "@/components/city-picker";
import { SubmitButton } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/form-error";

export function AddLocationForm({ featuredCities }: { featuredCities: City[] }) {
  const [city, setCity] = useState<PickedCity | null>(null);
  const [state, action] = useActionState(addLocation, null);
  const error = state && !state.ok ? state : null;

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Location name" error={error?.field === "shopName" ? error.error : undefined}>
        {(id) => <Input id={id} name="shopName" placeholder="e.g. Lueur Coffee — Bastille" required />}
      </Field>
      <Field label="Address" error={error?.field === "address" ? error.error : undefined}>
        {(id) => <Input id={id} name="address" placeholder="Street and number" required />}
      </Field>
      <Field
        label="City"
        hint="Gigs from this location reach baristas in its city."
        error={error?.field === "city" ? error.error : undefined}
      >
        {() => <CityPicker featured={featuredCities} value={city} onChange={setCity} />}
      </Field>
      <FormError message={error && !error.field ? error.error : undefined} />
      <SubmitButton className="self-start">Add location</SubmitButton>
    </form>
  );
}
