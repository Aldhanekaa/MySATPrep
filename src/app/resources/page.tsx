import ResourceSection from "@/components/resources";
import React from "react";
import { SiteHeader } from "../navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SAT Study Resources & Reference Materials",
  description:
    "Access comprehensive SAT study resources including reference sheets, formula guides, test-taking strategies, and essential materials to excel on the SAT exam. Free downloadable resources for math, reading, and writing sections.",
  keywords: [
    "SAT study resources",
    "SAT reference sheet",
    "SAT math formulas",
    "SAT study guide",
    "SAT test strategies",
    "SAT preparation materials",
    "College Board resources",
    "SAT math reference",
    "SAT study tips",
    "free SAT resources",
    "SAT formula sheet",
    "standardized test resources",
    "SAT exam preparation",
  ],
  openGraph: {
    title: "SAT Study Resources & Reference Materials - PracticeSAT",
    description:
      "Access comprehensive SAT study resources including reference sheets, formula guides, and test-taking strategies. Free downloadable materials for all SAT sections.",
    type: "website",
    url: "/resources",
    images: [
      {
        url: "/og-resources.png",
        width: 1200,
        height: 630,
        alt: "SAT Study Resources and Reference Materials - PracticeSAT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SAT Study Resources & Reference Materials - PracticeSAT",
    description:
      "Access comprehensive SAT study resources including reference sheets, formula guides, and test-taking strategies. Free downloadable materials.",
    images: ["/og-resources.png"],
  },
  alternates: {
    canonical: "/resources",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return (
    <React.Fragment>
      <SiteHeader />;
      <ResourceSection />
    </React.Fragment>
  );
}
