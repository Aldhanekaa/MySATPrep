import { Assessments } from "@/static-data/assessment";
import {
  DomainItemsArray,
  API_Response_Question_List,
  StatsAPIErrorResponse,
} from "@/types";
import { fetchQuestionData } from "@/lib/questionFetcher";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
): Promise<NextResponse> {
  const { questionId } = await params;

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
        next: { revalidate: 3600 },

        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        console.error(
          `Error fetching domain ${assessmentData.text}:`,
          response.status
        );
        continue; // Skip this domain and continue with others
      }

      const data: API_Response_Question_List | undefined =
        await response.json();
      const questionsData = data || [];
      const questionData = questionsData.find(
        (q) => q.questionId === questionId
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
          console.log(
            "Question problem data:",
            JSON.stringify(questionResult.data, null, 2)
          );

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
                "Cache-Control": "public, s-maxage=3600",
                "CDN-Cache-Control": "public, s-maxage=60",
                "Vercel-CDN-Cache-Control": "public, s-maxage=3600",
              },
            }
          );
        }
      }
    }

    return NextResponse.json(
      {
        success: true,

        message: "Question bank stats fetched successfully",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "CDN-Cache-Control": "public, s-maxage=60",
          "Vercel-CDN-Cache-Control": "public, s-maxage=3600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching question stats:", error);
    return NextResponse.json<StatsAPIErrorResponse>(
      {
        success: false,
        error: "Failed to fetch question bank stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
