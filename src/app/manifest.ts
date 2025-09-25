import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MySATPrep - SAT Practice & Question Bank",
    short_name: "MySATPrep",
    description:
      "Free SAT practice platform sourced from Collegeboard's question bank.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    orientation: "portrait-primary",
    scope: "/",
    lang: "en-US",
    categories: ["education", "productivity", "reference"],
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },

      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Practice Questions",
        short_name: "Practice",
        description: "Start practicing SAT questions",
        url: "/practice",
        icons: [
          {
            src: "/shortcut-practice.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
      {
        name: "Question Bank",
        short_name: "Questions",
        description: "Browse SAT question bank",
        url: "/questionbank",
        icons: [
          {
            src: "/shortcut-questions.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
      {
        name: "Progress",
        short_name: "Progress",
        description: "View your SAT progress",
        url: "/dashboard/tracker",
        icons: [
          {
            src: "/shortcut-progress.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
    screenshots: [
      {
        src: "/screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "MySATPrep desktop interface showing SAT practice questions",
      },
      {
        src: "/screenshot-narrow.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label: "MySATPrep mobile interface for SAT preparation",
      },
    ],
  };
}
