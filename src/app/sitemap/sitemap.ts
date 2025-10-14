import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const mainDomain = "https://www.mysatprep.fun";

  return [
    // Main Pages
    {
      url: `${mainDomain}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${mainDomain}/questionbank`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${mainDomain}/practice`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${mainDomain}/resources`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${mainDomain}/review`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${mainDomain}/question`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },

    // Dashboard Pages
    {
      url: `${mainDomain}/dashboard`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${mainDomain}/dashboard/vocabs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${mainDomain}/dashboard/vocabs/learn`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${mainDomain}/dashboard/vocabs/practice`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${mainDomain}/dashboard/tracker`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${mainDomain}/dashboard/answered`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${mainDomain}/dashboard/bookmarks`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${mainDomain}/dashboard/sessions`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];
}
