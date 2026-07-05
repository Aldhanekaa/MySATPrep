/**
 * Bookmark (Saved Questions) Database Operations
 *
 * CRUD operations for saved questions using parameterized queries.
 *
 * Validates: Requirements 7.6, 8.5, 8.6
 */

import { pool } from "@/lib/auth";
import type { SavedQuestion } from "@/lib/types/userData";
import type { PlainQuestionType } from "@/types/question";
import { slimPlainQuestion } from "@/lib/db/bookmarkTransforms";

interface DbSavedQuestion {
  id: string;
  userId: string;
  assessment: string;
  questionId: string;
  externalId: string | null;
  ibn: string | null;
  // plain_question column: new rows store a slim 3-field object; old rows store
  // the full PlainQuestionType. The bookmarksToSavedQuestions() mapping in
  // use-resolved-user-data.ts handles both shapes transparently.
  plainQuestion: Record<string, unknown> | null;
  timestamp: Date;
}

function rowToSavedQuestion(row: DbSavedQuestion): SavedQuestion {
  return {
    id: row.id,
    userId: row.userId,
    assessment: row.assessment,
    questionId: row.questionId,
    externalId: row.externalId,
    ibn: row.ibn,
    // Pass through as-is — bookmarksToSavedQuestions() reconstructs the full
    // PlainQuestionType from either the slim or legacy full shape at read time.
    plainQuestion: row.plainQuestion as PlainQuestionType | null,
    timestamp: row.timestamp.toISOString(),
  };
}

/**
 * Fetch all saved questions for a user, ordered newest first.
 * Validates: Requirement 7.6
 */
export async function getSavedQuestions(
  userId: string,
): Promise<SavedQuestion[]> {
  const result = await pool.query<DbSavedQuestion>(
    `SELECT id,
            user_id      AS "userId",
            assessment,
            question_id  AS "questionId",
            external_id  AS "externalId",
            ibn,
            plain_question AS "plainQuestion",
            timestamp
     FROM saved_questions
     WHERE user_id = $1
     ORDER BY timestamp DESC`,
    [userId],
  );

  return result.rows.map(rowToSavedQuestion);
}

/**
 * Insert a saved question. Ignores duplicates (same user + question_id).
 * Validates: Requirement 8.5
 */
export async function addSavedQuestion(
  userId: string,
  questionData: Omit<SavedQuestion, "id" | "userId">,
): Promise<SavedQuestion> {
  const result = await pool.query<DbSavedQuestion>(
    `INSERT INTO saved_questions
       (user_id, assessment, question_id, external_id, ibn, plain_question)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, question_id) DO UPDATE SET
       assessment     = EXCLUDED.assessment,
       external_id    = EXCLUDED.external_id,
       ibn            = EXCLUDED.ibn,
       plain_question = EXCLUDED.plain_question
     RETURNING
       id,
       user_id        AS "userId",
       assessment,
       question_id    AS "questionId",
       external_id    AS "externalId",
       ibn,
       plain_question AS "plainQuestion",
       timestamp`,
    [
      userId,
      questionData.assessment,
      questionData.questionId,
      questionData.externalId ?? null,
      questionData.ibn ?? null,
      // Write only the 3-field slim object instead of the full PlainQuestionType.
      // This keeps the column lean while preserving all data that consumers
      // actually read (primary_class_cd, skill_cd, difficulty).
      questionData.plainQuestion
        ? JSON.stringify(
            slimPlainQuestion(questionData.plainQuestion as PlainQuestionType),
          )
        : null,
    ],
  );

  return rowToSavedQuestion(result.rows[0]);
}

/**
 * Delete a saved question by question ID for a specific user.
 * Returns true if a row was deleted, false if it did not exist.
 * Validates: Requirement 8.6
 */
export async function removeSavedQuestion(
  userId: string,
  questionId: string,
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM saved_questions
     WHERE user_id = $1 AND question_id = $2`,
    [userId, questionId],
  );

  return (result.rowCount ?? 0) > 0;
}
