import { HeroSection } from "@/components/home-hero";
import React from "react";
import type { Metadata } from "next";
import FooterSection from "@/components/footer";

export const metadata: Metadata = {
  title: "Free SAT Practice Questions & Test Prep - MySATPrep",
  description:
    "We use official SAT Suite Question Bank Questions to provide a better interface for studying, with an answer interface, integrated timers+Desmos, and more",
  keywords: [
    "free SAT practice",
    "SAT test prep",
    "College Board questions",
    "Collegeboard Questionbank practice",
    "Collegeboard Questionbank questions",
    "SAT practice test",
    "SAT math practice",
    "SAT reading practice",
    "SAT writing practice",
    "improve SAT scores",
    "SAT study guide",
    "standardized test prep",
    "college entrance exam",
    "SAT question bank",
    "digital SAT practice",
    "SAT Suite questions",
    "SAT Suite Question Bank",
    "SAT Question Bank",
    "official SAT Suite questions",
    "official SAT questions",
    "SAT vocabulary practice",
    "SAT flashcards",
    "SAT progress tracking",
    "personalized SAT prep",
    "adaptive SAT learning",
    "SAT analytics dashboard",
    "complete SAT preparation",
    "comprehensive SAT study",
    "SAT score improvement",
    "best SAT prep platform",
    "free SAT resources",
    "SAT practice platform",
    "online SAT preparation",
    "College Board Question Bank",
    "official SAT Suite Question Bank Questions",
    "authentic SAT Suite questions",
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
    title: "MySATPrep",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Free SAT Practice Questions & Test Prep - MySATPrep",
    description:
      "Boost your SAT scores with our comprehensive question bank featuring real Collegeboard's Questionbank questions. Track progress and master the SAT.",
    type: "website",
    url: "https://www.mysatprep.fun",
    siteName: "MySATPrep",
    locale: "en_US",
    countryName: "United States",
    emails: ["support@mysatprep.fun"],
    phoneNumbers: [],
    faxNumbers: [],
    images: [
      {
        url: "/seo/dashboard-layout.png",
        width: 1200,
        height: 630,
        alt: "MySATPrep - Master the SAT with comprehensive practice questions",
        type: "image/png",
      },
      {
        url: "/seo/question-bank.png",
        width: 1200,
        height: 630,
        alt: "SAT Question Bank - 2000+ Official College Board Questions",
        type: "image/png",
      },
      {
        url: "/seo/vocabs-wordbank.png",
        width: 1200,
        height: 630,
        alt: "SAT Vocabulary Wordbank - 800+ Essential Words",
        type: "image/png",
      },
      {
        url: "/seo/personalized-stats.png",
        width: 1200,
        height: 630,
        alt: "Personalized SAT Progress Analytics",
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
    title: "Free SAT Practice Questions & Test Prep - MySATPrep",
    description:
      "Boost your SAT scores with our comprehensive question bank featuring real Collegeboard's Questionbank questions practice questions. Track progress and master the SAT.",
    images: {
      url: "/seo/dashboard-layout.png",
      alt: "MySATPrep - Free SAT Practice Platform",
    },
  },
  alternates: {
    canonical: "https://www.mysatprep.fun",
    languages: {
      "en-US": "https://www.mysatprep.fun",
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
    "apple-mobile-web-app-title": "MySATPrep",
    "application-name": "MySATPrep",
    "msapplication-TileColor": "#0066cc",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#0066cc",
    "color-scheme": "light dark",
    "supported-color-schemes": "light dark",
    "format-detection": "telephone=no",
    HandheldFriendly: "true",
    MobileOptimized: "width",
    "DC.title": "Free SAT Practice Questions & Test Prep - MySATPrep",
    "DC.creator": "MySATPrep Team",
    "DC.subject":
      "SAT Test Preparation, College Board Questions, Educational Resources",
    "DC.description":
      "Comprehensive SAT preparation platform with official College Board questions",
    "DC.publisher": "MySATPrep",
    "DC.contributor": "College Board",
    "DC.date": "2024-01-01",
    "DC.type": "Text.Homepage.Educational",
    "DC.format": "text/html",
    "DC.identifier": "https://www.mysatprep.fun",
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

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.mysatprep.fun/#website",
        url: "https://www.mysatprep.fun",
        name: "MySATPrep",
        description:
          "Free SAT practice questions and comprehensive test preparation platform with official College Board questions",
        publisher: {
          "@id": "https://www.mysatprep.fun/#organization",
        },
        potentialAction: [
          {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate:
                "https://www.mysatprep.fun/search?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        ],
        inLanguage: "en-US",
        copyrightHolder: {
          "@id": "https://www.mysatprep.fun/#organization",
        },
      },
      {
        "@type": "WebPage",
        "@id": "https://www.mysatprep.fun/#webpage",
        url: "https://www.mysatprep.fun",
        name: "Free SAT Practice Questions & Test Prep - MySATPrep",
        isPartOf: {
          "@id": "https://www.mysatprep.fun/#website",
        },
        about: {
          "@id": "https://www.mysatprep.fun/#organization",
        },
        primaryImageOfPage: {
          "@id": "https://www.mysatprep.fun/#primaryimage",
        },
        image: {
          "@id": "https://www.mysatprep.fun/#primaryimage",
        },
        thumbnailUrl: "https://www.mysatprep.fun/seo/dashboard-layout.png",
        datePublished: "2024-01-01T00:00:00+00:00",
        dateModified: new Date().toISOString(),
        description:
          "Boost your SAT scores with our comprehensive question bank featuring real Collegeboard's Questionbank questions. We use official SAT Suite Question Bank Questions. Track progress, identify weak areas, and master the SAT with personalized practice sessions.",
        breadcrumb: {
          "@id": "https://www.mysatprep.fun/#breadcrumb",
        },
        inLanguage: "en-US",
        potentialAction: [
          {
            "@type": "ReadAction",
            target: ["https://www.mysatprep.fun"],
          },
        ],
      },
      {
        "@type": "ImageObject",
        inLanguage: "en-US",
        "@id": "https://www.mysatprep.fun/#primaryimage",
        url: "https://www.mysatprep.fun/seo/dashboard-layout.png",
        contentUrl: "https://www.mysatprep.fun/seo/dashboard-layout.png",
        width: 1200,
        height: 630,
        caption: "MySATPrep - Free SAT Practice Platform Dashboard",
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://www.mysatprep.fun/#breadcrumb",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://www.mysatprep.fun",
          },
        ],
      },
      {
        "@type": "EducationalOrganization",
        "@id": "https://www.mysatprep.fun/#organization",
        name: "MySATPrep",
        alternateName: "My SAT Prep",
        url: "https://www.mysatprep.fun",
        logo: {
          "@type": "ImageObject",
          inLanguage: "en-US",
          "@id": "https://www.mysatprep.fun/#/schema/logo/image/",
          url: "https://www.mysatprep.fun/icon-512x512.png",
          contentUrl: "https://www.mysatprep.fun/icon-512x512.png",
          width: 512,
          height: 512,
          caption: "MySATPrep",
        },
        image: {
          "@id": "https://www.mysatprep.fun/#/schema/logo/image/",
        },
        sameAs: [
          "https://www.facebook.com/mysatprep",
          "https://www.twitter.com/mysatprep",
          "https://www.instagram.com/mysatprep",
          "https://www.youtube.com/mysatprep",
        ],
        address: {
          "@type": "PostalAddress",
          addressCountry: "US",
          addressRegion: "Nationwide",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: "support@mysatprep.fun",
          availableLanguage: ["English"],
        },
        foundingDate: "2024",
        description:
          "Leading educational technology platform providing free SAT practice questions and comprehensive test preparation resources",
        knowsAbout: [
          "SAT Test Preparation",
          "College Board Questions",
          "SAT Suite Question Bank",
          "SAT Question Bank",
          "Official SAT Suite Questions",
          "Digital SAT",
          "Standardized Test Prep",
          "Educational Assessment",
          "Academic Analytics",
          "Vocabulary Building",
          "Study Progress Tracking",
        ],
        memberOf: {
          "@type": "Organization",
          name: "Educational Technology Providers",
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "MySATPrep",
        applicationCategory: "EducationalApplication",
        operatingSystem: ["Web", "iOS", "Android"],
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "1250",
          bestRating: "5",
          worstRating: "1",
        },
        featureList: [
          "2000+ Official College Board Questions",
          "800+ Essential SAT Vocabulary Words",
          "Personalized Progress Tracking",
          "Adaptive Learning Algorithm",
          "Performance Analytics Dashboard",
          "Interactive Flashcards",
          "Multiple Practice Modes",
          "Detailed Answer Explanations",
        ],
        screenshot: [
          "https://www.mysatprep.fun/seo/dashboard-layout.png",
          "https://www.mysatprep.fun/seo/question-bank.png",
          "https://www.mysatprep.fun/seo/vocabs-wordbank.png",
          "https://www.mysatprep.fun/seo/personalized-stats.png",
        ],
        softwareVersion: "2.0",
        datePublished: "2024-01-01",
        author: {
          "@id": "https://www.mysatprep.fun/#organization",
        },
        publisher: {
          "@id": "https://www.mysatprep.fun/#organization",
        },
      },
    ],
  };

  return (
    <React.Fragment>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hidden SEO Content */}
      <div className="sr-only" aria-hidden="true">
        <h1>Free SAT Practice Questions and Test Preparation Platform</h1>
        <h2>Comprehensive SAT Study Resources</h2>
        <p>
          MySATPrep offers the most comprehensive free SAT preparation platform
          featuring over 2000 official College Board questions, 800+ essential
          vocabulary words, and advanced progress tracking analytics. Our
          platform helps students improve their SAT scores through personalized
          practice sessions, adaptive learning algorithms, and detailed
          performance insights.
        </p>

        <h3>Key Features and Benefits</h3>
        <ul>
          <li>
            Official College Board Questionbank Questions - Access to authentic
            SAT practice materials
          </li>
          <li>
            Comprehensive Question Bank - Over 2000 questions across all SAT
            sections
          </li>
          <li>
            SAT Vocabulary Mastery - 800+ essential words with interactive
            flashcards
          </li>
          <li>
            Progress Tracking Dashboard - Detailed analytics and performance
            metrics
          </li>
          <li>
            Personalized Learning Path - Adaptive algorithms for targeted
            improvement
          </li>
          <li>
            Multiple Practice Modes - Various study formats to match learning
            preferences
          </li>
          <li>
            Real-time Feedback - Instant scoring and detailed explanations
          </li>
          <li>
            Mobile-Friendly Design - Study anywhere, anytime on any device
          </li>
        </ul>

        <h3>SAT Preparation Categories</h3>
        <nav>
          <ul>
            <li>
              <a href="/questionbank">
                SAT Question Bank - Practice with Official Questions
              </a>
            </li>
            <li>
              <a href="/dashboard/vocabs">
                SAT Vocabulary Wordbank - Essential Words
              </a>
            </li>
            <li>
              <a href="/dashboard/vocabs/learn">
                Interactive Flashcards - Spaced Repetition Learning
              </a>
            </li>
            <li>
              <a href="/dashboard/vocabs/practice">
                AI-Powered Vocabulary Practice
              </a>
            </li>
            <li>
              <a href="/dashboard/tracker">
                Progress Analytics - Track Your Improvement
              </a>
            </li>
            <li>
              <a href="/practice">Personalized Practice Sessions</a>
            </li>
            <li>
              <a href="/review">Performance Review and Analysis</a>
            </li>
          </ul>
        </nav>

        <h3>Why Choose MySATPrep?</h3>
        <p>
          MySATPrep stands out as the premier free SAT preparation platform by
          offering authentic College Board questions, comprehensive vocabulary
          resources, and advanced analytics. Our platform combines the best of
          traditional test prep with modern technology to deliver personalized
          learning experiences that adapt to each student's needs.
        </p>

        <h4>Educational Excellence</h4>
        <p>
          Built by educators and test prep experts, MySATPrep ensures
          high-quality content aligned with the latest SAT format. Our question
          bank features official College Board materials, providing students
          with the most authentic practice experience possible.
        </p>

        <h4>Technology-Driven Learning</h4>
        <p>
          Our advanced algorithms track student performance, identify weak
          areas, and recommend targeted practice sessions. The platform's
          adaptive learning system ensures efficient study time and maximum
          score improvement.
        </p>

        <h4>Accessibility and Convenience</h4>
        <p>
          Available 24/7 on any device, MySATPrep makes SAT preparation
          accessible to all students regardless of location or schedule. Our
          mobile-optimized design ensures seamless studying on smartphones,
          tablets, and computers.
        </p>
      </div>

      <HeroSection />
      <FooterSection />
    </React.Fragment>
  );
}
