import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession, homeForRole } from "@/lib/auth";
import { LandingView } from "@/components/marketing-views";

export const metadata: Metadata = {
  description:
    "Barista Gigs connects specialty cafés with freelance baristas for one-off shifts. Post a gig, hear from baristas in your city, and cover the bar — starting in Paris.",
  alternates: { canonical: "/", languages: { en: "/", fr: "/fr" } },
};

export default async function LandingPage() {
  const { profile } = await getSession();
  if (profile) redirect(homeForRole(profile.role));
  return <LandingView locale="en" />;
}
