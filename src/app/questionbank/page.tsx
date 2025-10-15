import QuestionBankPageComponent from "@/components/questionbank/qb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "SAT Question Bank - 5000+ Official Collegeboard Questions",
  description:
    "Access the complete SAT Question Bank with 2000+ official College Board questions. We use official SAT Suite Question Bank Questions. Browse SAT Suite Question Bank with real exam questions for Math, Reading, and Writing sections. Updated with latest questions.",
  keywords: [
    "SAT Question Bank",
    "SAT Suite Question Bank",
    "College Board Question Bank",
    "official SAT questions",
    "SAT question database",
    "College Board SAT questions",
    "SAT Suite questions",
    "real SAT questions",
    "authentic SAT questions",
    "SAT question collection",
    "SAT exam questions",
    "SAT test questions",
    "SAT math questions",
    "SAT reading questions",
    "SAT writing questions",
    "SAT question library",
    "complete SAT questions",
    "SAT questions database",
    "official SAT question bank",
    "SAT Suite Question Bank 2024",
    "SAT Suite Question Bank 2025",
    "official SAT Suite Question Bank Questions",
    "College Board Question Bank",
    "authentic SAT Suite questions",
    "latest SAT questions",
    "new SAT questions",
    "SAT question archive",
    "comprehensive SAT questions",
    "SAT prep questions",
    "SAT practice questions",
    "SAT test prep",
    "digital SAT questions",
    "SAT question types",
    "SAT difficulty levels",
    "free SAT questions",
    "SAT question categories",
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
    title: "MySATPrep Question Bank",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "SAT Question Bank | 2000+ Official College Board Questions",
    description:
      "Access the complete SAT Question Bank with 2000+ official College Board questions. Browse SAT Suite Question Bank with real exam questions for all sections.",
    type: "website",
    url: "https://www.mysatprep.fun/questionbank",
    siteName: "MySATPrep",
    locale: "en_US",
    countryName: "United States",
    emails: ["support@mysatprep.fun"],
    phoneNumbers: [],
    faxNumbers: [],
    images: [
      {
        url: "/seo/question-bank.png",
        width: 1200,
        height: 630,
        alt: "SAT Question Bank - 2000+ Official College Board Questions | MySATPrep",
        type: "image/png",
      },
      {
        url: "/seo/questionbank-tracker.png",
        width: 1200,
        height: 630,
        alt: "SAT Question Bank Progress Tracker - MySATPrep",
        type: "image/png",
      },
      {
        url: "/seo/save-important-questions.png",
        width: 1200,
        height: 630,
        alt: "Save Important SAT Questions Feature - MySATPrep",
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
    title: "SAT Question Bank | 2000+ Official College Board Questions",
    description:
      "Browse the complete SAT Question Bank with 2000+ official College Board questions. Real SAT Suite questions for comprehensive test preparation.",
    images: {
      url: "/seo/question-bank.png",
      alt: "SAT Question Bank - MySATPrep",
    },
  },
  alternates: {
    canonical: "https://www.mysatprep.fun/questionbank",
    languages: {
      "en-US": "https://www.mysatprep.fun/questionbank",
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
    "apple-mobile-web-app-title": "MySATPrep Question Bank",
    "application-name": "MySATPrep",
    "msapplication-TileColor": "#0066cc",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#0066cc",
    "color-scheme": "light dark",
    "supported-color-schemes": "light dark",
    "format-detection": "telephone=no",
    HandheldFriendly: "true",
    MobileOptimized: "width",
    "DC.title": "SAT Question Bank - 2000+ Official College Board Questions",
    "DC.creator": "MySATPrep Team",
    "DC.subject": "SAT Test Preparation, Educational Resources",
    "DC.description":
      "Complete SAT Question Bank with official College Board questions",
    "DC.publisher": "MySATPrep",
    "DC.contributor": "College Board",
    "DC.date": "2024-01-01",
    "DC.type": "Text.Homepage.Educational",
    "DC.format": "text/html",
    "DC.identifier": "https://www.mysatprep.fun/questionbank",
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

export default function QuestionbankPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "SAT Question Bank - 2000+ Official College Board Questions",
    description:
      "Access the complete SAT Question Bank with 2000+ official College Board questions. Browse SAT Suite Question Bank with real exam questions for Math, Reading, and Writing sections.",
    url: "https://www.mysatprep.fun/questionbank",
    mainEntity: {
      "@type": "EducationalOrganization",
      name: "MySATPrep",
      url: "https://www.mysatprep.fun",
      description:
        "Complete SAT test preparation platform with official College Board questions",
      sameAs: [
        "https://twitter.com/MySATPrep",
        "https://facebook.com/MySATPrep",
        "https://instagram.com/MySATPrep",
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
          name: "Question Bank",
          item: "https://www.mysatprep.fun/questionbank",
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
        name: "SAT Test Preparation",
      },
      {
        "@type": "Thing",
        name: "College Board Questions",
      },
      {
        "@type": "Thing",
        name: "Educational Assessment",
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
        url: "https://www.mysatprep.fun/seo/question-bank.png",
        width: 1200,
        height: 630,
        caption: "SAT Question Bank Interface",
      },
      {
        "@type": "ImageObject",
        url: "https://www.mysatprep.fun/seo/questionbank-tracker.png",
        width: 1200,
        height: 630,
        caption: "Question Bank Progress Tracker",
      },
      {
        "@type": "ImageObject",
        url: "https://www.mysatprep.fun/seo/save-important-questions.png",
        width: 1200,
        height: 630,
        caption: "Save Important Questions Feature",
      },
    ],
    screenshot: {
      "@type": "ImageObject",
      url: "https://www.mysatprep.fun/seo/question-bank.png",
      caption: "SAT Question Bank Main Interface",
    },
  };

  return (
    <React.Fragment>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <QuestionBankPageComponent />

      {/* Hidden SEO Elements */}
      <div className="hidden" aria-hidden="true">
        <h1>
          SAT Question Bank - 2000+ Official College Board Questions | MySATPrep
        </h1>

        <h2>Official SAT Suite Question Bank</h2>
        <p>
          Access over 2000+ authentic SAT questions directly from College Board.
          Our comprehensive question bank includes official SAT Suite questions
          for Math, Reading and Writing, and Language sections.
        </p>

        <h3>SAT Math Questions</h3>
        <p>
          Practice with official SAT math questions covering algebra, geometry,
          trigonometry, and data analysis. All questions are sourced directly
          from College Board's SAT Suite Question Bank.
        </p>

        <h3>SAT Reading and Writing Questions</h3>
        <p>
          Improve your verbal skills with authentic SAT reading comprehension
          and writing questions. Practice with real College Board questions used
          in actual SAT exams.
        </p>

        <h3>Digital SAT Question Bank</h3>
        <p>
          Prepare for the digital SAT with our updated question bank featuring
          the latest format and question types from College Board's official SAT
          Suite.
        </p>

        <nav aria-label="Question Bank Navigation">
          <ul>
            <li>
              <a href="/questionbank/math">SAT Math Questions</a>
            </li>
            <li>
              <a href="/questionbank/reading">SAT Reading Questions</a>
            </li>
            <li>
              <a href="/questionbank/writing">SAT Writing Questions</a>
            </li>
            <li>
              <a href="/practice">SAT Practice Tests</a>
            </li>
            <li>
              <a href="/dashboard">Practice Dashboard</a>
            </li>
          </ul>
        </nav>

        <article>
          <header>
            <h4>Why Choose MySATPrep Question Bank?</h4>
          </header>
          <section>
            <h5>Official College Board Questions</h5>
            <p>
              Every question in our database comes directly from College Board's
              SAT Suite Question Bank, ensuring authenticity and accuracy for
              your SAT preparation.
            </p>
          </section>

          <section>
            <h5>Comprehensive Coverage</h5>
            <p>
              Our question bank covers all SAT sections: Math (Heart of Algebra,
              Problem Solving, Advanced Math), Reading, and Writing & Language.
            </p>
          </section>

          <section>
            <h5>Updated for Digital SAT</h5>
            <p>
              All questions are updated to reflect the current digital SAT
              format, including adaptive testing features and modern question
              types.
            </p>
          </section>
        </article>

        <aside>
          <h6>SAT Question Categories</h6>
          <ul>
            <li>Algebraic equations and inequalities</li>
            <li>Geometry and trigonometry</li>
            <li>Data analysis and statistics</li>
            <li>Reading comprehension passages</li>
            <li>Grammar and usage questions</li>
            <li>Rhetoric and expression</li>
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
            © 2024 MySATPrep. Official SAT questions used under license from
            College Board.
          </p>
          <p>
            SAT® is a trademark registered by College Board, which is not
            affiliated with, and does not endorse, this website.
          </p>
        </footer>

        {/* Additional semantic elements for SEO */}
        <div itemScope itemType="https://schema.org/EducationalOrganization">
          <span itemProp="name">MySATPrep</span>
          <span itemProp="description">
            Complete SAT preparation platform with official College Board
            questions
          </span>
          <span itemProp="url">https://www.mysatprep.fun</span>
          <span itemProp="email">support@mysatprep.fun</span>
        </div>

        <div itemScope itemType="https://schema.org/Course">
          <span itemProp="name">SAT Question Bank</span>
          <span itemProp="description">
            2000+ Official College Board SAT Questions
          </span>
          <span
            itemProp="provider"
            itemScope
            itemType="https://schema.org/Organization"
          >
            <span itemProp="name">MySATPrep</span>
          </span>
          <span itemProp="educationalLevel">High School</span>
          <span itemProp="teaches">SAT Test Preparation</span>
        </div>

        {/* Keywords for long-tail SEO */}
        <div>
          <span>SAT question bank free</span>
          <span>official SAT questions online</span>
          <span>College Board question database</span>
          <span>SAT Suite questions download</span>
          <span>digital SAT practice questions</span>
          <span>authentic SAT exam questions</span>
          <span>SAT math algebra questions</span>
          <span>SAT reading comprehension practice</span>
          <span>SAT writing grammar questions</span>
          <span>official SAT prep materials</span>
          <span>College Board authorized questions</span>
          <span>SAT question difficulty levels</span>
          <span>comprehensive SAT question collection</span>
          <span>real SAT test questions</span>
          <span>updated SAT question bank 2024</span>
          <span>SAT Suite Question Bank 2025</span>
        </div>

        {/* Hidden Images for SEO */}
        <div>
          <img
            src="/seo/question-bank.png"
            alt="SAT Question Bank Interface - Browse 2000+ Official College Board Questions"
            width="1200"
            height="630"
          />
          <img
            src="/seo/questionbank-tracker.png"
            alt="SAT Question Bank Progress Tracker - Track Your Practice Performance"
            width="1200"
            height="630"
          />
          <img
            src="/seo/save-important-questions.png"
            alt="Save Important SAT Questions - Bookmark Questions for Review"
            width="1200"
            height="630"
          />
          <img
            src="/seo/practice-session.png"
            alt="SAT Practice Session - Real College Board Questions Practice"
            width="1200"
            height="630"
          />
        </div>

        {/* Image descriptions for context */}
        <section>
          <h6>SAT Question Bank Features</h6>
          <p>
            Interactive question bank interface with 2000+ official College
            Board SAT questions
          </p>
          <p>
            Advanced progress tracking system to monitor your SAT preparation
            journey
          </p>
          <p>
            Save and bookmark important questions for focused review sessions
          </p>
          <p>
            Comprehensive practice sessions with authentic SAT exam questions
          </p>
        </section>
      </div>
    </React.Fragment>
  );
}
