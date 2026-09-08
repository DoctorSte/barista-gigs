import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession, homeForRole } from "@/lib/auth";
import { LandingView } from "@/components/marketing-views";

export const metadata: Metadata = {
  title: "Barista Gigs — vos shifts café, assurés",
  description:
    "Barista Gigs met en relation cafés de spécialité et baristas freelances pour des shifts ponctuels. Publiez un gig, recevez des candidatures dans votre ville — on démarre à Paris.",
  alternates: { canonical: "/fr", languages: { en: "/", fr: "/fr" } },
  openGraph: { locale: "fr_FR" },
};

export default async function LandingPageFr() {
  const { profile } = await getSession();
  if (profile) redirect(homeForRole(profile.role));
  return <LandingView locale="fr" />;
}
