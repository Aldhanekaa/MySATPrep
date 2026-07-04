-- Migration 003: Add question_notes and answer_history tables
--
-- Creates tables for storing user question notes and answer history in JSONB format.
-- Both tables follow the same pattern as vocabulary_progress and user_preferences.

-- ── question_notes ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS question_notes (
  user_id UUID PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  notes_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_notes_user_id ON question_notes(user_id);

-- ── answer_history ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS answer_history (
  user_id UUID PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  history_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_answer_history_user_id ON answer_history(user_id);

-- ── Triggers for updated_at columns ───────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_question_notes_updated_at') THEN
    CREATE TRIGGER update_question_notes_updated_at
      BEFORE UPDATE ON question_notes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_answer_history_updated_at') THEN
    CREATE TRIGGER update_answer_history_updated_at
      BEFORE UPDATE ON answer_history
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
