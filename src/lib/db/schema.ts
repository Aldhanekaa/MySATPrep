/**
 * Drizzle ORM Schema
 *
 * Defines all application tables that mirror the existing PostgreSQL schema
 * (migrations/001_initial_schema.sql and subsequent migrations).
 *
 * Better Auth manages its own tables (user, session, account, verification)
 * via the drizzle adapter — they are declared separately by the CLI-generated
 * auth.schema.ts and re-exported from here once generated.
 *
 * For now the app-level tables are defined below. The auth tables are managed
 * by better-auth automatically.
 */

import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// user_profiles
// ---------------------------------------------------------------------------
export const userProfiles = pgTable(
  "user_profiles",
  {
    userId: uuid("user_id").primaryKey(),
    totalXp: integer("total_xp").default(0),
    level: integer("level").default(0),
    questionsAnswered: integer("questions_answered").default(0),
    correctAnswers: integer("correct_answers").default(0),
    incorrectAnswers: integer("incorrect_answers").default(0),
    lastActivity: timestamp("last_activity", { withTimezone: true }),
    xpHistory: jsonb("xp_history").default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("idx_user_profiles_level").on(t.level),
    index("idx_user_profiles_total_xp").on(t.totalXp),
  ],
);

// ---------------------------------------------------------------------------
// practice_statistics
// ---------------------------------------------------------------------------
export const practiceStatistics = pgTable(
  "practice_statistics",
  {
    userId: uuid("user_id").notNull(),
    assessment: varchar("assessment", { length: 50 }).notNull(),
    answeredQuestions: jsonb("answered_questions").default([]),
    answeredQuestionsDetailed: jsonb("answered_questions_detailed").default([]),
    statistics: jsonb("statistics").default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("idx_practice_statistics_assessment").on(t.assessment),
    // composite PK is expressed as a unique index; actual PK is set below
    unique("practice_statistics_pkey").on(t.userId, t.assessment),
  ],
);

// ---------------------------------------------------------------------------
// practice_sessions
// ---------------------------------------------------------------------------
export const practiceSessions = pgTable(
  "practice_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
    sessionData: jsonb("session_data").notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    currentSession: boolean("current_session").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("idx_practice_sessions_user_id").on(t.userId),
    index("idx_practice_sessions_status").on(t.status),
    index("idx_practice_sessions_created_at").on(t.createdAt),
    // Partial unique index (one current session per user) is not expressible in
    // Drizzle column definitions — it must remain in the SQL migrations.
  ],
);

// ---------------------------------------------------------------------------
// saved_questions
// ---------------------------------------------------------------------------
export const savedQuestions = pgTable(
  "saved_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    assessment: varchar("assessment", { length: 50 }).notNull(),
    questionId: varchar("question_id", { length: 255 }).notNull(),
    externalId: varchar("external_id", { length: 255 }),
    ibn: varchar("ibn", { length: 255 }),
    plainQuestion: jsonb("plain_question"),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("idx_saved_questions_user_id").on(t.userId),
    index("idx_saved_questions_assessment").on(t.assessment),
    index("idx_saved_questions_timestamp").on(t.timestamp),
    unique("saved_questions_user_question_unique").on(t.userId, t.questionId),
  ],
);

// ---------------------------------------------------------------------------
// saved_collections
// ---------------------------------------------------------------------------
export const savedCollections = pgTable(
  "saved_collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    collectionId: varchar("collection_id", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    questionIds: jsonb("question_ids").default([]),
    questionDetails: jsonb("question_details").default([]),
    color: varchar("color", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("idx_saved_collections_user_id").on(t.userId),
    index("idx_saved_collections_created_at").on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// vocabulary_progress
// ---------------------------------------------------------------------------
export const vocabularyProgress = pgTable("vocabulary_progress", {
  userId: uuid("user_id").primaryKey(),
  progressData: jsonb("progress_data").default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ---------------------------------------------------------------------------
// user_preferences
// ---------------------------------------------------------------------------
export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").primaryKey(),
  preferencesData: jsonb("preferences_data").default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ---------------------------------------------------------------------------
// Re-export all tables as a single schema object for use with drizzle()
// ---------------------------------------------------------------------------
export const appSchema = {
  userProfiles,
  practiceStatistics,
  practiceSessions,
  savedQuestions,
  savedCollections,
  vocabularyProgress,
  userPreferences,
};
