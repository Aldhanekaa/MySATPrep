/**
 * GET /api/user/answer-history
 * PUT /api/user/answer-history
 *
 * GET — fetches answer history for the authenticated user.
 *       Called lazily when the user visits /dashboard/tracker or /dashboard/answered.
 * PUT — updates answer history.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/utils/errorLogger";
import { answerHistoryCache, getCacheKey, getCachedOrFetch } from "@/lib/cache";
import {
  getAnswerHistory,
  updateAnswerHistory,
  type AnswerHistory,
} from "@/lib/db/miscOperations";

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
    const answerHistory = await getCachedOrFetch(
      answerHistoryCache,
      getCacheKey("answerHistory", userId),
      () => getAnswerHistory(userId),
    );

    return NextResponse.json({
      success: true,
      data: { answerHistory: answerHistory ?? null },
    });
  } catch (error) {
    logError("[GET /api/user/answer-history]", error);

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

export async function PUT(request: NextRequest) {
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

  try {
    const answerHistoryData = body as AnswerHistory;

    const updated = await updateAnswerHistory(userId, answerHistoryData);

    // Bust the cache so the next GET reflects the new value
    answerHistoryCache.delete(getCacheKey("answerHistory", userId));

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logError("[PUT /api/user/answer-history]", error);

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
