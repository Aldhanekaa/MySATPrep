import { Assessments } from "@/static-data/assessment";
import {
  DomainItemsArray,
  API_Response_Question_List,
  StatsAPIErrorResponse,
} from "@/types";
import { fetchQuestionData } from "@/lib/questionFetcher";
import { NextRequest, NextResponse } from "next/server";
import { fetchCbJwtTokenInternal } from "@/lib/fetchCbJwtTokenInternal";
import { fetchCbJwtToken } from "@/lib/fetchCbJwtToken";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
): Promise<NextResponse> {
  const { questionId } = await params;

  // Prepare requests to College Board APIs for all domains
  const apiUrls = [
    "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-questions",
    "https://digitalpractice-api.collegeboard.org/mspractice-studentquestionbank-prod/get-questions",
  ];

  try {
    // Fetch questions for each domain separately to get detailed breakdown
    for (const assessment in Assessments) {
      const assessmentData =
        Assessments[assessment as keyof typeof Assessments];
      console.log(`Fetching questions for assessment: ${assessmentData.text}`);

      let questionsData: API_Response_Question_List = [];

      for (const apiUrl of apiUrls) {
        const isProtectedEndpoint = apiUrl.includes("digitalpractice-api");

        let CB_AUTHORIZATION_TOKEN = "";

        if (isProtectedEndpoint) {
          const { cbJwtToken, status, error } = await fetchCbJwtTokenInternal();

          if (typeof cbJwtToken === "string")
            CB_AUTHORIZATION_TOKEN = cbJwtToken;

          if (status !== 200) {
            continue; // if failed then do not use it lol
          }
          if (!cbJwtToken) {
            continue; //  if failed then do not use it lol
          }
        }

        // Make the request to College Board API
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            // Add any required authentication headers here if needed
            // 'Authorization': `Bearer ${process.env.COLLEGEBOARD_API_KEY}`,
            ...(isProtectedEndpoint
              ? {
                  "x-cb-catapult-authorization-token":
                    CB_AUTHORIZATION_TOKEN || "",
                  "x-cb-catapult-authentication-token":
                    process.env.AUTHENTICATION_CB_MYPRACTICE || "",
                }
              : {}),
          },
          body: JSON.stringify({
            asmtEventId: assessmentData.id,
            test: 2,
            domain: DomainItemsArray.join(","), // Assuming you want to fetch all domains
          }),
          next: { revalidate: 86400 },
          cache: "force-cache",
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        // console.log("CB_AUTHORIZATION_TOKEN", CB_AUTHORIZATION_TOKEN);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("College Board API error:", response.status, errorText);

          return NextResponse.json(
            {
              success: false,
              error: `College Board API error: ${response.status} ${response.statusText}`,
              details: errorText,
            },
            { status: response.status },
          );
        }

        const data: API_Response_Question_List | undefined =
          await response.json();
        // console.log(" Collegeboard Data ", data);

        questionsData = [...questionsData, ...(data || [])];
      }

      console.log(
        `Total questions fetched for ${assessmentData.text}:`,
        questionsData.length,
      );
      // console.log("questionsData", questionsData);

      const questionData = questionsData.find(
        (q) => q.questionId === questionId,
      );
      console.log(questionData);

      if (questionData) {
        // Use shared question fetching function
        const questionId = questionData.external_id || questionData.ibn;

        if (!questionId) {
          console.error("No question ID found");
          continue;
        }

        const questionResult = await fetchQuestionData(questionId);

        if (questionResult.success && questionResult.data) {
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
            },
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
      },
    );
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
}
