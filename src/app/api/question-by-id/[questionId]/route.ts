import { NextRequest, NextResponse } from "next/server";
import getInternalAPITargetURL from "@/lib/getInternalAPITargetURL";

import { Assessments } from "@/static-data/assessment";
import {
  DomainItemsArray,
  API_Response_Question_List,
  StatsAPIErrorResponse,
  QuestionById_Response,
} from "@/types";
import { fetchQuestionData } from "@/lib/questionFetcher";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
): Promise<NextResponse> {
  const { questionId } = await params;

  if (!questionId) {
    return NextResponse.json(
      {
        success: false,
        error: "Question ID parameter is required",
      },
      { status: 400 },
    );
  }

  // Prepare the request to College Board API for all domains
  const apiUrl =
    "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-questions";

  try {
    // Fetch questions for each domain separately to get detailed breakdown
    for (const assessment in Assessments) {
      const assessmentData =
        Assessments[assessment as keyof typeof Assessments];
      console.log(`Fetching questions for assessment: ${assessmentData.text}`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          asmtEventId: assessmentData.id,
          test: 2,
          domain: DomainItemsArray.join(","), // Assuming you want to fetch all domains
        }),
        cache: "force-cache",
        next: { revalidate: 86400 },

        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        console.error(
          `Error fetching domain ${assessmentData.text}:`,
          response.status,
        );
        continue; // Skip this domain and continue with others
      }

      const data: API_Response_Question_List | undefined =
        await response.json();
      const questionsData = data || [];
      const questionData = questionsData.find(
        (q) => q.questionId === questionId,
      );
      // console.log(
      //   `Fetched  ${questionsData.length} questions for assessment: ${
      //     assessmentData.text
      //   } {questionData: ${
      //     questionData ? "found" : "not found"
      //   }} ${JSON.stringify(questionData)}`
      // );

      if (questionData) {
        // Use shared question fetching function
        const questionId = questionData.external_id || questionData.ibn;

        if (!questionId) {
          console.error("No question ID found");
          continue;
        }

        const questionResult = await fetchQuestionData(questionId);

        if (questionResult.success && questionResult.data) {
          // console.log(
          //   "Question problem data:",
          //   JSON.stringify(questionResult.data, null, 2)
          // );

          return NextResponse.json(
            {
              success: true,
              data: {
                question: questionData,
                problem: questionResult.data,
              },
              message: "Question bank stats fetched successfully",
            },
            {
              status: 200,
              headers: {
                "Cache-Control": "public, s-maxage=86400",
                "CDN-Cache-Control": "public, s-maxage=86400",
                "Vercel-CDN-Cache-Control": "public, s-maxage=86400",
              },
            },
          );
        }
      }
    }
  } catch (error) {
    console.error("Error fetching question stats:", error);
    return NextResponse.json<StatsAPIErrorResponse>(
      {
        success: false,
        error: "Failed to fetch question bank stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }

  try {
    // Call the internal student-qb API
    const internalApiUrl = getInternalAPITargetURL();
    const response = await fetch(
      `${internalApiUrl}/api/student-qb/question-by-id/${questionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    if (response.status == 404) {
      return NextResponse.json(
        {
          success: false,
          error: "Question not found in any domain",
          details: `No question with ID ${questionId} found in any Educator Question Bank or Student Question Bank`,
        },
        { status: 404 },
      );
    }

    if (!response.ok) {
      const errorData = (await response.json()) as {
        error?: string;
        details?: string;
      };
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || "Failed to fetch question",
          details: errorData.details,
        },
        { status: response.status },
      );
    }

    const data = (await response.json()) as QuestionById_Response;

    return NextResponse.json(
      {
        success: data.success,
        data: data.data,
        message: data.message || "Question bank stats fetched successfully",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=86400",
          "CDN-Cache-Control": "public, s-maxage=60",
          "Vercel-CDN-Cache-Control": "public, s-maxage=86400",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching question stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch question bank stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
