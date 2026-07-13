"use server";

import {
  announcementSchema,
  extraProfileSchema,
  interestSchema,
  messageSchema,
  shopProfileSchema,
  signUpSchema,
} from "@barista-gigs/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile, requireProfile, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function signUpAction(formData: FormData): Promise<void> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    displayName: formData.get("displayName"),
    citySlug: formData.get("citySlug"),
  });

  if (!parsed.success) {
    redirect("/signup?error=invalid");
  }

  const supabase = await createClient();
  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", parsed.data.citySlug)
    .maybeSingle();

  if (!city) {
    redirect("/signup?error=city");
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    redirect("/signup?error=auth");
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    role: parsed.data.role,
    display_name: parsed.data.displayName,
    city_id: city.id,
  });

  if (profileError) {
    redirect("/signup?error=profile");
  }

  redirect("/onboarding");
}

export async function signInAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/gigs");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=auth&next=${encodeURIComponent(next)}`);
  }

  redirect(next.startsWith("/") ? next : "/gigs");
}

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (profile.role === "shop") {
    const parsed = shopProfileSchema.safeParse({
      name: formData.get("name"),
      address: formData.get("address"),
      machines: formData.getAll("machines"),
      description: formData.get("description") || undefined,
      website: formData.get("website") || undefined,
      phone: formData.get("phone") || undefined,
      isPublished: formData.get("isPublished") === "on",
    });

    if (!parsed.success) {
      redirect("/onboarding?error=invalid");
    }

    const { error } = await supabase.from("coffee_shops").upsert({
      owner_id: profile.id,
      city_id: profile.city_id,
      name: parsed.data.name,
      address: parsed.data.address,
      machines: parsed.data.machines,
      description: parsed.data.description ?? null,
      website: parsed.data.website || null,
      phone: parsed.data.phone ?? null,
      is_published: parsed.data.isPublished,
      updated_at: new Date().toISOString(),
    });

    if (error) redirect("/onboarding?error=save");

    const { data: createdShop } = await supabase
      .from("coffee_shops")
      .select("id")
      .eq("owner_id", profile.id)
      .maybeSingle();

    if (createdShop) {
      await supabase.from("subscriptions").upsert({
        shop_id: createdShop.id,
        status: "inactive",
        updated_at: new Date().toISOString(),
      });
    }

    redirect("/shop/dashboard");
  }

  const parsed = extraProfileSchema.safeParse({
    bio: formData.get("bio") || undefined,
    yearsExperience: formData.get("yearsExperience")
      ? Number(formData.get("yearsExperience"))
      : undefined,
    hourlyRateCents: formData.get("hourlyRateCents")
      ? Number(formData.get("hourlyRateCents"))
      : undefined,
    currency: formData.get("currency") || "EUR",
    availability: {
      weekly: [],
      blackoutDates: [],
    },
    skills: formData.getAll("skills"),
    isAvailable: true,
  });

  if (!parsed.success) {
    redirect("/onboarding?error=invalid");
  }

  const { error } = await supabase.from("extras_profiles").upsert({
    user_id: profile.id,
    city_id: profile.city_id,
    bio: parsed.data.bio ?? null,
    years_experience: parsed.data.yearsExperience ?? null,
    hourly_rate_cents: parsed.data.hourlyRateCents ?? null,
    currency: parsed.data.currency,
    availability: parsed.data.availability,
    skills: parsed.data.skills,
    is_available: parsed.data.isAvailable,
    updated_at: new Date().toISOString(),
  });

  if (error) redirect("/onboarding?error=save");
  redirect("/gigs");
}

