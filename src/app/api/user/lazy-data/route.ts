/**
 * GET /api/user/lazy-data
 *
 * Fetches the four "lazy" user data categories that are intentionally excluded
 * from /api/user/data for performance reasons: sessions, bookmarks, collections,
 * and vocabulary.
 *
 * Used by syncLocalStorageData when those fields haven't been loaded into Redux
 * yet, so the merge has accurate DB values to work against.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/utils/errorLogger";
import {
  sessionsCache,
  bookmarksCache,
  collectionsCache,
  vocabularyCache,
  getCacheKey,
  getCachedOrFetch,
} from "@/lib/cache";
import { getPracticeSessions } from "@/lib/db/userOperations";
import { getSavedQuestions } from "@/lib/db/bookmarkOperations";
import { getSavedCollections } from "@/lib/db/collectionOperations";
import { getVocabularyProgress } from "@/lib/db/miscOperations";

/** Wraps a promise so it never rejects — returns [value, null] or [null, error]. */
async function safe<T>(
  label: string,
  promise: Promise<T>,
): Promise<[T, null] | [null, Error]> {
  try {
    return [await promise, null];
  } catch (err) {
    logError(`[GET /api/user/lazy-data] failed to fetch ${label}`, err);
    return [null, err instanceof Error ? err : new Error(String(err))];
  }
}

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
    const [
      [sessions, sessionsErr],
      [bookmarks, bookmarksErr],
      [collections, collectionsErr],
      [vocabulary, vocabularyErr],
    ] = await Promise.all([
      safe(
        "sessions",
        getCachedOrFetch(sessionsCache, getCacheKey("sessions", userId), () =>
          getPracticeSessions(userId),
        ),
      ),
      safe(
        "bookmarks",
        getCachedOrFetch(bookmarksCache, getCacheKey("bookmarks", userId), () =>
          getSavedQuestions(userId),
        ),
      ),
      safe(
        "collections",
        getCachedOrFetch(
          collectionsCache,
          getCacheKey("collections", userId),
          () => getSavedCollections(userId),
        ),
      ),
      safe(
        "vocabulary",
        getCachedOrFetch(
          vocabularyCache,
          getCacheKey("vocabulary", userId),
          () => getVocabularyProgress(userId),
        ),
      ),
    ]);

    const fieldErrors: Record<string, string> = {};
    if (sessionsErr) fieldErrors.sessions = sessionsErr.message;
    if (bookmarksErr) fieldErrors.bookmarks = bookmarksErr.message;
    if (collectionsErr) fieldErrors.collections = collectionsErr.message;
    if (vocabularyErr) fieldErrors.vocabulary = vocabularyErr.message;

    return NextResponse.json({
      success: true,
      ...(Object.keys(fieldErrors).length > 0 && { fieldErrors }),
      data: {
        sessions: sessions ?? [],
        bookmarks: bookmarks ?? [],
        collections: collections ?? [],
        vocabulary: vocabulary ?? null,
      },
    });
  } catch (error) {
    logError("[GET /api/user/lazy-data]", error);

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
