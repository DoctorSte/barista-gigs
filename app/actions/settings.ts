"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getExtraProfile, getShop, homeForRole, requireProfile } from "@/lib/auth";
import { resolveCityId } from "@/lib/city";
import { citySelectionSchema, type ActionResult } from "@/lib/validation";

export async function changeCity(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { profile } = await requireProfile();

  const rawCity = formData.get("city");
  if (typeof rawCity !== "string" || !rawCity) {
    return { ok: false, error: "Pick your new city", field: "city" };
  }
  let cityParsed;
  try {
    cityParsed = citySelectionSchema.parse(JSON.parse(rawCity));
  } catch {
    return { ok: false, error: "Pick your new city", field: "city" };
  }

  let cityId: string;
  try {
    cityId = await resolveCityId(cityParsed);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "City unavailable" };
  }

  if (cityId === profile.city_id) {
    return { ok: false, error: "You're already in that city.", field: "city" };
  }

  const supabase = await createClient();

  if (profile.role === "shop") {
    const shop = await getShop();
    if (!shop) redirect("/onboarding");
    // Gigs are city-scoped, so a move closes anything still recruiting.
    const { error: closeError } = await supabase
      .from("announcements")
      .update({ status: "closed" })
      .eq("shop_id", shop.id)
      .in("status", ["draft", "open"]);
    const { error: shopError } = await supabase
      .from("coffee_shops")
      .update({ city_id: cityId })
      .eq("id", shop.id);
    if (closeError || shopError) {
      return { ok: false, error: "Could not move your shop. Try again." };
    }
  } else {
    const extra = await getExtraProfile();
    if (!extra) redirect("/onboarding");
    const { error: withdrawError } = await supabase
      .from("interests")
      .delete()
      .eq("extra_id", extra.id)
      .eq("status", "pending");
    const { error: extraError } = await supabase
      .from("extras_profiles")
      .update({ city_id: cityId })
      .eq("id", extra.id);
    if (withdrawError || extraError) {
      return { ok: false, error: "Could not move your profile. Try again." };
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ city_id: cityId })
    .eq("id", profile.id);
  if (profileError) {
    return { ok: false, error: "Could not move your profile. Try again." };
  }

  redirect(homeForRole(profile.role));
}
