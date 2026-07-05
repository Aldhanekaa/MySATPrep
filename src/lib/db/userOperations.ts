/**
 * User Data Database Operations
 *
 * CRUD operations for user profiles, practice statistics, and practice sessions.
 * All queries use parameterized inputs to prevent SQL injection.
 *
 * Validates: Requirements 2.3, 7.3, 7.4, 7.5, 8.1, 8.4
 */

import { pool } from "@/lib/auth";
import type {
  UserProfileWithHistory,
  XPTransaction,
} from "@/types/userProfile";
import type {
  PracticeStatistics,
  PracticeSession,
  AnsweredQuestion,
  ClassStatistics,
} from "@/types";
import {
  stripAnsweredQuestionsDetailed,
  stripClassStatistics,
  normaliseAnsweredQuestion,
  normaliseClassStatistics,
} from "@/lib/db/statsTransforms";

// ─── User Record ─────────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Retrieve a user record by ID. Returns null if not found. */
export async function getUserById(userId: string): Promise<DbUser | null> {
  const result = await pool.query<DbUser>(
    `SELECT id, email, name,
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM "user"
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

/** Retrieve a user record by email. Returns null if not found. */
export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const result = await pool.query<DbUser>(
    `SELECT id, email, name,
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM "user"
     WHERE email = $1
     LIMIT 1`,
    [email],
  );
  return result.rows[0] ?? null;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

interface DbUserProfile {
  userId: string;
  totalXp: number;
  level: number;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  lastActivity: Date | null;
  xpHistory: XPTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

function rowToUserProfile(row: DbUserProfile): UserProfileWithHistory {
  return {
    totalXP: row.totalXp,
    level: row.level,
    questionsAnswered: row.questionsAnswered,
    correctAnswers: row.correctAnswers,
    incorrectAnswers: row.incorrectAnswers,
    lastActivity: row.lastActivity ? row.lastActivity.toISOString() : "",
    createdAt: row.createdAt.toISOString(),
    xpHistory: row.xpHistory ?? [],
  };
}

/**
 * Fetch the profile for a user. Returns null if no profile row exists yet.
 * Validates: Requirement 7.3
 */
export async function getUserProfile(
  userId: string,
): Promise<UserProfileWithHistory | null> {
  const result = await pool.query<DbUserProfile>(
    `SELECT user_id       AS "userId",
            total_xp      AS "totalXp",
            level,
            questions_answered AS "questionsAnswered",
            correct_answers    AS "correctAnswers",
            incorrect_answers  AS "incorrectAnswers",
            last_activity      AS "lastActivity",
            xp_history         AS "xpHistory",
            created_at         AS "createdAt",
            updated_at         AS "updatedAt"
     FROM user_profiles
     WHERE user_id = $1
     LIMIT 1`,
    [userId],
  );

  if (!result.rows[0]) return null;
  return rowToUserProfile(result.rows[0]);
}

/**
 * Insert or update the profile for a user (upsert).
 * Validates: Requirement 8.1
 */
export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfileWithHistory>,
): Promise<UserProfileWithHistory> {
  const result = await pool.query<DbUserProfile>(
    `INSERT INTO user_profiles
       (user_id, total_xp, level, questions_answered, correct_answers,
        incorrect_answers, last_activity, xp_history)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id) DO UPDATE SET
       total_xp           = EXCLUDED.total_xp,
       level              = EXCLUDED.level,
       questions_answered = EXCLUDED.questions_answered,
       correct_answers    = EXCLUDED.correct_answers,
       incorrect_answers  = EXCLUDED.incorrect_answers,
       last_activity      = EXCLUDED.last_activity,
       xp_history         = EXCLUDED.xp_history,
       updated_at         = CURRENT_TIMESTAMP
     RETURNING
       user_id       AS "userId",
       total_xp      AS "totalXp",
       level,
       questions_answered AS "questionsAnswered",
       correct_answers    AS "correctAnswers",
       incorrect_answers  AS "incorrectAnswers",
       last_activity      AS "lastActivity",
       xp_history         AS "xpHistory",
       created_at         AS "createdAt",
       updated_at         AS "updatedAt"`,
    [
      userId,
      data.totalXP ?? 0,
      data.level ?? 0,
      data.questionsAnswered ?? 0,
      data.correctAnswers ?? 0,
      data.incorrectAnswers ?? 0,
      data.lastActivity ?? null,
      JSON.stringify(data.xpHistory ?? []),
    ],
  );

  return rowToUserProfile(result.rows[0]);
}

// ─── Practice Statistics ──────────────────────────────────────────────────────

interface DbPracticeStatistics {
  userId: string;
  assessment: string;
  answeredQuestions: string[];
  // Raw JSONB from Postgres — may be old format (with plainQuestion) or new
  // format (with top-level primary_class_cd / skill_cd). Normalised on read.
  answeredQuestionsDetailed: Record<string, unknown>[];
  statistics: Record<string, unknown>;
  updatedAt: Date;
}

/**
 * Normalise a raw DB row into the PracticeStatistics shape.
 *
 * Handles both legacy rows (plainQuestion present in JSONB) and new rows
 * (plainQuestion stripped, primary_class_cd / skill_cd promoted). The
 * normalised shape has primary_class_cd and skill_cd at the top level of
 * each AnsweredQuestion entry so that review/page.tsx can read them directly
 * without touching plainQuestion.
 */
function rowToAssessmentStats(row: DbPracticeStatistics): {
  answeredQuestions: string[];
  answeredQuestionsDetailed: AnsweredQuestion[];
  statistics: ClassStatistics;
} {
  const answeredQuestionsDetailed = (row.answeredQuestionsDetailed ?? []).map(
    (raw) => normaliseAnsweredQuestion(raw) as unknown as AnsweredQuestion,
  );

  const statistics = normaliseClassStatistics(
    row.statistics ?? {},
  ) as unknown as ClassStatistics;

  return {
    answeredQuestions: row.answeredQuestions ?? [],
    answeredQuestionsDetailed,
    statistics,
  };
}

/**
 * Fetch practice statistics for a user and assessment type.
 * Returns null if no record exists yet.
 * Validates: Requirement 7.4
 */
export async function getPracticeStatistics(
  userId: string,
  assessment: string,
): Promise<PracticeStatistics | null> {
  const result = await pool.query<DbPracticeStatistics>(
    `SELECT user_id                      AS "userId",
            assessment,
            answered_questions           AS "answeredQuestions",
            answered_questions_detailed  AS "answeredQuestionsDetailed",
            statistics,
            updated_at                   AS "updatedAt"
     FROM practice_statistics
     WHERE user_id = $1 AND assessment = $2
     LIMIT 1`,
    [userId, assessment],
  );

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    [assessment]: rowToAssessmentStats(row),
  } as unknown as PracticeStatistics;
}

/**
 * Insert or update practice statistics for a user and assessment.
 *
 * Strips plainQuestion from both JSONB columns before writing. Promotes
 * primary_class_cd and skill_cd as explicit top-level fields on each
 * answered_questions_detailed entry.
 *
 * Validates: Requirement 8.2
 */
export async function updatePracticeStatistics(
  userId: string,
  assessment: string,
  data: PracticeStatistics,
): Promise<PracticeStatistics> {
  const assessmentData = (data as Record<string, unknown>)[assessment] as
    | {
        answeredQuestions?: string[];
        answeredQuestionsDetailed?: AnsweredQuestion[];
        statistics?: ClassStatistics;
      }
    | undefined;

  const answeredQuestions = assessmentData?.answeredQuestions ?? [];

  // Strip plainQuestion and promote primary_class_cd / skill_cd before writing
  const answeredQuestionsDetailed = stripAnsweredQuestionsDetailed(
    (assessmentData?.answeredQuestionsDetailed ?? []) as AnsweredQuestion[],
  );
  const statistics = stripClassStatistics(
    (assessmentData?.statistics ?? {}) as ClassStatistics,
  );

  const result = await pool.query<DbPracticeStatistics>(
    `INSERT INTO practice_statistics
       (user_id, assessment, answered_questions, answered_questions_detailed, statistics)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, assessment) DO UPDATE SET
       answered_questions          = EXCLUDED.answered_questions,
       answered_questions_detailed = EXCLUDED.answered_questions_detailed,
       statistics                  = EXCLUDED.statistics,
       updated_at                  = CURRENT_TIMESTAMP
     RETURNING
       user_id                      AS "userId",
       assessment,
       answered_questions           AS "answeredQuestions",
       answered_questions_detailed  AS "answeredQuestionsDetailed",
       statistics,
       updated_at                   AS "updatedAt"`,
    [
      userId,
      assessment,
      JSON.stringify(answeredQuestions),
      JSON.stringify(answeredQuestionsDetailed),
      JSON.stringify(statistics),
    ],
  );

  const row = result.rows[0];
  return {
    [assessment]: rowToAssessmentStats(row),
  } as unknown as PracticeStatistics;
}

// ─── Practice Sessions ────────────────────────────────────────────────────────

interface DbPracticeSession {
  id: string;
  userId: string;
  sessionId: string;
  sessionData: PracticeSession;
  status: string;
  currentSession: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function rowToPracticeSession(row: DbPracticeSession): PracticeSession {
  return {
    ...(row.sessionData as PracticeSession),
    sessionId: row.sessionId,
    currentSession: row.currentSession,
  };
}

/**
 * Fetch the single in-progress session flagged as current for a user.
 * Returns null if no such session exists.
 */
export async function getCurrentSession(
  userId: string,
): Promise<PracticeSession | null> {
  const result = await pool.query<DbPracticeSession>(
    `SELECT id, user_id AS "userId", session_id AS "sessionId",
            session_data AS "sessionData", status,
            current_session AS "currentSession",
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM practice_sessions
     WHERE user_id = $1
       AND current_session = TRUE
     LIMIT 1`,
    [userId],
  );

  if (!result.rows[0]) return null;
  return rowToPracticeSession(result.rows[0]);
}

/**
 * Fetch all practice sessions for a user, ordered newest first.
 * Validates: Requirement 7.5
 */
export async function getPracticeSessions(
  userId: string,
): Promise<PracticeSession[]> {
  const result = await pool.query<DbPracticeSession>(
    `SELECT id, user_id AS "userId", session_id AS "sessionId",
            session_data AS "sessionData", status,
            current_session AS "currentSession",
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM practice_sessions
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );

  return result.rows.map(rowToPracticeSession);
}

