/**
 * Statistics DB Transform Utilities
 *
 * Strip functions that remove `plainQuestion` from practice_statistics JSONB
 * columns before writing to Postgres, while promoting `primary_class_cd` and
 * `skill_cd` as explicit top-level fields on AnsweredQuestion entries.
 *
 * Rules:
 *   - localStorage shape is UNCHANGED — full PlainQuestionType is kept there.
 *   - DB shape stores only what is actually consumed by DB-side queries and
 *     by UI consumers that read from Redux (which is populated from the DB).
 *   - Backward compatibility: existing DB rows may still carry `plainQuestion`
 *     in both JSONB columns. The read-path normaliser handles both old and new
 *     shapes transparently.
 *
 * answered_questions_detailed leaf — DB shape:
 *   { questionId, isCorrect, difficulty, timeSpent, timestamp,
 *     selectedAnswer?, external_id?, ibn?,
 *     primary_class_cd, skill_cd }          ← promoted from plainQuestion
 *   // plainQuestion removed
 *
 * statistics leaf — DB shape:
 *   { time, answer, isCorrect, external_id?, ibn? }
 *   // plainQuestion removed
 */

import type {
  AnsweredQuestion,
  QuestionStatistic,
  ClassStatistics,
} from "@/types/statistics";

// ─── Types for the lean DB shapes ────────────────────────────────────────────

export interface DB_AnsweredQuestion {
  questionId: string;
  isCorrect: boolean;
  difficulty: "E" | "M" | "H";
  timeSpent: number;
  timestamp: string;
  selectedAnswer?: string;
  external_id?: string;
  ibn?: string;
  /** Promoted from plainQuestion — needed by review/page.tsx and saved.tsx filters */
  primary_class_cd: string;
  /** Promoted from plainQuestion — needed by review/page.tsx */
  skill_cd: string;
}

export interface DB_QuestionStatistic {
  time: number;
  answer: string;
  isCorrect: boolean;
  external_id?: string;
  ibn?: string;
}

export interface DB_ClassStatistics {
  [primaryClassCd: string]: {
    [skillCd: string]: {
      [questionId: string]: DB_QuestionStatistic;
    };
  };
}

// ─── Strip helpers ────────────────────────────────────────────────────────────

/**
 * Strips plainQuestion from a single AnsweredQuestion entry and promotes
 * primary_class_cd and skill_cd as top-level fields.
 *
 * If primary_class_cd / skill_cd are unavailable (no plainQuestion and no
 * existing promoted fields), falls back to empty strings — these entries will
 * still function for isCorrect / timestamp / timeSpent consumers, and the
 * review/page.tsx subject filter will simply exclude them (same as before).
 */
export function stripAnsweredQuestion(
  aq: AnsweredQuestion,
): DB_AnsweredQuestion {
  const pq = (aq as unknown as { plainQuestion?: Record<string, unknown> })
    .plainQuestion;

  // Promote primary_class_cd: prefer existing top-level field (if a future
  // write already promoted it), then fall back to plainQuestion, then "".
  const existing = aq as unknown as {
    primary_class_cd?: string;
    skill_cd?: string;
  };

  const primary_class_cd =
    existing.primary_class_cd ??
    (typeof pq?.primary_class_cd === "string" ? pq.primary_class_cd : "") ??
    "";

  const skill_cd =
    existing.skill_cd ??
    (typeof pq?.skill_cd === "string" ? pq.skill_cd : "") ??
    "";

  return {
    questionId: aq.questionId,
    isCorrect: aq.isCorrect,
    difficulty: aq.difficulty,
    timeSpent: aq.timeSpent,
    timestamp: aq.timestamp,
    ...(aq.selectedAnswer !== undefined && {
      selectedAnswer: aq.selectedAnswer,
    }),
    ...(aq.external_id !== undefined && { external_id: aq.external_id }),
    ...(aq.ibn !== undefined && { ibn: aq.ibn }),
    primary_class_cd,
    skill_cd,
  };
}

/**
 * Strips plainQuestion from a single QuestionStatistic leaf.
 */
export function stripQuestionStatistic(
  qs: QuestionStatistic,
): DB_QuestionStatistic {
  return {
    time: qs.time,
    answer: qs.answer,
    isCorrect: qs.isCorrect,
    ...(qs.external_id !== undefined && { external_id: qs.external_id }),
    ...(qs.ibn !== undefined && { ibn: qs.ibn }),
  };
}

/**
 * Strips plainQuestion from every leaf of a ClassStatistics map.
 */
