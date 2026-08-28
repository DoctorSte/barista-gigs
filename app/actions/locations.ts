"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_SHOP_COOKIE, getOwnerShops, getOwnerSubscription, requireShop } from "@/lib/auth";
import { resolveCityId } from "@/lib/city";
import { geocodeAddress } from "@/lib/geocode";
import { PLANS, isPlanId } from "@/lib/plans";
import {
  citySelectionSchema,
  firstZodError,
  shopOnboardingSchema,
  type ActionResult,
} from "@/lib/validation";

export async function switchLocation(shopId: string): Promise<ActionResult> {
  const shops = await getOwnerShops();
  if (!shops.some((shop) => shop.id === shopId)) {
    return { ok: false, error: "That location isn't yours." };
  }
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SHOP_COOKIE, shopId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addLocation(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await requireShop();
  const shops = await getOwnerShops();
  const subscription = await getOwnerSubscription();
  const plan = PLANS[isPlanId(subscription?.plan) ? subscription!.plan : "regular"];

  if (shops.length >= plan.locations) {
    return {
      ok: false,
      error:
        plan.id === "group"
          ? "The Group plan includes up to 3 locations."
          : `Your ${plan.name} plan includes 1 location — upgrade to Group for up to 3.`,
    };
  }

  const parsed = shopOnboardingSchema.safeParse({
    shopName: formData.get("shopName"),
    address: formData.get("address"),
  });
  if (!parsed.success) {
    const { message, field } = firstZodError(parsed.error);
    return { ok: false, error: message, field };
  }

  const rawCity = formData.get("city");
  if (typeof rawCity !== "string" || !rawCity) {
    return { ok: false, error: "Pick the location's city", field: "city" };
  }
  let cityParsed;
  try {
    cityParsed = citySelectionSchema.parse(JSON.parse(rawCity));
  } catch {
    return { ok: false, error: "Pick the location's city", field: "city" };
  }

  let cityId: string;
  try {
    cityId = await resolveCityId(cityParsed);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "City unavailable" };
  }

  const coords = await geocodeAddress(parsed.data.address, cityParsed.name);
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("coffee_shops")
    .insert({
      owner_id: user.id,
      city_id: cityId,
      name: parsed.data.shopName,
      address: parsed.data.address,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      is_published: true,
    })
    .select("id")
    .single();
  if (error || !created) return { ok: false, error: "Could not add the location. Try again." };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SHOP_COOKIE, created.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  redirect("/cafe/profile");
}
