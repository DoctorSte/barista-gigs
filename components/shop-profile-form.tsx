"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { updateShopProfile } from "@/app/actions/shop";
import type { CoffeeShop, Machine } from "@/lib/database.types";
import { MACHINE_TYPES } from "@/lib/constants";
import { Switch } from "@/components/ui/switch";
import { SubmitButton } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { Card } from "@/components/ui/card";

export function ShopProfileForm({ shop }: { shop: CoffeeShop }) {
  const [machines, setMachines] = useState<Machine[]>(shop.machines ?? []);
  const [isPublished, setIsPublished] = useState(shop.is_published);
  const [state, action] = useActionState(updateShopProfile, null);
  const error = state && !state.ok ? state : null;

  useEffect(() => {
    if (state?.ok) toast.success("Café saved");
  }, [state]);

  return (
    <Card>
      <form action={action} className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Café details</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isPublished
                ? "Your café is visible to baristas in your city."
                : "Your café is hidden — publish it so baristas can see who's hiring."}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Label htmlFor="publish-switch" className="text-muted-foreground">
              Published
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

        <Field label="Café name" error={error?.field === "name" ? error.error : undefined}>
          {(id) => <Input id={id} name="name" defaultValue={shop.name} required />}
        </Field>

        <Field label="Address" error={error?.field === "address" ? error.error : undefined}>
          {(id) => <Input id={id} name="address" defaultValue={shop.address} required />}
        </Field>

        <Field label="About the café">
          {(id) => (
            <Textarea id={id} name="description" defaultValue={shop.description ?? ""} maxLength={1000} />
          )}
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Website" error={error?.field === "website" ? error.error : undefined}>
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
          <Field label="Phone">
            {(id) => <Input id={id} name="phone" type="tel" defaultValue={shop.phone ?? ""} />}
          </Field>
        </div>

        <Field label="Machines" hint="What will the barista be working on?">
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
                    placeholder="e.g. La Marzocco Linea"
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
        <SubmitButton className="self-start">Save café</SubmitButton>
      </form>
    </Card>
  );
}
