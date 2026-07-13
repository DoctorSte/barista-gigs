import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { PageShell } from "@/components/page-shell";
import { getCurrentProfile } from "@/lib/auth";

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  return (
    <PageShell
      title="Finish your profile"
      description={
        profile.role === "shop"
          ? "Tell baristas about your shop, machines, and location."
          : "Share your experience, skills, and rates."
      }
    >
      <OnboardingForm role={profile.role} />
    </PageShell>
  );
}
