/**
 * Vocabulary, Preferences, Question Notes, and Answer History Database Operations
 *
 * CRUD operations for vocabulary progress, user preferences, question notes,
 * and answer history using parameterized queries.
 *
 * Validates: Requirements 7.8, 7.9, 8.10, 1.1, 1.7
 */

import { pool } from "@/lib/auth";
import type { VocabularyProgress, UserPreferences } from "@/lib/types/userData";
import type { QuestionNotes } from "@/types/questionNotes";

/**
 * Answer history shape — keyed by questionId, each entry stores an array
 * of answer attempts for that question.
 */
export interface AnswerHistory {
  [questionId: string]: Array<{
    userChoice: string;
    time: number;
    status: "correct" | "incorrect";
  }>;
}

// ─── Vocabulary Progress ──────────────────────────────────────────────────────

/**
 * Fetch vocabulary progress for a user. Returns null if no record exists yet.
 * Validates: Requirement 7.8
 */
export async function getVocabularyProgress(
  userId: string,
): Promise<VocabularyProgress | null> {
  const result = await pool.query<{ progressData: VocabularyProgress }>(
    `SELECT progress_data AS "progressData"
     FROM vocabulary_progress
     WHERE user_id = $1
     LIMIT 1`,
    [userId],
  );

  return result.rows[0]?.progressData ?? null;
}

/**
 * Insert or update vocabulary progress for a user.
 * Validates: Requirement 8.10
 */
export async function updateVocabularyProgress(
  userId: string,
  data: VocabularyProgress,
): Promise<VocabularyProgress> {
  const result = await pool.query<{ progressData: VocabularyProgress }>(
    `INSERT INTO vocabulary_progress (user_id, progress_data)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET
       progress_data = EXCLUDED.progress_data,
       updated_at    = CURRENT_TIMESTAMP
     RETURNING progress_data AS "progressData"`,
    [userId, JSON.stringify(data)],
  );

  return result.rows[0].progressData;
}

// ─── User Preferences ────────────────────────────────────────────────────────

/**
 * Fetch user preferences. Returns null if no record exists yet.
 * Validates: Requirement 7.9
 */
export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences | null> {
  const result = await pool.query<{ preferencesData: UserPreferences }>(
    `SELECT preferences_data AS "preferencesData"
     FROM user_preferences
     WHERE user_id = $1
     LIMIT 1`,
    [userId],
  );

  return result.rows[0]?.preferencesData ?? null;
}

/**
 * Insert or update user preferences for a user.
 * Validates: Requirement 8.10
 */
export async function updateUserPreferences(
  userId: string,
  data: UserPreferences,
): Promise<UserPreferences> {
  const result = await pool.query<{ preferencesData: UserPreferences }>(
    `INSERT INTO user_preferences (user_id, preferences_data)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET
       preferences_data = EXCLUDED.preferences_data,
       updated_at       = CURRENT_TIMESTAMP
     RETURNING preferences_data AS "preferencesData"`,
    [userId, JSON.stringify(data)],
  );

  return result.rows[0].preferencesData;
}

// ─── Question Notes ───────────────────────────────────────────────────────────

/**
 * Fetch question notes for a user. Returns null if no record exists yet.
 * Validates: Requirement 1.7
 */
export async function getQuestionNotes(
  userId: string,
): Promise<QuestionNotes | null> {
  const result = await pool.query<{ notesData: QuestionNotes }>(
    `SELECT notes_data AS "notesData"
     FROM question_notes
     WHERE user_id = $1
     LIMIT 1`,
    [userId],
  );

  return result.rows[0]?.notesData ?? null;
}

/**
 * Insert or update question notes for a user.
 * Validates: Requirements 1.1, 1.5
 */
export async function updateQuestionNotes(
  userId: string,
  data: QuestionNotes,
): Promise<QuestionNotes> {
  const result = await pool.query<{ notesData: QuestionNotes }>(
    `INSERT INTO question_notes (user_id, notes_data)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET
       notes_data = EXCLUDED.notes_data,
       updated_at = CURRENT_TIMESTAMP
     RETURNING notes_data AS "notesData"`,
    [userId, JSON.stringify(data)],
  );

  return result.rows[0].notesData;
}

// ─── Answer History ───────────────────────────────────────────────────────────

/**
 * Fetch answer history for a user. Returns null if no record exists yet.
 */
export async function getAnswerHistory(
  userId: string,
): Promise<AnswerHistory | null> {
  const result = await pool.query<{ historyData: AnswerHistory }>(
    `SELECT history_data AS "historyData"
     FROM answer_history
     WHERE user_id = $1
     LIMIT 1`,
    [userId],
  );

  return result.rows[0]?.historyData ?? null;
}

/**
 * Insert or update answer history for a user.
 */
export async function updateAnswerHistory(
  userId: string,
  data: AnswerHistory,
): Promise<AnswerHistory> {
  const result = await pool.query<{ historyData: AnswerHistory }>(
    `INSERT INTO answer_history (user_id, history_data)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET
       history_data = EXCLUDED.history_data,
       updated_at   = CURRENT_TIMESTAMP
     RETURNING history_data AS "historyData"`,
    [userId, JSON.stringify(data)],
  );

  return result.rows[0].historyData;
}
