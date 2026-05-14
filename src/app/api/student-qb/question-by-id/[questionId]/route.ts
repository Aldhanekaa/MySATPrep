import { unstable_cache } from "next/cache";
import { sql, REVALIDATE_LONG } from "@/lib/db";
import { SkillCd_Variants } from "@/types/lookup";
import {
  API_Response_Question,
  PlainQuestionType,
  QuestionById_Data,
} from "@/types/question";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = REVALIDATE_LONG;

type DbQuestionRow = {
  questionid: string;
  updatedate: number | null;
  ppcc: string | null;
  skill_cd: string;
  score_band_range_cd: number;
  uid: string;
  skill_desc: string;
  createdate: number | null;
  program: string;
  primary_class_cd_desc: string;
  ibn: string | null;
  external_id: string | null;
  primary_class_cd: string;
  difficulty: string;
};

type DbQuestionByExternalRow = {
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

const toPlainQuestion = (row: DbQuestionRow): PlainQuestionType => ({
  questionId: row.questionid,
  updateDate: row.updatedate ?? 0,
  pPcc: row.ppcc ?? "",
  skill_cd: row.skill_cd as SkillCd_Variants,
  score_band_range_cd: row.score_band_range_cd,
  uId: row.uid,
  skill_desc: row.skill_desc,
  createDate: row.createdate ?? 0,
  program: row.program,
  primary_class_cd_desc: row.primary_class_cd_desc,
  ibn: row.ibn,
  external_id: row.external_id,
  primary_class_cd:
    row.primary_class_cd as PlainQuestionType["primary_class_cd"],
  difficulty: row.difficulty as PlainQuestionType["difficulty"],
});

const getQuestionByIdCached = unstable_cache(
  async (questionId: string): Promise<DbQuestionRow | null> => {
    if (!sql) {
      throw new Error("DATABASE_URL (or NEON_DATABASE_URL) is not configured");
    }

    const rows = (await sql.query(
      `
        SELECT
          questionid,
          updatedate,
          ppcc,
          skill_cd,
          score_band_range_cd,
          uid,
          skill_desc,
          createdate,
          program,
          primary_class_cd_desc,
          ibn,
          external_id,
          primary_class_cd,
          difficulty
        FROM questions
        WHERE questionid = $1
        LIMIT 1
      `,
      [questionId],
    )) as DbQuestionRow[];

    return rows[0] ?? null;
  },
  ["student-qb-question-row-by-id"],
  {
    revalidate,
    tags: ["student-qb-question", "questions"],
  },
);

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
    )) as DbQuestionByExternalRow[];

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
  ["student-qb-problem-row-by-externalid"],
  {
    revalidate,
    tags: ["student-qb-question", "questions_by_external"],
  },
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
): Promise<NextResponse> {
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
    const questionRow = await getQuestionByIdCached(questionId);

    if (!questionRow) {
      return NextResponse.json(
        {
          success: false,
          error: "Given Question Id Not Found",
          details: "No row found in questions",
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

    if (!questionRow.external_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Question external_id is missing",
          details: "The matching question row does not have external_id",
        },
        { status: 404 },
      );
    }

    const problem = await getQuestionByExternalIdCached(
      questionRow.external_id,
    );

    if (!problem) {
      return NextResponse.json(
        {
          success: false,
          error: "Given Question Id Not Found",
          details: "No row found in questions_by_external for external_id",
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

    const data: QuestionById_Data = {
      question: toPlainQuestion(questionRow),
      problem,
    };

    return NextResponse.json(
      {
        success: true,
        data,
        message: "Question bank stats fetched successfully",
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
    console.error("Error fetching question by id from Neon:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch question bank stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
