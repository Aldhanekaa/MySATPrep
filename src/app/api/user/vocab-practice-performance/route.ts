/**
 * GET /api/user/vocab-practice-performance
 * PUT /api/user/vocab-practice-performance
 *
 * GET — fetches vocabulary quiz practice performance for the authenticated user.
 * PUT — updates vocabulary quiz practice performance.
 *
 * Performance data includes per-word mastery levels, attempt history, accuracy
 * statistics, and overall quiz metrics (PracticePerformanceData type).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  vocabPracticePerformanceCache,
  getCacheKey,
  getCachedOrFetch,
} from "@/lib/cache";
import {
  getVocabPracticePerformance,
  updateVocabPracticePerformance,
} from "@/lib/db/miscOperations";
import { logError } from "@/lib/utils/errorLogger";
import type { PracticePerformanceData } from "@/types/vocabulary";

// ─── GET /api/user/vocab-practice-performance ─────────────────────────────────

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
    const performance = await getCachedOrFetch(
      vocabPracticePerformanceCache,
      getCacheKey("vocabPracticePerformance", userId),
      () => getVocabPracticePerformance(userId),
    );

    return NextResponse.json({
      success: true,
      data: { performance: performance ?? null },
    });
  } catch (error) {
    logError("[GET /api/user/vocab-practice-performance]", error);

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

// ─── PUT /api/user/vocab-practice-performance ─────────────────────────────────

function validatePayload(
  body: unknown,
):
  | { valid: true; data: PracticePerformanceData }
  | { valid: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  // Validate required top-level fields
  if (!Array.isArray(b.attempts)) {
    return { valid: false, error: "attempts must be an array" };
  }
  if (typeof b.wordPerformance !== "object" || b.wordPerformance === null) {
    return { valid: false, error: "wordPerformance must be an object" };
  }

  return { valid: true, data: body as PracticePerformanceData };
}

export async function PUT(request: NextRequest) {
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

  const validation = validatePayload(body);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 },
    );
  }

  try {
    const updated = await updateVocabPracticePerformance(
      userId,
      validation.data,
    );

    // Invalidate cache after successful update
    vocabPracticePerformanceCache.delete(
      getCacheKey("vocabPracticePerformance", userId),
    );

    return NextResponse.json(
      { success: true, data: { performance: updated } },
      { status: 200 },
    );
  } catch (error) {
    logError("[PUT /api/user/vocab-practice-performance]", error, { userId });

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
