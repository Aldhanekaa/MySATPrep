-- Initial Schema Migration for Better Auth System
-- Creates all necessary tables for authentication and user data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Better Auth will manage this)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  provider VARCHAR(50) NOT NULL, -- 'google' or 'email'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
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

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_level ON user_profiles(level);
CREATE INDEX idx_user_profiles_total_xp ON user_profiles(total_xp);

-- Practice statistics table
CREATE TABLE IF NOT EXISTS practice_statistics (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  assessment VARCHAR(50) NOT NULL, -- 'SAT', 'PSAT/NMSQT', 'PSAT'
  answered_questions JSONB DEFAULT '[]'::jsonb,
  answered_questions_detailed JSONB DEFAULT '[]'::jsonb,
  statistics JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, assessment)
);

CREATE INDEX idx_practice_statistics_user_id ON practice_statistics(user_id);
CREATE INDEX idx_practice_statistics_assessment ON practice_statistics(assessment);

-- Practice sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  session_data JSONB NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'not_started', 'in_progress', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_session_id ON practice_sessions(session_id);
CREATE INDEX idx_practice_sessions_status ON practice_sessions(status);
CREATE INDEX idx_practice_sessions_created_at ON practice_sessions(created_at DESC);

-- Saved questions table (bookmarks)
CREATE TABLE IF NOT EXISTS saved_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  assessment VARCHAR(50) NOT NULL,
  question_id VARCHAR(255) NOT NULL,
  external_id VARCHAR(255),
  ibn VARCHAR(255),
  plain_question JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_saved_questions_user_id ON saved_questions(user_id);
CREATE INDEX idx_saved_questions_question_id ON saved_questions(question_id);
CREATE INDEX idx_saved_questions_assessment ON saved_questions(assessment);
CREATE INDEX idx_saved_questions_timestamp ON saved_questions(timestamp DESC);

-- Saved collections table
CREATE TABLE IF NOT EXISTS saved_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  collection_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  question_ids JSONB DEFAULT '[]'::jsonb,
  question_details JSONB DEFAULT '[]'::jsonb,
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_collections_user_id ON saved_collections(user_id);
CREATE INDEX idx_saved_collections_collection_id ON saved_collections(collection_id);
CREATE INDEX idx_saved_collections_created_at ON saved_collections(created_at DESC);

-- Vocabulary progress table
CREATE TABLE IF NOT EXISTS vocabulary_progress (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  progress_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vocabulary_progress_user_id ON vocabulary_progress(user_id);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  preferences_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_statistics_updated_at BEFORE UPDATE ON practice_statistics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_sessions_updated_at BEFORE UPDATE ON practice_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_collections_updated_at BEFORE UPDATE ON saved_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vocabulary_progress_updated_at BEFORE UPDATE ON vocabulary_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
