import { Assessments } from "@/static-data/assessment";
import { DomainItemsArray, SkillCd_Variants } from "@/types/lookup";
import { API_Response_Question_List } from "@/types/question";
import { NextRequest, NextResponse } from "next/server";
import { skillCds as Skills } from "@/static-data/domains";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainsParam = searchParams.get("domains");
  const assessment = searchParams.get("assessment");
  const excludeQuestionIdsParam = searchParams.get("excludeIds");
  const difficultiesParam = searchParams.get("difficulties");
  const skillCdsParam = searchParams.get("skills");

  const random = searchParams.get("random");

  let skillCds: string[] = [];
  if (skillCdsParam) {
    skillCds = skillCdsParam.split(",").map((cd) => cd.trim());
  }
  if (
    skillCds.length > 0 &&
    !skillCds.every((cd) => Skills.includes(cd as SkillCd_Variants))
  ) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid skill codes provided: ${skillCds.join(", ")}`,
      },
      { status: 400 }
    );
  }

  let difficulties: string[] = [];
  if (difficultiesParam) {
    difficulties = difficultiesParam.split(",").map((id) => id.trim());
  }

  if (difficulties.length > 0 && !["E", "M", "H"].includes(difficulties[0])) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid difficulties provided: ${difficulties.join(", ")}`,
      },
      { status: 400 }
    );
  }

  let excludeQuestionIds: string[] = [];
  if (excludeQuestionIdsParam) {
    excludeQuestionIds = excludeQuestionIdsParam
      .split(",")
      .map((id) => id.trim());
  }

  console.log("domains", domainsParam);
  console.log("assessment", assessment);
  console.log("random", random);
  console.log("excludeQuestionIds", excludeQuestionIds);

  if (random == "true") {
  }

  let asmtEventId = 99;

  if (assessment !== null && assessment !== "" && assessment in Assessments) {
    asmtEventId = Assessments[assessment as keyof typeof Assessments].id;
  }

  if (domainsParam === null || domainsParam === "") {
    return NextResponse.json(
      {
        success: false,
        error: "Domains parameter is required",
      },
      { status: 400 }
    );
  }

  if (domainsParam && !DomainItemsArray.includes(domainsParam)) {
    // Validate domains parameter
    const domainList = domainsParam.split(",");
    const invalidDomains = domainList.filter(
      (domain) => !DomainItemsArray.includes(domain.trim())
    );

    if (invalidDomains.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid domains provided: ${invalidDomains.join(", ")}`,
        },
        { status: 400 }
      );
    }
  }

  // Prepare the request to College Board API
  const apiUrl =
    "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-questions";

  try {
    // Make the request to College Board API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Add any required authentication headers here if needed
        // 'Authorization': `Bearer ${process.env.COLLEGEBOARD_API_KEY}`,
      },
      body: JSON.stringify({
        asmtEventId: asmtEventId,
        test: 2,
        domain: domainsParam,
      }),
      next: { revalidate: 86400 },
      cache: "force-cache",
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("College Board API error:", response.status, errorText);

      return NextResponse.json(
        {
          success: false,
          error: `College Board API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data: API_Response_Question_List | undefined = await response.json();
    let questions = data || [];

    if (excludeQuestionIds.length > 0) {
      questions = questions.filter(
        (question) => !excludeQuestionIds.includes(question.questionId)
      );
    }

    if (skillCds.length > 0) {
      questions = questions.filter((question) => {
        return skillCds.includes(question.skill_cd as SkillCd_Variants);
      });
    }

    if (difficulties.length > 0) {
      questions = questions.filter((question) =>
        difficulties.includes(question.difficulty)
      );
    }

    console.log(questions.length, "questions fetched");

    return NextResponse.json(
      {
        success: true,
        data: questions,
        message: "Fetching question bank successfully",
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
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch questions",
      },
      { status: 500 }
    );
  }
}
