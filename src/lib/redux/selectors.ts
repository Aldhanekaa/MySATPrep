/**
 * Redux Memoized Selectors
 * Provides efficient state access for auth and userData slices using reselect.
 * Memoized selectors prevent unnecessary re-renders when unrelated state changes.
 *
 * Validates: Requirements 4.6, 19.1
 */

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import { calculateLevel } from "@/types/userProfile";

// ─── Auth Slice Selectors ────────────────────────────────────────────────────

/**
 * Selects the entire auth slice state.
 * Used as an input selector for derived auth selectors.
 */
export const selectAuthState = (state: RootState) => state.auth;

/**
 * Selects whether the user is currently authenticated.
 * Validates: Requirement 4.6
 */
export const selectIsAuthenticated = (state: RootState): boolean =>
  state.auth.isAuthenticated;

/**
 * Selects the current authenticated user object, or null if not authenticated.
 * Validates: Requirement 4.6
 */
export const selectUser = (state: RootState) => state.auth.user;

/**
 * Selects the auth loading state (true while any auth async thunk is pending).
 * Validates: Requirement 4.6
 */
export const selectAuthLoading = (state: RootState): boolean =>
  state.auth.loading;

/**
 * Selects the current auth error message, or null if no error.
 * Validates: Requirement 4.6
 */
export const selectAuthError = (state: RootState): string | null =>
  state.auth.error;

/**
 * Selects whether the session has been checked on app initialization.
 * Used to delay rendering auth-dependent UI until session is verified.
 */
export const selectSessionChecked = (state: RootState): boolean =>
  state.auth.sessionChecked;

/**
 * Selects whether the session check failed due to a DB/cloud connection error.
 * When true, the UI should prompt the user to retry rather than showing "not authenticated".
 */
export const selectConnectionError = (state: RootState): boolean =>
  state.auth.connectionError;

// ─── User Data Slice Selectors ───────────────────────────────────────────────

/**
 * Selects the entire userData slice state.
 * Used as an input selector for derived userData selectors.
 */
export const selectUserDataState = (state: RootState) => state.userData;

/**
 * Selects the user profile (includes XP, level, and answer history).
 * Returns null if no profile is loaded.
 * Validates: Requirement 4.6
 */
export const selectUserProfile = (state: RootState) => state.userData.profile;

/**
 * Selects practice statistics for all assessments.
 * Validates: Requirement 4.6
 */
export const selectUserStatistics = (state: RootState) =>
  state.userData.statistics;

/**
 * Selects all practice sessions for the user.
 * Validates: Requirement 4.6
 */
export const selectUserSessions = (state: RootState) => state.userData.sessions;

/**
 * Selects all bookmarked questions for the user.
 * Validates: Requirement 4.6
 */
export const selectUserBookmarks = (state: RootState) =>
  state.userData.bookmarks;

/**
 * Selects all saved collections for the user.
 * Validates: Requirement 4.6
 */
export const selectUserCollections = (state: RootState) =>
  state.userData.collections;

/**
 * Selects vocabulary progress data for the user.
 */
export const selectUserVocabulary = (state: RootState) =>
  state.userData.vocabulary;

/**
 * Selects answer history data for the user.
 */
export const selectAnswerHistory = (state: RootState) =>
  state.userData.answerHistory;

/**
 * Selects vocab practice performance data for the user.
 */
export const selectVocabPracticePerformance = (state: RootState) =>
  state.userData.vocabPracticePerformance;

/**
 * Selects question notes data for the user.
 */
export const selectQuestionNotes = (state: RootState) =>
  state.userData.questionNotes;

/**
 * Selects user preferences (theme, sound, notifications, etc.).
 */
export const selectUserPreferences = (state: RootState) =>
  state.userData.preferences;

/**
 * Selects the userData loading states object.
 */
export const selectUserDataLoading = (state: RootState) =>
  state.userData.loading;

export const selectDataInitialized = (state: RootState): boolean =>
  state.userData.dataInitialized;

/**
 * Selects the userData error message, or null if no error.
 */
export const selectUserDataError = (state: RootState): string | null =>
  state.userData.error;

// ─── Computed / Memoized Selectors ───────────────────────────────────────────

/**
 * Computes the user's current level from their total XP.
 * Uses the formula: Level = floor(sqrt(totalXP / 100))
 * Returns 0 if no profile is loaded.
 *
 * Memoized: only recomputes when selectUserProfile output changes.
 * Validates: Requirements 4.6, 19.1
 */
export const selectUserLevel = createSelector(
  selectUserProfile,
  (profile): number => {
    if (!profile) return 0;
    return calculateLevel(profile.totalXP);
  },
);

/**
 * Computes the user's answer accuracy as a percentage (0–100).
 * Formula: (correctAnswers / questionsAnswered) * 100
 * Returns 0 if no profile is loaded or no questions have been answered.
 *
 * Memoized: only recomputes when selectUserProfile output changes.
 * Validates: Requirements 4.6, 19.1
 */
export const selectAccuracy = createSelector(
  selectUserProfile,
  (profile): number => {
    if (!profile) return 0;
    if (profile.questionsAnswered === 0) return 0;
    return (profile.correctAnswers / profile.questionsAnswered) * 100;
  },
);

/**
 * Computes whether any part of userData is currently loading.
 * Useful for displaying a global loading indicator.
 *
 * Memoized: only recomputes when selectUserDataLoading output changes.
 */
export const selectIsUserDataLoading = createSelector(
  selectUserDataLoading,
  (loading): boolean => Object.values(loading).some(Boolean),
);

/**
 * Returns the boolean value for a specific UI flag key, or false if not found.
 * Reads from preferences.uiFlags in Redux state for authenticated users.
 *
 * Memoized: only recomputes when selectUserPreferences output changes.
 * Validates: Requirements 9.2, 9.6
 */
export const selectUiFlag = (key: string) =>
  createSelector(
    selectUserPreferences,
    (prefs): boolean => prefs?.uiFlags?.[key] ?? false,
  );
