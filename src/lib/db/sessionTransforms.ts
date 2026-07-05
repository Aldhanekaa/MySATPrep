/**
 * Session DB Transform Utilities
 *
 * Strip functions that remove bloat from PracticeSession before writing to
 * the `session_data` JSONB column in `practice_sessions`.
 *
 * Fields REMOVED from the DB shape:
 *   answeredQuestionDetails[].plainQuestion  — ~300–500 B per entry
 *   questionCorrectChoices                   — re-derivable from question bank
 *   correctAnswers  (numeric, cast-on)       — computed at completion, not read back
 *   accuracyPercentage (same)                — same
 *
 * Fields KEPT in answeredQuestionDetails entries:
 *   questionId, externalId, ibn              — needed to re-fetch questions on restore
 *
 * The localStorage shape (currentPracticeSession, practiceHistory) is
 * UNCHANGED — it keeps the full PracticeSession including plainQuestion.
 *
 * Backward compatibility:
 *   Old DB rows still carry plainQuestion in answeredQuestionDetails.
 *   The read normaliser transparently handles both old and new shapes.
 */

import type { PracticeSession } from "@/types/session";
import type { AnsweredQuestionDetail } from "@/types/session";

// ─── DB-side lean types ───────────────────────────────────────────────────────

/** Lean version of AnsweredQuestionDetail stored in the DB */
export interface DB_AnsweredQuestionDetail {
  questionId: string;
  externalId: string | null;
  ibn: string | null;
  // plainQuestion intentionally omitted
}

/**
 * The shape of session_data JSONB after stripping.
 * Extends the core PracticeSession fields that are needed for:
 *   - Session resume (currentQuestionStep, questionAnswers, questionTimes,
 *     answeredQuestionDetails, practiceSelections)
 *   - Session listing (timestamp, status, totalQuestions, answeredQuestions,
 *     averageTimePerQuestion, totalTimeSpent, totalXPReceived)
 *   - Continue button (status, currentSession)
 */
export type DB_PracticeSession = Omit<
  PracticeSession,
  "answeredQuestionDetails" | "questionCorrectChoices"
> & {
  answeredQuestionDetails: DB_AnsweredQuestionDetail[];
  // questionCorrectChoices omitted entirely
  // correctAnswers / accuracyPercentage cast-on fields omitted
};

// ─── Strip helpers ────────────────────────────────────────────────────────────

/**
 * Strips plainQuestion from a single AnsweredQuestionDetail entry.
 */
function stripAnsweredQuestionDetail(
  detail: AnsweredQuestionDetail,
): DB_AnsweredQuestionDetail {
  return {
    questionId: detail.questionId,
    externalId: detail.externalId,
    ibn: detail.ibn,
  };
}

/**
 * Produces a lean DB_PracticeSession from a full PracticeSession by:
 *   1. Removing plainQuestion from every answeredQuestionDetails entry
 *   2. Removing questionCorrectChoices
 *   3. Removing correctAnswers / accuracyPercentage (cast-on computed fields)
 *
 * The result is safe to JSON.stringify and write to session_data.
 */
export function stripSessionForDb(
  session: PracticeSession & {
    correctAnswers?: number;
    accuracyPercentage?: number;
  },
): DB_PracticeSession {
  const {
    // Strip the bloat fields
    questionCorrectChoices: _qcc,
    correctAnswers: _ca,
    accuracyPercentage: _ap,
    // Keep everything else
    answeredQuestionDetails,
    ...rest
  } = session as PracticeSession & {
    questionCorrectChoices?: unknown;
    correctAnswers?: number;
    accuracyPercentage?: number;
  };

  return {
    ...rest,
    answeredQuestionDetails: (answeredQuestionDetails ?? []).map(
      stripAnsweredQuestionDetail,
    ),
  };
}

// ─── Read-path normaliser ─────────────────────────────────────────────────────

/**
 * Normalises a raw answeredQuestionDetails entry coming out of Postgres.
 *
 * Handles:
 *   A) New format: { questionId, externalId, ibn } — no plainQuestion.
 *   B) Legacy format: { questionId, externalId, ibn, plainQuestion } — old rows.
 *
 * Always returns a DB_AnsweredQuestionDetail.
 * Consumers that need plainQuestion for restore/review should use
 * buildMinimalPlainQuestion() to reconstruct it from externalId / ibn.
 */
export function normaliseAnsweredQuestionDetail(
  raw: Record<string, unknown>,
): DB_AnsweredQuestionDetail {
  return {
    questionId: String(raw.questionId ?? ""),
    externalId:
      raw.externalId != null
        ? String(raw.externalId)
        : raw.external_id != null
          ? String(raw.external_id)
          : null,
    ibn: raw.ibn != null ? String(raw.ibn) : null,
    // plainQuestion intentionally dropped even if present (legacy row)
  };
}
