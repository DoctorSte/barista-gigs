import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CoffeeShop, ExtraProfile, Profile, Subscription } from "@/lib/database.types";

export const ACTIVE_SHOP_COOKIE = "active_shop";

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

/**
 * Whose café workspace does this user act in? Their own if they own any
 * location; otherwise the owner whose team they belong to.
 */
export const getEffectiveOwnerId = cache(async (): Promise<string | null> => {
  const { user } = await getSession();
  if (!user) return null;
  const supabase = await createClient();
  const { count } = await supabase
    .from("coffee_shops")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);
  if ((count ?? 0) > 0) return user.id;
  const { data } = await supabase
    .from("cafe_members")
    .select("owner_id")
    .eq("member_id", user.id)
    .maybeSingle();
  return (data?.owner_id as string | undefined) ?? user.id;
});

/** All of the workspace's locations, oldest (primary) first. */
export const getOwnerShops = cache(async (): Promise<CoffeeShop[]> => {
  const ownerId = await getEffectiveOwnerId();
  if (!ownerId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("coffee_shops")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at");
  return (data as CoffeeShop[] | null) ?? [];
});

/** The active location: the one picked via cookie, else the primary. */
export const getShop = cache(async (): Promise<CoffeeShop | null> => {
  const shops = await getOwnerShops();
  if (shops.length === 0) return null;
  const activeId = (await cookies()).get(ACTIVE_SHOP_COOKIE)?.value;
  return shops.find((shop) => shop.id === activeId) ?? shops[0];
});

/**
 * One subscription covers all locations; the row is keyed to whichever shop
 * subscribed (normally the primary). Prefers an active row.
 */
export const getOwnerSubscription = cache(async (): Promise<Subscription | null> => {
  const shops = await getOwnerShops();
  if (shops.length === 0) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .in(
      "shop_id",
      shops.map((shop) => shop.id),
    );
  const rows = (data as Subscription[] | null) ?? [];
  return rows.find((row) => row.status === "active") ?? rows[0] ?? null;
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
