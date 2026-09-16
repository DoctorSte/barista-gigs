import type { Metadata } from "next";
import { GuideFreelanceView } from "@/components/guide-freelance-view";

export const metadata: Metadata = {
  title: "Working freelance barista shifts in France — the complete guide",
  description:
    "Micro-entrepreneur status, SIRET, invoicing, contributions, VAT and rates: everything a barista needs to work paid café shifts in France, with official sources.",
  alternates: {
    canonical: "/guides/freelance-barista-france",
    languages: {
      en: "/guides/freelance-barista-france",
      fr: "/fr/guides/freelance-barista-france",
    },
  },
  openGraph: {
    title: "Working freelance barista shifts in France",
    description:
      "Micro-entrepreneur status, SIRET, invoicing, contributions and rates — the complete guide for baristas.",
  },
};

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ sponsor?: string }>;
}) {
  const { sponsor } = await searchParams;
  return <GuideFreelanceView locale="en" sponsorPreview={sponsor === "preview"} />;
}
