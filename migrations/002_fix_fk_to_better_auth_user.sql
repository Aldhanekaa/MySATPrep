-- Migration 002: Fix foreign keys to point to better-auth's "user" table
--
-- The original schema referenced a custom `users` table (plural), but
-- better-auth manages users in a `"user"` table (singular). All downstream
-- tables must reference `"user"(id)` instead of `users(id)`.

BEGIN;

-- ── user_profiles ─────────────────────────────────────────────────────────────
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- ── practice_statistics ───────────────────────────────────────────────────────
ALTER TABLE practice_statistics
  DROP CONSTRAINT IF EXISTS practice_statistics_user_id_fkey;

ALTER TABLE practice_statistics
  ADD CONSTRAINT practice_statistics_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- ── practice_sessions ─────────────────────────────────────────────────────────
ALTER TABLE practice_sessions
  DROP CONSTRAINT IF EXISTS practice_sessions_user_id_fkey;

ALTER TABLE practice_sessions
  ADD CONSTRAINT practice_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- ── saved_questions ───────────────────────────────────────────────────────────
ALTER TABLE saved_questions
  DROP CONSTRAINT IF EXISTS saved_questions_user_id_fkey;

ALTER TABLE saved_questions
  ADD CONSTRAINT saved_questions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- ── saved_collections ─────────────────────────────────────────────────────────
ALTER TABLE saved_collections
  DROP CONSTRAINT IF EXISTS saved_collections_user_id_fkey;

ALTER TABLE saved_collections
  ADD CONSTRAINT saved_collections_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- ── vocabulary_progress ───────────────────────────────────────────────────────
ALTER TABLE vocabulary_progress
  DROP CONSTRAINT IF EXISTS vocabulary_progress_user_id_fkey;

ALTER TABLE vocabulary_progress
  ADD CONSTRAINT vocabulary_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- ── user_preferences ──────────────────────────────────────────────────────────
ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

COMMIT;
