import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://baristagigs.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Authenticated app areas — nothing indexable behind these.
        disallow: [
          "/cafe/",
          "/gigs/",
          "/jobs/",
          "/messages/",
          "/applications",
          "/settings/",
          "/profile",
          "/onboarding",
          "/notifications",
          "/api/",
          "/team/",
          "/r/",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