/**
 * Insert a new practice session row.
 * When currentSession is true, clears the flag on any prior session for this
 * user first (only one active session per user is allowed).
 * Validates: Requirement 8.3
 */
export async function createPracticeSession(
  userId: string,
  sessionData: PracticeSession,
): Promise<PracticeSession> {
  const isCurrentSession = sessionData.currentSession ?? false;

  // If this session is being flagged as current, clear the flag on any
  // existing current session for this user before inserting/upserting.
  if (isCurrentSession) {
    await pool.query(
      `UPDATE practice_sessions
       SET current_session = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND current_session = TRUE`,
      [userId],
    );
  }

  const result = await pool.query<DbPracticeSession>(
    `INSERT INTO practice_sessions
       (user_id, session_id, session_data, status, current_session)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, session_id) DO UPDATE SET
       session_data     = EXCLUDED.session_data,
       status           = EXCLUDED.status,
       current_session  = EXCLUDED.current_session,
       updated_at       = CURRENT_TIMESTAMP
     RETURNING
       id, user_id AS "userId", session_id AS "sessionId",
       session_data AS "sessionData", status,
       current_session AS "currentSession",
       created_at AS "createdAt", updated_at AS "updatedAt"`,
    [
      userId,
      sessionData.sessionId,
      JSON.stringify(sessionData),
      sessionData.status ?? "not_started",
      isCurrentSession,
    ],
  );

  return rowToPracticeSession(result.rows[0]);
}

