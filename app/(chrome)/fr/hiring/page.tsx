import type { Metadata } from "next";
import { HiringView } from "@/components/hiring-view";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Jobs et shifts de barista à Paris",
  description:
    "Shifts et postes de barista ouverts dans les cafés de spécialité parisiens — salaire horaire affiché. Postulez avec un profil Barista Gigs gratuit.",
  alternates: {
    canonical: "/fr/hiring",
    languages: { en: "/hiring", fr: "/fr/hiring" },
  },
  openGraph: {
    title: "Jobs et shifts de barista à Paris",
    description:
      "Shifts et postes de barista ouverts dans les cafés de spécialité parisiens — salaire horaire affiché.",
  },
};

export default function HiringPageFr() {
  return <HiringView locale="fr" />;
}
