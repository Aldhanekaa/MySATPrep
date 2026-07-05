/**
 * Migration Database Operations
 *
 * Bulk-insert (DO NOTHING on conflict) of all localStorage data categories
 * into the database for a new user. Each category is written as a standalone
 * statement via pool.query() — no manual BEGIN/COMMIT.
 *
 * Why no transaction:
 *   The app uses a PgBouncer pooler (DATABASE_URL). PgBouncer in transaction
 *   mode multiplexes statements across backend connections, so a client-level
 *   BEGIN/COMMIT does not wrap the same backend connection. The COMMIT never
 *   lands on the same connection that ran BEGIN, so nothing is written.
 *
 *   Each INSERT … ON CONFLICT DO NOTHING is already atomic at the statement
 *   level, so per-statement auto-commit is correct and safe. If a later
 *   statement fails, previously written rows remain — acceptable for an
 *   initial migration where each category is independent.
 *
 * Validates: Requirements 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.11
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

const db = directPool;

export async function migrateUserData(
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

  // ── Profile (Requirement 6.4) ──────────────────────────────────────────────
  if (data.profile) {
    await db.query(
      `INSERT INTO user_profiles
         (user_id, total_xp, level, questions_answered, correct_answers,
          incorrect_answers, last_activity, xp_history)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
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

  // ── Statistics (Requirement 6.5) ───────────────────────────────────────────
  if (data.statistics && Object.keys(data.statistics).length > 0) {
    for (const [assessment, stats] of Object.entries(data.statistics)) {
      if (!stats) continue;

      // Strip plainQuestion and promote primary_class_cd / skill_cd.
      // DO NOTHING on conflict — first write wins for initial migration.
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
         ON CONFLICT (user_id, assessment) DO NOTHING`,
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

  // ── Sessions (Requirement 6.6) ─────────────────────────────────────────────
  if (data.sessions && data.sessions.length > 0) {
    for (const session of data.sessions) {
      // Strip plainQuestion / questionCorrectChoices / correctAnswers / accuracyPercentage.
      // DO NOTHING on conflict — first write wins for initial migration.
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
         ON CONFLICT (user_id, session_id) DO NOTHING`,
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

  // ── Bookmarks (Requirement 6.7) ────────────────────────────────────────────
  if (data.bookmarks && data.bookmarks.length > 0) {
    for (const bookmark of data.bookmarks) {
      await db.query(
        `INSERT INTO saved_questions
           (user_id, assessment, question_id, external_id, ibn, plain_question)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         ON CONFLICT (user_id, question_id) DO NOTHING`,
        [
          userId,
          bookmark.assessment,
          bookmark.questionId,
          bookmark.externalId ?? null,
          bookmark.ibn ?? null,
          bookmark.plainQuestion
            ? JSON.stringify(
                slimPlainQuestion(bookmark.plainQuestion as PlainQuestionType),
              )
            : null,
        ],
      );
      summary.bookmarksMigrated++;
    }
  }

  // ── Collections (Requirement 6.8) ──────────────────────────────────────────
  if (data.collections && data.collections.length > 0) {
    for (const collection of data.collections) {
      await db.query(
        `INSERT INTO saved_collections
           (user_id, collection_id, name, description, question_ids, question_details, color)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
         ON CONFLICT (user_id, collection_id) DO NOTHING`,
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
    }
  }

  // ── Vocabulary (Requirement 6.9) ───────────────────────────────────────────
  if (data.vocabulary && Object.keys(data.vocabulary).length > 0) {
    await db.query(
      `INSERT INTO vocabulary_progress (user_id, progress_data)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, JSON.stringify(data.vocabulary)],
    );
    summary.vocabularyMigrated = true;
  }

  // ── Preferences ────────────────────────────────────────────────────────────
  if (data.preferences && Object.keys(data.preferences).length > 0) {
    await db.query(
      `INSERT INTO user_preferences (user_id, preferences_data)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, JSON.stringify(data.preferences)],
    );
    summary.preferencesMigrated = true;
  }

  // ── Question Notes (Requirement 11.4) ──────────────────────────────────────
  if (data.questionNotes && Object.keys(data.questionNotes).length > 0) {
    await db.query(
      `INSERT INTO question_notes (user_id, notes_data)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, JSON.stringify(data.questionNotes)],
    );
    summary.notesMigrated = true;
  }

  // ── Answer History (Requirement 11.5) ──────────────────────────────────────
  if (data.answerHistory && Object.keys(data.answerHistory).length > 0) {
    await db.query(
      `INSERT INTO answer_history (user_id, history_data)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, JSON.stringify(data.answerHistory)],
    );
    summary.answerHistoryMigrated = true;
  }

  // ── Vocab Practice Performance ─────────────────────────────────────────────
  if (data.practicePerformance) {
    await db.query(
      `INSERT INTO vocab_practice_performance (user_id, performance_data)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, JSON.stringify(data.practicePerformance)],
    );
    summary.practicePerformanceMigrated = true;
  }

  return summary;
}
