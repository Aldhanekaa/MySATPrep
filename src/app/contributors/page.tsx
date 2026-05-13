import ResourceSection from "@/components/resources";
import React from "react";
import { SiteHeader } from "../navbar";
import type { Metadata } from "next";
import FooterSection from "@/components/footer";
import ContributorsSection from "@/components/contributors-section";

export const metadata: Metadata = {
  title: "Contributors - MySATPrep",
  description:
    "Meet the contributors behind MySATPrep. Explore the open source community members who build features, suggest improvements, and report bugs to make SAT prep better for everyone.",
  keywords: [
    "MySATPrep contributors",
    "open source contributors",
    "SAT prep community",
    "MySATPrep team",
    "feature contributors",
    "bug reporters",
    "community feedback",
    "GitHub contributors",
    "SAT education platform",
    "MySATPrep open source",
  ],
  openGraph: {
    title: "Contributors - MySATPrep",
    description:
      "Meet the contributors and community members helping build MySATPrep through feature ideas, bug reports, and open source collaboration.",
    type: "website",
    url: "/contributors",
    images: [
      {
        url: "/og-contributors.png",
        width: 1200,
        height: 630,
        alt: "MySATPrep Contributors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contributors - MySATPrep",
    description:
      "Meet the contributors and community members helping improve MySATPrep through collaboration and feedback.",
    images: ["/og-contributors.png"],
  },
  alternates: {
    canonical: "/contributors",
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
      <ContributorsSection />
      <FooterSection />
    </React.Fragment>
  );
}
