/**
 * GET  /api/user/sessions
 * POST /api/user/sessions
 *
 * GET  — fetches practice sessions for the authenticated user.
 *        Called lazily when the user visits /dashboard/sessions.
 * POST — creates a new practice session.
 *
 * Validates: Requirements 8.3, 8.12, 8.13, 8.14
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sessionsCache, getCacheKey, getCachedOrFetch } from "@/lib/cache";
import {
  getPracticeSessions,
  createPracticeSession,
} from "@/lib/db/userOperations";
import { isValidPracticeSession } from "@/types/session";
import { logError } from "@/lib/utils/errorLogger";
import type { PracticeSession } from "@/types";

// ─── GET /api/user/sessions ───────────────────────────────────────────────────

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
    const sessions = await getCachedOrFetch(
      sessionsCache,
      getCacheKey("sessions", userId),
      () => getPracticeSessions(userId),
    );

    return NextResponse.json({
      success: true,
      data: { sessions: sessions ?? [] },
    });
  } catch (error) {
    logError("[GET /api/user/sessions]", error);

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

// ─── POST /api/user/sessions ──────────────────────────────────────────────────

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  // Requirement 8.3 – validate incoming session data
  if (!isValidPracticeSession(body)) {
    return NextResponse.json(
      { success: false, error: "Invalid session data" },
      { status: 400 },
    );
  }

  try {
    const created = await createPracticeSession(
      userId,
      body as PracticeSession,
    );

    // Requirement 8.12 – invalidate sessions cache after successful create
    sessionsCache.delete(getCacheKey("sessions", userId));

    // Requirement 8.13 – return created session data
    return NextResponse.json(
      { success: true, data: { session: created } },
      { status: 201 },
    );
  } catch (error) {
    logError("[POST /api/user/sessions]", error, { userId });

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
