import {
  API_Response_Question,
  ExternalID_ResponseQuestion,
  MultipleChoiceDisclosedQuestion,
  SPRDisclosedQuestion,
} from "@/types/question";
import getInternalAPITargetURL from "./getInternalAPITargetURL";
import Fraction from "fraction.js";

export interface QuestionFetchResult {
  success: boolean;
  data?: API_Response_Question;
  error?: string;
  status?: number;
}

/**
 * Translates written fractions (e.g., "three halves", "one quarter") to numeric fractions (e.g., "3/2", "1/4")
 * @param fractionWord - The written fraction
 * @returns The numeric fraction as a string (e.g., "3/2") or the original input if not recognized
 */
function translateFractionWordsToAnswer(fractionWord: string): string {
  // console.log("translateFractionWordsToAnswer");
  // console.log("fractionWord", fractionWord);
  if (!fractionWord) return "";

  const normalized = fractionWord.toLowerCase().trim();
  // console.log("normalized", normalized);

  // Numerator words
  const numerators: { [key: string]: number } = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  // Denominator words
  const denominators: { [key: string]: number } = {
    two: 2,
    half: 2,
    halves: 2,
    three: 3,
    third: 3,
    thirds: 3,
    four: 4,
    fourth: 4,
    fourths: 4,
    quarter: 4,
    quarters: 4,
    five: 5,
    fifth: 5,
    fifths: 5,
    six: 6,
    sixth: 6,
    sixths: 6,
    seven: 7,
    seventh: 7,
    sevenths: 7,
    eighth: 8,
    eight: 8,
    eighths: 8,
    nine: 9,
    ninth: 9,
    ninths: 9,
    ten: 10,
    tenth: 10,
    tenths: 10,
  };

  // Try to match patterns like "three halves", "one quarter", etc.
  const fractionPattern = /^(\w+)\s+(\w+)?$/i;
  const match = normalized.match(fractionPattern);
  // console.log("match", match);

  if (match) {
    const numeratorWord = match[1];
    const denominatorWord = match[2]; // Already has the correct form from regex

    const numerator = numerators[numeratorWord];
    const denominator = denominators[denominatorWord];

    if (numerator !== undefined && denominator !== undefined) {
      return `${numerator}/${denominator}`;
    }
  }

  // If no pattern matched, return the original
  return fractionWord;
}

function findCorrectChoiceOrAnswerOnIBNQuestion(
  data: SPRDisclosedQuestion | MultipleChoiceDisclosedQuestion,
): Array<string> {
  if (
    data.answer.style == "Multiple Choice" &&
    "correct_choice" in data.answer
  ) {
    return [data.answer.correct_choice.toUpperCase()];
  } else {
    const rationale = data.answer.rationale;

    // Check for "either X or Y" pattern
    const eitherOrMatch = rationale.match(
      /The correct answer is(?: either)?\s+([A-D]|\d+\/\d+|\d+(?:\.\d+)?)\s+or\s+([A-D]|\d+\/\d+|\d+(?:\.\d+)?)/i,
    );

    if (eitherOrMatch) {
      return [eitherOrMatch[1].toUpperCase(), eitherOrMatch[2].toUpperCase()];
    }

    // try to find the correct choice in the rationale by looking for patterns like:
    // "The correct answer is {answer}." or "Choice {answer} is correct."
    // Also handles math expressions like: "The correct answer is <span class="math-container"><img ... alt="three halves"></span>."
    const correctChoiceMatch = rationale.match(
      /(?:The correct answer is\s+([A-D]|\d+\/\d+|\d+(?:\.\d+)?)\.?|Choice\s+([A-D]|\d+\/\d+|\d+(?:\.\d+)?)\s+is correct\.|alt="([^"]*)")/i,
    );

    // console.log("correctChoiceMatch", correctChoiceMatch);

    if (correctChoiceMatch) {
      const correctChoice =
        correctChoiceMatch[1] || correctChoiceMatch[2] || correctChoiceMatch[3];

      // console.log("correctChoiceMatch[3]", correctChoiceMatch[3]);
      // If it's a written fraction (from alt text), translate it to numeric form
      if (correctChoiceMatch[3]) {
        const translatedFraction = translateFractionWordsToAnswer(
          correctChoiceMatch[3],
        );
        return [translatedFraction.toUpperCase()];
      }

      return [correctChoice.toUpperCase()];
    }
  }

  return [];
}

export async function fetchQuestionData(
  questionId: string,
  isMyPractice: boolean = false,
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

        const correctAnswer =
          findCorrectChoiceOrAnswerOnIBNQuestion(questionData);

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
              correct_answer: correctAnswer,
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
              correct_answer: correctAnswer,
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

  // Handle regular questions - try internal API first, then fall back to qbank-api
  const internalApiUrl = getInternalAPITargetURL();

  // Try internal API (Neon database) first
  try {
    const internalResponse = await fetch(
      `${internalApiUrl}/api/student-qb/question/${questionId}`,
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
        data?: API_Response_Question;
      };
      if (internalData.success && internalData.data) {
        return {
          success: true,
          data: internalData.data,
        };
      }
    }
  } catch (internalError) {
    console.warn(
      "Internal API call failed, falling back to qbank-api:",
      internalError,
    );
  }

  // Fall back to qbank-api
  const apiUrl =
    "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-question";

  let lastErrorStatus = 404;

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

    lastErrorStatus = response.status;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("College Board API error:", response.status, errorText);
      return {
        success: false,
        error: `Question Not Found: ${response.status} ${response.statusText}`,
        status: response.status,
      };
    }

    const questionData: ExternalID_ResponseQuestion = await response.json();

    if (!questionData || !questionData.externalid) {
      return {
        success: false,
        error: "Given Question Id Not Found",
        status: 404,
      };
    }

    if (questionData.type === "mcq") {
      return {
        success: true,
        data: {
          answerOptions: questionData.answerOptions.reduce(
            (acc, option, idx) => {
              const key = ["a", "b", "c", "d"][idx];
              if (key) {
                acc[key.toUpperCase() as "A" | "B" | "C" | "D"] =
                  option.content;
              }

              return acc;
            },
            {} as { [key in "A" | "B" | "C" | "D"]: string },
          ),
          correct_answer: questionData.correct_answer.map((e) => {
            return e.toUpperCase();
          }),
          rationale: questionData.rationale,
          stem: questionData.stem,
          stimulus: questionData.stimulus,
          type: "mcq",
          externalid: questionData.externalid,
        },
      };
    } else if (questionData.type === "spr") {
      return {
        success: true,
        data: {
          answerOptions: undefined,
          correct_answer: questionData.correct_answer,
          rationale: questionData.rationale,
          stem: questionData.stem,
          type: "spr",
          externalid: questionData.externalid,
          stimulus: questionData.stimulus,
        },
      };
    }

    return {
      success: false,
      error: "Given Question Id Not Found",
      status: lastErrorStatus,
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
