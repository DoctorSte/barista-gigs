"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireShop } from "@/lib/auth";
import { getCityById } from "@/lib/city";
import { geocodeAddress } from "@/lib/geocode";
import { firstZodError, shopProfileSchema, type ActionResult } from "@/lib/validation";

export async function updateShopProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { shop } = await requireShop();

  const machineTypes = formData.getAll("machineType").map(String);
  const machineNames = formData.getAll("machineName").map(String);
  const machines = machineTypes
    .map((type, index) => ({ type, name: (machineNames[index] ?? "").trim() }))
    .filter((machine) => machine.name !== "");

  const parsed = shopProfileSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    description: formData.get("description") ?? "",
    website: formData.get("website") ?? "",
    phone: formData.get("phone") ?? "",
    machines,
    isPublished: formData.get("isPublished") === "true",
  });
  if (!parsed.success) {
    const { message, field } = firstZodError(parsed.error);
    return { ok: false, error: message, field };
  }

  // Best-effort geocode so the shop shows up on maps; skip if unchanged.
  let coords: { lat: number; lng: number } | null = null;
  if (parsed.data.address !== shop.address || shop.lat == null || shop.lng == null) {
    const city = await getCityById(shop.city_id);
    coords = await geocodeAddress(parsed.data.address, city?.name);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("coffee_shops")
    .update({
      name: parsed.data.name,
      address: parsed.data.address,
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      description: parsed.data.description || null,
      website: parsed.data.website || null,
      phone: parsed.data.phone || null,
      machines: parsed.data.machines,
      is_published: parsed.data.isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shop.id);

  if (error) return { ok: false, error: "Could not save your shop. Try again." };

  revalidatePath("/shop/profile");
  return { ok: true };
}
