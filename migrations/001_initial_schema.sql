-- Initial Schema Migration for Better Auth System
-- Creates all necessary tables for authentication and user data
--
-- NOTE: Better Auth manages the "user" table (singular).
-- generateId: "uuid" is set in auth.ts, so "user".id is UUID.
-- All user_id foreign keys here are UUID to match.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── user_profiles ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  xp_history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_level ON user_profiles(level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_total_xp ON user_profiles(total_xp);

-- ── practice_statistics ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS practice_statistics (
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  assessment VARCHAR(50) NOT NULL, -- 'SAT', 'PSAT/NMSQT', 'PSAT'
  answered_questions JSONB DEFAULT '[]'::jsonb,
  answered_questions_detailed JSONB DEFAULT '[]'::jsonb,
  statistics JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, assessment)
);

CREATE INDEX IF NOT EXISTS idx_practice_statistics_user_id ON practice_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_statistics_assessment ON practice_statistics(assessment);

-- ── practice_sessions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  session_data JSONB NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'not_started', 'in_progress', 'completed'
  current_session BOOLEAN NOT NULL DEFAULT FALSE, -- true for the single active in-progress session per user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- session_id is unique per user, not globally
  UNIQUE (user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_session_id ON practice_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_status ON practice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON practice_sessions(created_at DESC);
-- Partial unique index: only one row per user may have current_session = TRUE
CREATE UNIQUE INDEX IF NOT EXISTS idx_practice_sessions_current_session
  ON practice_sessions(user_id)
  WHERE current_session = TRUE;

-- ── saved_questions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  assessment VARCHAR(50) NOT NULL,
  question_id VARCHAR(255) NOT NULL,
  external_id VARCHAR(255),
  ibn VARCHAR(255),
  plain_question JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_questions_user_id ON saved_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_questions_question_id ON saved_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_saved_questions_assessment ON saved_questions(assessment);
CREATE INDEX IF NOT EXISTS idx_saved_questions_timestamp ON saved_questions(timestamp DESC);

-- ── saved_collections ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  collection_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  question_ids JSONB DEFAULT '[]'::jsonb,
  question_details JSONB DEFAULT '[]'::jsonb,
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- collection_id is unique per user, not globally
  UNIQUE (user_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_collections_user_id ON saved_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_collections_collection_id ON saved_collections(collection_id);
CREATE INDEX IF NOT EXISTS idx_saved_collections_created_at ON saved_collections(created_at DESC);

-- ── vocabulary_progress ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vocabulary_progress (
  user_id UUID PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  progress_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_progress_user_id ON vocabulary_progress(user_id);

-- ── user_preferences ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  preferences_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ── updated_at trigger function ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ── Triggers (idempotent via DO blocks) ────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_practice_statistics_updated_at') THEN
    CREATE TRIGGER update_practice_statistics_updated_at
      BEFORE UPDATE ON practice_statistics
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_practice_sessions_updated_at') THEN
    CREATE TRIGGER update_practice_sessions_updated_at
      BEFORE UPDATE ON practice_sessions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_saved_collections_updated_at') THEN
    CREATE TRIGGER update_saved_collections_updated_at
      BEFORE UPDATE ON saved_collections
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vocabulary_progress_updated_at') THEN
    CREATE TRIGGER update_vocabulary_progress_updated_at
      BEFORE UPDATE ON vocabulary_progress
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_preferences_updated_at') THEN
    CREATE TRIGGER update_user_preferences_updated_at
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
