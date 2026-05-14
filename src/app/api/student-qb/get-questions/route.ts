import { unstable_cache } from "next/cache";
import { sql, REVALIDATE_MEDIUM } from "@/lib/db";
import { Assessments } from "@/static-data/assessment";
import { DomainItemsArray, SkillCd_Variants } from "@/types/lookup";
import {
  API_Response_Question_List,
  PlainQuestionType,
} from "@/types/question";
import { NextRequest, NextResponse } from "next/server";
import { skillCds as Skills } from "@/static-data/domains";
import { AsmEventId_to_Program } from "../asmEventId";

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

const parseCsvParam = (value: string | null): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainsParam = searchParams.get("domains");
  const assessment = searchParams.get("assessment");
  const excludeQuestionIdsParam = searchParams.get("excludeIds");
  const difficultiesParam = searchParams.get("difficulties");
  const skillCdsParam = searchParams.get("skills");
  const random = searchParams.get("random");

  const uniqueIds = parseCsvParam(searchParams.get("uniqueIds")); // external_id or ibn
  const skillCds = parseCsvParam(skillCdsParam);

  if (
    skillCds.length > 0 &&
    !skillCds.every((cd) => Skills.includes(cd as SkillCd_Variants))
  ) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid skill codes provided: ${skillCds.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const difficulties = parseCsvParam(difficultiesParam);

  if (
    difficulties.length > 0 &&
    !difficulties.every((d) => ["E", "M", "H"].includes(d))
  ) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid difficulties provided: ${difficulties.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const excludeQuestionIds = parseCsvParam(excludeQuestionIdsParam);

  let asmtEventId = 99;

  if (assessment !== null && assessment !== "" && assessment in Assessments) {
    asmtEventId = Assessments[assessment as keyof typeof Assessments].id;
  }

  let Program =
    AsmEventId_to_Program[asmtEventId as keyof typeof AsmEventId_to_Program];
  console.log("Program", Program);

  if (
    (domainsParam === null || domainsParam === "") &&
    uniqueIds.length === 0
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Domains parameter is required",
      },
      { status: 400 },
    );
  }

  const domains = parseCsvParam(domainsParam);
  console.log("domains", domains);
  if (domains.length > 0) {
    const invalidDomains = domains.filter(
      (domain) =>
        !DomainItemsArray.includes(domain as (typeof DomainItemsArray)[number]),
    );

    if (invalidDomains.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid domains provided: ${invalidDomains.join(", ")}`,
        },
        { status: 400 },
      );
    }
  }

  if (!sql) {
    return NextResponse.json(
      {
        success: false,
        error: "DATABASE_URL (or NEON_DATABASE_URL) is not configured",
      },
      { status: 500 },
    );
  }

  const getQuestionsCached = unstable_cache(
    async (opts: {
      domains: string[];
      uniqueIds: string[];
      excludeQuestionIds: string[];
      skillCds: string[];
      difficulties: string[];
      random: boolean;
      assessment: string | null;
      asmtEventId: number;
      program: string | undefined;
    }) => {
      const {
        domains,
        uniqueIds,
        excludeQuestionIds,
        skillCds,
        difficulties,
        random,
        program,
      } = opts;

      const whereClauses: string[] = [];
      const values: Array<string[] | string> = [];

      if (uniqueIds.length > 0) {
        if (uniqueIds.length === 1) {
          values.push(uniqueIds[0]);
          whereClauses.push(
            `(external_id = $${values.length} OR ibn = $${values.length} OR questionid = $${values.length})`,
          );
        } else {
          values.push(uniqueIds);
          whereClauses.push(
            `(external_id = ANY($${values.length}::text[]) OR ibn = ANY($${values.length}::text[]) OR questionid = ANY($${values.length}::text[]))`,
          );
        }
      } else if (domains.length > 0) {
        if (domains.length === 1) {
          values.push(domains[0]);
          whereClauses.push(`primary_class_cd = $${values.length}`);
        } else {
          values.push(domains);
          whereClauses.push(
            `primary_class_cd = ANY($${values.length}::text[])`,
          );
        }
      }

      if (excludeQuestionIds.length > 0) {
        if (excludeQuestionIds.length === 1) {
          values.push(excludeQuestionIds[0]);
          whereClauses.push(`NOT (questionid = $${values.length})`);
        } else {
          values.push(excludeQuestionIds);
          whereClauses.push(
            `NOT (questionid = ANY($${values.length}::text[]))`,
          );
        }
      }

      if (skillCds.length > 0) {
        if (skillCds.length === 1) {
          values.push(skillCds[0]);
          whereClauses.push(`skill_cd = $${values.length}`);
        } else {
          values.push(skillCds);
          whereClauses.push(`skill_cd = ANY($${values.length}::text[])`);
        }
      }

      if (difficulties.length > 0) {
        if (difficulties.length === 1) {
          values.push(difficulties[0]);
          whereClauses.push(`difficulty = $${values.length}`);
        } else {
          values.push(difficulties);
          whereClauses.push(`difficulty = ANY($${values.length}::text[])`);
        }
      }

      if (program) {
        values.push(program);
        whereClauses.push(`program = $${values.length}`);
      }

      const query = `
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
      ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""}
      ORDER BY ${random ? "RANDOM()" : "createdate DESC"}
    `;

      const client = sql;
      if (!client) {
        throw new Error(
          "DATABASE_URL (or NEON_DATABASE_URL) is not configured",
        );
      }

      const rows = (await client.query(query, values)) as DbQuestionRow[];
      return rows;
    },
    ["student-qb-questions-list"],
    {
      revalidate: REVALIDATE_MEDIUM,
      tags: ["student-qb-question", "questions"],
    },
  );

  try {
    const whereClauses: string[] = [];
    const values: Array<string[] | string> = [];

    if (uniqueIds.length > 0) {
      values.push(uniqueIds);
      const idx = values.length;
      whereClauses.push(
        `(external_id = ANY($${idx}::text[]) OR ibn = ANY($${idx}::text[]) OR questionid = ANY($${idx}::text[]))`,
      );
    } else if (domains.length > 0) {
      values.push(domains);
      whereClauses.push(`primary_class_cd = ANY($${values.length}::text[])`);
    }

    if (excludeQuestionIds.length > 0) {
      values.push(excludeQuestionIds);
      whereClauses.push(`NOT (questionid = ANY($${values.length}::text[]))`);
    }

    if (skillCds.length > 0) {
      values.push(skillCds);
      whereClauses.push(`skill_cd = ANY($${values.length}::text[])`);
    }

    if (difficulties.length > 0) {
      values.push(difficulties);
      whereClauses.push(`difficulty = ANY($${values.length}::text[])`);
    }

    // Keep assessment handling for backward compatibility even though table rows are already SAT scoped.
    if (
      assessment !== null &&
      assessment !== "" &&
      assessment in Assessments &&
      asmtEventId !== 99
    ) {
      // no-op; preserved to avoid changing existing assessment query contracts abruptly
    }

    const rows = await getQuestionsCached({
      domains,
      uniqueIds,
      excludeQuestionIds,
      skillCds,
      difficulties,
      random: random === "true",
      assessment,
      asmtEventId,
      program: Program,
    });

    const questions: API_Response_Question_List = (rows as DbQuestionRow[]).map(
      toPlainQuestion,
    );

    return NextResponse.json(
      {
        success: true,
        data: questions,
        message: "Fetching question bank successfully",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "CDN-Cache-Control": "public, s-maxage=60",
          "Vercel-CDN-Cache-Control": "public, s-maxage=3600",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching questions from Neon:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch questions from database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

//
//xwmeb2o3
