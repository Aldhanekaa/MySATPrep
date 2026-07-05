/**
 * DELETE /api/user/account
 *
 * Permanently deletes the authenticated user's account and ALL related data.
 *
 * Deletion order (avoids FK constraint violations):
 *  1. Application data rows that reference "user"(id) via FK
 *     — All have ON DELETE CASCADE, but we delete explicitly for clarity
 *       and to invalidate the server-side cache before the user row is gone.
 *  2. Better-auth managed rows: session, verification (also CASCADE, handled
 *     automatically when the user row is deleted)
 *  3. The "user" row itself — cascades the rest automatically.
 *
 * After deletion the client should:
 *  - Clear any local auth cookies / session storage
 *  - Redirect to the home page
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, directPool } from "@/lib/auth";
import { invalidateUserCache } from "@/lib/cache";
import { logError } from "@/lib/utils/errorLogger";

export async function DELETE(request: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  const client = await directPool.connect();
  try {
    await client.query("BEGIN");

    // ── Delete all app-level data ──────────────────────────────────────────────
    // These all have ON DELETE CASCADE on user_id → "user"(id), but we delete
    // them explicitly before removing the user row so the cache is cleared
    // while the userId is still valid.
    const appTables = [
      "user_profiles",
      "practice_statistics",
      "practice_sessions",
      "saved_questions",
      "saved_collections",
      "vocabulary_progress",
      "vocab_practice_performance",
      "user_preferences",
      "question_notes",
      "answer_history",
    ];

    for (const table of appTables) {
      await client.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
    }

    // ── Delete better-auth session rows for this user ─────────────────────────
    // The "session" table has userId FK with ON DELETE CASCADE, but deleting
    // explicitly ensures all active sessions are invalidated immediately.
    await client.query(`DELETE FROM "session" WHERE "userId" = $1`, [userId]);

    // ── Delete the user row (cascades verification rows if any remain) ─────────
    await client.query(`DELETE FROM "user" WHERE id = $1`, [userId]);

    await client.query("COMMIT");

    // Purge server-side LRU caches for this user
    invalidateUserCache(userId);

    return NextResponse.json(
      { success: true, message: "Account and all associated data deleted." },
      { status: 200 },
    );
  } catch (error) {
    await client.query("ROLLBACK");
    logError("[DELETE /api/user/account]", error, { userId });

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
  } finally {
    client.release();
  }
}
