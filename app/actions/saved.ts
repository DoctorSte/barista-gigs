"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/auth";
import type { ActionResult } from "@/lib/validation";

export async function toggleSavedBarista(
  extraId: string,
): Promise<ActionResult<{ saved: boolean }>> {
  const shop = await getShop();
  if (!shop) return { ok: false, error: "Log in as a café to save baristas." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("saved_baristas")
    .select("extra_id")
    .eq("shop_id", shop.id)
    .eq("extra_id", extraId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("saved_baristas")
      .delete()
      .eq("shop_id", shop.id)
      .eq("extra_id", extraId);
    if (error) return { ok: false, error: "Could not update saved baristas." };
    revalidatePath("/cafe/baristas");
    return { ok: true, data: { saved: false } };
  }

  const { error } = await supabase
    .from("saved_baristas")
    .insert({ shop_id: shop.id, extra_id: extraId });
  if (error) return { ok: false, error: "Could not update saved baristas." };
  revalidatePath("/cafe/baristas");
  return { ok: true, data: { saved: true } };
}
