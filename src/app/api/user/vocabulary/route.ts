/**
 * GET /api/user/vocabulary
 * PUT /api/user/vocabulary
 *
 * GET — fetches vocabulary progress for the authenticated user.
 *       Called lazily when the user visits /dashboard/vocabs.
 * PUT — updates vocabulary progress.
 *
 * Validates: Requirements 8.10, 8.12, 8.13, 8.14
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { vocabularyCache, getCacheKey, getCachedOrFetch } from "@/lib/cache";
import {
  getVocabularyProgress,
  updateVocabularyProgress,
} from "@/lib/db/miscOperations";
import { logError } from "@/lib/utils/errorLogger";
import type { VocabularyProgress } from "@/lib/types/userData";

// ─── GET /api/user/vocabulary ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  try {
    const vocabulary = await getCachedOrFetch(
      vocabularyCache,
      getCacheKey("vocabulary", userId),
      () => getVocabularyProgress(userId),
    );

    return NextResponse.json({
      success: true,
      data: { vocabulary: vocabulary ?? null },
    });
  } catch (error) {
    logError("[GET /api/user/vocabulary]", error);

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

// ─── PUT /api/user/vocabulary ─────────────────────────────────────────────────

function validateVocabularyPayload(
  body: unknown,
): { valid: true; data: VocabularyProgress } | { valid: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, error: "Request body must be a JSON object" };
  }
  return { valid: true, data: body as VocabularyProgress };
}

export async function PUT(request: NextRequest) {
  // Requirement 8.14 – return 401 if not authenticated
  const session = await auth.api.getSession({ headers: request.headers });
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

  const validation = validateVocabularyPayload(body);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 },
    );
  }

  try {
    const updated = await updateVocabularyProgress(userId, validation.data);

    // Requirement 8.12 – invalidate vocabulary cache after successful update
    vocabularyCache.delete(getCacheKey("vocabulary", userId));

    // Requirement 8.13 – return updated data
    return NextResponse.json(
      { success: true, data: { vocabulary: updated } },
      { status: 200 },
    );
  } catch (error) {
    logError("[PUT /api/user/vocabulary]", error, { userId });

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
