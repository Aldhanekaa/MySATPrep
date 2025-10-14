import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MySATPrep - SAT Practice & Question Bank with 2000+ Official College Board Questions",
    short_name: "MySATPrep",
    description:
      "Complete SAT preparation platform with 2000+ official College Board questions, interactive vocabulary flashcards, progress tracking, and personalized learning. Free SAT practice for better scores.",
    start_url: "/?utm_source=pwa",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0066cc",
    orientation: "portrait-primary",
    scope: "/",
    lang: "en-US",
    dir: "ltr",
    categories: [
      "education",
      "productivity",
      "reference",
      "learning",
      "test-prep",
    ],
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
        description: "Start practicing with 2000+ official SAT questions",
        url: "/practice?utm_source=pwa_shortcut",
        icons: [
          {
            src: "/seo/practice-session.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Question Bank",
        short_name: "Questions",
        description: "Browse complete SAT Suite Question Bank",
        url: "/questionbank?utm_source=pwa_shortcut",
        icons: [
          {
            src: "/seo/question-bank.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Vocabulary Flashcards",
        short_name: "Vocab",
        description: "Learn 800+ SAT vocabulary words with flashcards",
        url: "/dashboard/vocabs/learn?utm_source=pwa_shortcut",
        icons: [
          {
            src: "/seo/vocabs-flashcard.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Progress Tracker",
        short_name: "Progress",
        description: "View detailed SAT practice analytics and progress",
        url: "/dashboard/tracker?utm_source=pwa_shortcut",
        icons: [
          {
            src: "/seo/personalized-stats.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Vocabulary Wordbank",
        short_name: "Wordbank",
        description: "Access comprehensive SAT vocabulary database",
        url: "/dashboard/vocabs?utm_source=pwa_shortcut",
        icons: [
          {
            src: "/seo/vocabs-wordbank.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
    screenshots: [
      {
        src: "/screenshots/news-new-dashboard.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label:
          "MySATPrep new dashboard interface with comprehensive SAT practice tools, progress tracking, and personalized learning analytics",
      },
      {
        src: "/screenshots/news-questionbank.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label:
          "Enhanced SAT Question Bank with 2000+ official College Board questions, advanced filtering, and difficulty-based organization",
      },
      {
        src: "/screenshots/news-flashcard.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label:
          "Interactive SAT vocabulary flashcards with spaced repetition algorithm, progress tracking, and adaptive learning system",
      },
      {
        src: "/screenshots/news-vocabs.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label:
          "Comprehensive SAT vocabulary wordbank featuring 800+ essential words with definitions, examples, and multiple practice modes",
      },
      {
        src: "/seo/personalized-stats.png",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "narrow",
        label:
          "Personalized SAT progress analytics showing performance trends, weak areas, and improvement recommendations",
      },
      {
        src: "/seo/practice-session.png",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "narrow",
        label:
          "SAT practice session interface with real College Board questions, instant feedback, and detailed explanations",
      },
    ],
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
  };
}
