import type { Metadata } from "next";
import { GuideFreelanceView } from "@/components/guide-freelance-view";

export const metadata: Metadata = {
  title: "Travailler comme barista freelance en France — le guide complet",
  description:
    "Statut micro-entrepreneur, SIRET, facturation, cotisations, TVA et tarifs : tout ce qu'il faut pour travailler des shifts payés en café en France, sources officielles à l'appui.",
  alternates: {
    canonical: "/fr/guides/freelance-barista-france",
    languages: {
      en: "/guides/freelance-barista-france",
      fr: "/fr/guides/freelance-barista-france",
    },
  },
  openGraph: {
    title: "Travailler comme barista freelance en France",
    description:
      "Statut micro-entrepreneur, SIRET, facturation, cotisations et tarifs — le guide complet pour baristas.",
  },
};

export default async function GuidePageFr({
  searchParams,
}: {
  searchParams: Promise<{ sponsor?: string }>;
}) {
  const { sponsor } = await searchParams;
  return <GuideFreelanceView locale="fr" sponsorPreview={sponsor === "preview"} />;
}
