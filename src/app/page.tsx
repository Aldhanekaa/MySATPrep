import { HeroSection } from "@/components/home-hero";
import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free SAT Practice Questions & Test Prep - PracticeSAT",
  description:
    "Boost your SAT scores with our comprehensive question bank featuring real College Board practice questions. Track progress, identify weak areas, and master the SAT with personalized practice sessions.",
  keywords: [
    "free SAT practice",
    "SAT test prep",
    "College Board questions",
    "SAT practice test",
    "SAT math practice",
    "SAT reading practice",
    "SAT writing practice",
    "improve SAT scores",
    "SAT study guide",
    "standardized test prep",
    "college entrance exam",
    "SAT question bank",
  ],
  openGraph: {
    title: "Free SAT Practice Questions & Test Prep - PracticeSAT",
    description:
      "Boost your SAT scores with our comprehensive question bank featuring real College Board practice questions. Track progress and master the SAT.",
    type: "website",
    images: [
      {
        url: "/og-home.png",
        width: 1200,
        height: 630,
        alt: "PracticeSAT - Master the SAT with comprehensive practice questions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free SAT Practice Questions & Test Prep - PracticeSAT",
    description:
      "Boost your SAT scores with our comprehensive question bank featuring real College Board practice questions. Track progress and master the SAT.",
    images: ["/og-home.png"],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return (
    <React.Fragment>
      <HeroSection />
    </React.Fragment>
  );
}
