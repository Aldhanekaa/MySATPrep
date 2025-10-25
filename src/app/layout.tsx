import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FooterSection from "@/components/footer";
import { MathJaxContext } from "better-react-mathjax";

import { Toaster } from "sonner";
import { Banner } from "@/components/ui/banner";
import { AssessmentProvider } from "@/contexts/assessment-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MySATPrep - Free SAT Practice Questions & Test Prep",
    template: "%s | MySATPrep",
  },
  description:
    "Master the SAT with our comprehensive question bank featuring real College Board practice questions. Track your progress, identify weak areas, and boost your SAT scores with targeted practice sessions.",
  keywords: [
    "SAT practice",
    "SAT test prep",
    "College Board questions",
    "SAT math",
    "SAT reading",
    "SAT writing",
    "standardized test prep",
    "college admissions",
    "practice questions",
    "SAT score improvement",
  ],
  authors: [{ name: "MySATPrep Team" }],
  creator: "MySATPrep",
  publisher: "MySATPrep",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://mysatprep.vercel.app"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "MySATPrep - Free SAT Practice Questions & Test Prep",
    description:
      "Master the SAT with our comprehensive question bank featuring real College Board practice questions. Track your progress and boost your SAT scores.",
    siteName: "MySATPrep",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MySATPrep - SAT Test Preparation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MySATPrep - Free SAT Practice Questions & Test Prep",
    description:
      "Master the SAT with our comprehensive question bank featuring real College Board practice questions. Track your progress and boost your SAT scores.",
    images: ["/og-image.png"],
    creator: "@mysatprep",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
  category: "education",
  classification: "Education, Test Preparation, SAT",
  referrer: "origin-when-cross-origin",
};

const config = {
  /* in theory, the MathML input processor should be activated if we add
  an "mml" block to the config OR if "input/mml" (NOT "input/mathml" as stated 
  in the docs) is in the load array. However, this is not necessary as MathML is 
  ALWAYS enabled in MathJax */
  loader: { load: ["input/mml", "output/chtml"] },
  mml: {},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* User declared canonical URL */}
        <link rel="canonical" href="https://www.mysatprep.fun" />

        {/* Additional SEO meta tags */}
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
        <meta
          name="googlebot"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />

        {/* Structured data for organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "@id": "https://www.mysatprep.fun/#organization",
              name: "MySATPrep",
              alternateName: "My SAT Prep",
              url: "https://www.mysatprep.fun",
              logo: {
                "@type": "ImageObject",
                url: "https://www.mysatprep.fun/icon-512x512.png",
                width: 512,
                height: 512,
              },
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                email: "support@mysatprep.fun",
                availableLanguage: ["English"],
              },
              sameAs: [
                "https://www.facebook.com/mysatprep",
                "https://www.twitter.com/mysatprep",
                "https://www.instagram.com/mysatprep",
                "https://www.youtube.com/mysatprep",
              ],
              foundingDate: "2024",
              description:
                "Leading educational technology platform providing free SAT practice questions and comprehensive test preparation resources",
              knowsAbout: [
                "SAT Test Preparation",
                "College Board Questions",
                "Digital SAT",
                "Standardized Test Prep",
                "Educational Assessment",
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <Banner
          message="Some features may be unavailable due to the ongoing global outage."
          height="2rem"
          variant="rainbow"
        /> */}
        <AssessmentProvider>
          <MathJaxContext version={3} config={config}>
            {children}
          </MathJaxContext>
        </AssessmentProvider>

        <GoogleAnalytics gaId={process.env.GA_KEY || ""} />
        <GoogleTagManager gtmId={process.env.GT_KEY || ""} />
        <SpeedInsights />
        <Analytics />
        <Toaster position="bottom-right" expand={true} closeButton={true} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "tvx6mt4cmh");`,
          }}
        ></script>
      </body>
    </html>
  );
}
