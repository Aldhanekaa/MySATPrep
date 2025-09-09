"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { motion } from "framer-motion";
import Image from "next/image";

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
          <div className="h-16 flex items-center justify-start">{children}</div>

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
              className="gap-1 pr-2 shadow-none hover:bg-blue-500 hover:text-white"
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
  <Image
    src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Khan_Academy_logo_%282018%29.svg/1024px-Khan_Academy_logo_%282018%29.svg.png"
    alt="Khan Academy Logo"
    width={200}
    height={60}
    className="object-contain h-8"
  />
);

const CollegeBoardLogo = () => (
  <Image
    src="https://vectorseek.com/wp-content/uploads/2023/07/College-Board-Logo-Vector.svg-.png"
    alt="College Board Logo"
    width={200}
    height={60}
    className="object-contain h-8"
  />
);
