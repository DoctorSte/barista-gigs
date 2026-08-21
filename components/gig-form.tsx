"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, RotateCcw, Siren, X } from "lucide-react";
import { toast } from "sonner";
import { createGig, updateGig } from "@/app/actions/gigs";
import type { Announcement, GigShift } from "@/lib/database.types";
import { SKILLS } from "@/lib/constants";
import { ChipGroup } from "@/components/ui/chip-toggle";
import { SubmitButton } from "@/components/ui/button";
import { Field, Input, Label, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { FormError } from "@/components/form-error";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

function toDateInputValue(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInputValue(iso: string) {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function initialShifts(gig?: Announcement): GigShift[] {
  if (gig?.shifts?.length) return gig.shifts;
  if (gig) {
    return [
      {
        date: toDateInputValue(gig.starts_at),
        start: toTimeInputValue(gig.starts_at),
        end: toTimeInputValue(gig.ends_at),
      },
    ];
  }
  return [{ date: "", start: "", end: "" }];
}

const JOB_KINDS = [
  { value: "full_time" as const, label: "Full-time" },
  { value: "part_time" as const, label: "Part-time" },
];

export function GigForm({
  gig,
  mode: modeProp,
  template,
  inviteExtraId,
  inviteName,
}: {
  gig?: Announcement;
  mode?: "shift" | "job";
  /** Prefills a new listing from a previous one (rebooking); dates stay empty. */
  template?: Announcement;
  inviteExtraId?: string;
  inviteName?: string;
}) {
  const defaults = gig ?? template;
  const mode = modeProp ?? (defaults && defaults.kind !== "shift" ? "job" : "shift");
  const [skills, setSkills] = useState<string[]>(defaults?.required_skills ?? []);
  const [shifts, setShifts] = useState<GigShift[]>(() => initialShifts(gig));
  const [kind, setKind] = useState<"shift" | "full_time" | "part_time">(
    defaults?.kind ?? (mode === "job" ? "full_time" : "shift"),
  );
  const [isSos, setIsSos] = useState(gig?.is_sos ?? false);
  const [payType, setPayType] = useState<"hourly" | "flat" | "monthly">(
    defaults?.pay_type ?? "hourly",
  );
  const [state, action] = useActionState(gig ? updateGig : createGig, null);
  const error = state && !state.ok ? state : null;
  const isJob = kind !== "shift";
  const payTypeOptions = isJob
    ? ([
        { value: "hourly", label: "Per hour" },
        { value: "monthly", label: "Per month" },
      ] as const)
    : ([
        { value: "hourly", label: "Per hour" },
        { value: "flat", label: "Flat rate" },
      ] as const);

  useEffect(() => {
    if (state?.ok) toast.success("Gig saved");
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-5">
      {gig ? <input type="hidden" name="gigId" value={gig.id} /> : null}
      {gig ? <input type="hidden" name="status" value={gig.status} /> : null}
      <input type="hidden" name="kind" value={kind} />
      {inviteExtraId ? <input type="hidden" name="inviteExtraId" value={inviteExtraId} /> : null}

      {inviteName ? (
        <p className="bubble-in inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-soft/50 px-4 py-3 text-sm">
          <RotateCcw className="size-4 shrink-0 text-accent" />
          Rebooking {inviteName} — they&apos;ll be invited the moment you publish.
        </p>
      ) : null}

      {mode === "job" ? (
        <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1" role="radiogroup" aria-label="Job type">
          {JOB_KINDS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={kind === option.value}
              onClick={() => setKind(option.value)}
              className={cn(
                "pressable rounded-sm py-2 text-[13px] font-medium outline-none transition-colors duration-150",
                "focus-visible:ring-2 focus-visible:ring-ring",
                kind === option.value
                  ? "bg-surface-raised text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}

      <Field
        label="Title (optional)"
        hint={
          isJob
            ? "Leave it blank and we'll call it a full- or part-time barista role."
            : "Leave it blank and we'll name the gig after its dates."
        }
        error={error?.field === "title" ? error.error : undefined}
      >
        {(id) => (
          <Input
            id={id}
            name="title"
            defaultValue={defaults?.title}
            placeholder={isJob ? "e.g. Head barista" : "e.g. Saturday brunch rush cover"}
          />
        )}
      </Field>

      <Field
        label="Description"
        hint="What's the shift like? Machines, volume, dress code, who to ask for."
        error={error?.field === "description" ? error.error : undefined}
      >
        {(id) => (
          <Textarea
            id={id}
            name="description"
            defaultValue={defaults?.description}
            required
            minLength={10}
            maxLength={2000}
            className="min-h-32"
          />
        )}
      </Field>

      {isJob ? (
        <Field
          label="Hours per week (optional)"
          hint="Roughly how many hours a week is this role?"
          error={error?.field === "weeklyHours" ? error.error : undefined}
        >
          {(id) => (
            <Input
              id={id}
              name="weeklyHours"
              type="number"
              min={1}
              max={60}
              defaultValue={defaults?.weekly_hours ?? ""}
              className="w-32"
            />
          )}
        </Field>
      ) : (
      <Field
        label="Dates"
        hint="Add every date this gig covers. An end time earlier than the start means the shift runs past midnight."
        error={error?.field?.startsWith("shifts") ? error.error : undefined}
      >
        {() => (
          <div className="flex flex-col gap-2">
            {shifts.map((shift, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  name="shiftDate"
                  type="date"
                  value={shift.date}
                  required
                  aria-label="Shift date"
                  onChange={(e) =>
                    setShifts((prev) =>
                      prev.map((s, i) => (i === index ? { ...s, date: e.target.value } : s)),
                    )
                  }
                />
                <Input
                  name="shiftStart"
                  type="time"
                  value={shift.start}
                  required
                  aria-label="Start time"
                  onChange={(e) =>
                    setShifts((prev) =>
                      prev.map((s, i) => (i === index ? { ...s, start: e.target.value } : s)),
                    )
                  }
                />
                <Input
                  name="shiftEnd"
                  type="time"
                  value={shift.end}
                  required
                  aria-label="End time"
                  onChange={(e) =>
                    setShifts((prev) =>
                      prev.map((s, i) => (i === index ? { ...s, end: e.target.value } : s)),
                    )
                  }
                />
                {shifts.length > 1 ? (
                  <button
                    type="button"
                    aria-label="Remove date"
                    onClick={() => setShifts((prev) => prev.filter((_, i) => i !== index))}
                    className="pressable rounded-sm p-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            ))}
            {shifts.length < 14 ? (
              <button
                type="button"
                onClick={() =>
                  setShifts((prev) => [
                    ...prev,
                    { date: "", start: prev[prev.length - 1]?.start ?? "", end: prev[prev.length - 1]?.end ?? "" },
                  ])
                }
                className="pressable inline-flex items-center gap-1.5 self-start rounded-sm px-2 py-1.5 text-[13px] font-medium text-accent"
              >
                <Plus className="size-4" /> Add a date
              </button>
            ) : null}
          </div>
        )}
      </Field>
      )}

      {!isJob ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3">
          <div className="flex items-start gap-2.5">
            <Siren className={cn("mt-0.5 size-4 shrink-0", isSos ? "text-danger" : "text-muted-foreground")} />
            <div>
              <Label htmlFor="sos-switch">SOS — urgent cover</Label>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Publishing pings every available barista in your city right away.
              </p>
            </div>
          </div>
          <Switch id="sos-switch" checked={isSos} onCheckedChange={setIsSos} aria-label="SOS mode" />
          <input type="hidden" name="isSos" value={String(isSos)} />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Pay (€)" error={error?.field === "payRateCents" ? error.error : undefined}>
          {(id) => (
            <Input
              id={id}
              name="payRate"
              type="number"
              min={1}
              step="0.5"
              defaultValue={defaults ? defaults.pay_rate_cents / 100 : undefined}
              required
            />
          )}
        </Field>
        <Field label="Pay type">
          {() => (
            <div className="grid h-10 grid-cols-2 gap-1 rounded-md bg-muted p-1" role="radiogroup">
              {payTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={payType === option.value}
                  onClick={() => setPayType(option.value)}
                  className={cn(
                    "pressable rounded-sm text-[13px] font-medium outline-none transition-colors duration-150",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                    payType === option.value
                      ? "bg-surface-raised text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
              <input type="hidden" name="payType" value={payType} />
            </div>
          )}
        </Field>
      </div>

      <Field label="Required skills" hint="Optional — helps the right baristas find you.">
        {() => (
          <ChipGroup
            options={[...SKILLS]}
            selected={skills}
            onToggle={(value) =>
              setSkills((prev) =>
                prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
              )
            }
            name="requiredSkills"
          />
        )}
      </Field>

      <FormError message={error && !error.field ? error.error : undefined} />
      <SubmitButton className="self-start">
        {gig ? "Save changes" : mode === "job" ? "Publish job" : "Publish gig"}
      </SubmitButton>
    </form>
  );
}
