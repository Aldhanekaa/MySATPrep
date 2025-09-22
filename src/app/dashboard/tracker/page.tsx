import Tracker from "@/components/dashboard/tracker/tracker";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "SAT Progress Tracker - Track Your Collegeboard's Question Bank Progress",
  description:
    "Track your College Board SAT Suite Question Bank progress with detailed analytics. Monitor your performance on official Collegeboard questions across Math, Reading, and Writing sections. View accuracy rates, time spent, and improvement trends.",
  keywords: [
    "SAT progress tracker",
    "SAT performance tracker",
    "College Board SAT tracker",
    "SAT Suite Question Bank tracker",
    "Collegeboard question bank tracker",
    "SAT analytics",
    "College Board question tracking",
    "SAT Suite progress tracking",
    "official SAT question tracker",
    "SAT score tracking",
    "SAT study tracker",
    "track SAT progress",
    "SAT improvement tracker",
    "SAT practice analytics",
    "SAT performance dashboard",
    "SAT study statistics",
    "College Board analytics",
    "SAT Suite analytics",
    "monitor SAT progress",
    "SAT preparation tracker",
    "SAT test tracking",
    "track SAT scores",
    "official SAT progress monitoring",
    "SAT study insights",
    "SAT performance metrics",
    "SAT accuracy tracker",
    "College Board question analytics",
    "SAT time tracking",
    "SAT section performance",
    "SAT trend analysis",
    "personalized SAT tracking",
  ],
  openGraph: {
    title:
      "SAT Progress Tracker | Track College Board Question Bank Performance",
    description:
      "Track your College Board SAT Suite Question Bank progress with detailed analytics. Monitor performance on official Collegeboard questions, view accuracy rates, and track improvement trends.",
    type: "website",
    url: "https://mysatprep.fun/dashboard/tracker",
    siteName: "MySATPrep",
    images: [
      {
        url: "/og-tracker.png",
        width: 1200,
        height: 630,
        alt: "SAT Progress Tracker - College Board Question Bank Analytics | MySATPrep",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "SAT Progress Tracker | Track College Board Question Bank Performance",
    description:
      "Monitor your SAT Suite Question Bank preparation with detailed analytics. Track accuracy on official Collegeboard questions, time spent, and improvement trends.",
    images: ["/og-tracker.png"],
    site: "@MySATPrep",
  },
  alternates: {
    canonical: "/dashboard/tracker",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SessionsPage() {
  return (
    <section className="space-y-4 max-w-4xl lg:max-w-5xl xl:max-w-7xl w-full mx-auto px-3 py-10 ">
      <Tracker />
    </section>
  );
}
