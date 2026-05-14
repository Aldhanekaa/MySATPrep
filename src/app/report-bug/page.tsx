import React from "react";
import { SiteHeader } from "../navbar";
import type { Metadata } from "next";
import FooterSection from "@/components/footer";

export const metadata: Metadata = {
  title: "Report a Bug - MySATPrep",
  description:
    "Report bugs, broken pages, or unexpected behavior on MySATPrep so we can improve the SAT practice and study experience.",
  keywords: [
    "report a bug",
    "MySATPrep bug report",
    "submit feedback",
    "site issue",
    "broken page",
    "bug report form",
    "website feedback",
    "report problem",
  ],
  openGraph: {
    title: "Report a Bug - MySATPrep",
    description: "Send bug reports and site feedback for MySATPrep.",
    type: "website",
    url: "/report-bug",
    images: [
      {
        url: "/seo/dashboard-layout.png",
        width: 1200,
        height: 630,
        alt: "MySATPrep bug report form",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Report a Bug - MySATPrep",
    description: "Report bugs and share feedback about MySATPrep.",
    images: ["/seo/dashboard-layout.png"],
  },
  alternates: {
    canonical: "/report-bug",
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
      <section>
        <div className="py-32">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <h2 className="text-balance text-3xl font-semibold md:text-4xl">
                Report Bug
              </h2>
              <p className="text-muted-foreground mt-6">
                Let us know about broken pages, unexpected behavior, or other
                issues you run into while using MySATPrep.
              </p>
            </div>
            <iframe
              className="airtable-embed rounded-xl mt-14"
              src="https://airtable.com/embed/appRwFRovs7CtS7m8/pagadmaARK4PfdZLI/form"
              frameBorder={0}
              width="100%"
              height="1000"
              style={{ background: "transparent", border: "1px solid #ccc" }}
            ></iframe>
          </div>
        </div>
      </section>
      <FooterSection />
    </React.Fragment>
  );
}
