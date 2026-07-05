/**
 * BRAINSTORMING: practice_statistics — PostgreSQL / DB-side Schema
 *
 * This file focuses exclusively on what is stored in the Postgres database.
 * For the localStorage / in-memory shape, see practice_statistics_localstorage_schema.ts
 *
 * ┌────────────────────────────────────────────────────────────────────────────┐
 * │  TABLE: practice_statistics  (migrations/001_initial_schema.sql)           │
 * │                                                                            │
 * │  user_id    UUID        FK → "user"(id) ON DELETE CASCADE                  │
 * │  assessment VARCHAR(50) 'SAT' | 'PSAT/NMSQT' | 'PSAT'                     │
 * │  PRIMARY KEY (user_id, assessment)                                         │
 * │                                                                            │
 * │  answered_questions         JSONB  DEFAULT '[]'                            │
 * │  answered_questions_detailed JSONB DEFAULT '[]'                            │
 * │  statistics                 JSONB  DEFAULT '{}'                            │
 * │                                                                            │
 * │  updated_at TIMESTAMPTZ auto-maintained via trigger                        │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * One row per (user, assessment). All three JSONB columns are synced together
 * from localStorage whenever the user is authenticated.
 */

// ─── Re-used primitives ───────────────────────────────────────────────────────

type QuestionDifficulty = "E" | "M" | "H";
type DomainItems = string; // e.g. "H-RTE", "H-WIC", "MATH-A", ...
type SkillCd_Variants = string; // e.g. "CAS", "INI", "SEC", ...

// ─── PlainQuestionType ────────────────────────────────────────────────────────
// Defined in src/types/question.ts.
// This is the full question-metadata object that currently gets embedded
// redundantly inside both JSONB columns (see the "problem" notes below).
interface PlainQuestionType {
  questionId: string;
  primary_class_cd: DomainItems;
  primary_class_cd_desc: string;
  skill_cd: SkillCd_Variants;
  skill_desc: string;
  difficulty: QuestionDifficulty;
  ibn: null | string; // internal book number — exactly one of ibn/external_id is non-null
  external_id: null | string; // external question id — exactly one of ibn/external_id is non-null
  program: string;
  pPcc: string;
  uId: string;
  score_band_range_cd: number;
  createDate: number;
  updateDate: number;
}

// =============================================================================
// COLUMN 1: answered_questions  (JSONB DEFAULT '[]')
// =============================================================================
/**
 * Legacy flat array of question-ID strings.
 * Written alongside answered_questions_detailed but kept as a separate set
 * for fast "have I answered this?" membership checks.
 *
 * Merge strategy in syncOperations.ts (ON CONFLICT):
 *   SELECT jsonb_agg(DISTINCT val) ... UNION  ← simple set-union dedup
 *
 * DB type:   JSONB array of strings
 * TS type:   string[]
 *
 * Example value stored in Postgres:
 *   ["cb6c6e00-e7f1-4b3f-a9bd-1f23456789ab", "d1a2b3c4-...", ...]
 */
type DB_AnsweredQuestions = string[];

// =============================================================================
// COLUMN 2: answered_questions_detailed  (JSONB DEFAULT '[]')
// =============================================================================
/**
 * Array of per-answer records, one entry per question the user has ever answered.
 * Deduplicated by questionId (latest timestamp wins) during sync.
 *
 * Merge strategy in syncOperations.ts (ON CONFLICT):
 *   DISTINCT ON (entry->>'questionId')
 *   ORDER BY entry->>'questionId', (entry->>'timestamp') DESC NULLS LAST
 *
 * DB type:   JSONB array of objects
 * TS type:   DB_AnsweredQuestionEntry[]
 *
 * PROBLEM — plainQuestion is redundant:
 *   Every entry currently carries the full PlainQuestionType (~15 fields,
 *   ~300–500 bytes serialised). For a user with 500 answers this is ~175–250 KB
 *   of pure duplication per assessment — all re-fetchable from the question
 *   bank via questionId.
 *
 * PROBLEM — external_id / ibn constraint is implicit:
 *   Both fields are optional strings, but the real invariant is that exactly
 *   one of them is non-null (mirrors the source PlainQuestionType). Nothing
 *   in the DB schema or type system currently expresses this.
 *
 * Written by:
 *   addAnsweredQuestion() in src/lib/practiceStatistics.ts (localStorage)
 *   → synced to DB via updatePracticeStatistics() / syncOperations.ts
 */
