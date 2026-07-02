/**
 * Vocabulary and Preferences Database Operations
 *
 * CRUD operations for vocabulary progress and user preferences using parameterized queries.
 *
 * Validates: Requirements 7.8, 7.9, 8.10
 */

import { pool } from "@/lib/auth";
import type { VocabularyProgress, UserPreferences } from "@/lib/types/userData";

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
