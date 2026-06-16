/**
 * User Data Redux Slice
 * Manages all user-specific data including profile, statistics, sessions, bookmarks, collections, vocabulary, and preferences
 *
 * Validates: Requirement 4.3
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { UserDataState } from "@/lib/types/userData";
import type { UserProfileWithHistory } from "@/types/userProfile";
import type { PracticeStatistics, PracticeSession } from "@/types";
import type {
  SavedQuestion,
  SavedCollection,
  VocabularyProgress,
  UserPreferences,
} from "@/lib/types/userData";

// Initial user data state
const initialState: UserDataState = {
  profile: null,
  statistics: {},
  sessions: [],
  bookmarks: [],
  collections: [],
  vocabulary: null,
  preferences: null,
  loading: {
    profile: false,
    statistics: false,
    sessions: false,
    bookmarks: false,
    collections: false,
    vocabulary: false,
  },
  error: null,
};

// User data slice with reducers
const userDataSlice = createSlice({
  name: "userData",
  initialState,
  reducers: {
    // Set user profile
    setProfile: (
      state,
      action: PayloadAction<UserProfileWithHistory | null>,
    ) => {
      state.profile = action.payload;
      state.loading.profile = false;
    },

    // Update user profile (merge with existing)
    updateProfile: (
      state,
      action: PayloadAction<Partial<UserProfileWithHistory>>,
    ) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
      state.loading.profile = false;
    },

    // Set practice statistics
    setStatistics: (state, action: PayloadAction<PracticeStatistics>) => {
      state.statistics = action.payload;
      state.loading.statistics = false;
    },

    // Update statistics for a specific assessment
    updateStatistics: (state, action: PayloadAction<PracticeStatistics>) => {
      state.statistics = { ...state.statistics, ...action.payload };
      state.loading.statistics = false;
    },

    // Set practice sessions
    setSessions: (state, action: PayloadAction<PracticeSession[]>) => {
      state.sessions = action.payload;
      state.loading.sessions = false;
    },

    // Add a new practice session
    addSession: (state, action: PayloadAction<PracticeSession>) => {
      state.sessions.unshift(action.payload); // Add to beginning
      state.loading.sessions = false;
    },

    // Update an existing session
    updateSession: (state, action: PayloadAction<PracticeSession>) => {
      const index = state.sessions.findIndex(
        (s) => s.sessionId === action.payload.sessionId,
      );
      if (index !== -1) {
        state.sessions[index] = action.payload;
      }
      state.loading.sessions = false;
    },

    // Set bookmarks
    setBookmarks: (state, action: PayloadAction<SavedQuestion[]>) => {
      state.bookmarks = action.payload;
      state.loading.bookmarks = false;
    },

    // Add a bookmark
    addBookmark: (state, action: PayloadAction<SavedQuestion>) => {
      // Check if bookmark already exists
      const exists = state.bookmarks.some(
        (b) => b.questionId === action.payload.questionId,
      );
      if (!exists) {
        state.bookmarks.push(action.payload);
      }
      state.loading.bookmarks = false;
    },

    // Remove a bookmark by question ID
    removeBookmark: (state, action: PayloadAction<string>) => {
      state.bookmarks = state.bookmarks.filter(
        (b) => b.questionId !== action.payload,
      );
      state.loading.bookmarks = false;
    },

    // Set collections
    setCollections: (state, action: PayloadAction<SavedCollection[]>) => {
      state.collections = action.payload;
      state.loading.collections = false;
    },

    // Add a collection
    addCollection: (state, action: PayloadAction<SavedCollection>) => {
      state.collections.push(action.payload);
      state.loading.collections = false;
    },

    // Update a collection
    updateCollection: (state, action: PayloadAction<SavedCollection>) => {
      const index = state.collections.findIndex(
        (c) => c.collectionId === action.payload.collectionId,
      );
      if (index !== -1) {
        state.collections[index] = action.payload;
      }
      state.loading.collections = false;
    },

    // Remove a collection by collection ID
    removeCollection: (state, action: PayloadAction<string>) => {
      state.collections = state.collections.filter(
        (c) => c.collectionId !== action.payload,
      );
      state.loading.collections = false;
    },

    // Set vocabulary progress
    setVocabulary: (
      state,
      action: PayloadAction<VocabularyProgress | null>,
    ) => {
      state.vocabulary = action.payload;
      state.loading.vocabulary = false;
    },

    // Update vocabulary progress (merge)
    updateVocabulary: (state, action: PayloadAction<VocabularyProgress>) => {
      state.vocabulary = { ...state.vocabulary, ...action.payload };
      state.loading.vocabulary = false;
    },

    // Set user preferences
    setPreferences: (state, action: PayloadAction<UserPreferences | null>) => {
      state.preferences = action.payload;
    },

    // Update user preferences (merge)
    updatePreferences: (state, action: PayloadAction<UserPreferences>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    // Set loading state for a specific data type
    setDataLoading: (
      state,
      action: PayloadAction<{
        dataType: keyof UserDataState["loading"];
        loading: boolean;
      }>,
    ) => {
      state.loading[action.payload.dataType] = action.payload.loading;
    },

    // Set error message
    setDataError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear all user data (on logout)
    clearUserData: (state) => {
      state.profile = null;
      state.statistics = {};
      state.sessions = [];
      state.bookmarks = [];
      state.collections = [];
      state.vocabulary = null;
      state.preferences = null;
      state.loading = {
        profile: false,
        statistics: false,
        sessions: false,
        bookmarks: false,
        collections: false,
        vocabulary: false,
      };
      state.error = null;
    },
  },
});

// Export actions
export const {
  setProfile,
  updateProfile,
  setStatistics,
  updateStatistics,
  setSessions,
  addSession,
  updateSession,
  setBookmarks,
  addBookmark,
  removeBookmark,
  setCollections,
  addCollection,
  updateCollection,
  removeCollection,
  setVocabulary,
  updateVocabulary,
  setPreferences,
  updatePreferences,
  setDataLoading,
  setDataError,
  clearUserData,
} = userDataSlice.actions;

// Export reducer
export default userDataSlice.reducer;
