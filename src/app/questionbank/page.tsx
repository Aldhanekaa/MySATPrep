import QuestionBankPageComponent from "@/components/questionbank/qb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "SAT Question Bank | 2000+ Official College Board Questions | MySATPrep",
  description:
    "Access the complete SAT Question Bank with 2000+ official College Board questions. Browse SAT Suite Question Bank with real exam questions for Math, Reading, and Writing sections. Updated with latest questions.",
  keywords: [
    "SAT Question Bank",
    "SAT Suite Question Bank",
    "College Board Question Bank",
    "official SAT questions",
    "SAT question database",
    "College Board SAT questions",
    "SAT Suite questions",
    "real SAT questions",
    "authentic SAT questions",
    "SAT question collection",
    "SAT exam questions",
    "SAT test questions",
    "SAT math questions",
    "SAT reading questions",
    "SAT writing questions",
    "SAT question library",
    "complete SAT questions",
    "SAT questions database",
    "official SAT question bank",
    "SAT Suite Question Bank 2024",
    "latest SAT questions",
    "new SAT questions",
    "SAT question archive",
    "comprehensive SAT questions",
  ],
  openGraph: {
    title: "SAT Question Bank | 2000+ Official College Board Questions",
    description:
      "Access the complete SAT Question Bank with 2000+ official College Board questions. Browse SAT Suite Question Bank with real exam questions for all sections.",
    type: "website",
    url: "https://mysatprep.fun/question-bank",
    siteName: "MySATPrep",
    images: [
      {
        url: "/og-question-bank.png",
        width: 1200,
        height: 630,
        alt: "SAT Question Bank - 2000+ Official College Board Questions | MySATPrep",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SAT Question Bank | 2000+ Official College Board Questions",
    description:
      "Browse the complete SAT Question Bank with 2000+ official College Board questions. Real SAT Suite questions for comprehensive test preparation.",
    images: ["/og-question-bank.png"],
    site: "@MySATPrep",
  },
  alternates: {
    canonical: "/questionbank",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function QuestionbankPage() {
  return <QuestionBankPageComponent />;
}
