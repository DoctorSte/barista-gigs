"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/stripe";
import { homeForRole } from "@/lib/auth";
import {
  emailSchema,
  firstZodError,
  loginSchema,
  passwordSchema,
  signupSchema,
  type ActionResult,
} from "@/lib/validation";

function friendlyAuthError(message: string) {
  const known: Record<string, string> = {
    "Invalid login credentials": "That email and password don't match.",
    "Email not confirmed": "Confirm your email first — check your inbox.",
    "User already registered": "An account with this email already exists. Try logging in.",
  };
  return known[message] ?? message;
}

export async function signUp(
  _prev: ActionResult<{ needsConfirmation: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    const { message, field } = firstZodError(parsed.error);
    return { ok: false, error: message, field };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: appUrl("/auth/callback?next=/onboarding"),
      data: {
        display_name: parsed.data.displayName,
        intended_role: parsed.data.role,
      },
    },
  });

  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  if (!data.session) return { ok: true, data: { needsConfirmation: true } };

  redirect("/onboarding");
}

export async function logIn(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const { message, field } = firstZodError(parsed.error);
    return { ok: false, error: message, field };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: friendlyAuthError(error.message) };

  const next = formData.get("next");
  if (typeof next === "string" && next.startsWith("/")) redirect(next);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  redirect(profile ? homeForRole(profile.role) : "/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: "Enter a valid email address" };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: appUrl("/auth/callback?next=/reset-password"),
  });

  // Always report success — never reveal whether an email is registered.
  return { ok: true };
}

export async function resetPassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid password" };
  }
  if (formData.get("confirm") !== formData.get("password")) {
    return { ok: false, error: "Passwords don't match", field: "confirm" };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { ok: false, error: "Your reset link expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { ok: false, error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  redirect(profile ? homeForRole(profile.role) : "/onboarding");
}