/**
 * Update an existing practice session by session ID.
/**
 * Update an existing practice session by session ID, scoped to the owning user.
 * When currentSession is set to true, clears the flag on any other session
 * for this user first.
 * Validates: Requirement 8.4
 */
export async function updatePracticeSession(
  sessionId: string,
  data: Partial<PracticeSession>,
  userId?: string,
): Promise<PracticeSession | null> {
  // Fetch existing session, optionally scoped to the owning user
  const existing = await pool.query<DbPracticeSession>(
    `SELECT session_data AS "sessionData", status, user_id AS "userId",
            current_session AS "currentSession"
     FROM practice_sessions
     WHERE session_id = $1
       AND ($2::uuid IS NULL OR user_id = $2)
     LIMIT 1`,
    [sessionId, userId ?? null],
  );

  if (!existing.rows[0]) return null;

  const merged = { ...existing.rows[0].sessionData, ...data };
  const newStatus = data.status ?? existing.rows[0].status;
  const newCurrentSession =
    data.currentSession !== undefined
      ? data.currentSession
      : existing.rows[0].currentSession;

  // If flipping current_session to true, clear the flag on any other session
  // for this user to maintain the at-most-one constraint.
  if (newCurrentSession && !existing.rows[0].currentSession) {
    await pool.query(
      `UPDATE practice_sessions
       SET current_session = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND current_session = TRUE AND session_id != $2`,
      [existing.rows[0].userId, sessionId],
    );
  }

  const result = await pool.query<DbPracticeSession>(
    `UPDATE practice_sessions
     SET session_data    = $2,
         status          = $3,
         current_session = $4,
         updated_at      = CURRENT_TIMESTAMP
     WHERE session_id = $1
       AND ($5::uuid IS NULL OR user_id = $5)
     RETURNING
       id, user_id AS "userId", session_id AS "sessionId",
       session_data AS "sessionData", status,
       current_session AS "currentSession",
       created_at AS "createdAt", updated_at AS "updatedAt"`,
    [
      sessionId,
      JSON.stringify(merged),
      newStatus,
      newCurrentSession,
      userId ?? null,
    ],
  );

  if (!result.rows[0]) return null;
  return rowToPracticeSession(result.rows[0]);
}
