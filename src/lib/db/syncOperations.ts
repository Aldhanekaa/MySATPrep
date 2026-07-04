/**
 * Sync Database Operations
 *
 * Transactional upserts for all user data categories. Unlike migrateUserData
 * (which uses ON CONFLICT DO NOTHING), this performs a true merge — combining
 * arrays and updating scalars so that the merged result lands in the DB.
 */

import { pool } from "@/lib/auth";
import type { MigrationSummary } from "@/lib/types/api";
import type { ValidatedMigrationPayload } from "@/lib/validation/migrationSchema";

/**
 * Sync all user data inside a single database transaction.
 * On any error, the transaction is rolled back and the error re-thrown.
 */
export async function syncUserData(
  userId: string,
  data: ValidatedMigrationPayload,
): Promise<MigrationSummary> {
  const client = await pool.connect();

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

    // ── Profile ──────────────────────────────────────────────────────────────
    // Upsert: take the higher totalXP/questionsAnswered/correct/incorrect,
    // merge xpHistory deduplicating by questionId+timestamp.
    if (data.profile) {
      await client.query(
        `INSERT INTO user_profiles
           (user_id, total_xp, level, questions_answered, correct_answers,
            incorrect_answers, last_activity, xp_history)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO UPDATE SET
           total_xp           = GREATEST(user_profiles.total_xp, EXCLUDED.total_xp),
           level              = GREATEST(user_profiles.level, EXCLUDED.level),
           questions_answered = GREATEST(user_profiles.questions_answered, EXCLUDED.questions_answered),
           correct_answers    = GREATEST(user_profiles.correct_answers, EXCLUDED.correct_answers),
           incorrect_answers  = GREATEST(user_profiles.incorrect_answers, EXCLUDED.incorrect_answers),
           last_activity      = GREATEST(user_profiles.last_activity, EXCLUDED.last_activity),
           xp_history         = (
             SELECT jsonb_agg(entry ORDER BY (entry->>'timestamp') ASC)
             FROM (
               SELECT DISTINCT ON ((entry->>'questionId'), (entry->>'timestamp')) entry
               FROM (
                 SELECT jsonb_array_elements(user_profiles.xp_history) AS entry
                 UNION ALL
                 SELECT jsonb_array_elements(EXCLUDED.xp_history) AS entry
               ) combined
             ) deduped
           ),
           updated_at         = CURRENT_TIMESTAMP`,
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

    // ── Statistics ───────────────────────────────────────────────────────────
    // Upsert: merge answeredQuestions arrays (union), merge statistics maps.
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
           ON CONFLICT (user_id, assessment) DO UPDATE SET
             answered_questions = (
               SELECT jsonb_agg(DISTINCT val)
               FROM (
                 SELECT jsonb_array_elements_text(practice_statistics.answered_questions::jsonb) AS val
                 UNION
                 SELECT jsonb_array_elements_text(EXCLUDED.answered_questions::jsonb) AS val
               ) merged
             ),
             answered_questions_detailed = (
               SELECT jsonb_agg(entry)
               FROM (
                 SELECT DISTINCT ON (entry->>'questionId') entry
                 FROM (
                   SELECT jsonb_array_elements(practice_statistics.answered_questions_detailed::jsonb) AS entry
                   UNION ALL
                   SELECT jsonb_array_elements(EXCLUDED.answered_questions_detailed::jsonb) AS entry
                 ) combined
                 ORDER BY entry->>'questionId', entry->>'timestamp' DESC NULLS LAST
               ) deduped
             ),
             statistics         = practice_statistics.statistics || EXCLUDED.statistics,
             updated_at         = CURRENT_TIMESTAMP`,
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

    // ── Sessions ─────────────────────────────────────────────────────────────
    // Upsert by session_id: update session_data and status if already exists.
    if (data.sessions && data.sessions.length > 0) {
      for (const session of data.sessions) {
        await client.query(
          `INSERT INTO practice_sessions
             (user_id, session_id, session_data, status)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (session_id) DO UPDATE SET
             session_data = EXCLUDED.session_data,
             status       = EXCLUDED.status,
             updated_at   = CURRENT_TIMESTAMP`,
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

    // ── Bookmarks ─────────────────────────────────────────────────────────────
    // Upsert by (user_id, question_id): update metadata if already exists.
    if (data.bookmarks && data.bookmarks.length > 0) {
      for (const bookmark of data.bookmarks) {
        await client.query(
          `INSERT INTO saved_questions
             (user_id, assessment, question_id, external_id, ibn, plain_question)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id, question_id) DO UPDATE SET
             assessment    = EXCLUDED.assessment,
             external_id   = COALESCE(EXCLUDED.external_id, saved_questions.external_id),
             ibn           = COALESCE(EXCLUDED.ibn, saved_questions.ibn),
             plain_question = COALESCE(EXCLUDED.plain_question, saved_questions.plain_question)`,
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

    // ── Collections ───────────────────────────────────────────────────────────
    // Upsert by collection_id: merge questionIds arrays, update metadata.
    if (data.collections && data.collections.length > 0) {
      for (const collection of data.collections) {
        await client.query(
          `INSERT INTO saved_collections
             (user_id, collection_id, name, description, question_ids, question_details, color)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (collection_id) DO UPDATE SET
             name             = EXCLUDED.name,
             description      = COALESCE(EXCLUDED.description, saved_collections.description),
             question_ids     = (
               SELECT jsonb_agg(DISTINCT val)
               FROM (
                 SELECT jsonb_array_elements_text(saved_collections.question_ids::jsonb) AS val
                 UNION
                 SELECT jsonb_array_elements_text(EXCLUDED.question_ids::jsonb) AS val
               ) merged
             ),
             question_details = (
               SELECT jsonb_agg(entry)
               FROM (
                 SELECT DISTINCT ON (entry->>'questionId') entry
                 FROM (
                   SELECT jsonb_array_elements(saved_collections.question_details::jsonb) AS entry
                   UNION ALL
                   SELECT jsonb_array_elements(EXCLUDED.question_details::jsonb) AS entry
                 ) combined
                 ORDER BY entry->>'questionId'
               ) deduped
             ),
             color            = COALESCE(EXCLUDED.color, saved_collections.color),
             updated_at       = CURRENT_TIMESTAMP`,
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

    // ── Vocabulary ────────────────────────────────────────────────────────────
    // Upsert: shallow-merge the JSONB maps (incoming keys win over existing).
    if (data.vocabulary && Object.keys(data.vocabulary).length > 0) {
      await client.query(
        `INSERT INTO vocabulary_progress (user_id, progress_data)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET
           progress_data = vocabulary_progress.progress_data || EXCLUDED.progress_data,
           updated_at    = CURRENT_TIMESTAMP`,
        [userId, JSON.stringify(data.vocabulary)],
      );
      summary.vocabularyMigrated = true;
    }

    // ── Preferences ───────────────────────────────────────────────────────────
    // Upsert: incoming preferences overwrite existing keys (user's local choice wins).
    if (data.preferences && Object.keys(data.preferences).length > 0) {
      await client.query(
        `INSERT INTO user_preferences (user_id, preferences_data)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET
           preferences_data = user_preferences.preferences_data || EXCLUDED.preferences_data,
           updated_at       = CURRENT_TIMESTAMP`,
        [userId, JSON.stringify(data.preferences)],
      );
      summary.preferencesMigrated = true;
    }

    await client.query("COMMIT");
    return summary;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
