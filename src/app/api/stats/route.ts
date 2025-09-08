import { Assessments } from "@/static-data/assessment";
import {
  DomainItemsArray,
  API_Response_Question_List,
  StatsData,
  StatsAPIResponse,
  StatsAPIErrorResponse,
  StatsDomainBreakdown,
  StatsDifficultyBreakdown,
  StatsSkillBreakdown,
} from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest
): Promise<NextResponse<StatsAPIResponse | StatsAPIErrorResponse>> {
  const { searchParams } = new URL(request.url);
  const assessment = searchParams.get("assessment");

  console.log("Fetching stats for assessment:", assessment);

  let asmtEventId = 99;

  if (assessment !== null && assessment !== "" && assessment in Assessments) {
    asmtEventId = Assessments[assessment as keyof typeof Assessments].id;
  }

  // Prepare the request to College Board API for all domains
  const apiUrl =
    "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-questions";

  try {
    // Fetch questions for all domains to get complete stats
    const allQuestions: API_Response_Question_List = [];
    const statsData: StatsData = {
      totalQuestions: 0,
      domainBreakdown: {} as StatsDomainBreakdown,
      difficultyBreakdown: { E: 0, M: 0, H: 0 } as StatsDifficultyBreakdown,
      skillBreakdown: {} as StatsSkillBreakdown,
      assessmentInfo: {
        assessment: assessment || "default",
        asmtEventId: asmtEventId,
      },
    };

    // Fetch questions for each domain separately to get detailed breakdown
    for (const domain of DomainItemsArray) {
      console.log(`Fetching questions for domain: ${domain}`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          asmtEventId: asmtEventId,
          test: 2,
          domain: domain,
        }),
        next: { revalidate: 3600 },

        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        console.error(`Error fetching domain ${domain}:`, response.status);
        continue; // Skip this domain and continue with others
      }

      const data: API_Response_Question_List | undefined =
        await response.json();
      const domainQuestions = data || [];

      // Add to all questions array
      allQuestions.push(...domainQuestions);

      // Update domain breakdown
      statsData.domainBreakdown[domain] = domainQuestions.length;

      // Update difficulty breakdown
      domainQuestions.forEach((question) => {
        if (question.difficulty === "E") statsData.difficultyBreakdown.E++;
        else if (question.difficulty === "M") statsData.difficultyBreakdown.M++;
        else if (question.difficulty === "H") statsData.difficultyBreakdown.H++;
      });

      // Update skill breakdown
      domainQuestions.forEach((question) => {
        const skillCd = question.skill_cd;
        if (skillCd) {
          statsData.skillBreakdown[skillCd] =
            (statsData.skillBreakdown[skillCd] || 0) + 1;
        }
      });
    }

    statsData.totalQuestions = allQuestions.length;

    console.log(
      `Total questions fetched across all domains: ${statsData.totalQuestions}`
    );

    return NextResponse.json<StatsAPIResponse>(
      {
        success: true,
        data: {
          stats: statsData,
          totalQuestions: statsData.totalQuestions,
          domainBreakdown: statsData.domainBreakdown,
          difficultyBreakdown: statsData.difficultyBreakdown,
          skillBreakdown: statsData.skillBreakdown,
          assessmentInfo: statsData.assessmentInfo,
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
