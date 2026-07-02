/**
 * POST /api/user/batch-update
 *
 * Batches multiple user data updates into a single API call, reducing the
 * number of network round-trips when several data categories need to be
 * persisted simultaneously (e.g. profile + statistics after a practice session).
 *
 * Accepts an object where each key is optional; only the keys present in the
 * request body will be updated.  All updates are run in parallel for minimum
 * latency.  After all updates succeed the full user cache is invalidated.
 *
 * Validates: Requirement 19.5
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { invalidateUserCache } from "@/lib/cache";
import {
  updateUserProfile,
  updatePracticeStatistics,
} from "@/lib/db/userOperations";
import {
  updateVocabularyProgress,
  updateUserPreferences,
} from "@/lib/db/miscOperations";
import { logError } from "@/lib/utils/errorLogger";
import type {
  UserProfileWithHistory,
  XPTransaction,
} from "@/types/userProfile";
import type { PracticeStatistics } from "@/types";
import type { VocabularyProgress, UserPreferences } from "@/lib/types/userData";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BatchUpdatePayload {
  profile?: unknown;
  statistics?: unknown;
  vocabulary?: unknown;
  preferences?: unknown;
}

interface BatchUpdateResult {
  profile?: UserProfileWithHistory;
  statistics?: PracticeStatistics;
  vocabulary?: VocabularyProgress;
  preferences?: UserPreferences;
}

// ─── Validators ───────────────────────────────────────────────────────────────

const VALID_THEMES = ["light", "dark", "system"] as const;

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

function validateProfile(
  body: unknown,
):
  | { valid: true; data: Partial<UserProfileWithHistory> }
  | { valid: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, error: "profile must be a JSON object" };
  }

  const payload = body as Record<string, unknown>;
  const data: Partial<UserProfileWithHistory> = {};

  if (payload.totalXP !== undefined) {
    if (
      typeof payload.totalXP !== "number" ||
      !Number.isFinite(payload.totalXP) ||
      payload.totalXP < 0
    ) {
      return {
        valid: false,
        error: "profile.totalXP must be a non-negative number",
      };
    }
    data.totalXP = payload.totalXP;
  }

  if (payload.level !== undefined) {
    if (
      typeof payload.level !== "number" ||
      !Number.isInteger(payload.level) ||
      payload.level < 0
    ) {
      return {
        valid: false,
        error: "profile.level must be a non-negative integer",
      };
    }
    data.level = payload.level;
  }

  if (payload.questionsAnswered !== undefined) {
    if (
      typeof payload.questionsAnswered !== "number" ||
      !Number.isInteger(payload.questionsAnswered) ||
      payload.questionsAnswered < 0
    ) {
      return {
        valid: false,
        error: "profile.questionsAnswered must be a non-negative integer",
      };
    }
    data.questionsAnswered = payload.questionsAnswered;
  }

  if (payload.correctAnswers !== undefined) {
    if (
      typeof payload.correctAnswers !== "number" ||
      !Number.isInteger(payload.correctAnswers) ||
      payload.correctAnswers < 0
    ) {
      return {
        valid: false,
        error: "profile.correctAnswers must be a non-negative integer",
      };
    }
    data.correctAnswers = payload.correctAnswers;
  }

  if (payload.incorrectAnswers !== undefined) {
    if (
      typeof payload.incorrectAnswers !== "number" ||
      !Number.isInteger(payload.incorrectAnswers) ||
      payload.incorrectAnswers < 0
    ) {
      return {
        valid: false,
        error: "profile.incorrectAnswers must be a non-negative integer",
      };
    }
    data.incorrectAnswers = payload.incorrectAnswers;
  }

  if (payload.lastActivity !== undefined) {
    if (!isISOString(payload.lastActivity)) {
      return {
        valid: false,
        error: "profile.lastActivity must be a valid ISO timestamp string",
      };
    }
    data.lastActivity = payload.lastActivity;
  }

  if (payload.xpHistory !== undefined) {
    if (!isXPTransactionArray(payload.xpHistory)) {
      return {
        valid: false,
        error:
          "profile.xpHistory must be an array of valid XPTransaction objects",
      };
    }
    data.xpHistory = payload.xpHistory;
  }

  if (Object.keys(data).length === 0) {
    return {
      valid: false,
      error: "profile must contain at least one updatable field",
    };
  }

  return { valid: true, data };
}

function validateStatistics(
  body: unknown,
): { valid: true; data: PracticeStatistics } | { valid: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, error: "statistics must be a JSON object" };
  }
  // The statistics object is keyed by assessment type; accept as-is after type check
  return { valid: true, data: body as PracticeStatistics };
}

function validateVocabulary(
  body: unknown,
): { valid: true; data: VocabularyProgress } | { valid: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, error: "vocabulary must be a JSON object" };
  }
  return { valid: true, data: body as VocabularyProgress };
}

function validatePreferences(
  body: unknown,
): { valid: true; data: UserPreferences } | { valid: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, error: "preferences must be a JSON object" };
  }

  const payload = body as Record<string, unknown>;

  if (
    payload.theme !== undefined &&
    !VALID_THEMES.includes(payload.theme as (typeof VALID_THEMES)[number])
  ) {
    return {
      valid: false,
      error: `preferences.theme must be one of: ${VALID_THEMES.join(", ")}`,
    };
  }

  if (
    payload.soundEnabled !== undefined &&
    typeof payload.soundEnabled !== "boolean"
  ) {
    return {
      valid: false,
      error: "preferences.soundEnabled must be a boolean",
    };
  }

  if (
    payload.notifications !== undefined &&
    typeof payload.notifications !== "boolean"
  ) {
    return {
      valid: false,
      error: "preferences.notifications must be a boolean",
    };
  }

  return { valid: true, data: payload as UserPreferences };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Require authentication
  const session = await auth.api.getSession({ headers: request.headers });
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

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { success: false, error: "Request body must be a JSON object" },
      { status: 400 },
    );
  }

  const payload = body as BatchUpdatePayload;

  // Require at least one update category
  if (
    payload.profile === undefined &&
    payload.statistics === undefined &&
    payload.vocabulary === undefined &&
    payload.preferences === undefined
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Request body must contain at least one of: profile, statistics, vocabulary, preferences",
      },
      { status: 400 },
    );
  }

  // Validate each category that is present
  if (payload.profile !== undefined) {
    const v = validateProfile(payload.profile);
    if (!v.valid)
      return NextResponse.json(
        { success: false, error: v.error },
        { status: 400 },
      );
  }

  if (payload.statistics !== undefined) {
    const v = validateStatistics(payload.statistics);
    if (!v.valid)
      return NextResponse.json(
        { success: false, error: v.error },
        { status: 400 },
      );
  }

  if (payload.vocabulary !== undefined) {
    const v = validateVocabulary(payload.vocabulary);
    if (!v.valid)
      return NextResponse.json(
        { success: false, error: v.error },
        { status: 400 },
      );
  }

  if (payload.preferences !== undefined) {
    const v = validatePreferences(payload.preferences);
    if (!v.valid)
      return NextResponse.json(
        { success: false, error: v.error },
        { status: 400 },
      );
  }

  try {
    const updates: Array<Promise<[keyof BatchUpdateResult, unknown]>> = [];

    // Profile update
    if (payload.profile !== undefined) {
      const profileValidation = validateProfile(payload.profile);
      if (profileValidation.valid) {
        updates.push(
          updateUserProfile(userId, profileValidation.data).then(
            (result) =>
              ["profile", result] as [keyof BatchUpdateResult, unknown],
          ),
        );
      }
    }

    // Statistics update — handle each assessment key in parallel
    if (payload.statistics !== undefined) {
      const statsValidation = validateStatistics(payload.statistics);
      if (statsValidation.valid) {
        const assessmentKeys = Object.keys(statsValidation.data);
        const statsPromises = assessmentKeys.map((assessment) =>
          updatePracticeStatistics(userId, assessment, statsValidation.data),
        );
        updates.push(
          Promise.all(statsPromises).then((results) => {
            const merged: PracticeStatistics = Object.assign({}, ...results);
            return ["statistics", merged] as [keyof BatchUpdateResult, unknown];
          }),
        );
      }
    }

    // Vocabulary update
    if (payload.vocabulary !== undefined) {
      const vocabValidation = validateVocabulary(payload.vocabulary);
      if (vocabValidation.valid) {
        updates.push(
          updateVocabularyProgress(userId, vocabValidation.data).then(
            (result) =>
              ["vocabulary", result] as [keyof BatchUpdateResult, unknown],
          ),
        );
      }
    }

    // Preferences update
    if (payload.preferences !== undefined) {
      const prefsValidation = validatePreferences(payload.preferences);
      if (prefsValidation.valid) {
        updates.push(
          updateUserPreferences(userId, prefsValidation.data).then(
            (result) =>
              ["preferences", result] as [keyof BatchUpdateResult, unknown],
          ),
        );
      }
    }

    // Run all updates in parallel
    const results = await Promise.all(updates);

    // Build response data object
    const data: BatchUpdateResult = {};
    for (const [key, value] of results) {
      (data as Record<string, unknown>)[key] = value;
    }

    // Invalidate all cached data for this user
    invalidateUserCache(userId);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    logError("[POST /api/user/batch-update]", error, { userId });

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
