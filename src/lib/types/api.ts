/**
 * API Type Definitions
 * These types handle API request/response formats for user data operations
 *
 * Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7
 */

import type {
  UserData,
  SavedQuestion,
  SavedCollection,
  VocabularyProgress,
  UserPreferences,
} from "./userData";
import type { UserProfileWithHistory } from "@/types/userProfile";
import type { PracticeStatistics, PracticeSession } from "@/types";

// Generic API response wrapper
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Migration payload for localStorage to database migration
export interface MigrationPayload {
  profile: UserProfileWithHistory;
  statistics: PracticeStatistics;
  sessions: PracticeSession[];
  bookmarks: SavedQuestion[];
  collections: SavedCollection[];
  vocabulary: VocabularyProgress;
  preferences: UserPreferences;
}

// Migration summary returned after successful migration
export interface MigrationSummary {
  profileMigrated: boolean;
  statisticsMigrated: boolean;
  sessionsMigrated: number;
  bookmarksMigrated: number;
  collectionsMigrated: number;
  vocabularyMigrated: boolean;
  preferencesMigrated: boolean;
  notesMigrated: boolean;
  answerHistoryMigrated: boolean;
  practicePerformanceMigrated: boolean;
}

// User data fetch response
export type UserDataResponse = APIResponse<UserData>;

// Migration response
export interface MigrationResponse extends APIResponse<MigrationSummary> {
  summary?: MigrationSummary;
}
