import type { Metadata } from "next";
import { ForBaristasView } from "@/components/marketing-views";

export const metadata: Metadata = {
  title: "Freelance barista gigs — free, no commission",
  description:
    "Find paid barista shifts at specialty cafés in your city. Free forever, no commission on your pay, one-tap applications, and a shareable Barista Passport that documents every shift.",
  alternates: {
    canonical: "/for-baristas",
    languages: { en: "/for-baristas", fr: "/fr/for-baristas" },
  },
  openGraph: {
    title: "Barista Gigs for baristas — your craft, on your terms",
    description:
      "Find paid barista shifts at specialty cafés in your city. Free forever, no commission, and a Barista Passport that documents every shift.",
  },
};

export default function ForBaristasPage() {
  return <ForBaristasView locale="en" />;
}
