/**
 * PUT /api/user/statistics
 *
 * Updates the authenticated user's practice statistics in the practice_statistics table.
 * Validates the incoming statistics data, persists changes, invalidates
 * the cached statistics entry, and returns the updated statistics.
 *
 * Validates: Requirements 8.2, 8.12, 8.13, 8.14
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { statisticsCache, getCacheKey } from "@/lib/cache";
import { updatePracticeStatistics } from "@/lib/db/userOperations";
import { logError } from "@/lib/utils/errorLogger";
import type { PracticeStatistics, AssessmentStatistics } from "@/types";

// Valid assessment types accepted by the endpoint
const VALID_ASSESSMENTS = ["SAT", "PSAT/NMSQT", "PSAT"] as const;
type ValidAssessment = (typeof VALID_ASSESSMENTS)[number];

// Fields accepted in the request body
interface StatisticsUpdatePayload {
  assessment?: unknown;
  answeredQuestions?: unknown;
  answeredQuestionsDetailed?: unknown;
  statistics?: unknown;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isAnsweredQuestionsDetailedArray(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).questionId === "string" &&
      typeof (item as Record<string, unknown>).isCorrect === "boolean" &&
      typeof (item as Record<string, unknown>).timeSpent === "number" &&
      typeof (item as Record<string, unknown>).timestamp === "string" &&
      ((item as Record<string, unknown>).difficulty === "E" ||
        (item as Record<string, unknown>).difficulty === "M" ||
        (item as Record<string, unknown>).difficulty === "H"),
  );
}

function isClassStatistics(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  // ClassStatistics is a nested object; do a shallow structural check
  for (const domainVal of Object.values(value as Record<string, unknown>)) {
    if (
      typeof domainVal !== "object" ||
      domainVal === null ||
      Array.isArray(domainVal)
    ) {
      return false;
    }
    for (const skillVal of Object.values(
      domainVal as Record<string, unknown>,
    )) {
      if (
        typeof skillVal !== "object" ||
        skillVal === null ||
        Array.isArray(skillVal)
      ) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Validate and coerce the request body into a safe statistics payload.
 * Returns { valid: false, error } on validation failure.
 */
function validateStatisticsPayload(body: unknown):
  | {
      valid: true;
      assessment: ValidAssessment;
      data: PracticeStatistics;
    }
  | {
      valid: false;
      error: string;
    } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const payload = body as StatisticsUpdatePayload;

  // Validate assessment – required field
  if (
    typeof payload.assessment !== "string" ||
    !VALID_ASSESSMENTS.includes(payload.assessment as ValidAssessment)
  ) {
    return {
      valid: false,
      error: `assessment must be one of: ${VALID_ASSESSMENTS.join(", ")}`,
    };
  }
  const assessment = payload.assessment as ValidAssessment;

  // Build the AssessmentStatistics object from the remaining fields
  const assessmentData: Partial<AssessmentStatistics> = {};
  let hasField = false;

  // answeredQuestions – array of string IDs
  if (payload.answeredQuestions !== undefined) {
    if (!isStringArray(payload.answeredQuestions)) {
      return {
        valid: false,
        error: "answeredQuestions must be an array of strings",
      };
    }
    assessmentData.answeredQuestions = payload.answeredQuestions;
    hasField = true;
  }

  // answeredQuestionsDetailed – array of AnsweredQuestion objects
  if (payload.answeredQuestionsDetailed !== undefined) {
    if (!isAnsweredQuestionsDetailedArray(payload.answeredQuestionsDetailed)) {
      return {
        valid: false,
        error:
          "answeredQuestionsDetailed must be an array of valid AnsweredQuestion objects",
      };
    }
    assessmentData.answeredQuestionsDetailed =
      payload.answeredQuestionsDetailed as AssessmentStatistics["answeredQuestionsDetailed"];
    hasField = true;
  }

  // statistics – ClassStatistics (nested domain/skill/question object)
  if (payload.statistics !== undefined) {
    if (!isClassStatistics(payload.statistics)) {
      return {
        valid: false,
        error: "statistics must be a valid ClassStatistics object",
      };
    }
    assessmentData.statistics =
      payload.statistics as AssessmentStatistics["statistics"];
    hasField = true;
  }

  if (!hasField) {
    return {
      valid: false,
      error:
        "Request body must contain at least one updatable statistics field",
    };
  }

  // Build the full PracticeStatistics shape expected by updatePracticeStatistics
  const data: PracticeStatistics = {
    [assessment]: {
      answeredQuestions: assessmentData.answeredQuestions ?? [],
      answeredQuestionsDetailed: assessmentData.answeredQuestionsDetailed ?? [],
      statistics: assessmentData.statistics ?? {},
    },
  };

  return { valid: true, assessment, data };
}

export async function PUT(request: NextRequest) {
  // Requirement 8.14 – return 401 if not authenticated
  const session = await getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  // Requirement 8.2 – validate incoming statistics data
  const validation = validateStatisticsPayload(body);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 },
    );
  }

  const { assessment, data } = validation;

  try {
    // Update practice_statistics table
    const updatedStatistics = await updatePracticeStatistics(
      userId,
      assessment,
      data,
    );

    // Requirement 8.12 – invalidate statistics cache after successful update
    statisticsCache.delete(getCacheKey("statistics", userId, assessment));

    // Requirement 8.13 – return updated statistics data
    return NextResponse.json(
      { success: true, data: { statistics: updatedStatistics } },
      { status: 200 },
    );
  } catch (error) {
    logError("[PUT /api/user/statistics]", error, { userId, assessment });

    const isDbError =
      error instanceof Error &&
      (error.message.includes("ECONNREFUSED") ||
        error.message.includes("connection") ||
        error.message.includes("pool"));

    if (isDbError) {
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
