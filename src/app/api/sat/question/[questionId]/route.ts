import {
  API_Response_Question,
  ExternalID_ResponseQuestion,
  MultipleChoiceDisclosedQuestion,
  SPRDisclosedQuestion,
} from "@/types/question";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { questionId } = await params;

  if (questionId === null || questionId === "") {
    return NextResponse.json(
      {
        success: false,
        error:
          "Question ID parameter is required : /api/sat/question/[questionId]",
      },
      { status: 400 }
    );
  }

  // // Check the Question ID format : 070615-DC or 77e2c729-a66a-47de-9258-130399ad202e
  // const questionIdRegex =
  //   /^(0\d{5}-[A-Z]{2}|[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})$/;

  // if (!questionIdRegex.test(questionId)) {
  //   return NextResponse.json(
  //     {
  //       success: false,
  //       error:
  //         "Invalid Question ID format. Expected format: 070615-DC or 77e2c729-a66a-47de-9258-130399ad202e",
  //     },
  //     { status: 400 }
  //   );
  // }

  // Prepare the request to College Board API
  if (questionId.includes("-DC")) {
    const API_URL = `https://saic.collegeboard.org/disclosed/${questionId}.json`;

    try {
      // Make the request to College Board API
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("College Board API error:", response.status, errorText);

        return NextResponse.json(
          {
            success: false,
            error: `Question Not Found: ${response.status} ${response.statusText}`,
            details: errorText,
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      let api_response: API_Response_Question | object = {};
      // console.log("DATA ", data);

      if (Array.isArray(data) && data.length > 0) {
        const questionData:
          | SPRDisclosedQuestion
          | MultipleChoiceDisclosedQuestion = data[0];

        if (questionData.answer.style === "Multiple Choice") {
          api_response = {
            answerOptions: {
              a: questionData.answer.choices.a.body,
              b: questionData.answer.choices.b.body,
              c: questionData.answer.choices.c.body,
              d: questionData.answer.choices.d.body,
            },
            correct_answer: [questionData.answer.correct_choice],
            rationale: questionData.answer.rationale,
            stem: questionData.prompt,
            type: "mcq",

            ibn: questionId,
          };
        } else if (questionData.answer.style === "SPR") {
          api_response = {
            answerOptions: {},
            correct_answer: [],
            rationale: questionData.answer.rationale,
            stem: questionData.prompt,
            type: "spr",

            ibn: questionId,
          };
        }
      }

      return NextResponse.json(
        {
          success: true,
          data: api_response,
          message: "Question retrieved successfully",
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
      console.error("Error in fetching question:", error);
      return NextResponse.json(
        {
          success: false,
          error: `Question Not Found: Error fetching question from College Board API`,
        },
        { status: 400 }
      );
    }
  }

  const apiUrl =
    "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-question";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Add any required authentication headers here if needed
        // 'Authorization': `Bearer ${process.env.COLLEGEBOARD_API_KEY}`,
      },
      body: JSON.stringify({ external_id: questionId }),
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
    const data = await response.json();
    let api_response: API_Response_Question | object = {};

    // Check if the response contains the expected data structure
    if (!data || !data.externalid) {
      return NextResponse.json(
        {
          success: false,
          error: "Given Question Id Not Found",
        },
        { status: 404 }
      );
    }

    if (data) {
      const questionData: ExternalID_ResponseQuestion = data;

      if (questionData.type == "mcq") {
        api_response = {
          answerOptions: questionData.answerOptions.reduce(
            (acc, option, idx) => {
              const key = ["a", "b", "c", "d"][idx] as "a" | "b" | "c" | "d";
              if (key) acc[key] = option.content;
              return acc;
            },
            {} as { [key in "a" | "b" | "c" | "d"]: string }
          ),
          correct_answer: questionData.correct_answer,
          rationale: questionData.rationale,
          stem: questionData.stem,
          type: "mcq",
          externalid: questionData.externalid,
        };
      } else if (questionData.type == "spr") {
        api_response = {
          answerOptions: undefined,
          correct_answer: questionData.correct_answer,
          rationale: questionData.rationale,
          stem: questionData.stem,
          type: "spr",
          externalid: questionData.externalid,
        };
      }
    }

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: api_response,
        message: "Question retrieved successfully",
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
    console.error("Error in fetching question:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Given Question Id Not Found",
      },
      { status: 404 }
    );
  }
}
