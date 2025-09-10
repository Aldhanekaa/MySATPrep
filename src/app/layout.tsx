import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

import { GoogleAnalytics } from "@next/third-parties/google";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FooterSection from "@/components/footer";
import { MathJaxContext } from "better-react-mathjax";

import { Toaster } from "sonner";
import { Banner } from "@/components/ui/banner";

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
    default: "PracticeSAT - Free SAT Practice Questions & Test Prep",
    template: "%s | PracticeSAT",
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
  authors: [{ name: "PracticeSAT Team" }],
  creator: "PracticeSAT",
  publisher: "PracticeSAT",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://practicesat.vercel.app"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "PracticeSAT - Free SAT Practice Questions & Test Prep",
    description:
      "Master the SAT with our comprehensive question bank featuring real College Board practice questions. Track your progress and boost your SAT scores.",
    siteName: "PracticeSAT",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PracticeSAT - SAT Test Preparation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PracticeSAT - Free SAT Practice Questions & Test Prep",
    description:
      "Master the SAT with our comprehensive question bank featuring real College Board practice questions. Track your progress and boost your SAT scores.",
    images: ["/og-image.png"],
    creator: "@practicesat",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MathJaxContext version={3} config={config}>
          {/* <Banner
            message="We just released a new feature!"
            height="2rem"
            variant="rainbow"
            className="mb-4 relative"
          /> */}

          {children}
        </MathJaxContext>
        <GoogleAnalytics gaId="GTM-T9GFVBPJ" />

        <SpeedInsights />
        <Analytics />
        <FooterSection />
        <Toaster position="bottom-right" expand={false} closeButton={true} />
      </body>
    </html>
  );
}
