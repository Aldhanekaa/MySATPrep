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

// Alias for clarity inside this file
const db = directPool;

export async function syncUserData(
  userId: string,
  data: ValidatedMigrationPayload,
): Promise<MigrationSummary> {
  console.log("\n====== syncUserData called ======");
  console.log("userId:", userId);
  console.log("bookmarks:", data.bookmarks?.length ?? 0);
  console.log("collections:", data.collections?.length ?? 0);
  console.log("sessions:", data.sessions?.length ?? 0);
  console.log("hasProfile:", !!data.profile);
  console.log("hasVocabulary:", !!data.vocabulary);
  console.log("=================================\n");
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
          JSON.stringify(stats.answeredQuestionsDetailed ?? []),
          JSON.stringify(stats.statistics ?? {}),
        ],
      );
    }
    summary.statisticsMigrated = true;
  }

  // ── Sessions ───────────────────────────────────────────────────────────────
  if (data.sessions && data.sessions.length > 0) {
    for (const session of data.sessions) {
      await db.query(
        `INSERT INTO practice_sessions
           (user_id, session_id, session_data, status)
         VALUES ($1, $2, $3::jsonb, $4)
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

  // ── Bookmarks ──────────────────────────────────────────────────────────────
  if (data.bookmarks && data.bookmarks.length > 0) {
    // ── DEBUG: print copy-pasteable SQL for each bookmark ──
    console.log("\n=== BOOKMARK SQL (copy-paste to psql) ===");
    for (const bm of data.bookmarks) {
      const pq = bm.plainQuestion
        ? JSON.stringify(bm.plainQuestion).replace(/'/g, "''")
        : "null";
      console.log(
        `INSERT INTO saved_questions (user_id, assessment, question_id, external_id, ibn, plain_question)\n` +
          `VALUES ('${userId}', '${bm.assessment}', '${bm.questionId}', ` +
          `${bm.externalId ? `'${bm.externalId}'` : "null"}, ` +
          `${bm.ibn ? `'${bm.ibn}'` : "null"}, ` +
          `${bm.plainQuestion ? `'${pq}'::jsonb` : "null"})\n` +
          `ON CONFLICT (user_id, question_id) DO UPDATE SET assessment = EXCLUDED.assessment;\n`,
      );
    }
    console.log("=========================================\n");

    for (const bookmark of data.bookmarks) {
      try {
        const result = await db.query(
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
              ? JSON.stringify(bookmark.plainQuestion)
              : null,
          ],
        );
        console.log(
          `[sync] bookmark OK: ${bookmark.questionId} rowCount=${result.rowCount} cmd=${result.command}`,
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
    // ── DEBUG: print copy-pasteable SQL for each collection ──
    console.log("\n=== COLLECTION SQL (copy-paste to psql) ===");
    for (const col of data.collections) {
      console.log(
        `INSERT INTO saved_collections (user_id, collection_id, name, description, question_ids, question_details, color)\n` +
          `VALUES ('${userId}', '${col.collectionId}', '${col.name.replace(/'/g, "''")}', ` +
          `${col.description ? `'${col.description.replace(/'/g, "''")}'` : "null"}, ` +
          `'${JSON.stringify(col.questionIds ?? []).replace(/'/g, "''")}'::jsonb, ` +
          `'${JSON.stringify(col.questionDetails ?? []).replace(/'/g, "''")}'::jsonb, ` +
          `${col.color ? `'${col.color}'` : "null"})\n` +
          `ON CONFLICT (collection_id) DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP;\n`,
      );
    }
    console.log("===========================================\n");

    for (const collection of data.collections) {
      try {
        const result = await db.query(
          `INSERT INTO saved_collections
           (user_id, collection_id, name, description, question_ids, question_details, color)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
         ON CONFLICT (collection_id) DO UPDATE SET
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
           updated_at = CURRENT_TIMESTAMP`,
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
        console.log(
          `[sync] collection OK: ${collection.collectionId} rowCount=${result.rowCount} cmd=${result.command}`,
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
