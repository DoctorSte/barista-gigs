import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@barista-gigs/shared";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*, cities(name, slug)")
    .eq("id", user.id)
    .maybeSingle();

  return data as (Profile & { cities: { name: string; slug: string } | null }) | null;
}

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("Profile required");
  }
  return profile;
}

export async function requireRole(role: UserRole) {
  const profile = await requireProfile();
  if (profile.role !== role) {
    throw new Error(`Role ${role} required`);
  }
  return profile;
}
