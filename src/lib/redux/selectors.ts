/**
 * Redux Selectors
 * Memoized selectors for accessing Redux state
 */

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import { calculateLevel } from "@/types/userProfile";

// ============ Auth Selectors ============

export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;

export const selectUser = (state: RootState) => state.auth.user;

export const selectAuthLoading = (state: RootState) => state.auth.loading;

export const selectAuthError = (state: RootState) => state.auth.error;

export const selectSessionChecked = (state: RootState) =>
  state.auth.sessionChecked;

// ============ User Data Selectors ============

export const selectUserProfile = (state: RootState) => state.userData.profile;

export const selectUserStatistics = (state: RootState) =>
  state.userData.statistics;

export const selectUserSessions = (state: RootState) => state.userData.sessions;

export const selectUserBookmarks = (state: RootState) =>
  state.userData.bookmarks;

export const selectUserCollections = (state: RootState) =>
  state.userData.collections;

export const selectUserVocabulary = (state: RootState) =>
  state.userData.vocabulary;

export const selectUserPreferences = (state: RootState) =>
  state.userData.preferences;

export const selectUserDataLoading = (state: RootState) =>
  state.userData.loading;

export const selectUserDataError = (state: RootState) => state.userData.error;

// ============ Computed Selectors (Memoized) ============

// Calculate user level from XP
export const selectUserLevel = createSelector(
  [selectUserProfile],
  (profile) => {
    if (!profile) return 0;
    return calculateLevel(profile.totalXP);
  },
);

// Calculate user accuracy percentage
export const selectUserAccuracy = createSelector(
  [selectUserProfile],
  (profile) => {
    if (!profile || profile.questionsAnswered === 0) return 0;
    return Math.round(
      (profile.correctAnswers / profile.questionsAnswered) * 100,
    );
  },
);

// Get total number of bookmarks
export const selectBookmarkCount = createSelector(
  [selectUserBookmarks],
  (bookmarks) => bookmarks.length,
);

// Get total number of collections
export const selectCollectionCount = createSelector(
  [selectUserCollections],
  (collections) => collections.length,
);

// Get total number of practice sessions
export const selectSessionCount = createSelector(
  [selectUserSessions],
  (sessions) => sessions.length,
);

// Check if any user data is loading
export const selectIsAnyDataLoading = createSelector(
  [selectUserDataLoading],
  (loading) => Object.values(loading).some((isLoading) => isLoading),
);

// Get bookmarks for a specific assessment
export const selectBookmarksByAssessment = (assessment: string) =>
  createSelector([selectUserBookmarks], (bookmarks) =>
    bookmarks.filter((bookmark) => bookmark.assessment === assessment),
  );

// Get collection by ID
export const selectCollectionById = (collectionId: string) =>
  createSelector([selectUserCollections], (collections) =>
    collections.find((collection) => collection.collectionId === collectionId),
  );

// Get recent sessions (last N sessions)
export const selectRecentSessions = (count: number = 10) =>
  createSelector([selectUserSessions], (sessions) => sessions.slice(0, count));
