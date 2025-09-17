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
        userAgent: "Googlebot",
        allow: allowList,
      },
      {
        userAgent: ["Applebot", "Bingbot"],
        allow: allowList,
      },
    ],
    sitemap: "https://mysatprep.fun/sitemap.xml",
  };
}
