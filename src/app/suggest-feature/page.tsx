import React from "react";
import { SiteHeader } from "../navbar";
import type { Metadata } from "next";
import FooterSection from "@/components/footer";

export const metadata: Metadata = {
  title: "Suggest a Feature - MySATPrep",
  description:
    "Suggest new features, improvements, or product ideas for MySATPrep to help shape the SAT practice and study experience.",
  keywords: [
    "suggest a feature",
    "MySATPrep feature request",
    "submit feedback",
    "product idea",
    "feature request form",
    "website feedback",
    "request improvement",
    "suggestion form",
  ],
  openGraph: {
    title: "Suggest a Feature - MySATPrep",
    description: "Send feature requests and product ideas for MySATPrep.",
    type: "website",
    url: "/suggest-feature",
    images: [
      {
        url: "/seo/dashboard-layout.png",
        width: 1200,
        height: 630,
        alt: "MySATPrep feature suggestion form",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Suggest a Feature - MySATPrep",
    description: "Suggest features and share product ideas for MySATPrep.",
    images: ["/seo/dashboard-layout.png"],
  },
  alternates: {
    canonical: "/suggest-feature",
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
                Suggest a Feature
              </h2>
              <p className="text-muted-foreground mt-6">
                Share product ideas, request improvements, or suggest new
                features to help shape the MySATPrep experience.
              </p>
              <p className="text-muted-foreground text-sm lg:px-36 mt-4">
                Alternatively, you can also suggest features by creating an
                issue on our{" "}
                <a
                  href="https://github.com/aldhanekaa/MySATPrep/"
                  className="text-blue-500 hover:underline"
                >
                  open source GitHub repository.
                </a>{" "}
                Then, if it is feasible, I would add you to our{" "}
                <a
                  href="/contributors"
                  className="text-blue-500 hover:underline"
                >
                  contributors list page
                </a>{" "}
                and feature you on the website as a thank you for your
                contribution!
              </p>
            </div>
            <iframe
              className="airtable-embed rounded-xl mt-14"
              src="https://airtable.com/embed/appRwFRovs7CtS7m8/pag8kXB0EovDa2J4Q/form"
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
