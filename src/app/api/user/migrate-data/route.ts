/**
 * POST /api/user/migrate-data
 *
 * Migrates localStorage data to the database for an authenticated user.
 * Validates incoming data structure, runs all inserts in a single transaction,
 * and returns a summary of what was migrated.
 *
 * Validates: Requirements 6.1, 6.2, 6.10, 6.12, 6.13
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateMigrationPayload } from "@/lib/validation/migrationSchema";
import { migrateUserData } from "@/lib/db/migrationOperations";
import { logError } from "@/lib/utils/errorLogger";

export async function POST(request: NextRequest) {
  // Requirement 6.2, 6.12 – verify authentication
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

  // Requirement 6.3, 6.13 – validate incoming data structure
  const validation = validateMigrationPayload(body);
  console.log("validation", validation, body);
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
    // Requirement 6.4–6.9, 6.11 – run transactional migration
    const summary = await migrateUserData(userId, validation.data);

    // Requirement 6.10 – return summary with counts and boolean flags
    return NextResponse.json(
      {
        success: true,
        message: "Data migration completed successfully",
        summary,
      },
      { status: 200 },
    );
  } catch (error) {
    logError("[POST /api/user/migrate-data]", error, { userId });

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
        error: "Migration failed. All changes have been rolled back.",
      },
      { status: 500 },
    );
  }
}
