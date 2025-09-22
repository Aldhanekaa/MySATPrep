import PracticePageComponent from "@/components/practice";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SAT Practice Questions",
  description:
    "Practice with authentic SAT questions from College Board's official question bank. Improve your SAT scores with real test questions covering Math, Reading, and Writing sections.",
  keywords: [
    "SAT practice questions",
    "free SAT practice",
    "SAT test prep",
    "College Board practice questions",
    "Collegeboard Questionbank practice",
    "authentic SAT questions",
    "SAT math practice questions",
    "SAT reading practice questions",
    "SAT writing practice questions",
    "real SAT questions",
    "SAT practice test",
    "SAT exam preparation",
    "improve SAT scores",
    "SAT study practice",
    "standardized test practice",
    "college entrance exam prep",
    "SAT question practice",
    "SAT Suite Question Bank practice",
    "official SAT practice",
    "SAT prep questions",
    "interactive SAT practice",
    "SAT score improvement",
  ],
  openGraph: {
    title: "SAT Practice Questions | MySATPrep",
    description:
      "Practice with authentic SAT questions from College Board's official question bank. Improve your SAT scores with real test questions covering Math, Reading, and Writing sections.",
    type: "website",
    images: [
      {
        url: "/og-practice.png",
        width: 1200,
        height: 630,
        alt: "MySATPrep Practice - Authentic SAT questions for effective preparation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SAT Practice Questions | MySATPrep",
    description:
      "Master the SAT with authentic College Board practice questions. Interactive practice sessions for Math, Reading, and Writing sections.",
    images: ["/og-practice.png"],
  },
  alternates: {
    canonical: "/practice",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PracticePage() {
  return <PracticePageComponent />;
}