interface DB_AnsweredQuestionEntry {
  questionId: string;
  difficulty: QuestionDifficulty; // kept: 1 char, avoids join in breakdown charts
  isCorrect: boolean;
  timeSpent: number; // milliseconds
  timestamp: string; // ISO 8601, used for dedup ordering in merge SQL
  selectedAnswer?: string; // "A" | "B" | "C" | "D" or numeric string for SPR

  // Exactly one of these will be non-null (mirrors PlainQuestionType.ibn / .external_id)
  external_id?: string; // SAT external question identifier
  ibn?: string; // internal book number identifier

  // ⚠️  REDUNDANT — full metadata blob, re-fetchable by questionId
  plainQuestion?: PlainQuestionType;
}

// =============================================================================
// COLUMN 3: statistics  (JSONB DEFAULT '{}')
// =============================================================================
/**
 * Nested object: domain → skill → questionId → per-answer stat.
 * This is the primary structure used for accuracy/performance breakdowns.
 *
 * Merge strategy in syncOperations.ts (ON CONFLICT):
 *   practice_statistics.statistics || EXCLUDED.statistics
 *   (shallow JSONB object merge — incoming keys win at the top level)
 *
 * DB type:   JSONB object
 * TS type:   DB_ClassStatistics
 *
 * PROBLEM — plainQuestion inside leaf nodes:
 *   Same redundancy as column 2. Each QuestionStatistic leaf currently stores
 *   a full PlainQuestionType, adding ~300–500 bytes per question per assessment.
 *
 * PROBLEM — external_id / ibn same implicit-constraint issue as column 2.
 *
 * Written by:
 *   saveQuestionStatistic() in src/lib/practiceStatistics.ts (localStorage)
 *   → synced to DB via updatePracticeStatistics() / syncOperations.ts
 */

/** Leaf node stored at statistics[primaryClassCd][skillCd][questionId] */
interface DB_QuestionStatistic {
  time: number; // milliseconds taken to answer
  answer: string; // user's selected answer, e.g. "A", "B", "2.5"
  isCorrect: boolean;

  // Exactly one of these will be non-null
  external_id?: string;
  ibn?: string;

  // ⚠️  REDUNDANT — full metadata blob, re-fetchable by questionId
  plainQuestion?: PlainQuestionType;
}

/** statistics[primaryClassCd][skillCd][questionId] */
interface DB_SkillStatistics {
  [questionId: string]: DB_QuestionStatistic;
}

/** statistics[primaryClassCd][skillCd] */
interface DB_DomainStatistics {
  [skillCd: SkillCd_Variants]: DB_SkillStatistics;
}

/** Full shape of the `statistics` JSONB column */
interface DB_ClassStatistics {
  [primaryClassCd: DomainItems]: DB_DomainStatistics;
}

// =============================================================================
// COMPLETE ROW TYPE (as returned by userOperations.ts → getPracticeStatistics)
// =============================================================================

/** Raw row shape returned from Postgres (internal to userOperations.ts) */
interface DbPracticeStatisticsRow {
  userId: string;
  assessment: "SAT" | "PSAT/NMSQT" | "PSAT";
  answeredQuestions: DB_AnsweredQuestions;
  answeredQuestionsDetailed: DB_AnsweredQuestionEntry[];
  statistics: DB_ClassStatistics;
  updatedAt: Date;
}

// =============================================================================
// SUMMARY OF REDUNDANCY PROBLEMS
// =============================================================================
/**
 * Both JSONB columns store plainQuestion on every entry.
 * PlainQuestionType serialised ≈ 300–500 bytes (15 fields, several long strings).
 *
 * Per user, per assessment, 500 answered questions →
 *   answered_questions_detailed  :  500 × ~400 B  = ~200 KB redundant
 *   statistics leaf nodes        :  500 × ~400 B  = ~200 KB redundant
 *   ─────────────────────────────────────────────────────────────────
 *   Total wasted per assessment  :  ~400 KB (re-fetchable by questionId)
 *
 * Fields in plainQuestion that add no value here because they are either
 * already present elsewhere in the record OR derivable from questionId:
 *   updateDate, createDate, pPcc, uId, skill_desc, primary_class_cd_desc,
 *   program, score_band_range_cd, skill_cd, primary_class_cd
 *   (difficulty is already a top-level field in AnsweredQuestionEntry)
 *
 * Fields in plainQuestion that ARE useful without a question-bank round-trip:
 *   external_id, ibn  — but these can be promoted to top-level fields
 *   (they already are on AnsweredQuestionEntry, just also duplicated inside plainQuestion)
 *
 * Proposed fix: remove plainQuestion from both columns; promote external_id
 * and ibn to top-level nullable fields with an application-layer invariant
 * that exactly one is non-null. See practice_statistics_localstorage_schema.ts
 * for the localStorage side of the same change.
 */
