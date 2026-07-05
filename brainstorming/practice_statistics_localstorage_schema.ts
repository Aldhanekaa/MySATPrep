/**
 * BRAINSTORMING: practice_statistics — localStorage / In-Memory Schema
 *
 * This file documents the shape of practice statistics as they live in
 * localStorage and in Redux state (the client-side canonical form).
 * For the Postgres / DB-side shape, see practice_statistics_db_schema.ts
 *
 * localStorage key: "practiceStatistics"
 * Redux slice:      userDataSlice → state.userData.statistics
 * Types source:     src/types/statistics.ts
 * Logic source:     src/lib/practiceStatistics.ts
 *
 * The localStorage object is a flat map from assessment type to an
 * AssessmentStatistics object. When synced to Postgres, each assessment
 * becomes one row in the practice_statistics table.
 */

// ─── Re-used primitives ───────────────────────────────────────────────────────

type QuestionDifficulty = "E" | "M" | "H";
type DomainItems = string; // e.g. "H-RTE", "H-WIC", "MATH-A", ...
type SkillCd_Variants = string; // e.g. "CAS", "INI", "SEC", ...
type AssessmentType = "SAT" | "PSAT/NMSQT" | "PSAT";

// ─── PlainQuestionType ────────────────────────────────────────────────────────
// Defined in src/types/question.ts.
// On the localStorage side this is intentionally kept in full because:
//   1. localStorage reads are synchronous — no round-trip cost to re-fetch.
//   2. The client needs metadata (stem, answerOptions, rationale) to render
//      a question without an API call.
// The redundancy problem is specifically on the DB side where storage cost
// and bandwidth matter. See practice_statistics_db_schema.ts.
interface PlainQuestionType {
  questionId: string;
  primary_class_cd: DomainItems;
  primary_class_cd_desc: string;
  skill_cd: SkillCd_Variants;
  skill_desc: string;
  difficulty: QuestionDifficulty;
  ibn: null | string;
  external_id: null | string;
  program: string;
  pPcc: string;
  uId: string;
  score_band_range_cd: number;
  createDate: number;
  updateDate: number;
}

// =============================================================================
// QuestionStatistic
// Leaf value at: statistics[primaryClassCd][skillCd][questionId]
// Written by saveQuestionStatistic() in practiceStatistics.ts
// =============================================================================
interface QuestionStatistic {
  time: number; // milliseconds
  answer: string; // e.g. "A", "B", "2.5"
  isCorrect: boolean;
  external_id?: string; // SAT external question id — one of these two is always defined
  ibn?: string; // internal book number    — one of these two is always defined
  plainQuestion?: PlainQuestionType; // full metadata, kept for offline rendering
}

// =============================================================================
// statistics nested map
// Shape of AssessmentStatistics.statistics
// =============================================================================
interface SkillStatistics {
  [questionId: string]: QuestionStatistic;
}

interface DomainStatistics {
  [skillCd: SkillCd_Variants]: SkillStatistics;
}

/** Top-level type of the `statistics` field inside AssessmentStatistics */
interface ClassStatistics {
  [primaryClassCd: DomainItems]: DomainStatistics;
}

// =============================================================================
// AnsweredQuestion
// Element of: AssessmentStatistics.answeredQuestionsDetailed
// Written by addAnsweredQuestion() in practiceStatistics.ts
// =============================================================================
interface AnsweredQuestion {
  questionId: string;
  difficulty: QuestionDifficulty;
  isCorrect: boolean;
  timeSpent: number; // milliseconds
  timestamp: string; // ISO 8601, e.g. "2025-01-15T10:30:00.000Z"
  selectedAnswer?: string; // "A" | "B" | "C" | "D" or numeric string for SPR
  plainQuestion?: PlainQuestionType; // full metadata, kept for offline rendering
}

// =============================================================================
// AssessmentStatistics
// Value type for each key in PracticeStatistics
// Maps 1-to-1 with one row in the practice_statistics DB table
// =============================================================================
interface AssessmentStatistics {
  /** Legacy flat list of answered questionIds — used for O(1) "already answered?" checks */
  answeredQuestions: string[];

  /** Detailed per-answer records ordered by insertion; deduped by questionId on sync */
  answeredQuestionsDetailed: AnsweredQuestion[];

  /** Nested performance data used for accuracy/difficulty/domain breakdowns */
  statistics: ClassStatistics;
}

// =============================================================================
// PracticeStatistics
// Root object stored under localStorage key "practiceStatistics"
// Also the shape used throughout Redux state
// =============================================================================
interface PracticeStatistics {
  [assessment: AssessmentType | string]: AssessmentStatistics;
}

// =============================================================================
// StatisticEntry
// Argument type passed to saveQuestionStatistic() — the write API for statistics
// =============================================================================
interface StatisticEntry {
  assessment: AssessmentType;
  primaryClassCd: DomainItems;
  skillCd: SkillCd_Variants;
  questionId: string;
  statistic: QuestionStatistic;
  external_id?: string;
  ibn?: string;
  plainQuestion?: PlainQuestionType;
}

// =============================================================================
// NOTES: What stays in localStorage vs what gets trimmed before DB write
// =============================================================================
/**
 * Currently the localStorage and DB shapes are IDENTICAL — the entire
 * PracticeStatistics object is JSON.stringify'd and sent as-is to the server
 * in syncOperations.ts / updatePracticeStatistics().
 *
 * This means all the plainQuestion bloat from localStorage travels across
 * the wire and lands in Postgres unchanged.
 *
 * Proposed optimisation (DB side only, localStorage unchanged):
 *   Strip plainQuestion from both AnsweredQuestion and QuestionStatistic
 *   entries before the DB write in syncOperations.ts / userOperations.ts.
 *   The localStorage copy keeps the full object for offline rendering;
 *   Postgres only stores the minimal identifiers it actually needs for
 *   analytics queries.
 *
 * Fields that can be safely dropped at DB-write time:
 *   AnsweredQuestion.plainQuestion     — ~300–500 B per entry
 *   QuestionStatistic.plainQuestion    — ~300–500 B per entry
 *
 * Fields that SHOULD be kept in the DB (already top-level, no change needed):
 *   AnsweredQuestion.external_id / .ibn
 *   QuestionStatistic.external_id / .ibn
 *   AnsweredQuestion.difficulty   ← single char, avoids join for breakdown charts
 */
