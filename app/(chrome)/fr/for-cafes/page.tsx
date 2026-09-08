import type { Metadata } from "next";
import { ForCafesView } from "@/components/marketing-views";

export const metadata: Metadata = {
  title: "Recrutez des baristas freelances pour vos shifts",
  description:
    "Publiez un shift, recevez les candidatures de baristas freelances expérimentés de votre ville et couvrez votre bar — avec parcours vérifiables, avis et mode SOS. Dès 15 €/mois.",
  alternates: {
    canonical: "/fr/for-cafes",
    languages: { en: "/for-cafes", fr: "/fr/for-cafes" },
  },
  openGraph: {
    title: "Barista Gigs pour les cafés — vos shifts, assurés",
    description:
      "Publiez un shift, recevez les candidatures de baristas freelances expérimentés de votre ville. Dès 15 €/mois.",
    locale: "fr_FR",
  },
};

export default function ForCafesPageFr() {
  return <ForCafesView locale="fr" />;
}
