import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SAT Question Search - Find Specific Questions by ID | MySATPrep",
  description:
    "Search for specific SAT questions by ID from the College Board question bank. Access detailed solutions, explanations, and practice with targeted SAT questions to improve your test scores.",
  keywords: [
    "SAT question search",
    "SAT question ID lookup",
    "College Board question search",
    "SAT question finder",
    "specific SAT questions",
    "SAT question database",
    "targeted SAT practice",
    "SAT question bank search",
    "individual SAT questions",
    "SAT question retrieval",
    "College Board Questionbank",
    "SAT question access",
    "SAT practice questions",
    "digital SAT questions",
    "SAT Suite questions",
    "official SAT questions",
    "SAT question solutions",
    "SAT answer explanations",
    "personalized SAT practice",
    "SAT study resources",
    "SAT prep questions",
    "standardized test questions",
    "SAT math questions",
    "SAT reading questions",
    "SAT writing questions",
    "SAT test preparation",
    "educational assessment",
    "academic practice tools",
    "study efficiency",
    "targeted learning",
  ],
  authors: [{ name: "MySATPrep Team" }],
  creator: "MySATPrep",
  publisher: "MySATPrep",
  applicationName: "MySATPrep",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "Education",
  classification: "Educational Search Tool",
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
    title: "MySATPrep Question Search",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "SAT Question Search - Find Specific Questions by ID | MySATPrep",
    description:
      "Search for specific SAT questions by ID from the College Board question bank. Access detailed solutions and practice with targeted questions.",
    type: "website",
    url: "https://www.mysatprep.fun/question",
    siteName: "MySATPrep",
    locale: "en_US",
    countryName: "United States",
    emails: ["support@mysatprep.fun"],
    images: [
      {
        url: "/seo/question-bank.png",
        width: 1200,
        height: 630,
        alt: "SAT Question Search - Find Questions by ID",
        type: "image/png",
      },
      {
        url: "/seo/dashboard-layout.png",
        width: 1200,
        height: 630,
        alt: "MySATPrep Question Search Interface",
        type: "image/png",
      },
      {
        url: "/seo/personalized-stats.png",
        width: 1200,
        height: 630,
        alt: "SAT Question Analytics and Tracking",
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
  },
  twitter: {
    card: "summary_large_image",
    site: "@MySATPrep",
    creator: "@MySATPrep",
    title: "SAT Question Search - Find Specific Questions by ID | MySATPrep",
    description:
      "Search for specific SAT questions by ID from the College Board question bank. Access detailed solutions and targeted practice.",
    images: {
      url: "/seo/question-bank.png",
      alt: "SAT Question Search Tool",
    },
  },
  alternates: {
    canonical: "https://www.mysatprep.fun/question",
    languages: {
      "en-US": "https://www.mysatprep.fun/question",
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
    "apple-mobile-web-app-title": "MySATPrep Question Search",
    "application-name": "MySATPrep Question Search",
    "msapplication-TileColor": "#0066cc",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#0066cc",
    "color-scheme": "light dark",
    "supported-color-schemes": "light dark",
    "format-detection": "telephone=no",
    HandheldFriendly: "true",
    MobileOptimized: "width",
    "DC.title": "SAT Question Search - Find Specific Questions by ID",
    "DC.creator": "MySATPrep Team",
    "DC.subject":
      "SAT Question Search, College Board Questions, Educational Tools",
    "DC.description":
      "Advanced search tool for finding specific SAT questions by ID from the College Board question bank",
    "DC.publisher": "MySATPrep",
    "DC.contributor": "College Board",
    "DC.date": "2024-01-01",
    "DC.type": "Text.Interactive.SearchInterface",
    "DC.format": "text/html",
    "DC.identifier": "https://www.mysatprep.fun/question",
    "DC.source": "https://www.mysatprep.fun",
    "DC.language": "en",
    "DC.relation": "https://www.mysatprep.fun/questionbank",
    "DC.coverage": "SAT Question Database",
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

export default function QuestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://www.mysatprep.fun/question#webpage",
        url: "https://www.mysatprep.fun/question",
        name: "SAT Question Search - Find Specific Questions by ID",
        isPartOf: {
          "@id": "https://www.mysatprep.fun/#website",
        },
        about: {
          "@id": "https://www.mysatprep.fun/#organization",
        },
        description:
          "Search for specific SAT questions by ID from the College Board question bank. Access detailed solutions, explanations, and practice with targeted SAT questions.",
        breadcrumb: {
          "@id": "https://www.mysatprep.fun/question#breadcrumb",
        },
        inLanguage: "en-US",
        potentialAction: [
          {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://www.mysatprep.fun/question/{question_id}",
            },
            "query-input": "required name=question_id",
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://www.mysatprep.fun/question#breadcrumb",
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
            name: "Question Search",
            item: "https://www.mysatprep.fun/question",
          },
        ],
      },
      {
        "@type": "SearchAction",
        "@id": "https://www.mysatprep.fun/question#search",
        name: "SAT Question ID Search",
        description: "Search for specific SAT questions using question IDs",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://www.mysatprep.fun/question/{question_id}",
          actionPlatform: [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/MobileWebPlatform",
            "http://schema.org/IOSPlatform",
            "http://schema.org/AndroidPlatform",
          ],
        },
        "query-input": {
          "@type": "PropertyValueSpecification",
          valueRequired: true,
          valueName: "question_id",
          description: "Enter the SAT question ID (e.g., bd9eb2b5)",
        },
        result: {
          "@type": "Question",
          educationalLevel: "High School",
          learningResourceType: "Practice Question",
          about: "SAT Test Preparation",
        },
      },
      {
        "@type": "WebApplication",
        name: "SAT Question Search Tool",
        applicationCategory: "EducationalApplication",
        operatingSystem: ["Web", "iOS", "Android"],
        browserRequirements: "HTML5, JavaScript enabled",
        url: "https://www.mysatprep.fun/question",
        description:
          "Advanced search interface for finding specific SAT questions by ID",
        featureList: [
          "Question ID Search",
          "Instant Question Retrieval",
          "Detailed Answer Explanations",
          "Mobile-Friendly Interface",
          "Real-time Search Results",
          "College Board Question Access",
        ],
        screenshot: "https://www.mysatprep.fun/seo/question-bank.png",
        author: {
          "@id": "https://www.mysatprep.fun/#organization",
        },
        publisher: {
          "@id": "https://www.mysatprep.fun/#organization",
        },
      },
      {
        "@type": "Course",
        name: "SAT Question Database Access",
        description:
          "Comprehensive access to College Board SAT questions through ID-based search",
        provider: {
          "@id": "https://www.mysatprep.fun/#organization",
        },
        educationalLevel: "High School",
        teaches: [
          "SAT Math Problem Solving",
          "SAT Reading Comprehension",
          "SAT Writing and Language Skills",
          "Test-Taking Strategies",
          "Academic Preparation",
        ],
        courseMode: "online",
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          instructor: {
            "@id": "https://www.mysatprep.fun/#organization",
          },
        },
        about: [
          "SAT Test Preparation",
          "College Board Questions",
          "Standardized Testing",
          "Academic Assessment",
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hidden SEO Content */}
      <div className="sr-only" aria-hidden="true">
        <h1>SAT Question Search - Find Specific Questions by ID</h1>
        <h2>Advanced SAT Question Lookup Tool</h2>
        <p>
          Search for specific SAT questions using unique question IDs from the
          College Board question bank. Our advanced search tool provides instant
          access to over 2000 official SAT questions with detailed solutions,
          comprehensive explanations, and targeted practice opportunities.
        </p>

        <h3>How to Use the Question Search</h3>
        <ol>
          <li>
            Enter the specific question ID you want to find (e.g., bd9eb2b5)
          </li>
          <li>Click the search button or press Enter to initiate the search</li>
          <li>View the complete question with detailed explanations</li>
          <li>Access related practice questions and study materials</li>
          <li>Track your progress and performance analytics</li>
        </ol>

        <h3>Question Search Features</h3>
        <ul>
          <li>
            Instant Question Retrieval - Find any SAT question by its unique ID
          </li>
          <li>
            Official College Board Content - Access authentic SAT questions
          </li>
          <li>
            Detailed Answer Explanations - Comprehensive solution breakdowns
          </li>
          <li>Cross-Reference System - Find related questions and topics</li>
          <li>Mobile-Optimized Interface - Search on any device</li>
          <li>Real-time Results - Immediate access to question content</li>
          <li>
            Progress Integration - Track searched questions in your dashboard
          </li>
          <li>Bookmarking System - Save frequently accessed questions</li>
        </ul>

        <h3>Question Categories Available</h3>
        <nav>
          <ul>
            <li>
              SAT Math Questions - Algebra, Geometry, Statistics, and Advanced
              Topics
            </li>
            <li>
              SAT Reading Questions - Passage Analysis, Literature, and
              Comprehension
            </li>
            <li>SAT Writing Questions - Grammar, Style, and Language Usage</li>
            <li>Digital SAT Format - Updated question types and formats</li>
            <li>Practice Test Questions - Full-length exam questions</li>
            <li>Topic-Specific Questions - Targeted skill development</li>
          </ul>
        </nav>

        <h3>Educational Benefits</h3>
        <p>
          The SAT Question Search tool enables targeted practice by allowing
          students to focus on specific questions that align with their study
          needs. Whether reviewing missed questions from practice tests or
          exploring specific topic areas, this tool provides direct access to
          high-quality educational content.
        </p>

        <h4>Personalized Learning</h4>
        <p>
          Search for questions based on difficulty level, topic area, or
          question type to create customized practice sessions. This targeted
          approach maximizes study efficiency and helps students focus on areas
          that need the most improvement.
        </p>

        <h4>Research and Analysis</h4>
        <p>
          Educators and students can use the question search to analyze question
          patterns, study specific problem-solving techniques, and understand
          the SAT's question structure and format.
        </p>

        <h4>Study Efficiency</h4>
        <p>
          Direct question access eliminates time spent browsing through
          extensive question banks. Students can quickly locate specific
          questions for review, practice, or analysis.
        </p>
      </div>

      {children}
    </>
  );
}
