import VocabsPracticePage_Main from "@/components/dashboard/vocabs/practice/practice";
import { PracticeBanner } from "@/components/dashboard/vocabs/practice/practice-banner";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title:
    "AI-Powered SAT Vocabulary Practice - Practice With 800+ Common Words in SAT",
  description:
    "Master SAT vocabulary with AI-powered practice modes featuring 800+ College Board words. Adaptive learning, personalized quizzes, context-based exercises, and intelligent spaced repetition from SAT Suite Question Bank vocabulary.",
  keywords: [
    "AI SAT vocabulary practice",
    "SAT vocab practice modes",
    "adaptive SAT vocabulary",
    "AI-powered vocabulary learning",
    "personalized SAT vocab practice",
    "intelligent SAT vocabulary",
    "SAT vocabulary AI tutor",
    "adaptive vocabulary learning",
    "College Board vocabulary practice",
    "SAT Suite vocabulary practice",
    "context-based vocabulary practice",
    "AI vocabulary exercises",
    "personalized vocabulary quizzes",
    "intelligent spaced repetition",
    "SAT vocab learning modes",
    "AI-driven vocabulary study",
    "smart vocabulary practice",
    "customized SAT vocab training",
    "AI vocabulary coaching",
    "dynamic vocabulary practice",
    "machine learning vocabulary",
    "adaptive SAT word practice",
    "AI-enhanced vocabulary study",
    "personalized word learning",
    "intelligent vocabulary drills",
    "AI vocabulary assessment",
    "custom vocabulary practice",
    "smart SAT vocab study",
  ],
  openGraph: {
    title: "AI-Powered SAT Vocabulary Practice | Multiple Study Modes",
    description:
      "Master SAT vocabulary with AI-powered practice modes featuring 800+ College Board words. Adaptive learning, personalized quizzes, and intelligent spaced repetition.",
    type: "website",
    url: "https://mysatprep.fun/dashboard/vocabs/practice",
    siteName: "MySATPrep",
    images: [
      {
        url: "/og-vocab-practice.png",
        width: 1200,
        height: 630,
        alt: "AI-Powered SAT Vocabulary Practice - Multiple Study Modes | MySATPrep",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Powered SAT Vocabulary Practice | Multiple Study Modes",
    description:
      "Master 800+ SAT vocabulary words with AI-powered practice modes. Adaptive learning, personalized quizzes, and intelligent coaching from College Board content.",
    images: ["/og-vocab-practice.png"],
    site: "@MySATPrep",
  },
  alternates: {
    canonical: "/dashboard/vocabs/practice",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function VocabsPracticePage() {
  return (
    <React.Fragment>
      <PracticeBanner />
      <section className="space-y-4 max-w-full lg:max-w-2xl w-full mx-auto px-3 py-10 ">
        <VocabsPracticePage_Main />
      </section>
    </React.Fragment>
  );
}
