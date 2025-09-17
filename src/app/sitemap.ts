import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const mainDomain = "https://mysatprep.fun";

  return [
    {
      url: `${mainDomain}`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: `${mainDomain}/questionbank`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${mainDomain}/practice`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${mainDomain}/dashboard`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${mainDomain}/dashboard/vocabs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${mainDomain}/dashboard/tracker`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
