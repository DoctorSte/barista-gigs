"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getExtraProfile, getSession } from "@/lib/auth";
import { extraProfileSchema, firstZodError, type ActionResult } from "@/lib/validation";

export async function updateAvatar(path: string | null): Promise<ActionResult> {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Log in first." };
  if (path !== null && !path.startsWith(`${user.id}/`)) {
    return { ok: false, error: "Invalid photo." };
  }

  const url = path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
    : null;
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (error) return { ok: false, error: "Could not save your photo. Try again." };

  revalidatePath("/", "layout");
  return { ok: true };
}

function parseWindows(raw: FormDataEntryValue | null): unknown[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function updateCv(
  path: string | null,
  filename: string | null,
): Promise<ActionResult> {
  const { user } = await getSession();
  const extra = await getExtraProfile();
  if (!user || !extra) return { ok: false, error: "Log in as a barista to edit your CV." };
  if (path !== null && !path.startsWith(`${user.id}/`)) {
    return { ok: false, error: "Invalid file." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("extras_profiles")
    .update({
      cv_path: path,
      cv_filename: path ? (filename ?? "CV") : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", extra.id);
  if (error) return { ok: false, error: "Could not save your CV. Try again." };

  revalidatePath("/profile");
  return { ok: true };
}

export async function updateExtraProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await getSession();
  const extra = await getExtraProfile();
  if (!user || !extra) return { ok: false, error: "Log in as a barista to edit this profile." };

  const rateLabels = formData.getAll("rateLabel").map(String);
  const rateAmounts = formData.getAll("rateAmount").map(String);
  const rates = rateLabels
    .map((label, index) => ({
      label: label.trim(),
      cents: Math.round((Number(rateAmounts[index]) || 0) * 100),
    }))
    .filter((rate) => rate.label !== "");

  const parsed = extraProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio") ?? "",
    yearsExperience: formData.get("yearsExperience") ? Number(formData.get("yearsExperience")) : null,
    hourlyRateCents: formData.get("hourlyRate")
      ? Math.round(Number(formData.get("hourlyRate")) * 100)
      : null,
    rates,
    signatureDrink: formData.get("signatureDrink") ?? "",
    instagramHandle: formData.get("instagramHandle") ?? "",
    skills: formData.getAll("skills"),
    languages: formData.getAll("languages"),
    isAvailable: formData.get("isAvailable") === "true",
    availability: {
      weekly: parseWindows(formData.get("availabilityWindows")),
      blackoutDates: extra.availability?.blackoutDates ?? [],
    },
  });
  if (!parsed.success) {
    const { message, field } = firstZodError(parsed.error);
    return { ok: false, error: message, field };
  }

  const supabase = await createClient();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);
  if (profileError) return { ok: false, error: "Could not save your name. Try again." };

  const { error } = await supabase
    .from("extras_profiles")
    .update({
      bio: parsed.data.bio || null,
      years_experience: parsed.data.yearsExperience,
      hourly_rate_cents: parsed.data.hourlyRateCents,
      rates: parsed.data.rates,
      signature_drink: parsed.data.signatureDrink || null,
      instagram_handle: parsed.data.instagramHandle || null,
      skills: parsed.data.skills,
      languages: parsed.data.languages,
      is_available: parsed.data.isAvailable,
      availability: parsed.data.availability,
      updated_at: new Date().toISOString(),
    })
    .eq("id", extra.id);
  if (error) return { ok: false, error: "Could not save your profile. Try again." };

  revalidatePath("/profile");
  return { ok: true };
}

export async function updatePaymentDetails(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await getSession();
  const extra = await getExtraProfile();
  if (!user || !extra) return { ok: false, error: "Log in as a barista to edit payment details." };

  const details = String(formData.get("details") ?? "").trim();
  if (details.length > 600) {
    return { ok: false, error: "Keep payment details under 600 characters.", field: "details" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("extras_payment_details")
    .upsert({ extra_id: extra.id, details, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: "Could not save your payment details. Try again." };

  revalidatePath("/profile");
  return { ok: true };
}
