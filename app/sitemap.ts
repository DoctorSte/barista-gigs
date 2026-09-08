import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://baristagigs.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${BASE}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/for-cafes`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/for-baristas`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/signup`, lastModified, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE}/login`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/legal/terms`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/disclaimer`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
