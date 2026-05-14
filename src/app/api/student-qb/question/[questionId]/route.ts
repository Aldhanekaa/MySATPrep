import { unstable_cache } from "next/cache";
import { sql, REVALIDATE_LONG } from "@/lib/db";
import { API_Response_Question } from "@/types/question";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = REVALIDATE_LONG;

type QuestionByExternalRow = {
  externalid: string;
  answeroptions: unknown;
  correct_answer: string[] | null;
  rationale: string;
  stem: string;
  type: string;
  stimulus: string | null;
  ibn: string | null;
};

// `sql` is provided by the shared DB client in `@/lib/db`

const normalizeAnswerOptions = (
  answeroptions: unknown,
): API_Response_Question["answerOptions"] => {
  if (Array.isArray(answeroptions)) {
    const arr = answeroptions as Array<{ content?: unknown }>;
    const [a, b, c, d] = arr.map((item) => item?.content);
    if (
      typeof a === "string" &&
      typeof b === "string" &&
      typeof c === "string" &&
      typeof d === "string"
    ) {
      return { A: a, B: b, C: c, D: d };
    }
    return undefined;
  }

  if (answeroptions && typeof answeroptions === "object") {
    const obj = answeroptions as Record<string, unknown>;
    const a = obj.A ?? obj.a;
    const b = obj.B ?? obj.b;
    const c = obj.C ?? obj.c;
    const d = obj.D ?? obj.d;

    if (
      typeof a === "string" &&
      typeof b === "string" &&
      typeof c === "string" &&
      typeof d === "string"
    ) {
      return { A: a, B: b, C: c, D: d };
    }
  }

  return undefined;
};

const getQuestionByExternalIdCached = unstable_cache(
  async (externalId: string): Promise<API_Response_Question | null> => {
    if (!sql) {
      throw new Error("DATABASE_URL (or NEON_DATABASE_URL) is not configured");
    }

    const rows = (await sql.query(
      `
        SELECT
          externalid,
          answeroptions,
          correct_answer,
          rationale,
          stem,
          type,
          stimulus,
          ibn
        FROM questions_by_external
        WHERE externalid = $1
        LIMIT 1
      `,
      [externalId],
    )) as QuestionByExternalRow[];

    const row = rows[0];
    if (!row) return null;

    return {
      answerOptions: normalizeAnswerOptions(row.answeroptions),
      correct_answer: row.correct_answer,
      rationale: row.rationale,
      stem: row.stem,
      type: row.type === "spr" ? "spr" : "mcq",
      stimulus: row.stimulus,
      externalid: row.externalid,
      ibn: row.ibn,
    };
  },
  ["student-qb-question-by-externalid"],
  {
    revalidate,
    tags: ["student-qb-question", "questions_by_external"],
  },
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const { questionId } = await params;

  if (!questionId) {
    return NextResponse.json(
      {
        success: false,
        error: "Question ID parameter is required",
        details: "Question ID parameter is required",
      },
      { status: 400 },
    );
  }

  if (!sql) {
    return NextResponse.json(
      {
        success: false,
        error: "DATABASE_URL (or NEON_DATABASE_URL) is not configured",
        details: "Database connection is missing",
      },
      { status: 500 },
    );
  }

  try {
    const data = await getQuestionByExternalIdCached(questionId);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Given Question Id Not Found",
          details: "No row found in questions_by_external",
        },
        {
          status: 404,
          headers: {
            "Cache-Control":
              "public, max-age=0, s-maxage=60, stale-while-revalidate=600",
            "CDN-Cache-Control":
              "public, s-maxage=60, stale-while-revalidate=600",
            "Vercel-CDN-Cache-Control":
              "public, s-maxage=60, stale-while-revalidate=600",
          },
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
        message: "Question retrieved successfully",
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          "CDN-Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
          "Vercel-CDN-Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching question from Neon:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch question",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
