import {
  API_Response_Question,
  ExternalID_ResponseQuestion,
  MultipleChoiceDisclosedQuestion,
  SPRDisclosedQuestion,
} from "@/types/question";

export interface QuestionFetchResult {
  success: boolean;
  data?: API_Response_Question;
  error?: string;
  status?: number;
}

/**
 * Fetches question data from College Board APIs
 * Handles both disclosed questions (-DC suffix) and regular questions
 * @param questionId - The question ID to fetch
 * @returns Promise<QuestionFetchResult>
 */
export async function fetchQuestionData(
  questionId: string
): Promise<QuestionFetchResult> {
  if (!questionId || questionId === "") {
    return {
      success: false,
      error: "Question ID parameter is required",
      status: 400,
    };
  }

  // Handle disclosed questions
  if (questionId.includes("-DC")) {
    const API_URL = `https://saic.collegeboard.org/disclosed/${questionId}.json`;

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "force-cache",
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("College Board API error:", response.status, errorText);
        return {
          success: false,
          error: `Question Not Found: ${response.status} ${response.statusText}`,
          status: response.status,
        };
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const questionData:
          | SPRDisclosedQuestion
          | MultipleChoiceDisclosedQuestion = data[0];

        if (questionData.answer.style === "Multiple Choice") {
          return {
            success: true,
            data: {
              answerOptions: {
                A: questionData.answer.choices.a.body,
                B: questionData.answer.choices.b.body,
                C: questionData.answer.choices.c.body,
                D: questionData.answer.choices.d.body,
              },
              correct_answer: [
                questionData.answer.correct_choice.toUpperCase(),
              ],
              rationale: questionData.answer.rationale,
              stem: questionData.prompt,
              type: "mcq",
              stimulus: questionData.body,
              ibn: questionId,
            },
          };
        } else if (questionData.answer.style === "SPR") {
          return {
            success: true,
            data: {
              answerOptions: undefined,
              correct_answer: [],
              rationale: questionData.answer.rationale,
              stem: questionData.prompt,
              type: "spr",
              stimulus: questionData.body,
              ibn: questionId,
            },
          };
        }
      }

      return {
        success: false,
        error: "Invalid question data format",
        status: 400,
      };
    } catch (error) {
      console.error("Error in fetching disclosed question:", error);
      return {
        success: false,
        error:
          "Question Not Found: Error fetching question from College Board API",
        status: 400,
      };
    }
  }

  // Handle regular questions
  const apiUrl =
    "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-question";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ external_id: questionId }),
      cache: "force-cache",
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("College Board API error:", response.status, errorText);
      return {
        success: false,
        error: `College Board API error: ${response.status} ${response.statusText}`,
        status: response.status,
      };
    }

    const data: ExternalID_ResponseQuestion = await response.json();

    if (!data || !data.externalid) {
      return {
        success: false,
        error: "Given Question Id Not Found",
        status: 404,
      };
    }

    // console.log("Fetched question data:", data);

    if (data.type === "mcq") {
      return {
        success: true,
        data: {
          answerOptions: data.answerOptions.reduce((acc, option, idx) => {
            const key = ["a", "b", "c", "d"][idx];
            if (key)
              acc[key.toUpperCase() as "A" | "B" | "C" | "D"] = option.content;
            return acc;
          }, {} as { [key in "A" | "B" | "C" | "D"]: string }),
          correct_answer: data.correct_answer.map((e) => e.toUpperCase()),
          rationale: data.rationale,
          stem: data.stem,
          stimulus: data.stimulus,
          type: "mcq",
          externalid: data.externalid,
        },
      };
    } else if (data.type === "spr") {
      return {
        success: true,
        data: {
          answerOptions: undefined,
          correct_answer: data.correct_answer,
          rationale: data.rationale,
          stem: data.stem,
          type: "spr",
          externalid: data.externalid,
          stimulus: data.stimulus,
        },
      };
    }

    return {
      success: false,
      error: "Unknown question type",
      status: 400,
    };
  } catch (error) {
    console.error("Error in fetching question:", error);
    return {
      success: false,
      error: "Given Question Id Not Found",
      status: 404,
    };
  }
}
