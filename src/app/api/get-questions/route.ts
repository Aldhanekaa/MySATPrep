import { Assessments } from "@/static-data/assessment";
import { DomainItemsArray, SkillCd_Variants } from "@/types/lookup";
import { API_Response_Question_List } from "@/types/question";
import { NextRequest, NextResponse } from "next/server";
import { skillCds as Skills } from "@/static-data/domains";
import { fetchQuestionData, QuestionFetchResult } from "@/lib/questionFetcher";
import { fetchCbJwtTokenInternal } from "@/lib/fetchCbJwtTokenInternal";
import { fetchCbJwtToken } from "@/lib/fetchCbJwtToken";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainsParam = searchParams.get("domains");
  const assessment = searchParams.get("assessment");
  const excludeQuestionIdsParam = searchParams.get("excludeIds");
  const difficultiesParam = searchParams.get("difficulties");
  const skillCdsParam = searchParams.get("skills");
  const random = searchParams.get("random");

  const uniqueIdsParam = searchParams.get("uniqueIds"); // externalIds or Ibn

  if (uniqueIdsParam) {
    const uniqueIds = uniqueIdsParam.split(",").map((id) => id.trim());
    const questions: QuestionFetchResult[] = [];

    uniqueIds.forEach(async (id) => {
      const result = await fetchQuestionData(id);
      questions.push(result);
    });

    return NextResponse.json({ success: true, data: questions });
  }

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

  // console.log("domains", domainsParam);
  // console.log("assessment", assessment);
  // console.log("random", random);
  // console.log("excludeQuestionIds", excludeQuestionIds);

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
  const apiUrls = [
    "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-questions",
    "https://digitalpractice-api.collegeboard.org/mspractice-studentquestionbank-prod/get-questions",
  ];

  let questions: API_Response_Question_List = [];
  const responseStatus = [];

  try {
    for (const apiUrl of apiUrls) {
      const isProtectedEndpoint = apiUrl.includes("digitalpractice-api");

      let CB_AUTHORIZATION_TOKEN = "";

      if (isProtectedEndpoint) {
        const { cbJwtToken, status, error } = await fetchCbJwtTokenInternal();

        if (typeof cbJwtToken === "string") CB_AUTHORIZATION_TOKEN = cbJwtToken;

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
          asmtEventId: asmtEventId,
          test: 2,
          domain: domainsParam,
        }),
        next: { revalidate: 86400 },
        cache: "force-cache",
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      // console.log("CB_AUTHORIZATION_TOKEN", CB_AUTHORIZATION_TOKEN);
      responseStatus.push({
        url: apiUrl,
        status: response.status,
        errorText: response.status !== 200 && (await response.text()),
        statusText: response.statusText,
      });

      const data: API_Response_Question_List | undefined =
        await response.json();
      // console.log(" Collegeboard Data ", data);

      questions = [...questions, ...(data || [])];
    }
  } catch (error) {
    console.log(responseStatus);
    if (responseStatus[0].status !== 200) {
      let response = responseStatus[0];
      console.error("Error fetching questions:", error);
      const errorText = response.errorText || "No error text available";
      console.error("College Board API error:", response.status, errorText);

      return NextResponse.json(
        {
          success: false,
          error: `College Board API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status },
      );
    } else if (responseStatus[1] && responseStatus[1].status !== 200) {
      let response = responseStatus[1];
      console.error("Error fetching questions on mypractice api:", error);
      const errorText = response.errorText || "No error text available";
      console.error("College Board API error:", response.status, errorText);
    }
  }

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
          "Cache-Control": "public, s-maxage=3600",
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
