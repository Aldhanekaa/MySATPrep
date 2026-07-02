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
} from "@/lib/db/miscOperations";
import type { PracticeStatistics } from "@/types";

const ASSESSMENTS = ["SAT", "PSAT/NMSQT", "PSAT"] as const;

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
    // Fetch all seven data categories in parallel, using the cache layer
    const [
      profile,
      statisticsResults,
      sessions,
      bookmarks,
      collections,
      vocabulary,
      preferences,
    ] = await Promise.all([
      // Profile
      getCachedOrFetch(
        userProfileCache,
        getCacheKey("userProfile", userId),
        () => getUserProfile(userId),
      ),

      // Statistics — fetch all assessment types and merge
      Promise.all(
        ASSESSMENTS.map((assessment) =>
          getCachedOrFetch(
            statisticsCache,
            getCacheKey("statistics", userId, assessment),
            () => getPracticeStatistics(userId, assessment),
          ),
        ),
      ),

      // Sessions
      getCachedOrFetch(sessionsCache, getCacheKey("sessions", userId), () =>
        getPracticeSessions(userId),
      ),

      // Bookmarks
      getCachedOrFetch(bookmarksCache, getCacheKey("bookmarks", userId), () =>
        getSavedQuestions(userId),
      ),

      // Collections
      getCachedOrFetch(
        collectionsCache,
        getCacheKey("collections", userId),
        () => getSavedCollections(userId),
      ),

      // Vocabulary progress (no dedicated cache bucket — use a small inline key)
      getVocabularyProgress(userId),

      // User preferences
      getUserPreferences(userId),
    ]);

    // Merge per-assessment statistics into a single object
    const mergedStatistics: PracticeStatistics = statisticsResults.reduce(
      (acc, stat) => (stat ? { ...acc, ...stat } : acc),
      {} as PracticeStatistics,
    );

    return NextResponse.json({
      success: true,
      data: {
        profile: profile ?? null,
        statistics: mergedStatistics,
        sessions: sessions ?? [],
        bookmarks: bookmarks ?? [],
        collections: collections ?? [],
        vocabulary: vocabulary ?? null,
        preferences: preferences ?? null,
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
