import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const allowList = [
    "/",
    "/questionbank",
    "/practice",
    "/dashboard",
    "/dashboard/tracker",
    "/dashboard/vocabs",
  ];
  return {
    rules: [
      {
        userAgent: "*",
        allow: allowList,
      }
    ],
    sitemap: "https://www.mysatprep.fun/sitemap.xml",
  };
}
