"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeForRole } from "@/lib/auth";
import { resolveCityId } from "@/lib/city";
import { geocodeAddress } from "@/lib/geocode";
import {
  citySelectionSchema,
  extraOnboardingSchema,
  firstZodError,
  shopOnboardingSchema,
  type ActionResult,
} from "@/lib/validation";
import { z } from "zod";

const baseSchema = z.object({
  role: z.enum(["shop", "extra"]),
  displayName: z.string().trim().min(2, "Enter your name").max(80),
});

export async function completeOnboarding(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const base = baseSchema.safeParse({
    role: formData.get("role"),
    displayName: formData.get("displayName"),
  });
  if (!base.success) {
    const { message, field } = firstZodError(base.error);
    return { ok: false, error: message, field };
  }

  const rawCity = formData.get("city");
  if (typeof rawCity !== "string" || !rawCity) {
    return { ok: false, error: "Pick your city", field: "city" };
  }
  let cityParsed;
  try {
    cityParsed = citySelectionSchema.parse(JSON.parse(rawCity));
  } catch {
    return { ok: false, error: "Pick your city", field: "city" };
  }

  let cityId: string;
  try {
    cityId = await resolveCityId(cityParsed);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "City unavailable" };
  }

  const { role, displayName } = base.data;

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    role,
    display_name: displayName,
    city_id: cityId,
  });
  if (profileError) {
    return { ok: false, error: "Could not save your profile. Try again." };
  }

  if (role === "shop") {
    const parsed = shopOnboardingSchema.safeParse({
      shopName: formData.get("shopName"),
      address: formData.get("address"),
    });
    if (!parsed.success) {
      const { message, field } = firstZodError(parsed.error);
      return { ok: false, error: message, field };
    }
    const coords = await geocodeAddress(parsed.data.address, cityParsed.name);
    const { data: existingShop } = await supabase
      .from("coffee_shops")
      .select("id, referred_by")
      .eq("owner_id", user.id)
      .maybeSingle();

    // Resolve a referral cookie (set by /r/[code]) into the referring shop.
    // Best-effort: an unknown code is silently ignored.
    let referrerId: string | null = null;
    if (!existingShop || existingShop.referred_by === null) {
      const cookieStore = await cookies();
      const referralCode = cookieStore.get("referral_code")?.value;
      if (referralCode) {
        const { data: referrer } = await supabase
          .from("coffee_shops")
          .select("id")
          .eq("referral_code", referralCode)
          .maybeSingle();
        if (referrer && referrer.id !== existingShop?.id) referrerId = referrer.id;
      }
    }

    const values = {
      city_id: cityId,
      name: parsed.data.shopName,
      address: parsed.data.address,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      ...(referrerId ? { referred_by: referrerId } : {}),
    };
    const { error } = existingShop
      ? await supabase.from("coffee_shops").update(values).eq("id", existingShop.id)
      : await supabase.from("coffee_shops").insert({
          owner_id: user.id,
          ...values,
          is_published: true,
        });
    if (error) return { ok: false, error: "Could not save your shop. Try again." };
  } else {
    const parsed = extraOnboardingSchema.safeParse({
      bio: formData.get("bio") ?? "",
      yearsExperience: formData.get("yearsExperience") || undefined,
      hourlyRateCents: formData.get("hourlyRate")
        ? Math.round(Number(formData.get("hourlyRate")) * 100)
        : undefined,
      skills: formData.getAll("skills"),
    });
    if (!parsed.success) {
      const { message, field } = firstZodError(parsed.error);
      return { ok: false, error: message, field };
    }
    const { data: existingExtra } = await supabase
      .from("extras_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    const values = {
      city_id: cityId,
      bio: parsed.data.bio || null,
      years_experience: parsed.data.yearsExperience ?? null,
      hourly_rate_cents: parsed.data.hourlyRateCents ?? null,
      skills: parsed.data.skills,
    };
    const { error } = existingExtra
      ? await supabase.from("extras_profiles").update(values).eq("id", existingExtra.id)
      : await supabase.from("extras_profiles").insert({ user_id: user.id, ...values });
    if (error) return { ok: false, error: "Could not save your barista profile. Try again." };
  }

  redirect(homeForRole(role));
}
