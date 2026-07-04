/**
 * GET  /api/user/bookmarks
 * POST /api/user/bookmarks
 *
 * GET  — fetches all saved questions + collections for the authenticated user.
 *        Called lazily when the user visits /dashboard/bookmarks.
 * POST — adds a new bookmark (saved question).
 *
 * Validates: Requirements 8.5, 8.12, 8.13, 8.14
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { logError } from "@/lib/utils/errorLogger";
import {
  bookmarksCache,
  collectionsCache,
  getCacheKey,
  getCachedOrFetch,
} from "@/lib/cache";
import {
  getSavedQuestions,
  addSavedQuestion,
} from "@/lib/db/bookmarkOperations";
import { getSavedCollections } from "@/lib/db/collectionOperations";
import type { SavedQuestion } from "@/lib/types/userData";

// ─── GET /api/user/bookmarks ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  try {
    const [bookmarks, collections] = await Promise.all([
      getCachedOrFetch(bookmarksCache, getCacheKey("bookmarks", userId), () =>
        getSavedQuestions(userId),
      ),
      getCachedOrFetch(
        collectionsCache,
        getCacheKey("collections", userId),
        () => getSavedCollections(userId),
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        bookmarks: bookmarks ?? [],
        collections: collections ?? [],
      },
    });
  } catch (error) {
    logError("[GET /api/user/bookmarks]", error);

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

// ─── POST /api/user/bookmarks ────────────────────────────────────────────────

// Fields accepted in the request body
interface BookmarkPayload {
  assessment?: unknown;
  questionId?: unknown;
  externalId?: unknown;
  ibn?: unknown;
  plainQuestion?: unknown;
}

/**
 * Validate and coerce the request body into a safe bookmark payload.
 * Returns { valid: false, error } on validation failure.
 */
function validateBookmarkPayload(body: unknown):
  | {
      valid: true;
      data: Omit<SavedQuestion, "id" | "userId">;
    }
  | {
      valid: false;
      error: string;
    } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const payload = body as BookmarkPayload;

  // assessment – required string
  if (typeof payload.assessment !== "string" || !payload.assessment.trim()) {
    return { valid: false, error: "assessment must be a non-empty string" };
  }

  // questionId – required string
  if (typeof payload.questionId !== "string" || !payload.questionId.trim()) {
    return { valid: false, error: "questionId must be a non-empty string" };
  }

  // externalId – optional string or null
  if (
    payload.externalId !== undefined &&
    payload.externalId !== null &&
    typeof payload.externalId !== "string"
  ) {
    return { valid: false, error: "externalId must be a string or null" };
  }

  // ibn – optional string or null
  if (
    payload.ibn !== undefined &&
    payload.ibn !== null &&
    typeof payload.ibn !== "string"
  ) {
    return { valid: false, error: "ibn must be a string or null" };
  }

  // plainQuestion – optional object or null (kept as-is; DB stores as JSONB)
  if (
    payload.plainQuestion !== undefined &&
    payload.plainQuestion !== null &&
    (typeof payload.plainQuestion !== "object" ||
      Array.isArray(payload.plainQuestion))
  ) {
    return { valid: false, error: "plainQuestion must be an object or null" };
  }

  return {
    valid: true,
    data: {
      assessment: payload.assessment,
      questionId: payload.questionId,
      externalId:
        payload.externalId !== undefined
          ? (payload.externalId as string | null)
          : null,
      ibn: payload.ibn !== undefined ? (payload.ibn as string | null) : null,
      plainQuestion:
        payload.plainQuestion !== undefined
          ? (payload.plainQuestion as SavedQuestion["plainQuestion"])
          : null,
      timestamp: new Date().toISOString(),
    },
  };
}

export async function POST(request: NextRequest) {
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

  // Requirement 8.5 – validate incoming bookmark data
  const validation = validateBookmarkPayload(body);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 },
    );
  }

  try {
    // Insert or upsert the saved question
    const bookmark = await addSavedQuestion(userId, validation.data);

    // Requirement 8.12 – invalidate bookmarks cache after successful add
    bookmarksCache.delete(getCacheKey("bookmarks", userId));

    // Requirement 8.13 – return updated bookmark data
    return NextResponse.json(
      { success: true, data: { bookmark } },
      { status: 201 },
    );
  } catch (error) {
    logError("[POST /api/user/bookmarks]", error, { userId });

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
