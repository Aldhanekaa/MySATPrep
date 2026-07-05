/**
 * GET /api/user/sessions/time-spent
 *
 * Returns the total time spent across all of the authenticated user's
 * practice sessions, derived from `totalTimeSpent` stored in each
 * session's JSONB blob. The aggregation is done in Postgres to avoid
 * pulling every session row into memory.
 *
 * Response shape:
 *   { success: true, data: { totalTimeSpentMs: number } }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/auth";
import { logError } from "@/lib/utils/errorLogger";

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
    // Cast the JSONB field to numeric so Postgres can SUM it.
    // COALESCE handles rows where totalTimeSpent is null or missing from the blob.
    const result = await pool.query<{ totalTimeSpentMs: string }>(
      `SELECT COALESCE(
         SUM((session_data->>'totalTimeSpent')::numeric),
         0
       ) AS "totalTimeSpentMs"
       FROM practice_sessions
       WHERE user_id = $1`,
      [userId],
    );

    const totalTimeSpentMs = Number(result.rows[0]?.totalTimeSpentMs ?? 0);

    return NextResponse.json({
      success: true,
      data: { totalTimeSpentMs },
    });
  } catch (error) {
    logError("[GET /api/user/sessions/time-spent]", error, { userId });

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
