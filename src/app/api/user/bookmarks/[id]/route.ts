/**
 * DELETE /api/user/bookmarks/[id]
 *
 * Removes a saved question (bookmark) for the authenticated user by question ID.
 * Verifies authentication, deletes the record, invalidates the bookmarks cache,
 * and returns a success confirmation.
 *
 * Validates: Requirements 8.6, 8.12, 8.13, 8.14
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { bookmarksCache, getCacheKey } from "@/lib/cache";
import { removeSavedQuestion } from "@/lib/db/bookmarkOperations";
import { logError } from "@/lib/utils/errorLogger";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  // Requirement 8.14 – return 401 if not authenticated
  const session = await getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const { id: questionId } = await context.params;

  if (!questionId || typeof questionId !== "string") {
    return NextResponse.json(
      { success: false, error: "Question ID is required" },
      { status: 400 },
    );
  }

  try {
    // Requirement 8.6 – remove the saved question
    const deleted = await removeSavedQuestion(userId, questionId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Bookmark not found" },
        { status: 404 },
      );
    }

    // Requirement 8.12 – invalidate bookmarks cache after successful removal
    bookmarksCache.delete(getCacheKey("bookmarks", userId));

    // Requirement 8.13 – return confirmation of deletion
    return NextResponse.json(
      { success: true, data: { deletedQuestionId: questionId } },
      { status: 200 },
    );
  } catch (error) {
    logError(`[DELETE /api/user/bookmarks/${questionId}]`, error, {
      userId,
      questionId,
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
