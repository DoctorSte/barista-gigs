"use server";

import { CITY_COOKIE } from "@barista-gigs/shared";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setCityAction(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "paris");
  const cookieStore = await cookies();
  cookieStore.set(CITY_COOKIE, slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: city } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (city) {
      await supabase
        .from("profiles")
        .update({ city_id: city.id })
        .eq("id", user.id);
    }
  }

  redirect("/");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
