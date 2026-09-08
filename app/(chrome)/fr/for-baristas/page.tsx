import type { Metadata } from "next";
import { ForBaristasView } from "@/components/marketing-views";

export const metadata: Metadata = {
  title: "Gigs barista freelance — gratuit, sans commission",
  description:
    "Trouvez des shifts payés dans les cafés de spécialité de votre ville. Gratuit pour toujours, sans commission sur votre paie, avec un Passeport Barista partageable qui documente chaque shift.",
  alternates: {
    canonical: "/fr/for-baristas",
    languages: { en: "/for-baristas", fr: "/fr/for-baristas" },
  },
  openGraph: {
    title: "Barista Gigs pour les baristas — votre métier, à vos conditions",
    description:
      "Des shifts payés dans les cafés de spécialité de votre ville. Gratuit pour toujours, sans commission, avec un Passeport Barista qui documente chaque shift.",
    locale: "fr_FR",
  },
};

export default function ForBaristasPageFr() {
  return <ForBaristasView locale="fr" />;
}
