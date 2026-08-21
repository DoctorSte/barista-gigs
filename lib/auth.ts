import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CoffeeShop, ExtraProfile, Profile } from "@/lib/database.types";

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: (profile as Profile | null) ?? null };
});

export async function requireUser() {
  const { user, profile } = await getSession();
  if (!user) redirect("/login");
  return { user, profile };
}

export async function requireProfile() {
  const { user, profile } = await requireUser();
  if (!profile) redirect("/onboarding");
  return { user, profile };
}

export const getShop = cache(async (): Promise<CoffeeShop | null> => {
  const { user } = await getSession();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("coffee_shops")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  return (data as CoffeeShop | null) ?? null;
});

export const getExtraProfile = cache(async (): Promise<ExtraProfile | null> => {
  const { user } = await getSession();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("extras_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return (data as ExtraProfile | null) ?? null;
});

export async function requireShop() {
  const { user, profile } = await requireProfile();
  if (profile.role !== "shop") redirect("/gigs");
  const shop = await getShop();
  if (!shop) redirect("/onboarding");
  return { user, profile, shop };
}

export async function requireExtra() {
  const { user, profile } = await requireProfile();
  if (profile.role !== "extra") redirect("/cafe/dashboard");
  const extra = await getExtraProfile();
  if (!extra) redirect("/onboarding");
  return { user, profile, extra };
}

export function homeForRole(role: "shop" | "extra") {
  return role === "shop" ? "/cafe/dashboard" : "/gigs";
}
