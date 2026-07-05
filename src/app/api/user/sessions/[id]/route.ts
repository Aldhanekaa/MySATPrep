/**
 * PUT /api/user/sessions/[id]
 *
 * Updates an existing practice session (identified by session ID) for the
 * authenticated user. Validates incoming data, merges with the existing
 * session, invalidates the sessions cache, and returns the updated session.
 *
 * Validates: Requirements 8.4, 8.12, 8.13, 8.14
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sessionsCache, getCacheKey } from "@/lib/cache";
import { updatePracticeSession } from "@/lib/db/userOperations";
import { logError } from "@/lib/utils/errorLogger";
import type { PracticeSession } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  // Requirement 8.14 – return 401 if not authenticated
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const { id: sessionId } = await context.params;

  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json(
      { success: false, error: "Session ID is required" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  // Requirement 8.4 – validate body is a non-null object
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { success: false, error: "Request body must be a JSON object" },
      { status: 400 },
    );
  }

  try {
    const updated = await updatePracticeSession(
      sessionId,
      body as Partial<PracticeSession>,
      userId,
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 },
      );
    }

    // Requirement 8.12 – invalidate sessions cache after successful update
    sessionsCache.delete(getCacheKey("sessions", userId));

    // Requirement 8.13 – return updated session data
    return NextResponse.json(
      { success: true, data: { session: updated } },
      { status: 200 },
    );
  } catch (error) {
    logError(`[PUT /api/user/sessions/${sessionId}]`, error, {
      userId,
      sessionId,
    });

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
