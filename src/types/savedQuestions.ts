/**
 * Saved Questions TypeScript interfaces
 * These types handle the localStorage structure for saved questions
 */

import { PlainQuestionType } from "./question";

// Individual saved question with metadata
export interface SavedQuestion {
  questionId: string;
  externalId?: string | null;
  ibn?: string | null;
  plainQuestion?: PlainQuestionType; // Full question metadata
  timestamp: string; // ISO timestamp when saved
}

// Legacy saved question format for backward compatibility
export interface LegacySavedQuestion {
  questionId: string;
  externalId?: string | null;
  ibn?: string | null;
}

// Saved questions organized by assessment
export interface SavedQuestions {
  [assessment: string]: SavedQuestion[];
}

// Legacy saved questions format
export interface LegacySavedQuestions {
  [assessment: string]: LegacySavedQuestion[];
}

/**
 * Utility function to migrate legacy saved questions to new format
 */
export function migrateSavedQuestions(
  legacyData: LegacySavedQuestions
): SavedQuestions {
  const migratedData: SavedQuestions = {};

  for (const [assessment, questions] of Object.entries(legacyData)) {
    migratedData[assessment] = questions.map((q) => ({
      questionId: q.questionId,
      externalId: q.externalId,
      ibn: q.ibn,
      plainQuestion: undefined, // Will be populated when question is accessed
      timestamp: new Date().toISOString(), // Default timestamp for legacy data
    }));
  }

  return migratedData;
}
