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

// Saved question with database fields
export interface SavedQuestion {
  id?: string; // Database-generated ID
  userId?: string; // User ID (for database)
  assessment: string;
  questionId: string;
  externalId: string | null;
  ibn: string | null;
  plainQuestion: PlainQuestionType | null;
  timestamp: string;
}

// Question detail for collections
export interface QuestionDetail {
  questionId: string;
  externalId?: string;
  ibn?: string;
  plainQuestion?: PlainQuestionType;
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

// User preferences
export interface UserPreferences {
  theme?: "light" | "dark";
  data_mode_priority?: "localstorage" | "cloud";
  assessment?: "SAT" | "PSAT/NMSQT" | "PSAT";
  soundEnabled?: boolean;
  notifications?: boolean;
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
  loading: {
    profile: boolean;
    statistics: boolean;
    sessions: boolean;
    bookmarks: boolean;
    collections: boolean;
    vocabulary: boolean;
  };
  error: string | null;
}
