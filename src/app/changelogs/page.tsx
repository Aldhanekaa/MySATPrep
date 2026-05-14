import { Component as ChangelogPage } from "@/components/ui/interactive-changelog-with-dialog";
import React from "react";
import { SiteHeader } from "../navbar";
import type { Metadata } from "next";
import FooterSection from "@/components/footer";

export const metadata: Metadata = {
  title: "MySATPrep Changelog - Latest Updates, Fixes & Release Notes",
  description:
    "Read the latest MySATPrep changelog for product updates, new features, bug fixes, and release notes across SAT practice, question bank, vocab, and study tools.",
  keywords: [
    "MySATPrep changelog",
    "release notes",
    "product updates",
    "feature updates",
    "bug fixes",
    "platform news",
    "SAT prep updates",
    "question bank improvements",
    "study tool updates",
    "site changelog",
  ],
  openGraph: {
    title: "MySATPrep Changelog - Latest Updates, Fixes & Release Notes",
    description:
      "See the latest MySATPrep product updates, feature releases, and bug fixes for SAT practice, vocab, and study tools.",
    type: "website",
    url: "/changelogs",
    images: [
      {
        url: "/seo/dashboard-layout.png",
        width: 1200,
        height: 630,
        alt: "MySATPrep changelog and product updates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MySATPrep Changelog - Latest Updates, Fixes & Release Notes",
    description:
      "Read the latest MySATPrep updates, feature releases, and bug fixes.",
    images: ["/seo/dashboard-layout.png"],
  },
  alternates: {
    canonical: "/changelogs",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return (
    <React.Fragment>
      <SiteHeader disableBlur disableScroll />
      <ChangelogPage />
      <FooterSection />
    </React.Fragment>
  );
}
