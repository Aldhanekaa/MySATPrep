/**
 * GET /api/user/data
 *
 * Fetches all user data for the authenticated user across all seven categories:
 * profile, statistics, sessions, bookmarks, collections, vocabulary, preferences.
 *
 * Uses the cache layer (LRU) before hitting the database. Returns empty structures
 * for new users who have no data yet.
 *
 * Validates: Requirements 7.1, 7.2, 7.10, 7.11, 7.12, 18.7
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/utils/errorLogger";
import {
  userProfileCache,
  statisticsCache,
  sessionsCache,
  bookmarksCache,
  collectionsCache,
  vocabularyCache,
  preferencesCache,
  notesCache,
  answerHistoryCache,
  getCacheKey,
  getCachedOrFetch,
} from "@/lib/cache";
import {
  getUserProfile,
  getPracticeStatistics,
  getPracticeSessions,
} from "@/lib/db/userOperations";
import { getSavedQuestions } from "@/lib/db/bookmarkOperations";
import { getSavedCollections } from "@/lib/db/collectionOperations";
import {
  getVocabularyProgress,
  getUserPreferences,
  getQuestionNotes,
  getAnswerHistory,
} from "@/lib/db/miscOperations";
import type { PracticeStatistics } from "@/types";

const ASSESSMENTS = ["SAT", "PSAT/NMSQT", "PSAT"] as const;

/** Wraps a promise so it never rejects — returns [value, null] or [null, error]. */
async function safe<T>(
  label: string,
  promise: Promise<T>,
): Promise<[T, null] | [null, Error]> {
  try {
    return [await promise, null];
  } catch (err) {
    logError(`[GET /api/user/data] failed to fetch ${label}`, err);
    return [null, err instanceof Error ? err : new Error(String(err))];
  }
}

export async function GET(request: NextRequest) {
  // Verify authentication
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  try {
    // Fetch all nine data categories in parallel, isolating failures per-item
    const [
      [profile, profileErr],
      statisticsResults,
      [sessions, sessionsErr],
      [bookmarks, bookmarksErr],
      [collections, collectionsErr],
      [vocabulary, vocabularyErr],
      [preferences, preferencesErr],
      [questionNotes, questionNotesErr],
      // [answerHistory, answerHistoryErr],
    ] = await Promise.all([
      // Profile
      safe(
        "profile",
        getCachedOrFetch(
          userProfileCache,
          getCacheKey("userProfile", userId),
          () => getUserProfile(userId),
        ),
      ),

      // Statistics — fetch all assessment types and merge
      Promise.all(
        ASSESSMENTS.map((assessment) =>
          safe(
            `statistics:${assessment}`,
            getCachedOrFetch(
              statisticsCache,
              getCacheKey("statistics", userId, assessment),
              () => getPracticeStatistics(userId, assessment),
            ),
          ),
        ),
      ),

      // Sessions
      safe(
        "sessions",
        getCachedOrFetch(sessionsCache, getCacheKey("sessions", userId), () =>
          getPracticeSessions(userId),
        ),
      ),

      // Bookmarks
      safe(
        "bookmarks",
        getCachedOrFetch(bookmarksCache, getCacheKey("bookmarks", userId), () =>
          getSavedQuestions(userId),
        ),
      ),

      // Collections
      safe(
        "collections",
        getCachedOrFetch(
          collectionsCache,
          getCacheKey("collections", userId),
          () => getSavedCollections(userId),
        ),
      ),

      // Vocabulary progress
      safe(
        "vocabulary",
        getCachedOrFetch(
          vocabularyCache,
          getCacheKey("vocabulary", userId),
          () => getVocabularyProgress(userId),
        ),
      ),

      // User preferences
      safe(
        "preferences",
        getCachedOrFetch(
          preferencesCache,
          getCacheKey("preferences", userId),
          () => getUserPreferences(userId),
        ),
      ),

      // Question notes
      safe(
        "notes",
        getCachedOrFetch(notesCache, getCacheKey("notes", userId), () =>
          getQuestionNotes(userId),
        ),
      ),

      // Answer history
      // safe(
      //   "answerHistory",
      //   getCachedOrFetch(
      //     answerHistoryCache,
      //     getCacheKey("answerHistory", userId),
      //     () => getAnswerHistory(userId),
      //   ),
      // ),
    ]);

    // Log any per-field errors without failing the whole response
    const fieldErrors: Record<string, string> = {};
    if (profileErr) fieldErrors.profile = profileErr.message;
    if (sessionsErr) fieldErrors.sessions = sessionsErr.message;
    if (bookmarksErr) fieldErrors.bookmarks = bookmarksErr.message;
    if (collectionsErr) fieldErrors.collections = collectionsErr.message;
    if (vocabularyErr) fieldErrors.vocabulary = vocabularyErr.message;
    if (preferencesErr) fieldErrors.preferences = preferencesErr.message;
    if (questionNotesErr) fieldErrors.questionNotes = questionNotesErr.message;
    // if (answerHistoryErr) fieldErrors.answerHistory = answerHistoryErr.message;

    // Merge per-assessment statistics into a single object
    const mergedStatistics: PracticeStatistics = statisticsResults.reduce(
      (acc, [stat]) => (stat ? { ...acc, ...stat } : acc),
      {} as PracticeStatistics,
    );

    const statsErrors = statisticsResults
      .map(([, err], i) => (err ? `${ASSESSMENTS[i]}: ${err.message}` : null))
      .filter(Boolean);
    if (statsErrors.length > 0) fieldErrors.statistics = statsErrors.join("; ");

    return NextResponse.json({
      success: true,
      ...(Object.keys(fieldErrors).length > 0 && { fieldErrors }),
      data: {
        profile: profile ?? null,
        statistics: mergedStatistics,
        sessions: sessions ?? [],
        bookmarks: bookmarks ?? [],
        collections: collections ?? [],
        vocabulary: vocabulary ?? null,
        preferences: preferences ?? null,
        questionNotes: questionNotes ?? null,
        // answerHistory: answerHistory ?? null,
      },
    });
  } catch (error) {
    logError("[GET /api/user/data]", error);

    // Distinguish connection/availability errors from other failures
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
