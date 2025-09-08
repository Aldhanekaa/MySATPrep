import { SiteHeader } from "@/app/navbar";
import QuestionProblemCard from "@/components/question-problem-card";
import { QuestionById_Response } from "@/types";
import React from "react";

async function fetchQuestionById(
  questionId: string
): Promise<QuestionById_Response> {
  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_URL
        ? process.env.NEXT_PUBLIC_URL
        : process.env.NEXT_PUBLIC_VERCEL_ENV !== "production"
        ? process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
        : process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    }/api/question-by-id/${questionId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch question");
  }

  return response.json();
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

  if (!result.success) {
    return <div>not found</div>;
  }

  const questionData = result.data;

  console.log("Question data:", JSON.stringify(result.data, null, 2));

  return (
    <React.Fragment>
      <SiteHeader />
      <QuestionProblemCard question={questionData} />
    </React.Fragment>
  );
}
