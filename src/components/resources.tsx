"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { motion } from "framer-motion";

// Framer Motion animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99] as const,
    },
  },
};

export default function ResourceSection() {
  return (
    <section>
      <div className="py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-balance text-3xl font-semibold md:text-4xl">
              SAT Resources
            </h2>
            <p className="text-muted-foreground mt-6">
              Use this resources section to find useful website platforms to
              help you prepare for the SAT.
            </p>
          </div>

          <motion.div
            className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            role="list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <IntegrationCard
              title="Khan Academy"
              description="Free SAT practice questions, lessons, and full-length practice tests."
              link="https://www.khanacademy.org/test-prep/sat"
            >
              <KhanAcademyLogo />
            </IntegrationCard>

            <IntegrationCard
              title="College Board"
              description="Official SAT practice tests and study materials from the test maker."
              link="https://satsuite.collegeboard.org/sat/practice-preparation"
            >
              <CollegeBoardLogo />
            </IntegrationCard>

            <IntegrationCard
              title="PrepScholar"
              description="Comprehensive SAT prep with personalized study plans and strategies."
              link="https://www.prepscholar.com/sat/"
            >
              <PrepScholarLogo />
            </IntegrationCard>

            <IntegrationCard
              title="Magoosh"
              description="Online SAT prep with video lessons and practice questions."
              link="https://magoosh.com/sat/"
            >
              <MagooshLogo />
            </IntegrationCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const IntegrationCard = ({
  title,
  description,
  children,
  link = "https://collegereadiness.collegeboard.org/sat",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  link?: string;
}) => {
  return (
    <motion.div variants={itemVariants} role="listitem">
      <Card className="p-6">
        <div className="relative">
          <div className="*:size-10">{children}</div>

          <div className="space-y-2 py-6">
            <h3 className="text-base font-medium">{title}</h3>
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {description}
            </p>
          </div>

          <div className="flex gap-3 border-t border-dashed pt-6">
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="gap-1 pr-2 shadow-none hover:bg-indigo-500 hover:text-white"
            >
              <Link href={link}>
                Learn More
                <ChevronRight className="ml-0 !size-3.5 opacity-50" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// --- Logos (inline SVG) ---
const KhanAcademyLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const CollegeBoardLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="text-blue-800">
    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 9.74s9-4.19 9-9.74V7l-10-5z" />
    <path d="M12 7l-6 3v6c0 3.33 2.67 6 6 6s6-2.67 6-6v-6l-6-3z" />
  </svg>
);

const PrepScholarLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="text-purple-600">
    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L23 9l-11-6zM18.82 9L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
  </svg>
);

const MagooshLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="text-orange-500">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
  </svg>
);

const UWorldLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="text-red-600">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
);

const KaplanLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="text-indigo-600">
    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
  </svg>
);
