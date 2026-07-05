/**
 * Sync Database Operations
 *
 * Upserts for all user data categories. Each category is written as a
 * standalone statement via pool.query() — no manual BEGIN/COMMIT.
 *
 * Why no transaction:
 *   The app uses a PgBouncer pooler (DATABASE_URL). PgBouncer in transaction
 *   mode multiplexes statements across backend connections, so a client-level
 *   BEGIN/COMMIT does not wrap the same backend connection. Calling BEGIN on
 *   the pooler silently succeeds but the subsequent statements land on
 *   different connections, meaning COMMIT never actually commits. The result
 *   is a "success" response with zero rows changed.
 *
 *   Each upsert here is already atomic at the statement level (ON CONFLICT DO
 *   UPDATE is a single atomic operation in Postgres), so per-statement
 *   auto-commit is correct and safe.
 */

import { directPool } from "@/lib/auth";
import type { MigrationSummary } from "@/lib/types/api";
import type { ValidatedMigrationPayload } from "@/lib/validation/migrationSchema";
import type { AnsweredQuestion, ClassStatistics } from "@/types/statistics";
import type { PracticeSession } from "@/types/session";
import type { QuestionDetail } from "@/lib/types/userData";
import type { PlainQuestionType } from "@/types/question";
import {
  stripAnsweredQuestionsDetailed,
  stripClassStatistics,
} from "@/lib/db/statsTransforms";
import { stripSessionForDb } from "@/lib/db/sessionTransforms";
import { slimPlainQuestion } from "@/lib/db/bookmarkTransforms";

// ─── Collection question_details strip helper ─────────────────────────────────
function stripQuestionDetail(detail: QuestionDetail): {
  questionId: string;
  externalId: string | null;
  ibn: string | null;
} {
  return {
    questionId: detail.questionId,
    externalId: detail.externalId ?? null,
    ibn: detail.ibn ?? null,
  };
}

// Alias for clarity inside this file
const db = directPool;

