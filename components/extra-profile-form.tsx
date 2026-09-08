"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { updateExtraProfile } from "@/app/actions/profile";
import type { AvailabilityWindow, ExtraProfile, Profile } from "@/lib/database.types";
import { SKILLS } from "@/lib/constants";
import { LanguagePicker } from "@/components/language-picker";
import { WeekHoursEditor } from "@/components/week-hours-editor";
import { ChipGroup } from "@/components/ui/chip-toggle";
import { Switch } from "@/components/ui/switch";
import { SubmitButton } from "@/components/ui/button";
import { Field, Input, Label, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { Card } from "@/components/ui/card";
import { useDict } from "@/components/i18n-provider";

export function ExtraProfileForm({ profile, extra }: { profile: Profile; extra: ExtraProfile }) {
  const d = useDict();
  const [skills, setSkills] = useState<string[]>(extra.skills);
  const [rates, setRates] = useState<{ label: string; amount: string }[]>(
    (extra.rates ?? []).map((rate) => ({ label: rate.label, amount: String(rate.cents / 100) })),
  );
  const [weekly, setWeekly] = useState<AvailabilityWindow[]>(extra.availability?.weekly ?? []);
  const [languages, setLanguages] = useState<string[]>(extra.languages ?? []);
  const [isAvailable, setIsAvailable] = useState(extra.is_available);
  const [state, action] = useActionState(updateExtraProfile, null);
  const error = state && !state.ok ? state : null;

  useEffect(() => {
    if (state?.ok) toast.success(d.profile.profileSaved);
  }, [state, d]);

  return (
    <Card>
      <form action={action} className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">{d.profile.aboutYou}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isAvailable ? d.profile.aboutYouSub : d.uploads.hiddenFromSearch}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Label htmlFor="availability-switch" className="text-muted-foreground">
              {d.profile.available}
            </Label>
            <Switch
              id="availability-switch"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
              aria-label={d.profile.available}
            />
            <input type="hidden" name="isAvailable" value={String(isAvailable)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={d.onboarding.displayName} error={error?.field === "displayName" ? error.error : undefined}>
            {(id) => <Input id={id} name="displayName" defaultValue={profile.display_name} required />}
          </Field>
          <Field
            label={d.profile.username}
            hint={d.profile.usernameHint}
            error={error?.field === "username" ? error.error : undefined}
          >
            {(id) => (
              <Input
                id={id}
                name="username"
                defaultValue={profile.username ?? ""}
                placeholder={d.uploads.usernamePlaceholder}
                maxLength={30}
              />
            )}
          </Field>
        </div>

        <Field label={d.onboarding.bio}>
          {(id) => <Textarea id={id} name="bio" defaultValue={extra.bio ?? ""} maxLength={600} />}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={d.onboarding.yearsExperience}>
            {(id) => (
              <Input
                id={id}
                name="yearsExperience"
                type="number"
                min={0}
                max={60}
                defaultValue={extra.years_experience ?? ""}
              />
            )}
          </Field>
          <Field label={d.onboarding.hourlyRate}>
            {(id) => (
              <Input
                id={id}
                name="hourlyRate"
                type="number"
                min={0}
                step="0.5"
                defaultValue={extra.hourly_rate_cents != null ? extra.hourly_rate_cents / 100 : ""}
              />
            )}
          </Field>
        </div>

        <Field
          label={d.profile.moreRates}
          hint={d.profile.ratesHint}
        >
          {() => (
            <div className="flex flex-col gap-2">
              {rates.map((rate, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    name="rateLabel"
                    value={rate.label}
                    placeholder={d.uploads.ratePlaceholder}
                    maxLength={40}
                    aria-label="Rate name"
                    onChange={(e) =>
                      setRates((prev) =>
                        prev.map((r, i) => (i === index ? { ...r, label: e.target.value } : r)),
                      )
                    }
                  />
                  <Input
                    name="rateAmount"
                    value={rate.amount}
                    type="number"
                    min={0}
                    step="0.5"
                    placeholder="€/hr"
                    className="w-28"
                    aria-label="Rate in euros per hour"
                    onChange={(e) =>
                      setRates((prev) =>
                        prev.map((r, i) => (i === index ? { ...r, amount: e.target.value } : r)),
                      )
                    }
                  />
                  <button
                    type="button"
                    aria-label="Remove rate"
                    onClick={() => setRates((prev) => prev.filter((_, i) => i !== index))}
                    className="pressable rounded-sm p-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              {rates.length < 6 ? (
                <button
                  type="button"
                  onClick={() => setRates((prev) => [...prev, { label: "", amount: "" }])}
                  className="pressable inline-flex items-center gap-1.5 self-start rounded-sm px-2 py-1.5 text-[13px] font-medium text-accent"
                >
                  <Plus className="size-4" /> {d.profile.addRate}
                </button>
              ) : null}
            </div>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={d.profile.signatureDrink} hint={d.profile.partyTrick}>
            {(id) => (
              <Input
                id={id}
                name="signatureDrink"
                defaultValue={extra.signature_drink ?? ""}
                placeholder={d.uploads.signaturePlaceholder}
                maxLength={80}
              />
            )}
          </Field>
          <Field label={d.profile.instagram} error={error?.field === "instagramHandle" ? error.error : undefined}>
            {(id) => (
              <Input
                id={id}
                name="instagramHandle"
                defaultValue={extra.instagram_handle ?? ""}
                placeholder="@yourhandle"
                maxLength={31}
              />
            )}
          </Field>
        </div>

        <Field label={d.profile.skills}>
          {() => (
            <ChipGroup
              options={SKILLS.map((sk) => ({ value: sk.value, label: d.labels.skills[sk.value] ?? sk.label }))}
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

        <Field label={d.profile.languages} hint={d.uploads.languagesHint}>
          {() => <LanguagePicker value={languages} onChange={setLanguages} />}
        </Field>

        <Field
          label={d.uploads.usualAvailability}
          hint={d.uploads.availabilityHint}
        >
          {() => (
            <>
              <WeekHoursEditor windows={weekly} onChange={setWeekly} />
              <input type="hidden" name="availabilityWindows" value={JSON.stringify(weekly)} />
            </>
          )}
        </Field>

        <FormError message={error && !error.field ? error.error : undefined} />
        <SubmitButton className="self-start">{d.profile.saveProfile}</SubmitButton>
      </form>
    </Card>
  );
}
