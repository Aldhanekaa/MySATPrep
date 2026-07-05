/**
 * BRAINSTORMING: practice_sessions — Current & Proposed Schemas
 *
 * Covers both the localStorage shape and the PostgreSQL DB shape.
 * The DB stores the full PracticeSession object as a single JSONB blob
 * in the `session_data` column — so the question is which fields of that
 * blob are actually needed in the DB vs which are only needed on the client.
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  TABLE: practice_sessions  (migrations/001_initial_schema.sql)         │
 * │                                                                        │
 * │  id              UUID        PK  DEFAULT gen_random_uuid()             │
 * │  user_id         UUID        FK → "user"(id) ON DELETE CASCADE         │
 * │  session_id      VARCHAR(255) NOT NULL                                  │
 * │  session_data    JSONB        NOT NULL   ← entire PracticeSession blob  │
 * │  status          VARCHAR(50)  NOT NULL   ← denormalised from blob       │
 * │  current_session BOOLEAN      NOT NULL DEFAULT FALSE                   │
 * │  created_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP                │
 * │  updated_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP (trigger)      │
 * │  UNIQUE (user_id, session_id)                                          │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * localStorage keys:
 *   "currentPracticeSession"  → single PracticeSession (in-progress)
 *   "practiceHistory"         → PracticeSession[]   (completed / abandoned)
 */

// ─── Supporting types (unchanged) ────────────────────────────────────────────

type QuestionDifficulty = "E" | "M" | "H";
type SessionStatus =
  | "not_started"
  | "in_progress"
  | "paused"
  | "completed"
  | "abandoned"
  | "expired";

interface Domain {
  id: string;
  text: string;
  primaryClassCd: string;
}

interface Skill {
  id: string;
  text: string;
  skill_cd: string;
}

interface PracticeSelections {
  practiceType: string; // "rush" | "review"
  assessment: string; // "SAT" | "PSAT/NMSQT" | "PSAT"
  subject: string; // "math" | "reading-writing"
  domains: Domain[];
  skills: Skill[];
  difficulties: QuestionDifficulty[];
  randomize: boolean;
  questionIds?: string[]; // pre-selected question IDs (shared links / review)
  excludeBluebook: boolean;
  duplicateSession?: boolean;
}

interface QuestionAnswers {
  [questionId: string]: string | null; // null = skipped
}

interface QuestionTimes {
  [questionId: string]: number; // milliseconds per question
}

interface QuestionCorrectChoices {
  [questionId: string]: string[];
}

// ─── AnsweredQuestionDetail ───────────────────────────────────────────────────
// Lives inside PracticeSession.answeredQuestionDetails (the SESSION type,
// not to be confused with AnsweredQuestion in practiceStatistics).

import type { PlainQuestionType } from "@/types/question";

interface AnsweredQuestionDetail {
  questionId: string;
  externalId: string | null;
  ibn: string | null;
  plainQuestion?: PlainQuestionType; // ← used by PracticeRushCelebration chart
}

// =============================================================================
// CURRENT SCHEMA
// =============================================================================

/**
 * CURRENT: PracticeSession
 * This is the shape stored as-is in both:
 *   - localStorage["currentPracticeSession"]
 *   - localStorage["practiceHistory"][]
 *   - DB: practice_sessions.session_data JSONB (the entire object)
 *
 * Problems:
 *
 * 1. answeredQuestionDetails contains plainQuestion (~300–500 B each).
 *    This is the session-local copy used by PracticeRushCelebration to build
 *    the per-skill bar chart. It's NOT the same as practiceStatistics —
 *    this is session-scoped transient data.
 *    → The celebration screen needs it immediately after session completion,
 *      but it is useless in the DB after the session is done.
 *
 * 2. questionAnswers / questionTimes are BOTH in session_data AND denormalised
 *    into answeredQuestions[]. No field is truly redundant but questionAnswers
 *    is large for long sessions.
 *
 * 3. questionCorrectChoices stores the correct answer for every question.
 *    This is already available from the question bank API by questionId.
 *    After session completion it has no read use in the DB.
 *
 * 4. correctAnswers / accuracyPercentage are computed fields (derivable from
 *    questionAnswers + questionCorrectChoices). They are denormalised onto the
 *    session object as convenience fields for the celebration screen.
 *    → After the celebration screen renders, they are never read from the DB.
 *
 * 5. status is ALREADY denormalised as a separate column (practice_sessions.status).
 *    It is duplicated inside session_data as well.
 */
