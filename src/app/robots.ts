import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const allowList = ["/"];
  return {
    rules: [
      {
        userAgent: "*",
        allow: allowList,
        disallow: ["/private/", "/api/*"],
      },
    ],
    sitemap: "https://www.mysatprep.fun/sitemap2.xml",
  };
}
