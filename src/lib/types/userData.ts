/**
 * User Data Type Definitions
 * These types handle all user-specific data including profile, statistics, sessions, bookmarks, and preferences
 *
 * Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7
 */

import type { UserProfileWithHistory } from "@/types/userProfile";
import type {
  PracticeStatistics,
  PracticeSession,
  PlainQuestionType,
} from "@/types";
import type { PracticePerformanceData } from "@/types/vocabulary";
import type { QuestionNotes } from "@/types/questionNotes";

// Saved question with database fields
export interface SavedQuestion {
  id?: string; // Database-generated ID
  userId?: string; // User ID (for database)
  assessment: string;
  questionId: string;
  externalId?: string | null;
  ibn?: string | null;
  plainQuestion?: PlainQuestionType | null;
  timestamp: string;
}

// Question detail for collections
export interface QuestionDetail {
  questionId: string;
  externalId?: string | null;
  ibn?: string | null;
  // plainQuestion intentionally omitted: never written by any current code path,
  // never read back from the DB by any consumer. Old DB rows carrying plainQuestion
  // are handled gracefully — collectionOperations strips it on every write and
  // collectionsToSavedCollections() in use-resolved-user-data.ts ignores it on read.
}

// Saved collection with database fields
export interface SavedCollection {
  id?: string; // Database-generated ID
  userId?: string; // User ID (for database)
  collectionId: string;
  name: string;
  description?: string;
  questionIds: string[];
  questionDetails: QuestionDetail[];
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// Vocabulary progress structure (flexible JSONB)
export interface VocabularyProgress {
  [key: string]: any; // Vocabulary progress structure
}

// Answer history structure (flexible JSONB)
export interface AnswerHistory {
  [questionId: string]: Array<{
    userChoice: string;
    time: number;
    status: "correct" | "incorrect";
  }>;
}

// User preferences
export interface UserPreferences {
  theme?: "light" | "dark";
  data_mode_priority?: "localstorage" | "cloud";
  assessment?: "SAT" | "PSAT/NMSQT" | "PSAT";
  soundEnabled?: boolean;
  notifications?: boolean;
  uiFlags?: Record<string, boolean>; // NEW — explicit typed field for per-key UI state
  [key: string]: any;
}

// Complete user data structure
export interface UserData {
  profile: UserProfileWithHistory | null;
  statistics: PracticeStatistics;
  sessions: PracticeSession[];
  bookmarks: SavedQuestion[];
  collections: SavedCollection[];
  vocabulary: VocabularyProgress | null;
  preferences: UserPreferences | null;
  answerHistory: AnswerHistory | null;
  questionNotes: QuestionNotes | null;
  vocabPracticePerformance: PracticePerformanceData | null;
}

// User data state for Redux
export interface UserDataState {
  profile: UserProfileWithHistory | null;
  statistics: PracticeStatistics;
  sessions: PracticeSession[];
  bookmarks: SavedQuestion[];
  collections: SavedCollection[];
  vocabulary: VocabularyProgress | null;
  preferences: UserPreferences | null;
  answerHistory: AnswerHistory | null;
  questionNotes: QuestionNotes | null;
  vocabPracticePerformance: PracticePerformanceData | null;
  /** True once fetchUserData has completed at least once. Used to prevent
   *  duplicate initializations when SessionInitializer remounts (e.g. React
   *  StrictMode double-invoke in development). */
  dataInitialized: boolean;
  loading: {
    profile: boolean;
    statistics: boolean;
    sessions: boolean;
    bookmarks: boolean;
    collections: boolean;
    vocabulary: boolean;
    answerHistory: boolean;
    questionNotes: boolean;
    vocabPracticePerformance: boolean;
  };
  error: string | null;
}
