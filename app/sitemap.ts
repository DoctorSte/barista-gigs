import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://baristagigs.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const bilingual = (path: string) => ({
    languages: { en: `${BASE}${path || "/"}`, fr: `${BASE}/fr${path}` },
  });
  return [
    {
      url: `${BASE}/`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 1,
      alternates: bilingual(""),
    },
    {
      url: `${BASE}/fr`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      alternates: bilingual(""),
    },
    {
      url: `${BASE}/for-cafes`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
      alternates: bilingual("/for-cafes"),
    },
    {
      url: `${BASE}/fr/for-cafes`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: bilingual("/for-cafes"),
    },
    {
      url: `${BASE}/for-baristas`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
      alternates: bilingual("/for-baristas"),
    },
    {
      url: `${BASE}/fr/for-baristas`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: bilingual("/for-baristas"),
    },
    { url: `${BASE}/signup`, lastModified, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE}/login`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/legal/terms`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/disclaimer`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