export function stripClassStatistics(
  stats: ClassStatistics,
): DB_ClassStatistics {
  const result: DB_ClassStatistics = {};
  for (const [primaryClassCd, domainStats] of Object.entries(stats)) {
    result[primaryClassCd] = {};
    for (const [skillCd, skillStats] of Object.entries(domainStats)) {
      result[primaryClassCd][skillCd] = {};
      for (const [questionId, qs] of Object.entries(skillStats)) {
        result[primaryClassCd][skillCd][questionId] = stripQuestionStatistic(
          qs as QuestionStatistic,
        );
      }
    }
  }
  return result;
}

/**
 * Strips plainQuestion from every element of an answeredQuestionsDetailed array.
 */
export function stripAnsweredQuestionsDetailed(
  aqd: AnsweredQuestion[],
): DB_AnsweredQuestion[] {
  return aqd.map(stripAnsweredQuestion);
}

// ─── Read-path normaliser ─────────────────────────────────────────────────────

/**
 * Normalises a raw answered_questions_detailed entry coming out of Postgres.
 *
 * Handles two cases:
 *   A) New format: has top-level primary_class_cd / skill_cd, no plainQuestion.
 *   B) Legacy format: has plainQuestion object (old rows written before this change).
 *
 * Always returns a plain object with primary_class_cd and skill_cd at the top
 * level, and no plainQuestion — so downstream code in review/page.tsx can
 * safely read `q.primary_class_cd` and `q.skill_cd` regardless of row age.
 */
export function normaliseAnsweredQuestion(
  raw: Record<string, unknown>,
): DB_AnsweredQuestion {
  // Legacy: plainQuestion blob is present
  const pq = raw.plainQuestion as Record<string, unknown> | undefined;

  const primary_class_cd =
    typeof raw.primary_class_cd === "string"
      ? raw.primary_class_cd
      : typeof pq?.primary_class_cd === "string"
        ? pq.primary_class_cd
        : "";

  const skill_cd =
    typeof raw.skill_cd === "string"
      ? raw.skill_cd
      : typeof pq?.skill_cd === "string"
        ? pq.skill_cd
        : "";

  return {
    questionId: String(raw.questionId ?? ""),
    isCorrect: Boolean(raw.isCorrect),
    difficulty: (raw.difficulty as "E" | "M" | "H") ?? "M",
    timeSpent: Number(raw.timeSpent ?? 0),
    timestamp: String(raw.timestamp ?? ""),
    ...(raw.selectedAnswer !== undefined && {
      selectedAnswer: String(raw.selectedAnswer),
    }),
    ...(raw.external_id !== undefined && {
      external_id: raw.external_id as string,
    }),
    ...(raw.ibn !== undefined && { ibn: raw.ibn as string }),
    primary_class_cd,
    skill_cd,
  };
}

/**
 * Normalises a raw statistics leaf entry coming out of Postgres.
 *
 * Handles legacy rows that still carry plainQuestion inside the leaf.
 * Returns a clean DB_QuestionStatistic without plainQuestion.
 */
export function normaliseQuestionStatistic(
  raw: Record<string, unknown>,
): DB_QuestionStatistic {
  return {
    time: Number(raw.time ?? 0),
    answer: String(raw.answer ?? ""),
    isCorrect: Boolean(raw.isCorrect),
    ...(raw.external_id !== undefined && {
      external_id: raw.external_id as string,
    }),
    ...(raw.ibn !== undefined && { ibn: raw.ibn as string }),
  };
}

/**
 * Normalises an entire raw ClassStatistics object from Postgres.
 * Works correctly for both old rows (with plainQuestion in leaves) and
 * new rows (without plainQuestion).
 */
export function normaliseClassStatistics(
  raw: Record<string, unknown>,
): DB_ClassStatistics {
  const result: DB_ClassStatistics = {};
  for (const [primaryClassCd, domainRaw] of Object.entries(raw)) {
    if (typeof domainRaw !== "object" || domainRaw === null) continue;
    result[primaryClassCd] = {};
    for (const [skillCd, skillRaw] of Object.entries(
      domainRaw as Record<string, unknown>,
    )) {
      if (typeof skillRaw !== "object" || skillRaw === null) continue;
      result[primaryClassCd][skillCd] = {};
      for (const [questionId, leafRaw] of Object.entries(
        skillRaw as Record<string, unknown>,
      )) {
        if (typeof leafRaw !== "object" || leafRaw === null) continue;
        result[primaryClassCd][skillCd][questionId] =
          normaliseQuestionStatistic(leafRaw as Record<string, unknown>);
      }
    }
  }
  return result;
}
