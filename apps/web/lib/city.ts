import { CITY_COOKIE } from "@barista-gigs/shared";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function getSelectedCitySlug() {
  const cookieStore = await cookies();
  return cookieStore.get(CITY_COOKIE)?.value ?? "paris";
}

export async function getCities() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("*")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export async function getCityBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}
