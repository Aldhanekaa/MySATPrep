import { Assessments } from "@/static-data/assessment";
import { DomainItemsArray, SkillCd_Variants } from "@/types/lookup";
import { API_Response_Question_List } from "@/types/question";
import { NextRequest, NextResponse } from "next/server";
import { skillCds as Skills } from "@/static-data/domains";
import getInternalAPITargetURL from "@/lib/getInternalAPITargetURL";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainsParam = searchParams.get("domains");
  const assessment = searchParams.get("assessment");
  const excludeQuestionIdsParam = searchParams.get("excludeIds");
  const difficultiesParam = searchParams.get("difficulties");
  const skillCdsParam = searchParams.get("skills");
  const random = searchParams.get("random");

  const uniqueIdsParam = searchParams.get("uniqueIds"); // externalIds or Ibn

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
      { status: 400 },
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
      { status: 400 },
    );
  }

  let excludeQuestionIds: string[] = [];
  if (excludeQuestionIdsParam) {
    excludeQuestionIds = excludeQuestionIdsParam
      .split(",")
      .map((id) => id.trim());
  }

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
      { status: 400 },
    );
  }

  if (domainsParam && !DomainItemsArray.includes(domainsParam)) {
    // Validate domains parameter
    const domainList = domainsParam.split(",");
    const invalidDomains = domainList.filter(
      (domain) => !DomainItemsArray.includes(domain.trim()),
    );

    if (invalidDomains.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid domains provided: ${invalidDomains.join(", ")}`,
        },
        { status: 400 },
      );
    }
  }

  // Prepare the request to College Board API
  const apiUrl =
    "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-questions";

  let questions: API_Response_Question_List = [];

  const questionDedupKey = (question: API_Response_Question_List[number]) => ({
    externalId: question.external_id ?? null,
    ibn: question.ibn ?? null,
  });

  try {
    // Make the request to College Board API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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

    if (response.status !== 200) {
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

    const data: API_Response_Question_List | undefined = await response.json();

    questions = [...questions, ...(data || [])];

    // Also call the internal student-qb API
    try {
      const internalApiUrl = getInternalAPITargetURL();
      const queryParams = new URLSearchParams();

      if (domainsParam) queryParams.append("domains", domainsParam);
      if (assessment) queryParams.append("assessment", assessment);
      if (excludeQuestionIdsParam)
        queryParams.append("excludeIds", excludeQuestionIdsParam);
      if (difficultiesParam)
        queryParams.append("difficulties", difficultiesParam);
      if (skillCdsParam) queryParams.append("skills", skillCdsParam);
      if (random) queryParams.append("random", random);

      const internalResponse = await fetch(
        `${internalApiUrl}/api/student-qb/get-questions?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (internalResponse.ok) {
        const internalData = (await internalResponse.json()) as {
          success: boolean;
          data?: API_Response_Question_List;
        };
        // console.log("questions length", questions?.length);

        questions = [...questions, ...(internalData.data || [])];

        // console.log("internalData.data length", internalData.data?.length);
      }
    } catch (internalError) {
      console.warn(
        "Internal API call failed, continuing with CB data:",
        internalError,
      );
    }
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch questions from College Board API",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }

  let uniqueQuestions: API_Response_Question_List = [];
  let counter = 0;
  // console.log("questions length before deduplication", questions.length);

  if (questions.length > 0) {
    const seenExternalIds = new Set<string>();
    const seenIbns = new Set<string>();

    for (const question of questions) {
      const { externalId, ibn } = questionDedupKey(question);

      // console.log("Checking question:", { externalId, ibn });

      const alreadySeen =
        (externalId !== null && seenExternalIds.has(externalId)) ||
        (ibn !== null && seenIbns.has(ibn));

      if (!alreadySeen) {
        // uniqueQuestions.push(question);
        // if (externalId) seenExternalIds.add(externalId);
        // if (ibn) seenIbns.add(ibn);
        uniqueQuestions.push(question);
        if (externalId) seenExternalIds.add(externalId);
        if (ibn) seenIbns.add(ibn);
      } else {
        // console.log("Duplicate question found, skipping:", { externalId, ibn });

        counter += 1;
      }
    }
  }

  // console.log("Counter ", counter, "questions filtered out due to duplicates");
  // console.log("uniqueQuestions", uniqueQuestions.length, "after deduplication");
  // console.log("questions", questions);
  questions = uniqueQuestions;
  // console.log("questions ", questions.length, "after deduplication");

  try {
    if (excludeQuestionIds.length > 0) {
      questions = questions.filter(
        (question) => !excludeQuestionIds.includes(question.questionId),
      );
    }

    if (skillCds.length > 0) {
      questions = questions.filter((question) => {
        return skillCds.includes(question.skill_cd as SkillCd_Variants);
      });
    }

    if (difficulties.length > 0) {
      questions = questions.filter((question) =>
        difficulties.includes(question.difficulty),
      );
    }

    // console.log(questions.length, "questions fetched");

    return NextResponse.json(
      {
        success: true,
        data: questions,
        message: "Fetching question bank successfully",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600", // one hour
          "CDN-Cache-Control": "public, s-maxage=60",
          "Vercel-CDN-Cache-Control": "public, s-maxage=3600",
        },
      },
    );
  } catch (error) {
    console.error("Error processing questions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process questions",
      },
      { status: 500 },
    );
  }
}

//
//xwmeb2o3
