import type { Metadata } from "next";
import { HiringView } from "@/components/hiring-view";

// Refresh the board every 15 minutes — fresh enough for job seekers, cheap
// enough to serve logged-out search traffic.
export const revalidate = 900;

export const metadata: Metadata = {
  title: "Barista jobs & shifts in Paris",
  description:
    "Open barista shifts and jobs at specialty coffee shops in Paris — hourly pay listed up front. Apply with a free Barista Gigs profile.",
  alternates: {
    canonical: "/hiring",
    languages: { en: "/hiring", fr: "/fr/hiring" },
  },
  openGraph: {
    title: "Barista jobs & shifts in Paris",
    description:
      "Open barista shifts and jobs at specialty coffee shops in Paris — hourly pay listed up front.",
  },
};

export default function HiringPage() {
  return <HiringView locale="en" />;
}
