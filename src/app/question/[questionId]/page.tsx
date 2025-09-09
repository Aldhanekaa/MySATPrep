import { SiteHeader } from "@/app/navbar";
import QuestionNotFound from "@/components/question-not-found";
import QuestionProblemCard from "@/components/question-problem-card";
import { Label } from "@/components/ui/label";
import { QuestionById_Response } from "@/types";
import { MathJax } from "better-react-mathjax";
import React from "react";
import type { Metadata } from "next";

async function fetchQuestionById(
  questionId: string
): Promise<QuestionById_Response> {
  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_URL
        ? process.env.NEXT_PUBLIC_URL
        : process.env.NEXT_PUBLIC_VERCEL_ENV !== "production"
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
        : `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
    }/api/question-by-id/${questionId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch question");
  }

  return response.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ questionId: string }>;
}): Promise<Metadata> {
  const { questionId } = await params;

  try {
    const result = await fetchQuestionById(questionId);

    if (!result.data) {
      return {
        title: "Question Not Found - PracticeSAT",
        description:
          "The requested SAT practice question could not be found. Browse our question bank for more SAT practice questions.",
        robots: {
          index: false,
          follow: true,
        },
      };
    }

    const { question, problem } = result.data;
    const questionType =
      question.skill_desc || question.primary_class_cd_desc || "SAT Question";
    const difficulty =
      question.difficulty === "E"
        ? "Easy"
        : question.difficulty === "M"
        ? "Medium"
        : question.difficulty === "H"
        ? "Hard"
        : "Standard";

    // Create a clean description from the question content
    const questionPreview =
      problem.stem
        ?.replace(/<[^>]*>/g, "") // Remove HTML tags
        ?.replace(/\$[^$]*\$/g, "") // Remove LaTeX
        ?.substring(0, 120) || "Practice SAT question";

    return {
      title: `${questionType} Practice Question #${question.questionId} - PracticeSAT`,
      description: `Practice this ${difficulty.toLowerCase()} ${questionType.toLowerCase()} SAT question. ${questionPreview}... Master SAT concepts with detailed explanations and step-by-step solutions.`,
      keywords: [
        "SAT practice question",
        questionType,
        `SAT ${question.primary_class_cd_desc || ""}`,
        `${difficulty} SAT question`,
        "College Board practice",
        "SAT test prep",
        "practice problems",
        "SAT solutions",
        "standardized test prep",
        question.skill_desc || "",
      ],
      openGraph: {
        title: `${questionType} SAT Practice Question #${question.questionId}`,
        description: `Practice this ${difficulty.toLowerCase()} ${questionType.toLowerCase()} SAT question with detailed explanations. Improve your SAT scores with PracticeSAT.`,
        type: "article",
        url: `/question/${questionId}`,
        images: [
          {
            url: "/og-question.png",
            width: 1200,
            height: 630,
            alt: `SAT ${questionType} Practice Question - PracticeSAT`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${questionType} SAT Practice Question #${question.questionId}`,
        description: `Practice this ${difficulty.toLowerCase()} ${questionType.toLowerCase()} SAT question with detailed explanations.`,
        images: ["/og-question.png"],
      },
      alternates: {
        canonical: `/question/${questionId}`,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    // Fallback metadata if question fetch fails
    return {
      title: "SAT Practice Question - PracticeSAT",
      description:
        "Practice SAT questions with detailed explanations and solutions. Improve your test scores with comprehensive SAT preparation.",
      robots: {
        index: false,
        follow: true,
      },
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;

  // Fetch question data using the utility function
  const result = await fetchQuestionById(questionId);

  console.log(
    "Question data:",
    questionId,
    JSON.stringify(result.data, null, 2)
  );

  if (!result.data) {
    return (
      <React.Fragment>
        <SiteHeader />
        <QuestionNotFound />
      </React.Fragment>
    );
  }

  const questionData = result.data;

  console.log("Question data:", JSON.stringify(result.data, null, 2));

  return (
    <React.Fragment>
      <SiteHeader />
      <main className="w-full flex items-center flex-col min-h-[85vh] py-16 lg:py-32 px-3 md:px-10">
        <section className="space-y-4 max-w-screen md:max-w-5xl mt-8">
          <QuestionProblemCard question={questionData} hideViewQuestionButton />
        </section>
      </main>
    </React.Fragment>
  );
}
