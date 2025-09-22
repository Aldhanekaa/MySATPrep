import LearnVocab from "@/components/dashboard/vocabs/learn";

import { Banner } from "@/components/ui/banner-v2";
import { MessageCircleWarningIcon } from "lucide-react";
import { Metadata } from "next";
import React, { Suspense } from "react";

function PageBanner() {
  return (
    <Banner variant={"default"} className="dark text-foreground">
      <div className="w-full">
        <p className="flex items-center justify-center text-sm">
          <MessageCircleWarningIcon
            className="-mt-0.5 me-3 inline-flex opacity-60"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
          You should submit a sentence for each vocabulary so that you save your
          progress.
        </p>
      </div>
    </Banner>
  );
}

export const metadata: Metadata = {
  title: "SAT Vocabulary Flashcards - Learn 800+ Common Words in SAT",
  description:
    "Learn SAT vocabulary with interactive flashcards featuring 800+ essential words from College Board's SAT Suite Question Bank. Master SAT vocab through spaced repetition, definitions, examples, and quiz mode for better Reading and Writing scores.",
  keywords: [
    "SAT vocabulary flashcards",
    "SAT vocab flashcards",
    "interactive SAT flashcards",
    "SAT word flashcards",
    "digital SAT flashcards",
    "SAT vocabulary cards",
    "learn SAT vocabulary",
    "SAT vocab study cards",
    "SAT flashcard practice",
    "College Board vocabulary flashcards",
    "SAT Suite vocabulary cards",
    "spaced repetition SAT vocab",
    "SAT vocabulary learning",
    "memorize SAT words",
    "SAT vocab quiz cards",
    "adaptive SAT flashcards",
    "personalized SAT vocab",
    "SAT word memory cards",
    "effective SAT vocabulary study",
    "SAT flashcard system",
    "vocabulary flashcard app",
    "smart SAT flashcards",
    "SAT vocab drill cards",
    "interactive vocabulary learning",
    "SAT word practice cards",
    "flashcard SAT preparation",
    "SAT vocabulary mastery cards",
    "online SAT flashcards",
  ],
  openGraph: {
    title: "SAT Vocabulary Flashcards | Learn 800+ SAT Words",
    description:
      "Learn SAT vocabulary with interactive flashcards featuring 800+ essential words from College Board's SAT Suite Question Bank. Master SAT vocab through spaced repetition and quiz mode.",
    type: "website",
    url: "https://mysatprep.fun/dashboard/vocabs/learn",
    siteName: "MySATPrep",
    images: [
      {
        url: "/og-flashcards.png",
        width: 1200,
        height: 630,
        alt: "SAT Vocabulary Flashcards - Interactive Learning with 800+ Words | MySATPrep",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SAT Vocabulary Flashcards | Learn 800+ SAT Words",
    description:
      "Master SAT vocabulary with interactive flashcards. 800+ words from College Board questions with spaced repetition, definitions, and quiz mode.",
    images: ["/og-flashcards.png"],
    site: "@MySATPrep",
  },
  alternates: {
    canonical: "/dashboard/vocabs/learn",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function VocabsPage() {
  return (
    <React.Fragment>
      <PageBanner />
      <section className="space-y-4 max-w-full lg:max-w-2xl w-full mx-auto px-3 py-10 ">
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          }
        >
          <LearnVocab />
        </Suspense>
      </section>
    </React.Fragment>
  );
}
