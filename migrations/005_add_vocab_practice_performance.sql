-- Migration 005: Add vocab_practice_performance table
--
-- Stores per-user vocabulary quiz performance data (attempts, word-level mastery,
-- accuracy stats) separately from the vocabulary_progress (word bank / flashcard
-- progress). This allows both datasets to be fetched and updated independently.
--
-- The performance_data column is a flexible JSONB blob that holds a
-- PracticePerformanceData object (see src/types/vocabulary.ts).

CREATE TABLE IF NOT EXISTS vocab_practice_performance (
  user_id UUID PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  performance_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vocab_practice_performance_user_id
  ON vocab_practice_performance(user_id);

-- ── updated_at trigger ─────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_vocab_practice_performance_updated_at'
  ) THEN
    CREATE TRIGGER update_vocab_practice_performance_updated_at
      BEFORE UPDATE ON vocab_practice_performance
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
