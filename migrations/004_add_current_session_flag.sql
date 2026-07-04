-- Migration 004: Add current_session flag to practice_sessions
--
-- Adds a boolean column that marks the single active in-progress session for
-- a given user. A partial unique index enforces the at-most-one-true constraint
-- at the database level: only one row per user_id may have current_session = TRUE.

-- ── Add column ─────────────────────────────────────────────────────────────────
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS current_session BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Partial unique index ───────────────────────────────────────────────────────
-- Prevents more than one "current" session per user without touching rows where
-- current_session is FALSE (no overhead for historical sessions).
CREATE UNIQUE INDEX IF NOT EXISTS idx_practice_sessions_current_session
  ON practice_sessions(user_id)
  WHERE current_session = TRUE;
