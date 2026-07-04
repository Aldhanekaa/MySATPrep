/**
 * PUT /api/user/profile
 *
 * Updates the authenticated user's profile in the user_profiles table.
 * Validates the incoming profile data, persists changes, invalidates
 * the cached profile entry, and returns the updated profile.
 *
 * Validates: Requirements 8.1, 8.12, 8.13, 8.14
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { invalidateUserCache } from "@/lib/cache";
import { updateUserProfile } from "@/lib/db/userOperations";
import { logError } from "@/lib/utils/errorLogger";
import type {
  UserProfileWithHistory,
  XPTransaction,
} from "@/types/userProfile";

// Fields that are accepted in the request body
interface ProfileUpdatePayload {
  totalXP?: unknown;
  level?: unknown;
  questionsAnswered?: unknown;
  correctAnswers?: unknown;
  incorrectAnswers?: unknown;
  lastActivity?: unknown;
  xpHistory?: unknown;
}

function isISOString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

function isXPTransactionArray(value: unknown): value is XPTransaction[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      typeof item.questionId === "string" &&
      typeof item.change === "number" &&
      (item.reason === "correct_answer" ||
        item.reason === "incorrect_answer") &&
      typeof item.timestamp === "string" &&
      typeof item.scoreBandRange === "number",
  );
}

/**
 * Validate and coerce the request body into a safe partial profile object.
 * Returns { valid: false, error } on validation failure.
 */
function validateProfilePayload(body: unknown):
  | {
      valid: true;
      data: Partial<UserProfileWithHistory>;
    }
  | {
      valid: false;
      error: string;
    } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const payload = body as ProfileUpdatePayload;
  const data: Partial<UserProfileWithHistory> = {};

  // totalXP – non-negative integer
  if (payload.totalXP !== undefined) {
    if (
      typeof payload.totalXP !== "number" ||
      !Number.isFinite(payload.totalXP) ||
      payload.totalXP < 0
    ) {
      return { valid: false, error: "totalXP must be a non-negative number" };
    }
    data.totalXP = payload.totalXP;
  }

  // level – non-negative integer
  if (payload.level !== undefined) {
    if (
      typeof payload.level !== "number" ||
      !Number.isInteger(payload.level) ||
      payload.level < 0
    ) {
      return { valid: false, error: "level must be a non-negative integer" };
    }
    data.level = payload.level;
  }

  // questionsAnswered – non-negative integer
  if (payload.questionsAnswered !== undefined) {
    if (
      typeof payload.questionsAnswered !== "number" ||
      !Number.isInteger(payload.questionsAnswered) ||
      payload.questionsAnswered < 0
    ) {
      return {
        valid: false,
        error: "questionsAnswered must be a non-negative integer",
      };
    }
    data.questionsAnswered = payload.questionsAnswered;
  }

  // correctAnswers – non-negative integer
  if (payload.correctAnswers !== undefined) {
    if (
      typeof payload.correctAnswers !== "number" ||
      !Number.isInteger(payload.correctAnswers) ||
      payload.correctAnswers < 0
    ) {
      return {
        valid: false,
        error: "correctAnswers must be a non-negative integer",
      };
    }
    data.correctAnswers = payload.correctAnswers;
  }

  // incorrectAnswers – non-negative integer
  if (payload.incorrectAnswers !== undefined) {
    if (
      typeof payload.incorrectAnswers !== "number" ||
      !Number.isInteger(payload.incorrectAnswers) ||
      payload.incorrectAnswers < 0
    ) {
      return {
        valid: false,
        error: "incorrectAnswers must be a non-negative integer",
      };
    }
    data.incorrectAnswers = payload.incorrectAnswers;
  }

  // lastActivity – ISO timestamp string
  if (payload.lastActivity !== undefined) {
    if (!isISOString(payload.lastActivity)) {
      return {
        valid: false,
        error: "lastActivity must be a valid ISO timestamp string",
      };
    }
    data.lastActivity = payload.lastActivity;
  }

  // xpHistory – array of XPTransaction
  if (payload.xpHistory !== undefined) {
    if (!isXPTransactionArray(payload.xpHistory)) {
      return {
        valid: false,
        error: "xpHistory must be an array of valid XPTransaction objects",
      };
    }
    data.xpHistory = payload.xpHistory;
  }

  if (Object.keys(data).length === 0) {
    return {
      valid: false,
      error: "Request body must contain at least one updatable field",
    };
  }

  return { valid: true, data };
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

  // Requirement 8.1 – validate incoming profile data
  const validation = validateProfilePayload(body);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 },
    );
  }

  try {
    // Update user_profiles table
    const updatedProfile = await updateUserProfile(userId, validation.data);

    // Requirement 8.12 – invalidate cache after successful update
    invalidateUserCache(userId);

    // Requirement 8.13 – return updated profile data
    return NextResponse.json(
      { success: true, data: { profile: updatedProfile } },
      { status: 200 },
    );
  } catch (error) {
    logError("[PUT /api/user/profile]", error, { userId });

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
