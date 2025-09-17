import VocabsMainPage from "@/components/dashboard/vocabs/vocabs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SAT Vocabulary Wordbank | 800+ Essential SAT Words | MySATPrep",
  description:
    "Master 800+ essential SAT vocabulary words with our comprehensive wordbank. Study high-frequency SAT vocab from College Board questions with definitions, examples, and practice exercises. Boost your SAT Reading and Writing scores.",
  keywords: [
    "SAT vocabulary",
    "SAT vocab words",
    "SAT wordbank",
    "SAT vocabulary list",
    "essential SAT words",
    "800 SAT vocabulary words",
    "SAT vocab practice",
    "high frequency SAT words",
    "SAT vocabulary flashcards",
    "SAT reading vocabulary",
    "SAT writing vocabulary",
    "College Board SAT vocabulary",
    "SAT Suite vocabulary",
    "SAT vocab from questions",
    "most common SAT words",
    "SAT vocabulary study",
    "SAT word list",
    "SAT vocabulary preparation",
    "improve SAT vocabulary",
    "SAT vocab definitions",
    "advanced SAT vocabulary",
    "SAT vocabulary builder",
    "comprehensive SAT vocab",
    "SAT vocabulary mastery",
    "official SAT vocabulary",
    "SAT vocabulary database",
    "learn SAT vocabulary",
    "SAT vocab quiz",
  ],
  openGraph: {
    title: "SAT Vocabulary Wordbank | 800+ Essential SAT Words",
    description:
      "Master 800+ essential SAT vocabulary words with our comprehensive wordbank. Study high-frequency SAT vocab from College Board questions with definitions and examples.",
    type: "website",
    url: "https://mysatprep.fun/dashboard/vocabs",
    siteName: "MySATPrep",
    images: [
      {
        url: "/og-vocabs.png",
        width: 1200,
        height: 630,
        alt: "SAT Vocabulary Wordbank - 800+ Essential SAT Words | MySATPrep",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SAT Vocabulary Wordbank | 800+ Essential SAT Words",
    description:
      "Study 800+ high-frequency SAT vocabulary words from College Board questions. Comprehensive wordbank with definitions, examples, and practice exercises.",
    images: ["/og-vocabs.png"],
    site: "@MySATPrep",
  },
  alternates: {
    canonical: "/dashboard/vocabs",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function VocabsPage() {
  return (
    <section className="space-y-4 max-w-4xl lg:max-w-5xl xl:max-w-7xl w-full mx-auto px-3 py-10 ">
      <VocabsMainPage />
    </section>
  );
}