interface Current_PracticeSession {
  // ── Identity ──────────────────────────────────────────────────────────────
  sessionId: string;
  timestamp: string; // ISO 8601 — session start time
  status: SessionStatus; // ← also stored as top-level DB column

  // ── Configuration ─────────────────────────────────────────────────────────
  practiceSelections: PracticeSelections; // domains, skills, difficulties, etc.

  // ── In-progress state (needed to RESUME a session) ────────────────────────
  currentQuestionStep: number; // which question the user is on
  questionAnswers: QuestionAnswers; // { [questionId]: selectedAnswer | null }
  questionTimes: QuestionTimes; // { [questionId]: ms }

  // ── Session-local metadata for celebration screen ─────────────────────────
  answeredQuestionDetails: AnsweredQuestionDetail[]; // includes plainQuestion
  questionCorrectChoices?: QuestionCorrectChoices; // correct answer per question

  // ── Computed analytics ────────────────────────────────────────────────────
  totalQuestions: number;
  answeredQuestions: string[]; // question IDs that were answered
  averageTimePerQuestion: number; // ms
  totalTimeSpent: number; // ms
  totalXPReceived?: number; // net XP delta for the session

  // ── Computed convenience fields (written at completion) ───────────────────
  correctAnswers?: number; // count — not on PracticeSession type directly
  // but cast onto it in practice-rush-multistep
  accuracyPercentage?: number; // 0–100 — same

  // ── DB-level flag (managed by DB, mirrored into session_data) ─────────────
  currentSession?: boolean; // true = active in-progress session
}

// =============================================================================
// FIELD-BY-FIELD ANALYSIS
// =============================================================================

/**
 * Fields by category:
 *
 * ── Always needed in DB ──────────────────────────────────────────────────────
 *
 * sessionId            identity, dedup key for upserts and review routing
 * timestamp            creation time, used for sorting in sessions tab
 * status               correctness checking, review mode routing
 *                      (ALSO denormalised as separate column — session_data copy
 *                       is kept for rowToPracticeSession() convenience)
 * practiceSelections   needed to reconstruct PracticeSelections for review mode
 *                      (domains, skills used by review/page.tsx and sessions.tsx)
 * currentQuestionStep  CRITICAL for session resume — "continue where you left off"
 * questionAnswers      CRITICAL for session resume — restores per-question answers
 * questionTimes        CRITICAL for session resume — restores per-question timing
 * totalQuestions       displayed in sessions tab
 * answeredQuestions    displayed in sessions tab (count), dedup in migration
 * averageTimePerQuestion  displayed in sessions tab and celebration screen
 * totalTimeSpent       displayed in sessions tab and celebration screen
 * totalXPReceived      displayed in sessions tab ("XP Gained" column)
 * currentSession       mirrors DB column, used by rowToPracticeSession()
 *
 * ── Only needed in localStorage / on the client ──────────────────────────────
 *
 * answeredQuestionDetails[].plainQuestion
 *   Only consumer: PracticeRushCelebration bar chart, which runs immediately
 *   after session completion from the in-memory completedSession object —
 *   NOT from a DB fetch. Once the celebration screen unmounts, this data
 *   is never read from storage again.
 *   → DROP from DB. Keep in localStorage (currentPracticeSession) during
 *     session, but strip before persisting to practice_sessions DB table.
 *   → Keep answeredQuestionDetails itself (questionId, externalId, ibn) —
 *     these are lightweight and useful for potential future per-session audit.
 *
 * questionCorrectChoices
 *   Only consumer: correctAnswers count computation in practice-rush-multistep
 *   (completedSession builder) and passed as prop to PracticeRushCelebration.
 *   After the session ends, this data is re-derivable from the question bank
 *   API using questionId. No DB consumer reads it back.
 *   → DROP from DB. Strip before persisting to session_data.
 *
 * correctAnswers (the numeric field cast onto PracticeSession)
 *   Only consumer: PracticeRushCelebration display. Computed in
 *   practice-rush-multistep at completion time. Sessions tab derives
 *   correctness from practiceStatistics, not from this field.
 *   → DROP from DB. Strip before persisting (it's not even on the type
 *     definition, just cast via `as`).
 *
 * accuracyPercentage (same as above)
 *   → DROP from DB. Same rationale.
 */

