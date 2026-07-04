/**
 * GET /api/user/sessions/current
 *
 * Returns the single in-progress session that is flagged as `current_session = TRUE`
 * for the authenticated user. Used by the "Continue Where You Left Off" button to
 * cheaply check whether an active session exists without fetching the full list.
 *
 * Response shapes:
 *   200 { success: true,  data: { session: PracticeSession } }   — current session found
 *   200 { success: true,  data: { session: null } }              — no current session
 *   401 { success: false, error: "Unauthorized" }
 *   503 { success: false, error: "Service temporarily unavailable" }
 *   500 { success: false, error: "Internal server error" }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sessionsCache, getCacheKey, getCachedOrFetch } from "@/lib/cache";
import { getCurrentSession } from "@/lib/db/userOperations";
import { logError } from "@/lib/utils/errorLogger";

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
    // Re-use the same sessions cache so a concurrent full-list fetch stays warm.
    // We key it separately so a current-session miss doesn't evict the full list.
    const currentSession = await getCachedOrFetch(
      sessionsCache,
      getCacheKey("sessions:current", userId),
      () => getCurrentSession(userId),
    );

    return NextResponse.json(
      { success: true, data: { session: currentSession ?? null } },
      { status: 200 },
    );
  } catch (error) {
    logError("[GET /api/user/sessions/current]", error, { userId });

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
