/**
 * Migration Database Operations
 *
 * Transactional bulk-insert of all localStorage data categories into the
 * database for an authenticated user. Either all inserts commit or all
 * are rolled back on any failure.
 *
 * Validates: Requirements 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.11
 */

import { getPool } from "@/lib/db";
import type { MigrationSummary } from "@/lib/types/api";
import type { ValidatedMigrationPayload } from "@/lib/validation/migrationSchema";

/**
 * Migrate all user data inside a single database transaction.
 * On any error, the transaction is rolled back and the error re-thrown.
 *
 * Validates: Requirements 6.4–6.9, 6.11
 */
export async function migrateUserData(
  userId: string,
  data: ValidatedMigrationPayload,
): Promise<MigrationSummary> {
  const client = await getPool().connect();

  const summary: MigrationSummary = {
    profileMigrated: false,
    statisticsMigrated: false,
    sessionsMigrated: 0,
    bookmarksMigrated: 0,
    collectionsMigrated: 0,
    vocabularyMigrated: false,
    preferencesMigrated: false,
    notesMigrated: false,
    answerHistoryMigrated: false,
    practicePerformanceMigrated: false,
  };

  try {
    await client.query("BEGIN");

    // ── Profile (Requirement 6.4) ────────────────────────────────────────────
    if (data.profile) {
      await client.query(
        `INSERT INTO user_profiles
           (user_id, total_xp, level, questions_answered, correct_answers,
            incorrect_answers, last_activity, xp_history)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO NOTHING`,
        [
          userId,
          data.profile.totalXP ?? 0,
          data.profile.level ?? 0,
          data.profile.questionsAnswered ?? 0,
          data.profile.correctAnswers ?? 0,
          data.profile.incorrectAnswers ?? 0,
          data.profile.lastActivity ?? null,
          JSON.stringify(data.profile.xpHistory ?? []),
        ],
      );
      summary.profileMigrated = true;
    }

    // ── Statistics (Requirement 6.5) ─────────────────────────────────────────
    if (data.statistics && Object.keys(data.statistics).length > 0) {
      for (const [assessment, stats] of Object.entries(data.statistics)) {
        if (!stats) continue;
        const answeredQuestions = stats.answeredQuestions ?? [];
        const answeredQuestionsDetailed = stats.answeredQuestionsDetailed ?? [];
        const statistics = stats.statistics ?? {};
        await client.query(
          `INSERT INTO practice_statistics
             (user_id, assessment, answered_questions, answered_questions_detailed, statistics)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, assessment) DO NOTHING`,
          [
            userId,
            assessment,
            JSON.stringify(answeredQuestions),
            JSON.stringify(answeredQuestionsDetailed),
            JSON.stringify(statistics),
          ],
        );
      }
      summary.statisticsMigrated = true;
    }

    // ── Sessions (Requirement 6.6) ────────────────────────────────────────────
    if (data.sessions && data.sessions.length > 0) {
      for (const session of data.sessions) {
        await client.query(
          `INSERT INTO practice_sessions
             (user_id, session_id, session_data, status)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (session_id) DO NOTHING`,
          [
            userId,
            session.sessionId,
            JSON.stringify(session),
            session.status ?? "not_started",
          ],
        );
        summary.sessionsMigrated++;
      }
    }

    // ── Bookmarks (Requirement 6.7) ───────────────────────────────────────────
    if (data.bookmarks && data.bookmarks.length > 0) {
      for (const bookmark of data.bookmarks) {
        await client.query(
          `INSERT INTO saved_questions
             (user_id, assessment, question_id, external_id, ibn, plain_question)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id, question_id) DO NOTHING`,
          [
            userId,
            bookmark.assessment,
            bookmark.questionId,
            bookmark.externalId ?? null,
            bookmark.ibn ?? null,
            bookmark.plainQuestion
              ? JSON.stringify(bookmark.plainQuestion)
              : null,
          ],
        );
        summary.bookmarksMigrated++;
      }
    }

    // ── Collections (Requirement 6.8) ─────────────────────────────────────────
    if (data.collections && data.collections.length > 0) {
      for (const collection of data.collections) {
        await client.query(
          `INSERT INTO saved_collections
             (user_id, collection_id, name, description, question_ids, question_details, color)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (collection_id) DO NOTHING`,
          [
            userId,
            collection.collectionId,
            collection.name,
            collection.description ?? null,
            JSON.stringify(collection.questionIds ?? []),
            JSON.stringify(collection.questionDetails ?? []),
            collection.color ?? null,
          ],
        );
        summary.collectionsMigrated++;
      }
    }

    // ── Vocabulary (Requirement 6.9) ──────────────────────────────────────────
    if (data.vocabulary && Object.keys(data.vocabulary).length > 0) {
      await client.query(
        `INSERT INTO vocabulary_progress (user_id, progress_data)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, JSON.stringify(data.vocabulary)],
      );
      summary.vocabularyMigrated = true;
    }

    // ── Preferences ───────────────────────────────────────────────────────────
    if (data.preferences && Object.keys(data.preferences).length > 0) {
      await client.query(
        `INSERT INTO user_preferences (user_id, preferences_data)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, JSON.stringify(data.preferences)],
      );
      summary.preferencesMigrated = true;
    }

    // ── Question Notes (Requirement 11.4) ─────────────────────────────────────
    if (data.questionNotes && Object.keys(data.questionNotes).length > 0) {
      await client.query(
        `INSERT INTO question_notes (user_id, notes_data)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, JSON.stringify(data.questionNotes)],
      );
      summary.notesMigrated = true;
    }

    // ── Answer History (Requirement 11.5) ─────────────────────────────────────
    if (data.answerHistory && Object.keys(data.answerHistory).length > 0) {
      await client.query(
        `INSERT INTO answer_history (user_id, history_data)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, JSON.stringify(data.answerHistory)],
      );
      summary.answerHistoryMigrated = true;
    }

    // ── Vocab Practice Performance ────────────────────────────────────────────
    if (data.practicePerformance) {
      await client.query(
        `INSERT INTO vocab_practice_performance (user_id, performance_data)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, JSON.stringify(data.practicePerformance)],
      );
      summary.practicePerformanceMigrated = true;
    }

    await client.query("COMMIT");
    return summary;
  } catch (error) {
    // Requirement 6.11 – rollback all changes on any failure
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
