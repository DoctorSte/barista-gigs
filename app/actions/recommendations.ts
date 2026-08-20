"use server";

import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/auth";
import type { ActionResult } from "@/lib/validation";

export async function toggleRecommendation(
  extraId: string,
): Promise<ActionResult<{ recommended: boolean }>> {
  const shop = await getShop();
  if (!shop) return { ok: false, error: "Log in as a shop to recommend baristas." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("recommendations")
    .select("id")
    .eq("shop_id", shop.id)
    .eq("extra_id", extraId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("recommendations").delete().eq("id", existing.id);
    if (error) return { ok: false, error: "Could not remove the recommendation. Try again." };
    return { ok: true, data: { recommended: false } };
  }

  // RLS only allows this when the barista worked an accepted shift for this shop.
  const { error } = await supabase
    .from("recommendations")
    .insert({ shop_id: shop.id, extra_id: extraId });
  if (error) {
    return {
      ok: false,
      error: "You can only recommend baristas who worked a shift at your shop.",
    };
  }
  return { ok: true, data: { recommended: true } };
}