export async function syncUserData(
  userId: string,
  data: ValidatedMigrationPayload,
): Promise<MigrationSummary> {
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

  // ── Profile ────────────────────────────────────────────────────────────────
  if (data.profile) {
    await db.query(
      `INSERT INTO user_profiles
         (user_id, total_xp, level, questions_answered, correct_answers,
          incorrect_answers, last_activity, xp_history)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       ON CONFLICT (user_id) DO UPDATE SET
         total_xp           = GREATEST(user_profiles.total_xp,           EXCLUDED.total_xp),
         level              = GREATEST(user_profiles.level,              EXCLUDED.level),
         questions_answered = GREATEST(user_profiles.questions_answered, EXCLUDED.questions_answered),
         correct_answers    = GREATEST(user_profiles.correct_answers,    EXCLUDED.correct_answers),
         incorrect_answers  = GREATEST(user_profiles.incorrect_answers,  EXCLUDED.incorrect_answers),
         last_activity      = GREATEST(user_profiles.last_activity,      EXCLUDED.last_activity),
         xp_history = (
           SELECT jsonb_agg(entry ORDER BY (entry->>'timestamp') ASC)
           FROM (
             SELECT DISTINCT ON ((entry->>'questionId'), (entry->>'timestamp')) entry
             FROM (
               SELECT jsonb_array_elements(user_profiles.xp_history) AS entry
               UNION ALL
               SELECT jsonb_array_elements(EXCLUDED.xp_history)      AS entry
             ) combined
           ) deduped
         ),
         updated_at = CURRENT_TIMESTAMP`,
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

  // ── Statistics ─────────────────────────────────────────────────────────────
  if (data.statistics && Object.keys(data.statistics).length > 0) {
    for (const [assessment, stats] of Object.entries(data.statistics)) {
      if (!stats) continue;

      // Strip plainQuestion and promote primary_class_cd / skill_cd before
      // writing. The SQL merge uses DISTINCT ON (entry->>'questionId') which
      // only looks at the key — not at plainQuestion — so stripping here is
      // safe and does not affect the dedup logic.
      const strippedDetailed = stripAnsweredQuestionsDetailed(
        (stats.answeredQuestionsDetailed ?? []) as AnsweredQuestion[],
      );
      const strippedStatistics = stripClassStatistics(
        (stats.statistics ?? {}) as ClassStatistics,
      );

      await db.query(
        `INSERT INTO practice_statistics
           (user_id, assessment, answered_questions, answered_questions_detailed, statistics)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb)
         ON CONFLICT (user_id, assessment) DO UPDATE SET
           answered_questions = (
             SELECT jsonb_agg(DISTINCT val)
             FROM (
               SELECT jsonb_array_elements_text(practice_statistics.answered_questions) AS val
               UNION
               SELECT jsonb_array_elements_text(EXCLUDED.answered_questions)            AS val
             ) merged
           ),
           answered_questions_detailed = (
             SELECT jsonb_agg(entry)
             FROM (
               SELECT DISTINCT ON (entry->>'questionId') entry
               FROM (
                 SELECT jsonb_array_elements(practice_statistics.answered_questions_detailed) AS entry
                 UNION ALL
                 SELECT jsonb_array_elements(EXCLUDED.answered_questions_detailed)            AS entry
               ) combined
               ORDER BY entry->>'questionId', (entry->>'timestamp') DESC NULLS LAST
             ) deduped
           ),
           statistics = practice_statistics.statistics || EXCLUDED.statistics,
           updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          assessment,
          JSON.stringify(stats.answeredQuestions ?? []),
          JSON.stringify(strippedDetailed),
          JSON.stringify(strippedStatistics),
        ],
      );
    }
    summary.statisticsMigrated = true;
  }

  // ── Sessions ───────────────────────────────────────────────────────────────
  if (data.sessions && data.sessions.length > 0) {
    for (const session of data.sessions) {
      // Strip plainQuestion from answeredQuestionDetails and remove
      // questionCorrectChoices / correctAnswers / accuracyPercentage.
      const stripped = stripSessionForDb(
        session as PracticeSession & {
          correctAnswers?: number;
          accuracyPercentage?: number;
        },
      );

      await db.query(
        `INSERT INTO practice_sessions
           (user_id, session_id, session_data, status)
         VALUES ($1, $2, $3::jsonb, $4)
         ON CONFLICT (user_id, session_id) DO UPDATE SET
           session_data = EXCLUDED.session_data,
           status       = EXCLUDED.status,
           updated_at   = CURRENT_TIMESTAMP`,
        [
          userId,
          session.sessionId,
          JSON.stringify(stripped),
          session.status ?? "not_started",
        ],
      );
      summary.sessionsMigrated++;
    }
  }

  // ── Bookmarks ──────────────────────────────────────────────────────────────
  if (data.bookmarks && data.bookmarks.length > 0) {
    for (const bookmark of data.bookmarks) {
      try {
        await db.query(
          `INSERT INTO saved_questions
             (user_id, assessment, question_id, external_id, ibn, plain_question)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb)
           ON CONFLICT (user_id, question_id) DO UPDATE SET
             assessment     = EXCLUDED.assessment,
             external_id    = COALESCE(EXCLUDED.external_id,    saved_questions.external_id),
             ibn            = COALESCE(EXCLUDED.ibn,            saved_questions.ibn),
             plain_question = COALESCE(EXCLUDED.plain_question, saved_questions.plain_question)`,
          [
            userId,
            bookmark.assessment,
            bookmark.questionId,
            bookmark.externalId ?? null,
            bookmark.ibn ?? null,
            bookmark.plainQuestion
              ? JSON.stringify(
                  slimPlainQuestion(
                    bookmark.plainQuestion as PlainQuestionType,
                  ),
                )
              : null,
          ],
        );
        summary.bookmarksMigrated++;
      } catch (err) {
        console.error(
          `[sync] bookmark FAILED: ${bookmark.questionId}`,
          err instanceof Error ? err.message : err,
        );
        throw err;
      }
    }
  }

  // ── Collections ────────────────────────────────────────────────────────────
  if (data.collections && data.collections.length > 0) {
    for (const collection of data.collections) {
      try {
        await db.query(
          `INSERT INTO saved_collections
           (user_id, collection_id, name, description, question_ids, question_details, color)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
         ON CONFLICT (user_id, collection_id) DO UPDATE SET
           name        = EXCLUDED.name,
           description = COALESCE(EXCLUDED.description, saved_collections.description),
           question_ids = (
             SELECT jsonb_agg(DISTINCT val)
             FROM (
               SELECT jsonb_array_elements_text(saved_collections.question_ids) AS val
               UNION
               SELECT jsonb_array_elements_text(EXCLUDED.question_ids)          AS val
             ) merged
           ),
           question_details = (
             SELECT jsonb_agg(entry)
             FROM (
               SELECT DISTINCT ON (entry->>'questionId') entry
               FROM (
                 SELECT jsonb_array_elements(saved_collections.question_details) AS entry
                 UNION ALL
                 SELECT jsonb_array_elements(EXCLUDED.question_details)          AS entry
               ) combined
               ORDER BY entry->>'questionId'
             ) deduped
           ),
           color      = COALESCE(EXCLUDED.color, saved_collections.color),
           updated_at = CURRENT_TIMESTAMP
         WHERE saved_collections.user_id = EXCLUDED.user_id`,
          [
            userId,
            collection.collectionId,
            collection.name,
            collection.description ?? null,
            JSON.stringify(collection.questionIds ?? []),
            JSON.stringify(
              (collection.questionDetails ?? []).map(stripQuestionDetail),
            ),
            collection.color ?? null,
          ],
        );
        summary.collectionsMigrated++;
      } catch (err) {
        console.error(
          `[sync] collection FAILED: ${collection.collectionId}`,
          err instanceof Error ? err.message : err,
        );
        throw err;
      }
    }
  }

  // ── Vocabulary ─────────────────────────────────────────────────────────────
  if (data.vocabulary && Object.keys(data.vocabulary).length > 0) {
    await db.query(
      `INSERT INTO vocabulary_progress (user_id, progress_data)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id) DO UPDATE SET
         progress_data = vocabulary_progress.progress_data || EXCLUDED.progress_data,
         updated_at    = CURRENT_TIMESTAMP`,
      [userId, JSON.stringify(data.vocabulary)],
    );
    summary.vocabularyMigrated = true;
  }

  // ── Preferences ────────────────────────────────────────────────────────────
  if (data.preferences && Object.keys(data.preferences).length > 0) {
    await db.query(
      `INSERT INTO user_preferences (user_id, preferences_data)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id) DO UPDATE SET
         preferences_data = user_preferences.preferences_data || EXCLUDED.preferences_data,
         updated_at       = CURRENT_TIMESTAMP`,
      [userId, JSON.stringify(data.preferences)],
    );
    summary.preferencesMigrated = true;
  }

  // ── Question Notes ─────────────────────────────────────────────────────────
  if (data.questionNotes && Object.keys(data.questionNotes).length > 0) {
    await db.query(
      `INSERT INTO question_notes (user_id, notes_data)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id) DO UPDATE SET
         notes_data = question_notes.notes_data || EXCLUDED.notes_data,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, JSON.stringify(data.questionNotes)],
    );
    summary.notesMigrated = true;
  }

  // ── Answer History ─────────────────────────────────────────────────────────
  if (data.answerHistory && Object.keys(data.answerHistory).length > 0) {
    await db.query(
      `INSERT INTO answer_history (user_id, history_data)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id) DO UPDATE SET
         history_data = answer_history.history_data || EXCLUDED.history_data,
         updated_at   = CURRENT_TIMESTAMP`,
      [userId, JSON.stringify(data.answerHistory)],
    );
    summary.answerHistoryMigrated = true;
  }

  // ── Vocab Practice Performance ─────────────────────────────────────────────
  if (data.practicePerformance) {
    await db.query(
      `INSERT INTO vocab_practice_performance (user_id, performance_data)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id) DO UPDATE SET
         performance_data = jsonb_build_object(
           'attempts', (
             SELECT jsonb_agg(entry)
             FROM (
               SELECT DISTINCT ON ((entry->>'word'), (entry->>'timestamp')) entry
               FROM (
                 SELECT jsonb_array_elements(vocab_practice_performance.performance_data->'attempts') AS entry
                 UNION ALL
                 SELECT jsonb_array_elements(EXCLUDED.performance_data->'attempts')                   AS entry
               ) combined
             ) deduped
           ),
           'wordPerformance',
             vocab_practice_performance.performance_data->'wordPerformance' ||
             EXCLUDED.performance_data->'wordPerformance',
           'lastUpdated',
             GREATEST(
               (vocab_practice_performance.performance_data->>'lastUpdated')::bigint,
               (EXCLUDED.performance_data->>'lastUpdated')::bigint
             ),
           'totalQuizzesTaken',
             GREATEST(
               (vocab_practice_performance.performance_data->>'totalQuizzesTaken')::int,
               (EXCLUDED.performance_data->>'totalQuizzesTaken')::int
             ),
           'overallAccuracy',
             CASE
               WHEN (vocab_practice_performance.performance_data->>'totalQuizzesTaken')::int >=
                    (EXCLUDED.performance_data->>'totalQuizzesTaken')::int
               THEN vocab_practice_performance.performance_data->'overallAccuracy'
               ELSE EXCLUDED.performance_data->'overallAccuracy'
             END,
           'strongWords',
             CASE
               WHEN (vocab_practice_performance.performance_data->>'totalQuizzesTaken')::int >=
                    (EXCLUDED.performance_data->>'totalQuizzesTaken')::int
               THEN vocab_practice_performance.performance_data->'strongWords'
               ELSE EXCLUDED.performance_data->'strongWords'
             END,
           'weakWords',
             CASE
               WHEN (vocab_practice_performance.performance_data->>'totalQuizzesTaken')::int >=
                    (EXCLUDED.performance_data->>'totalQuizzesTaken')::int
               THEN vocab_practice_performance.performance_data->'weakWords'
               ELSE EXCLUDED.performance_data->'weakWords'
             END,
           'improvingWords',
             CASE
               WHEN (vocab_practice_performance.performance_data->>'totalQuizzesTaken')::int >=
                    (EXCLUDED.performance_data->>'totalQuizzesTaken')::int
               THEN vocab_practice_performance.performance_data->'improvingWords'
               ELSE EXCLUDED.performance_data->'improvingWords'
             END
         ),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, JSON.stringify(data.practicePerformance)],
    );
    summary.practicePerformanceMigrated = true;
  }

  return summary;
}
