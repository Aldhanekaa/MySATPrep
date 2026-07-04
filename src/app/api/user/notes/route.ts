/**
 * GET /api/user/notes
 * PUT /api/user/notes
 *
 * Manages question notes for authenticated users with cache-first reads
 * and cache invalidation on writes.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 10.1, 10.5, 12.4, 12.5
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { notesCache, getCacheKey, getCachedOrFetch } from "@/lib/cache";
import { getQuestionNotes, updateQuestionNotes } from "@/lib/db/miscOperations";
import { logError } from "@/lib/utils/errorLogger";
import type { QuestionNotes, QuestionNote } from "@/types/questionNotes";

/**
 * Validate the request body structure for question notes.
 * Returns { valid: false, error, details[] } on validation failure.
 */
function validateQuestionNotesPayload(body: unknown):
  | {
      valid: true;
      data: QuestionNotes;
    }
  | {
      valid: false;
      error: string;
      details: string[];
    } {
  const details: string[] = [];

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      valid: false,
      error: "Request body must be a JSON object",
      details: [
        "Body must be an object mapping assessment names to note arrays",
      ],
    };
  }

  const payload = body as Record<string, unknown>;

  // Validate that each key is a string and each value is an array of notes
  for (const [assessment, notes] of Object.entries(payload)) {
    if (typeof assessment !== "string") {
      details.push(`Assessment key must be a string, got ${typeof assessment}`);
      continue;
    }

    if (!Array.isArray(notes)) {
      details.push(
        `Assessment "${assessment}" must map to an array of notes, got ${typeof notes}`,
      );
      continue;
    }

    // Validate each note in the array
    notes.forEach((note, index) => {
      if (typeof note !== "object" || note === null || Array.isArray(note)) {
        details.push(
          `Assessment "${assessment}", note ${index}: must be an object, got ${typeof note}`,
        );
        return;
      }

      const n = note as Partial<QuestionNote>;

      // Required fields
      if (typeof n.questionId !== "string" || !n.questionId.trim()) {
        details.push(
          `Assessment "${assessment}", note ${index}: questionId must be a non-empty string`,
        );
      }
      if (typeof n.note !== "string") {
        details.push(
          `Assessment "${assessment}", note ${index}: note must be a string`,
        );
      }
      if (typeof n.timestamp !== "string" || !n.timestamp.trim()) {
        details.push(
          `Assessment "${assessment}", note ${index}: timestamp must be a non-empty string`,
        );
      }
      if (typeof n.createdAt !== "string" || !n.createdAt.trim()) {
        details.push(
          `Assessment "${assessment}", note ${index}: createdAt must be a non-empty string`,
        );
      }

      // Optional fields validation (if present, must be correct type)
      if (
        n.difficulty !== undefined &&
        n.difficulty !== null &&
        typeof n.difficulty !== "string"
      ) {
        details.push(
          `Assessment "${assessment}", note ${index}: difficulty must be a string or null`,
        );
      }
      if (
        n.primaryClassCd !== undefined &&
        n.primaryClassCd !== null &&
        typeof n.primaryClassCd !== "string"
      ) {
        details.push(
          `Assessment "${assessment}", note ${index}: primaryClassCd must be a string or null`,
        );
      }
      if (
        n.skillCd !== undefined &&
        n.skillCd !== null &&
        typeof n.skillCd !== "string"
      ) {
        details.push(
          `Assessment "${assessment}", note ${index}: skillCd must be a string or null`,
        );
      }
      if (
        n.subject !== undefined &&
        n.subject !== null &&
        typeof n.subject !== "string"
      ) {
        details.push(
          `Assessment "${assessment}", note ${index}: subject must be a string or null`,
        );
      }
      if (
        n.createdDate !== undefined &&
        n.createdDate !== null &&
        typeof n.createdDate !== "number"
      ) {
        details.push(
          `Assessment "${assessment}", note ${index}: createdDate must be a number or null`,
        );
      }
      if (
        n.updatedDate !== undefined &&
        n.updatedDate !== null &&
        typeof n.updatedDate !== "number"
      ) {
        details.push(
          `Assessment "${assessment}", note ${index}: updatedDate must be a number or null`,
        );
      }
    });
  }

  if (details.length > 0) {
    return {
      valid: false,
      error: "Validation failed for one or more note fields",
      details,
    };
  }

  return {
    valid: true,
    data: payload as QuestionNotes,
  };
}

/**
 * GET /api/user/notes
 *
 * Returns question notes for the authenticated user, reading from cache first.
 * Validates: Requirements 1.7, 1.8, 1.9
 */
export async function GET(request: NextRequest) {
  // Requirement 1.8 – return 401 if not authenticated
  const session = await getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  try {
    // Requirement 1.7 – read from cache before DB
    const notes = await getCachedOrFetch(
      notesCache,
      getCacheKey("notes", userId),
      () => getQuestionNotes(userId),
    );

    // Requirement 1.9 – return empty object if user has no notes
    return NextResponse.json(
      { success: true, data: notes ?? {} },
      { status: 200 },
    );
  } catch (error) {
    logError("[GET /api/user/notes]", error, { userId });

    // Requirement 1.6 – return 503 on DB errors
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

/**
 * PUT /api/user/notes
 *
 * Updates question notes for the authenticated user with payload validation,
 * cache invalidation, and standardized responses.
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 10.1, 12.4, 12.5
 */
export async function PUT(request: NextRequest) {
  // Requirement 1.2 – verify session
  const session = await getSession({ headers: request.headers });
  if (!session?.user?.id) {
    // Requirement 1.3 – return 401 if session invalid
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
    // Requirement 12.4 – return 400 with details on validation failure
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON in request body",
        details: ["Request body must be valid JSON"],
      },
      { status: 400 },
    );
  }

  // Requirement 12.4 – validate payload shape
  const validation = validateQuestionNotesPayload(body);
  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: validation.error,
        details: validation.details,
      },
      { status: 400 },
    );
  }

  try {
    // Requirement 1.1 – upsert notes
    const updatedNotes = await updateQuestionNotes(userId, validation.data);

    // Requirement 1.4 & 10.1 – invalidate cache BEFORE returning response
    notesCache.delete(getCacheKey("notes", userId));

    // Requirement 1.5 – return standardized success response with data
    return NextResponse.json(
      { success: true, data: updatedNotes },
      { status: 200 },
    );
  } catch (error) {
    logError("[PUT /api/user/notes]", error, { userId });

    // Requirement 12.5 – return 503 on DB errors
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
