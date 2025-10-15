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
    "Learn SAT vocabulary with interactive flashcards featuring 800+ essential words from College Board's SAT Suite Question Bank. We use official SAT Suite Question Bank Questions. Master SAT vocab through spaced repetition, definitions, examples, and quiz mode for better Reading and Writing scores.",
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
    "free SAT flashcards",
    "SAT flashcard generator",
    "mobile SAT flashcards",
    "SAT vocabulary review cards",
    "flashcard SAT study method",
    "SAT word definition cards",
    "visual SAT vocabulary learning",
  ],
  authors: [{ name: "MySATPrep Team" }],
  creator: "MySATPrep",
  publisher: "MySATPrep",
  applicationName: "MySATPrep",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "Education",
  classification: "Educational Resource",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#0066cc",
  colorScheme: "light dark",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "MySATPrep Flashcards",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "SAT Vocabulary Flashcards | Learn 800+ SAT Words",
    description:
      "Learn SAT vocabulary with interactive flashcards featuring 800+ essential words from College Board's SAT Suite Question Bank. Master SAT vocab through spaced repetition and quiz mode.",
    type: "website",
    url: "https://www.mysatprep.fun/dashboard/vocabs/learn",
    siteName: "MySATPrep",
    locale: "en_US",
    countryName: "United States",
    emails: ["support@mysatprep.fun"],
    phoneNumbers: [],
    faxNumbers: [],
    images: [
      {
        url: "/seo/vocabs-flashcard.png",
        width: 1200,
        height: 630,
        alt: "SAT Vocabulary Flashcards - Interactive Learning with 800+ Words | MySATPrep",
        type: "image/png",
      },
      {
        url: "/seo/vocabs-practice-modes.png",
        width: 1200,
        height: 630,
        alt: "SAT Vocabulary Practice Modes - Multiple Learning Methods | MySATPrep",
        type: "image/png",
      },
      {
        url: "/seo/vocabs-ai-feedbacks.png",
        width: 1200,
        height: 630,
        alt: "SAT Vocabulary AI Feedback - Smart Learning System | MySATPrep",
        type: "image/png",
      },
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "MySATPrep Logo",
        type: "image/png",
      },
    ],
    videos: [],
    audio: [],
  },
  twitter: {
    card: "summary_large_image",
    site: "@MySATPrep",
    creator: "@MySATPrep",
    title: "SAT Vocabulary Flashcards | Learn 800+ SAT Words",
    description:
      "Master SAT vocabulary with interactive flashcards. 800+ words from College Board questions with spaced repetition, definitions, and quiz mode.",
    images: {
      url: "/seo/vocabs-flashcard.png",
      alt: "SAT Vocabulary Flashcards - MySATPrep",
    },
  },
  alternates: {
    canonical: "https://www.mysatprep.fun/dashboard/vocabs/learn",
    languages: {
      "en-US": "https://www.mysatprep.fun/dashboard/vocabs/learn",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_SITE_VERIFICATION,
    other: {
      me: ["support@mysatprep.fun"],
    },
  },
  metadataBase: new URL("https://www.mysatprep.fun"),
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "MySATPrep Flashcards",
    "application-name": "MySATPrep",
    "msapplication-TileColor": "#0066cc",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#0066cc",
    "color-scheme": "light dark",
    "supported-color-schemes": "light dark",
    "format-detection": "telephone=no",
    HandheldFriendly: "true",
    MobileOptimized: "width",
    "DC.title": "SAT Vocabulary Flashcards - Learn 800+ Common Words",
    "DC.creator": "MySATPrep Team",
    "DC.subject":
      "SAT Vocabulary, Flashcards, Test Preparation, Educational Resources",
    "DC.description":
      "Interactive SAT vocabulary flashcards with 800+ essential words",
    "DC.publisher": "MySATPrep",
    "DC.contributor": "College Board",
    "DC.date": "2024-01-01",
    "DC.type": "Text.Homepage.Educational",
    "DC.format": "text/html",
    "DC.identifier": "https://www.mysatprep.fun/dashboard/vocabs/learn",
    "DC.source": "https://www.mysatprep.fun",
    "DC.language": "en",
    "DC.relation": "https://www.mysatprep.fun",
    "DC.coverage": "Worldwide",
    "DC.rights": "© 2024 MySATPrep. All rights reserved.",
    rating: "general",
    distribution: "global",
    "revisit-after": "7 days",
    expires: "never",
    "cache-control": "public, max-age=31536000",
    pragma: "no-cache",
    "content-language": "en-US",
    "geo.region": "US",
    "geo.placename": "United States",
    ICBM: "39.50, -98.35",
    "geo.position": "39.50;-98.35",
  },
};

