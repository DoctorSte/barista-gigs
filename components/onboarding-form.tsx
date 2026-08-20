"use client";

import { useActionState, useState } from "react";
import { completeOnboarding } from "@/app/actions/onboarding";
import type { City } from "@/lib/database.types";
import { SKILLS } from "@/lib/constants";
import { CityPicker, type PickedCity } from "@/components/city-picker";
import { ChipGroup } from "@/components/ui/chip-toggle";
import { SubmitButton } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { cn } from "@/lib/utils";

export function OnboardingForm({
  featuredCities,
  initialRole,
  initialName,
  roleLocked,
}: {
  featuredCities: City[];
  initialRole: "shop" | "extra";
  initialName: string;
  roleLocked: boolean;
}) {
  const [role, setRole] = useState(initialRole);
  const [city, setCity] = useState<PickedCity | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [state, action] = useActionState(completeOnboarding, null);
  const error = state && !state.ok ? state : null;

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="role" value={role} />

      {!roleLocked ? (
        <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1" role="radiogroup">
          {(["extra", "shop"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={role === option}
              onClick={() => setRole(option)}
              className={cn(
                "pressable rounded-sm py-2 text-sm font-medium outline-none transition-colors duration-150",
                "focus-visible:ring-2 focus-visible:ring-ring",
                role === option
                  ? "bg-surface-raised text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option === "extra" ? "Barista" : "Coffee shop"}
            </button>
          ))}
        </div>
      ) : null}

      <Field label={role === "shop" ? "Your name" : "Display name"} error={error?.field === "displayName" ? error.error : undefined}>
        {(id) => <Input id={id} name="displayName" defaultValue={initialName} required />}
      </Field>

      <Field
        label="Your city"
        hint="Gigs and profiles are matched within a city."
        error={error?.field === "city" ? error.error : undefined}
      >
        {() => <CityPicker featured={featuredCities} value={city} onChange={setCity} />}
      </Field>

      {role === "shop" ? (
        <>
          <Field label="Shop name" error={error?.field === "shopName" ? error.error : undefined}>
            {(id) => <Input id={id} name="shopName" placeholder="e.g. Kaffebar Nord" required />}
          </Field>
          <Field label="Address" error={error?.field === "address" ? error.error : undefined}>
            {(id) => <Input id={id} name="address" placeholder="Street and number" required />}
          </Field>
        </>
      ) : (
        <>
          <Field label="Bio" hint="Optional — a couple of lines about your coffee background.">
            {(id) => <Textarea id={id} name="bio" maxLength={600} />}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Years of experience">
              {(id) => <Input id={id} name="yearsExperience" type="number" min={0} max={60} />}
            </Field>
            <Field label="Hourly rate (€)">
              {(id) => <Input id={id} name="hourlyRate" type="number" min={0} step="0.5" />}
            </Field>
          </div>
          <Field label="Skills">
            {() => (
              <ChipGroup
                options={[...SKILLS]}
                selected={skills}
                onToggle={(value) =>
                  setSkills((prev) =>
                    prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
                  )
                }
                name="skills"
              />
            )}
          </Field>
        </>
      )}

      <FormError message={error && !error.field ? error.error : undefined} />
      <SubmitButton size="lg" className="w-full">
        {role === "shop" ? "Open shop account" : "Start finding gigs"}
      </SubmitButton>
    </form>
  );
}
