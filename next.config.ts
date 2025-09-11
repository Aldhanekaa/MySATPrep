import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: "/api/lookup",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=3600, stale-while-revalidate=59",
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      new URL("https://originui.com/**"),
      new URL("https://upload.wikimedia.org/**"),
      new URL("https://vectorseek.com/**"),
      new URL("https://assets.dub.co/**"),
      new URL("https://raw.githubusercontent.com/**"),
    ],
  },
};

export default nextConfig;
