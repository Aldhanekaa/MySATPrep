-- Migration 007: Make practice_sessions.session_id unique per user, not globally
--
-- The original schema had `session_id VARCHAR(255) UNIQUE NOT NULL`, which
-- enforces a *global* unique constraint. This means:
--   1. Two users with the same client-generated session_id clash.
--   2. During migrate/sync, ON CONFLICT (session_id) could silently skip or
--      overwrite another user's session.
--
-- The fix drops the global unique constraint and replaces it with a composite
-- unique constraint on (user_id, session_id) so session IDs only need to be
-- unique per user.

-- Drop the old global unique constraint on session_id
ALTER TABLE practice_sessions DROP CONSTRAINT IF EXISTS practice_sessions_session_id_key;

-- Also drop the index if it exists under a different name
DROP INDEX IF EXISTS practice_sessions_session_id_key;

-- Create a composite unique constraint: unique session_id per user
ALTER TABLE practice_sessions
  ADD CONSTRAINT practice_sessions_user_id_session_id_key
  UNIQUE (user_id, session_id);
