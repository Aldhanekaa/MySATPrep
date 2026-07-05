/**
 * GET /api/user/profile/success-rate
 *
 * Returns the authenticated user's success rate derived directly from
 * user_profiles (questions_answered, correct_answers) — no session
 * scanning required.
 *
 * Response shape:
 *   { success: true, data: { questionsAnswered: number, correctAnswers: number, successRate: number } }
 *
 * successRate is a 0-100 integer (0 when questionsAnswered === 0).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/auth";
import { logError } from "@/lib/utils/errorLogger";

interface ProfileRow {
  questionsAnswered: string;
  correctAnswers: string;
}

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
    const result = await pool.query<ProfileRow>(
      `SELECT
         COALESCE(questions_answered, 0) AS "questionsAnswered",
         COALESCE(correct_answers, 0)    AS "correctAnswers"
       FROM user_profiles
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );

    // No profile row yet — treat as zero activity
    const row = result.rows[0];
    const questionsAnswered = Number(row?.questionsAnswered ?? 0);
    const correctAnswers = Number(row?.correctAnswers ?? 0);
    const successRate =
      questionsAnswered > 0
        ? Math.round((correctAnswers / questionsAnswered) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: { questionsAnswered, correctAnswers, successRate },
    });
  } catch (error) {
    logError("[GET /api/user/profile/success-rate]", error, { userId });

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
