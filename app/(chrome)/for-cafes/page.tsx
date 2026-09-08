import type { Metadata } from "next";
import { ForCafesView } from "@/components/marketing-views";

export const metadata: Metadata = {
  title: "Hire freelance baristas for one-off shifts",
  description:
    "Post a shift, hear from experienced freelance baristas in your city, and cover the bar — with track records, reviews, and SOS mode for emergencies. Plans from €15/month.",
  alternates: {
    canonical: "/for-cafes",
    languages: { en: "/for-cafes", fr: "/fr/for-cafes" },
  },
  openGraph: {
    title: "Barista Gigs for cafés — coffee shifts, covered",
    description:
      "Post a shift, hear from experienced freelance baristas in your city, and cover the bar. Plans from €15/month.",
  },
};

export default function ForCafesPage() {
  return <ForCafesView locale="en" />;
}
