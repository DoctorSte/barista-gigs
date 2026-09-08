"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { updateShopProfile } from "@/app/actions/shop";
import type { AvailabilityWindow, CoffeeShop, Machine, OpeningHours } from "@/lib/database.types";
import { MACHINE_TYPES } from "@/lib/constants";
import { WeekHoursEditor } from "@/components/week-hours-editor";
import { Switch } from "@/components/ui/switch";
import { SubmitButton } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { Card } from "@/components/ui/card";
import { useDict } from "@/components/i18n-provider";

function hoursToWindows(hours: OpeningHours | null): AvailabilityWindow[] {
  if (!hours) return [];
  return hours.flatMap((entry, day) =>
    entry ? [{ day, start: entry.open, end: entry.close }] : [],
  );
}

function windowsToHours(windows: AvailabilityWindow[]): OpeningHours {
  return Array.from({ length: 7 }, (_, day) => {
    const w = windows.find((x) => x.day === day);
    return w ? { open: w.start, close: w.end } : null;
  });
}

export function ShopProfileForm({ shop }: { shop: CoffeeShop }) {
  const [machines, setMachines] = useState<Machine[]>(shop.machines ?? []);
  const [openingWindows, setOpeningWindows] = useState<AvailabilityWindow[]>(() =>
    hoursToWindows(shop.opening_hours),
  );
  const d = useDict();
  const [isPublished, setIsPublished] = useState(shop.is_published);
  const [state, action] = useActionState(updateShopProfile, null);
  const error = state && !state.ok ? state : null;

  useEffect(() => {
    if (state?.ok) toast.success(d.shopForm.saved);
  }, [state, d]);

  return (
    <Card>
      <form action={action} className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Café details</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isPublished
                ? d.shopForm.visible
                : d.shopForm.hidden}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Label htmlFor="publish-switch" className="text-muted-foreground">
              {d.shopForm.published}
            </Label>
            <Switch
              id="publish-switch"
              checked={isPublished}
              onCheckedChange={setIsPublished}
              aria-label="Publish café"
            />
            <input type="hidden" name="isPublished" value={String(isPublished)} />
          </div>
        </div>

        <Field label={d.shopForm.cafeName} error={error?.field === "name" ? error.error : undefined}>
          {(id) => <Input id={id} name="name" defaultValue={shop.name} required />}
        </Field>

        <Field label={d.shopForm.address} error={error?.field === "address" ? error.error : undefined}>
          {(id) => <Input id={id} name="address" defaultValue={shop.address} required />}
        </Field>

        <Field label={d.shopForm.about}>
          {(id) => (
            <Textarea id={id} name="description" defaultValue={shop.description ?? ""} maxLength={1000} />
          )}
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={d.shopForm.website} error={error?.field === "website" ? error.error : undefined}>
            {(id) => (
              <Input
                id={id}
                name="website"
                type="url"
                placeholder="https://…"
                defaultValue={shop.website ?? ""}
              />
            )}
          </Field>
          <Field label={d.shopForm.phone}>
            {(id) => <Input id={id} name="phone" type="tel" defaultValue={shop.phone ?? ""} />}
          </Field>
        </div>

        <Field
          label={d.shopForm.openingHours}
          hint={d.shopForm.openingHoursHint}
        >
          {() => (
            <>
              <WeekHoursEditor
                windows={openingWindows}
                onChange={setOpeningWindows}
                defaultStart="07:00"
                defaultEnd="19:00"
              />
              <input
                type="hidden"
                name="openingHours"
                value={JSON.stringify(windowsToHours(openingWindows))}
              />
            </>
          )}
        </Field>

        <Field label={d.shopForm.machines} hint={d.shopForm.machinesHint}>
          {() => (
            <div className="flex flex-col gap-2">
              {machines.map((machine, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    name="machineType"
                    value={machine.type}
                    aria-label="Machine type"
                    className="w-44 shrink-0"
                    onChange={(e) =>
                      setMachines((prev) =>
                        prev.map((m, i) =>
                          i === index ? { ...m, type: e.target.value as Machine["type"] } : m,
                        ),
                      )
                    }
                  >
                    {MACHINE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                  <Input
                    name="machineName"
                    value={machine.name}
                    placeholder={d.shopForm.machinePlaceholder}
                    maxLength={80}
                    aria-label="Machine name"
                    onChange={(e) =>
                      setMachines((prev) =>
                        prev.map((m, i) => (i === index ? { ...m, name: e.target.value } : m)),
                      )
                    }
                  />
                  <button
                    type="button"
                    aria-label="Remove machine"
                    onClick={() => setMachines((prev) => prev.filter((_, i) => i !== index))}
                    className="pressable rounded-sm p-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              {machines.length < 12 ? (
                <button
                  type="button"
                  onClick={() =>
                    setMachines((prev) => [...prev, { type: "espresso_machine", name: "" }])
                  }
                  className="pressable inline-flex items-center gap-1.5 self-start rounded-sm px-2 py-1.5 text-[13px] font-medium text-accent"
                >
                  <Plus className="size-4" /> Add a machine
                </button>
              ) : null}
            </div>
          )}
        </Field>

        <FormError message={error && !error.field ? error.error : undefined} />
        <SubmitButton className="self-start">{d.shopForm.saveCafe}</SubmitButton>
      </form>
    </Card>
  );
}