// =============================================================================
// PROPOSED DB SCHEMA
// =============================================================================

/**
 * PROPOSED: DB_PracticeSession
 * The shape written into practice_sessions.session_data JSONB.
 *
 * Note: answeredQuestionDetails is kept (without plainQuestion).
 *   questionId, externalId, ibn are lightweight and useful for
 *   potential per-session analytics / audit without a question bank join.
 */
interface DB_AnsweredQuestionDetail {
  questionId: string;
  externalId: string | null;
  ibn: string | null;
  // plainQuestion REMOVED — never read back from DB by any consumer
}

interface DB_PracticeSession {
  // ── Identity ──────────────────────────────────────────────────────────────
  sessionId: string;
  timestamp: string;
  status: SessionStatus;

  // ── Configuration ─────────────────────────────────────────────────────────
  practiceSelections: PracticeSelections;

  // ── Resume state ──────────────────────────────────────────────────────────
  currentQuestionStep: number;
  questionAnswers: QuestionAnswers;
  questionTimes: QuestionTimes;

  // ── Session metadata (stripped of plainQuestion) ──────────────────────────
  answeredQuestionDetails: DB_AnsweredQuestionDetail[];

  // ── Analytics ─────────────────────────────────────────────────────────────
  totalQuestions: number;
  answeredQuestions: string[];
  averageTimePerQuestion: number;
  totalTimeSpent: number;
  totalXPReceived?: number;

  // ── DB flag ───────────────────────────────────────────────────────────────
  currentSession?: boolean;

  // REMOVED from DB:
  //   questionCorrectChoices   — re-derivable from question bank by questionId
  //   correctAnswers           — computed field, only used at celebration render
  //   accuracyPercentage       — same
  //   answeredQuestionDetails[].plainQuestion — only used by celebration screen
}

// =============================================================================
// LOCALSTORAGE SCHEMA — UNCHANGED
// =============================================================================

/**
 * localStorage keeps the full PracticeSession shape as defined in
 * src/types/session.ts. No changes here.
 *
 * "currentPracticeSession" → full PracticeSession including:
 *   - answeredQuestionDetails[].plainQuestion (needed by celebration screen
 *     which reads directly from the completedSession object in React state,
 *     NOT from a storage read — but the localStorage copy is the fallback
 *     for the "continue" flow)
 *   - questionCorrectChoices (needed for session restoration mid-session)
 *   - correctAnswers / accuracyPercentage (written at completion)
 *
 * "practiceHistory" → PracticeSession[] (same full shape)
 *   Kept as-is. For authenticated users this is superseded by Redux/DB,
 *   but unauthenticated users rely on it fully.
 */

// =============================================================================
// STORAGE SAVINGS ESTIMATE
// =============================================================================

/**
 * Per session savings:
 *
 * answeredQuestionDetails[].plainQuestion
 *   ~20 questions × ~400 B per PlainQuestionType = ~8 KB per session
 *
 * questionCorrectChoices
 *   ~20 questions × ~10 B per entry = ~200 B per session
 *
 * correctAnswers / accuracyPercentage
 *   ~20 B (negligible)
 *
 * A user with 50 sessions:
 *   50 × ~8.2 KB = ~410 KB saved from session_data JSONB
 *
 * Per-session wire savings (on every save/update call):
 *   ~8.2 KB less per POST/PUT to /api/user/sessions
 *   Significant for "continue session" flow which saves every 1 second.
 */