export default function VocabsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "SAT Vocabulary Flashcards - Learn 800+ Common Words",
    description:
      "Learn SAT vocabulary with interactive flashcards featuring 800+ essential words from College Board's SAT Suite Question Bank. Master SAT vocab through spaced repetition, definitions, examples, and quiz mode.",
    url: "https://www.mysatprep.fun/dashboard/vocabs/learn",
    mainEntity: {
      "@type": "Course",
      name: "SAT Vocabulary Flashcards",
      description:
        "Interactive flashcard system to learn 800+ essential SAT vocabulary words",
      provider: {
        "@type": "EducationalOrganization",
        name: "MySATPrep",
        url: "https://www.mysatprep.fun",
        sameAs: [
          "https://twitter.com/MySATPrep",
          "https://facebook.com/MySATPrep",
          "https://instagram.com/MySATPrep",
        ],
      },
      educationalLevel: "High School",
      teaches: "SAT Vocabulary through Flashcards",
      courseCode: "SAT-VOCAB-FLASHCARDS",
      numberOfCredits: 0,
      timeRequired: "P60D",
      coursePrerequisites: "Basic English proficiency",
      educationalCredentialAwarded: "Vocabulary Mastery Certificate",
      isAccessibleForFree: true,
      inLanguage: "en-US",
      learningResourceType: "Interactive Flashcards",
      educationalUse: "Study Material",
      typicalAgeRange: "16-18",
      interactivityType: "active",
      audience: {
        "@type": "EducationalAudience",
        educationalRole: "student",
        audienceType: "High School Students preparing for SAT",
      },
      hasPart: [
        {
          "@type": "LearningResource",
          name: "Spaced Repetition System",
          description:
            "Adaptive learning algorithm for optimal vocabulary retention",
        },
        {
          "@type": "LearningResource",
          name: "Interactive Quiz Mode",
          description: "Test vocabulary knowledge with immediate feedback",
        },
        {
          "@type": "LearningResource",
          name: "Progress Tracking",
          description: "Monitor learning progress and identify weak areas",
        },
      ],
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.mysatprep.fun",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Dashboard",
          item: "https://www.mysatprep.fun/dashboard",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Vocabulary",
          item: "https://www.mysatprep.fun/dashboard/vocabs",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Flashcards",
          item: "https://www.mysatprep.fun/dashboard/vocabs/learn",
        },
      ],
    },
    provider: {
      "@type": "Organization",
      name: "MySATPrep",
      url: "https://www.mysatprep.fun",
      logo: {
        "@type": "ImageObject",
        url: "https://www.mysatprep.fun/icon-512x512.png",
      },
    },
    about: [
      {
        "@type": "Thing",
        name: "SAT Vocabulary Flashcards",
      },
      {
        "@type": "Thing",
        name: "Spaced Repetition Learning",
      },
      {
        "@type": "Thing",
        name: "Interactive Learning",
      },
    ],
    inLanguage: "en-US",
    isAccessibleForFree: true,
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    publisher: {
      "@type": "Organization",
      name: "MySATPrep",
      logo: {
        "@type": "ImageObject",
        url: "https://www.mysatprep.fun/icon-512x512.png",
      },
    },
    image: [
      {
        "@type": "ImageObject",
        url: "https://www.mysatprep.fun/seo/vocabs-flashcard.png",
        width: 1200,
        height: 630,
        caption: "Interactive SAT Vocabulary Flashcards Interface",
      },
      {
        "@type": "ImageObject",
        url: "https://www.mysatprep.fun/seo/vocabs-practice-modes.png",
        width: 1200,
        height: 630,
        caption: "Multiple Vocabulary Practice Modes",
      },
      {
        "@type": "ImageObject",
        url: "https://www.mysatprep.fun/seo/vocabs-ai-feedbacks.png",
        width: 1200,
        height: 630,
        caption: "AI-Powered Learning Feedback System",
      },
    ],
    screenshot: {
      "@type": "ImageObject",
      url: "https://www.mysatprep.fun/seo/vocabs-flashcard.png",
      caption: "SAT Vocabulary Flashcards Main Interface",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

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

      {/* Hidden SEO Elements */}
      <div className="hidden" aria-hidden="true">
        <h1>SAT Vocabulary Flashcards - Learn 800+ Common Words | MySATPrep</h1>

        <h2>Interactive SAT Vocabulary Flashcards</h2>
        <p>
          Master SAT vocabulary with our advanced flashcard system featuring
          800+ essential words from College Board SAT Suite questions. Use
          spaced repetition, interactive learning, and adaptive algorithms to
          maximize vocabulary retention for better SAT scores.
        </p>

        <h3>Spaced Repetition Learning System</h3>
        <p>
          Our intelligent spaced repetition algorithm shows you vocabulary words
          at optimal intervals to maximize long-term retention. Focus more time
          on challenging words while reinforcing your knowledge of familiar SAT
          vocabulary.
        </p>

        <h3>Interactive Vocabulary Practice</h3>
        <p>
          Engage with SAT vocabulary through multiple interaction modes:
          definition recall, context clues, sentence completion, and visual
          association. Each flashcard includes detailed definitions, example
          sentences, and usage contexts.
        </p>

        <h3>Progress Tracking and Analytics</h3>
        <p>
          Monitor your SAT vocabulary learning progress with detailed analytics.
          Track your mastery level for each word, identify challenging
          vocabulary areas, and see your improvement over time with
          comprehensive learning statistics.
        </p>

        <nav aria-label="Flashcard Navigation">
          <ul>
            <li>
              <a href="/dashboard/vocabs/learn?mode=study">Study Mode</a>
            </li>
            <li>
              <a href="/dashboard/vocabs/learn?mode=quiz">Quiz Mode</a>
            </li>
            <li>
              <a href="/dashboard/vocabs/learn?mode=review">Review Mode</a>
            </li>
            <li>
              <a href="/dashboard/vocabs">Vocabulary Dashboard</a>
            </li>
            <li>
              <a href="/dashboard/vocabs">Learning Progress</a>
            </li>
          </ul>
        </nav>

        <article>
          <header>
            <h4>Why Use SAT Vocabulary Flashcards?</h4>
          </header>

          <section>
            <h5>Scientifically Proven Learning Method</h5>
            <p>
              Flashcards with spaced repetition are scientifically proven to
              improve vocabulary retention by up to 200%. Our system optimizes
              review timing for maximum learning efficiency and long-term memory
              consolidation.
            </p>
          </section>

          <section>
            <h5>College Board Aligned Vocabulary</h5>
            <p>
              Every flashcard features words directly sourced from College Board
              SAT Suite questions and official SAT exams, ensuring you study the
              most relevant and frequently tested vocabulary for optimal SAT
              preparation.
            </p>
          </section>

          <section>
            <h5>Adaptive Learning Technology</h5>
            <p>
              Our AI-powered system adapts to your learning pace and style,
              presenting vocabulary cards based on your individual performance
              and retention patterns for personalized SAT vocabulary mastery.
            </p>
          </section>

          <section>
            <h5>Mobile-Optimized Learning</h5>
            <p>
              Study SAT vocabulary anywhere with our mobile-responsive flashcard
              system. Perfect for quick review sessions during commutes, breaks,
              or whenever you have spare time to reinforce your vocabulary
              knowledge.
            </p>
          </section>
        </article>

        <aside>
          <h6>Flashcard Learning Features</h6>
          <ul>
            <li>Spaced repetition algorithm for optimal retention</li>
            <li>Multiple interaction modes and practice types</li>
            <li>Progress tracking and performance analytics</li>
            <li>Difficulty-based vocabulary organization</li>
            <li>Context-rich example sentences</li>
            <li>Visual and audio learning aids</li>
            <li>Customizable study sessions</li>
            <li>Offline study capability</li>
          </ul>
        </aside>

        <footer>
          <address>
            <p>
              Contact MySATPrep:{" "}
              <a href="mailto:support@mysatprep.fun">support@mysatprep.fun</a>
            </p>
          </address>
          <p>
            © 2024 MySATPrep. SAT vocabulary flashcards based on official
            College Board materials.
          </p>
          <p>
            SAT® is a trademark registered by College Board, which is not
            affiliated with, and does not endorse, this website.
          </p>
        </footer>

        {/* Additional semantic elements for SEO */}
        <div itemScope itemType="https://schema.org/Course">
          <span itemProp="name">SAT Vocabulary Flashcards</span>
          <span itemProp="description">
            Interactive flashcard system to learn 800+ essential SAT vocabulary
            words
          </span>
          <span
            itemProp="provider"
            itemScope
            itemType="https://schema.org/Organization"
          >
            <span itemProp="name">MySATPrep</span>
            <span itemProp="url">https://www.mysatprep.fun</span>
          </span>
          <span itemProp="educationalLevel">High School</span>
          <span itemProp="teaches">
            SAT Vocabulary through Interactive Flashcards
          </span>
          <span itemProp="timeRequired">P60D</span>
          <span itemProp="isAccessibleForFree">true</span>
          <span itemProp="inLanguage">en-US</span>
        </div>

        <div itemScope itemType="https://schema.org/LearningResource">
          <span itemProp="name">Spaced Repetition Flashcards</span>
          <span itemProp="description">
            Advanced flashcard system with spaced repetition algorithm
          </span>
          <span itemProp="learningResourceType">Interactive Flashcards</span>
          <span itemProp="educationalUse">Study Material</span>
          <span itemProp="interactivityType">active</span>
        </div>

        {/* Hidden Images for SEO */}
        <div>
          <img
            src="/seo/vocabs-flashcard.png"
            alt="SAT Vocabulary Flashcards Interface - Interactive Learning with Spaced Repetition"
            width="1200"
            height="630"
          />
          <img
            src="/seo/vocabs-practice-modes.png"
            alt="SAT Vocabulary Practice Modes - Multiple Study Methods and Learning Options"
            width="1200"
            height="630"
          />
          <img
            src="/seo/vocabs-ai-feedbacks.png"
            alt="AI-Powered SAT Vocabulary Feedback - Smart Learning Analytics and Progress Tracking"
            width="1200"
            height="630"
          />
        </div>

        {/* Image descriptions for context */}
        <section>
          <h6>Flashcard Learning System Features</h6>
          <p>
            Advanced flashcard interface with spaced repetition algorithm for
            optimal vocabulary retention
          </p>
          <p>
            Multiple practice modes including study, quiz, and review sessions
            for comprehensive learning
          </p>
          <p>
            AI-powered feedback system providing personalized learning insights
            and progress analytics
          </p>
        </section>

        {/* Keywords for long-tail SEO */}
        <div>
          <span>SAT vocabulary flashcards free</span>
          <span>interactive SAT flashcard app</span>
          <span>spaced repetition SAT vocab</span>
          <span>digital SAT vocabulary cards</span>
          <span>College Board flashcards</span>
          <span>SAT word memorization system</span>
          <span>adaptive vocabulary flashcards</span>
          <span>SAT flashcard study method</span>
          <span>mobile SAT vocabulary cards</span>
          <span>smart SAT flashcard system</span>
          <span>SAT vocab learning app</span>
          <span>flashcard SAT preparation</span>
          <span>vocabulary retention techniques</span>
          <span>SAT word practice cards</span>
          <span>effective vocabulary study</span>
          <span>SAT flashcard generator</span>
          <span>personalized vocab flashcards</span>
          <span>SAT vocabulary mastery</span>
          <span>flashcard learning algorithm</span>
          <span>SAT word memory techniques</span>
        </div>
      </div>
    </>
  );
}
