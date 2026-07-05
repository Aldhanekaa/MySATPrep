/**
 * POST /api/user/sync-data
 *
 * Merges localStorage data with existing database data for an authenticated user.
 * Unlike migrate-data (which uses ON CONFLICT DO NOTHING), this endpoint performs
 * a true merge: combines arrays, updates aggregates, and overwrites scalars.
 *
 * Expected payload: merged data that should replace what's in the DB.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateMigrationPayload } from "@/lib/validation/migrationSchema";
import { syncUserData } from "@/lib/db/syncOperations";
import { invalidateUserCache } from "@/lib/cache";
import { logError } from "@/lib/utils/errorLogger";

export async function POST(request: NextRequest) {
  // Verify authentication
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
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
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  // Validate incoming data structure
  const validation = validateMigrationPayload(body);
  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: validation.errors,
      },
      { status: 400 },
    );
  }

  try {
    // Run sync (upserts, not inserts)
    const summary = await syncUserData(userId, validation.data);

    // Bust the LRU cache so the next GET /api/user/data fetches fresh DB rows
    invalidateUserCache(userId);

    return NextResponse.json(
      {
        success: true,
        message: "Data sync completed successfully",
        summary,
      },
      { status: 200 },
    );
  } catch (error) {
    logError("[POST /api/user/sync-data]", error, { userId });

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
      {
        success: false,
        error: "Sync failed. All changes have been rolled back.",
      },
      { status: 500 },
    );
  }
}
