import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getExtraProfile, getSession, getShop, homeForRole, requireUser } from "@/lib/auth";
import { getFeaturedCities } from "@/lib/city";
import { AuthShell } from "@/components/auth-shell";
import { OnboardingForm } from "@/components/onboarding-form";

export const metadata: Metadata = { title: "Set up your account" };

export default async function OnboardingPage() {
  const { user } = await requireUser();
  const { profile } = await getSession();

  if (profile) {
    const done =
      profile.role === "shop" ? Boolean(await getShop()) : Boolean(await getExtraProfile());
    if (done) redirect(homeForRole(profile.role));
  }

  const meta = user.user_metadata as { display_name?: string; intended_role?: string };
  const initialRole =
    profile?.role ??
    (meta.intended_role === "shop" || meta.intended_role === "extra"
      ? meta.intended_role
      : "extra");

  const cities = await getFeaturedCities();

  return (
    <AuthShell
      title={initialRole === "shop" ? "Set up your shop" : "Set up your profile"}
      subtitle="Two minutes, then you're in."
    >
      <OnboardingForm
        featuredCities={cities}
        initialRole={initialRole}
        initialName={profile?.display_name ?? meta.display_name ?? ""}
        roleLocked={Boolean(profile)}
      />
    </AuthShell>
  );
}
