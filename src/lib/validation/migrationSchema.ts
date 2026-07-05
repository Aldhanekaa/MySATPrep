/**
 * Migration Data Validation
 *
 * Zod schemas for validating all localStorage data types before migration.
 * Returns detailed error messages on validation failure.
 *
 * Validates: Requirements 6.3, 6.13
 */

import { z } from "zod";

// ─── XP Transaction ───────────────────────────────────────────────────────────

const XPTransactionSchema = z.object({
  questionId: z.string(),
  change: z.number(),
  reason: z.enum(["correct_answer", "incorrect_answer"]),
  timestamp: z.string(),
  scoreBandRange: z.number(),
});

// ─── Profile ──────────────────────────────────────────────────────────────────

export const ProfileSchema = z.object({
  totalXP: z.number().min(0).optional(),
  level: z.number().int().min(0).optional(),
  questionsAnswered: z.number().int().min(0).optional(),
  correctAnswers: z.number().int().min(0).optional(),
  incorrectAnswers: z.number().int().min(0).optional(),
  lastActivity: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  xpHistory: z.array(XPTransactionSchema).optional(),
});

// ─── Practice Statistics ──────────────────────────────────────────────────────

const AssessmentStatsSchema = z.object({
  answeredQuestions: z.array(z.string()).optional(),
  answeredQuestionsDetailed: z.array(z.unknown()).optional(),
  statistics: z.record(z.string(), z.unknown()).optional(),
});

export const StatisticsSchema = z.record(z.string(), AssessmentStatsSchema);

// ─── Practice Session ─────────────────────────────────────────────────────────

export const PracticeSessionSchema = z.object({
  sessionId: z.string(),
  timestamp: z.string().optional(),
  status: z.string().optional(),
  practiceSelections: z.unknown().optional(),
  currentQuestionStep: z.number().optional(),
  questionAnswers: z.record(z.string(), z.string().nullable()).optional(),
  questionTimes: z.record(z.string(), z.number()).optional(),
  answeredQuestionDetails: z.array(z.unknown()).optional(),
  questionCorrectChoices: z.record(z.string(), z.array(z.string())).optional(),
  totalQuestions: z.number().optional(),
  answeredQuestions: z.array(z.string()).optional(),
  averageTimePerQuestion: z.number().optional(),
  totalTimeSpent: z.number().optional(),
  totalXPReceived: z.number().optional(),
});

export const SessionsSchema = z.array(PracticeSessionSchema);

// ─── Saved Question (Bookmark) ────────────────────────────────────────────────

export const SavedQuestionSchema = z.object({
  questionId: z.string(),
  assessment: z.string(),
  externalId: z.string().nullable().optional(),
  ibn: z.string().nullable().optional(),
  plainQuestion: z.unknown().optional().nullable(),
  timestamp: z.string().optional(),
});

export const BookmarksSchema = z.array(SavedQuestionSchema);

// ─── Saved Collection ─────────────────────────────────────────────────────────

export const QuestionDetailSchema = z.object({
  questionId: z.string(),
  externalId: z.string().nullable().optional(),
  ibn: z.string().nullable().optional(),
  // plainQuestion intentionally not validated — it was never reliably written
  // into question_details by any current code path. The strip helper in the DB
  // layer removes it before writing, so we don't need to validate or pass it
  // through. Unknown fields in incoming payloads are stripped by Zod's default
  // .strip() mode, so legacy data with plainQuestion will be accepted and
  // the field will be silently dropped before the schema returns.
});

export const SavedCollectionSchema = z.object({
  collectionId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  questionIds: z.array(z.string()).optional(),
  questionDetails: z.array(QuestionDetailSchema).optional(),
  color: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CollectionsSchema = z.array(SavedCollectionSchema);

// ─── Vocabulary Progress ──────────────────────────────────────────────────────

export const VocabularyProgressSchema = z.record(z.string(), z.unknown());

// ─── User Preferences ─────────────────────────────────────────────────────────

export const UserPreferencesSchema = z.record(z.string(), z.unknown());

// ─── Vocab Practice Performance ───────────────────────────────────────────────

const WordPerformanceSchema = z.object({
  word: z.string(),
  totalAttempts: z.number().int().min(0),
  correctAttempts: z.number().int().min(0),
  incorrectAttempts: z.number().int().min(0),
  lastAttemptTimestamp: z.number(),
  averageTimeSpent: z.number(),
  strugglingAreas: z.array(z.string()).optional(),
  masteryLevel: z.enum(["struggling", "learning", "proficient", "mastered"]),
  consecutiveCorrect: z.number().int().min(0),
  consecutiveIncorrect: z.number().int().min(0),
});

export const PracticePerformanceSchema = z.object({
  attempts: z.array(z.unknown()),
  wordPerformance: z.record(z.string(), WordPerformanceSchema),
  lastUpdated: z.number(),
  totalQuizzesTaken: z.number().int().min(0),
  overallAccuracy: z.number().min(0).max(100),
  strongWords: z.array(z.string()),
  weakWords: z.array(z.string()),
  improvingWords: z.array(z.string()),
});

// ─── Question Notes ───────────────────────────────────────────────────────────

const QuestionNoteSchema = z.object({
  note: z.string().optional(),
  timestamp: z.string().optional(),
  createdAt: z.string().optional(),
  difficulty: z.string().optional().nullable(),
  primaryClassCd: z.string().optional().nullable(),
  skillCd: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  createdDate: z.string().optional().nullable(),
  updatedDate: z.string().optional().nullable(),
});

export const QuestionNotesSchema = z.record(
  z.string(),
  z.array(QuestionNoteSchema).or(z.unknown()),
);

// ─── Answer History ───────────────────────────────────────────────────────────

export const AnswerHistorySchema = z.record(
  z.string(),
  z.array(
    z.object({
      userChoice: z.string(),
      time: z.number(),
      status: z.enum(["correct", "incorrect"]),
    }),
  ),
);

// ─── Migration Payload ────────────────────────────────────────────────────────

export const MigrationPayloadSchema = z.object({
  profile: ProfileSchema.optional().nullable(),
  statistics: StatisticsSchema.optional().nullable(),
  sessions: SessionsSchema.optional(),
  bookmarks: BookmarksSchema.optional(),
  collections: CollectionsSchema.optional(),
  vocabulary: VocabularyProgressSchema.optional().nullable(),
  preferences: UserPreferencesSchema.optional().nullable(),
  questionNotes: QuestionNotesSchema.optional().nullable(),
  answerHistory: AnswerHistorySchema.optional().nullable(),
  practicePerformance: PracticePerformanceSchema.optional().nullable(),
});

export type ValidatedMigrationPayload = z.infer<typeof MigrationPayloadSchema>;

// ─── Validation Function ──────────────────────────────────────────────────────

export interface ValidationResult {
  valid: true;
  data: ValidatedMigrationPayload;
}

export interface ValidationError {
  valid: false;
  errors: string[];
}

/**
 * Validate incoming migration payload and return detailed error messages.
 * Validates: Requirements 6.3, 6.13
 */
export function validateMigrationPayload(
  body: unknown,
): ValidationResult | ValidationError {
  const result = MigrationPayloadSchema.safeParse(body);

  if (result.success) {
    return { valid: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });

  return { valid: false, errors };
}
