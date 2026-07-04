/**
 * PUT /api/user/preferences
 *
 * Updates the authenticated user's preferences in the user_preferences table.
 * Validates the incoming data, persists changes, invalidates the cache, and returns
 * the updated preferences.
 *
 * Validates: Requirements 8.10, 8.12, 8.13, 8.14
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { preferencesCache, getCacheKey } from "@/lib/cache";
import { updateUserPreferences } from "@/lib/db/miscOperations";
import { logError } from "@/lib/utils/errorLogger";
import type { UserPreferences } from "@/lib/types/userData";

const VALID_THEMES = ["light", "dark"] as const;
const VALID_DATA_MODE_PRIORITIES = ["localstorage", "cloud"] as const;
const VALID_ASSESSMENTS = ["SAT", "PSAT/NMSQT", "PSAT"] as const;

function validatePreferencesPayload(
  body: unknown,
): { valid: true; data: UserPreferences } | { valid: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const payload = body as Record<string, unknown>;

  if (
    payload.theme !== undefined &&
    !VALID_THEMES.includes(payload.theme as (typeof VALID_THEMES)[number])
  ) {
    return {
      valid: false,
      error: `theme must be one of: ${VALID_THEMES.join(", ")}`,
    };
  }

  if (
    payload.data_mode_priority !== undefined &&
    !VALID_DATA_MODE_PRIORITIES.includes(
      payload.data_mode_priority as (typeof VALID_DATA_MODE_PRIORITIES)[number],
    )
  ) {
    return {
      valid: false,
      error: `data_mode_priority must be one of: ${VALID_DATA_MODE_PRIORITIES.join(", ")}`,
    };
  }

  if (
    payload.assessment !== undefined &&
    !VALID_ASSESSMENTS.includes(
      payload.assessment as (typeof VALID_ASSESSMENTS)[number],
    )
  ) {
    return {
      valid: false,
      error: `assessment must be one of: ${VALID_ASSESSMENTS.join(", ")}`,
    };
  }

  if (
    payload.soundEnabled !== undefined &&
    typeof payload.soundEnabled !== "boolean"
  ) {
    return { valid: false, error: "soundEnabled must be a boolean" };
  }

  if (
    payload.notifications !== undefined &&
    typeof payload.notifications !== "boolean"
  ) {
    return { valid: false, error: "notifications must be a boolean" };
  }

  if (Object.keys(payload).length === 0) {
    return {
      valid: false,
      error: "Request body must contain at least one preference field",
    };
  }

  return { valid: true, data: payload as UserPreferences };
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  const validation = validatePreferencesPayload(body);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 },
    );
  }

  try {
    const updated = await updateUserPreferences(userId, validation.data);

    // Requirement 8.12 – invalidate preferences cache after successful update
    preferencesCache.delete(getCacheKey("preferences", userId));

    // Requirement 8.13 – return updated data
    return NextResponse.json(
      { success: true, data: { preferences: updated } },
      { status: 200 },
    );
  } catch (error) {
    logError("[PUT /api/user/preferences]", error, { userId });

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