export async function updateShopProfileAction(formData: FormData): Promise<void> {
  await requireRole("shop");
  const parsed = shopProfileSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    machines: formData.getAll("machines"),
    description: formData.get("description") || undefined,
    website: formData.get("website") || undefined,
    phone: formData.get("phone") || undefined,
    isPublished: formData.get("isPublished") === "on",
  });

  if (!parsed.success) {
    redirect("/shop/profile?error=invalid");
  }

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("coffee_shops")
    .update({
      name: parsed.data.name,
      address: parsed.data.address,
      machines: parsed.data.machines,
      description: parsed.data.description ?? null,
      website: parsed.data.website || null,
      phone: parsed.data.phone ?? null,
      is_published: parsed.data.isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("owner_id", profile.id);

  if (error) redirect("/shop/profile?error=save");
  revalidatePath("/shop/profile");
  redirect("/shop/profile?saved=1");
}

export async function updateExtraProfileAction(formData: FormData): Promise<void> {
  await requireRole("extra");
  const parsed = extraProfileSchema.safeParse({
    bio: formData.get("bio") || undefined,
    yearsExperience: formData.get("yearsExperience")
      ? Number(formData.get("yearsExperience"))
      : undefined,
    hourlyRateCents: formData.get("hourlyRateCents")
      ? Number(formData.get("hourlyRateCents"))
      : undefined,
    currency: formData.get("currency") || "EUR",
    availability: JSON.parse(String(formData.get("availability") ?? "{}")),
    skills: formData.getAll("skills"),
    isAvailable: formData.get("isAvailable") === "on",
  });

  if (!parsed.success) {
    redirect("/profile?error=invalid");
  }

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("extras_profiles")
    .update({
      bio: parsed.data.bio ?? null,
      years_experience: parsed.data.yearsExperience ?? null,
      hourly_rate_cents: parsed.data.hourlyRateCents ?? null,
      currency: parsed.data.currency,
      availability: parsed.data.availability,
      skills: parsed.data.skills,
      is_available: parsed.data.isAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", profile.id);

  if (error) redirect("/profile?error=save");
  revalidatePath("/profile");
  redirect("/profile?saved=1");
}

export async function createAnnouncementAction(formData: FormData): Promise<void> {
  await requireRole("shop");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    startsAt: new Date(String(formData.get("startsAt"))).toISOString(),
    endsAt: new Date(String(formData.get("endsAt"))).toISOString(),
    payRateCents: Number(formData.get("payRateCents")),
    payType: formData.get("payType"),
    requiredSkills: formData.getAll("requiredSkills"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect("/shop/announce/new?error=invalid");
  }

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("coffee_shops")
    .select("id")
    .eq("owner_id", profile.id)
    .maybeSingle();

  if (!shop) redirect("/shop/profile");

  const { error } = await supabase.from("announcements").insert({
    shop_id: shop.id,
    city_id: profile.city_id,
    title: parsed.data.title,
    description: parsed.data.description,
    starts_at: parsed.data.startsAt,
    ends_at: parsed.data.endsAt,
    pay_rate_cents: parsed.data.payRateCents,
    pay_type: parsed.data.payType,
    required_skills: parsed.data.requiredSkills,
    status: parsed.data.status,
  });

  if (error) redirect("/shop/announce/new?error=save");
  revalidatePath("/shop/dashboard");
  redirect("/shop/dashboard");
}

export async function expressInterestAction(formData: FormData): Promise<void> {
  await requireRole("extra");
  const parsed = interestSchema.safeParse({
    announcementId: formData.get("announcementId"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    redirect(`/gigs/${String(formData.get("announcementId"))}?error=invalid`);
  }

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: extra } = await supabase
    .from("extras_profiles")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!extra) redirect("/profile");

  const { data: announcement } = await supabase
    .from("announcements")
    .select("shop_id")
    .eq("id", parsed.data.announcementId)
    .maybeSingle();

  if (!announcement) redirect("/gigs");

  const { error: interestError } = await supabase.from("interests").insert({
    announcement_id: parsed.data.announcementId,
    extra_id: extra.id,
    message: parsed.data.message,
  });

  if (interestError) {
    redirect(`/gigs/${parsed.data.announcementId}?error=interest`);
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .upsert(
      {
        announcement_id: parsed.data.announcementId,
        shop_id: announcement.shop_id,
        extra_id: extra.id,
      },
      { onConflict: "announcement_id,extra_id" },
    )
    .select("id")
    .single();

  if (conversation) {
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: profile.id,
      body: parsed.data.message,
    });
  }

  revalidatePath("/messages");
  redirect("/messages");
}

export async function sendMessageAction(formData: FormData): Promise<void> {
  const parsed = messageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return;
  }

  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase.from("messages").insert({
    conversation_id: parsed.data.conversationId,
    sender_id: profile.id,
    body: parsed.data.body,
  });

  revalidatePath(`/messages/${parsed.data.conversationId}`);
}
