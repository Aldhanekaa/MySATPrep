/**
 * Data Synchronization Utilities
 *
 * Provides a unified interface for persisting user data.
 * - Authenticated users: data is saved to the database via API and Redux is updated.
 * - Unauthenticated users: data is saved to localStorage (existing behavior).
 *
 * Debounced variants (500 ms) are exported for high-frequency update paths so
 * rapid successive calls are coalesced into a single API request, reducing
 * unnecessary network traffic.
 *
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.10, 18.6, 19.4, 19.5
 */

import type { AppDispatch, RootState } from "@/lib/redux/store";
import type { UserProfileWithHistory } from "@/types/userProfile";
import type { PracticeStatistics, PracticeSession } from "@/types";
import type {
  SavedQuestion,
  SavedCollection,
  VocabularyProgress,
  UserPreferences,
} from "@/lib/types/userData";
import {
  updateUserProfile,
  updateUserStatistics,
  createSession,
  updateSessionThunk,
  removeSession,
  addBookmarkThunk,
  removeBookmarkThunk,
  createCollection,
  updateCollectionThunk,
  deleteCollection,
  updateVocabularyThunk,
  updatePreferencesThunk,
  batchUpdateUserData,
  type BatchUpdatePayload,
} from "@/lib/redux/slices/userDataSlice";
import { saveUserProfile as saveProfileToLocalStorage } from "@/lib/userProfile";
import { savePracticeStatistics } from "@/lib/practiceStatistics";
import { withRetry } from "@/lib/utils/retry";
import { showNetworkError } from "@/lib/utils/notifications";
import { debounce } from "@/lib/utils/debounce";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true if the current Redux state indicates an authenticated user.
 */
function isAuthenticated(state: RootState): boolean {
  return state.auth.isAuthenticated;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

/**
 * Saves user profile data.
 * Authenticated → PUT /api/user/profile + Redux update.
 * Unauthenticated → localStorage.
 *
 * Validates: Requirement 13.1
 */
export function saveUserProfile(
  data: Partial<UserProfileWithHistory>,
  dispatch: AppDispatch,
  state: RootState,
): void {
  if (isAuthenticated(state)) {
    withRetry(
      () => dispatch(updateUserProfile(data)) as unknown as Promise<unknown>,
    ).catch(() => {
      showNetworkError("Failed to save profile. Please check your connection.");
    });
  } else {
    // Merge with existing profile and write to localStorage
    try {
      const raw = localStorage.getItem("userProfile");
      const existing: UserProfileWithHistory = raw ? JSON.parse(raw) : {};
      saveProfileToLocalStorage({
        ...existing,
        ...data,
      } as UserProfileWithHistory);
    } catch (error) {
      console.error(
        "[dataSync] Failed to save profile to localStorage:",
        error,
      );
    }
  }
}

// ─── Statistics ───────────────────────────────────────────────────────────────

/**
 * Saves practice statistics.
 * Authenticated → PUT /api/user/statistics + Redux update.
 * Unauthenticated → localStorage.
 *
 * Validates: Requirement 13.2
 */
export function saveUserStatistics(
  data: PracticeStatistics,
  dispatch: AppDispatch,
  state: RootState,
): void {
  if (isAuthenticated(state)) {
    withRetry(
      () => dispatch(updateUserStatistics(data)) as unknown as Promise<unknown>,
    ).catch(() => {
      showNetworkError(
        "Failed to save statistics. Please check your connection.",
      );
    });
  } else {
    savePracticeStatistics(data);
  }
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

/**
 * Creates a new practice session.
 * Authenticated → POST /api/user/sessions + Redux update.
 * Unauthenticated → localStorage ("practiceHistory" key).
 *
 * Validates: Requirement 13.3
 */
export function savePracticeSession(
  data: PracticeSession,
  dispatch: AppDispatch,
  state: RootState,
): void {
  if (isAuthenticated(state)) {
    withRetry(
      () => dispatch(createSession(data)) as unknown as Promise<unknown>,
    ).catch(() => {
      showNetworkError("Failed to save session. Please check your connection.");
    });
  } else {
    try {
      const raw = localStorage.getItem("practiceHistory");
      const sessions: PracticeSession[] = raw ? JSON.parse(raw) : [];
      // Prevent duplicates
      const idx = sessions.findIndex((s) => s.sessionId === data.sessionId);
      if (idx !== -1) {
        sessions[idx] = data;
      } else {
        sessions.unshift(data);
      }
      // Keep only the most recent 20 sessions
      localStorage.setItem(
        "practiceHistory",
        JSON.stringify(sessions.slice(0, 20)),
      );
    } catch (error) {
      console.error(
        "[dataSync] Failed to save session to localStorage:",
        error,
      );
    }
  }
}

/**
 * Updates an existing practice session.
 * Authenticated → PUT /api/user/sessions/:id + Redux update.
 * Unauthenticated → localStorage.
 *
 * Validates: Requirement 13.3
 */
export function updatePracticeSession(
  id: string,
  sessionData: Partial<PracticeSession>,
  dispatch: AppDispatch,
  state: RootState,
): void {
  if (isAuthenticated(state)) {
    withRetry(
      () =>
        dispatch(
          updateSessionThunk({ id, sessionData }),
        ) as unknown as Promise<unknown>,
    ).catch(() => {
      showNetworkError(
        "Failed to update session. Please check your connection.",
      );
    });
  } else {
    try {
      const raw = localStorage.getItem("practiceHistory");
      const sessions: PracticeSession[] = raw ? JSON.parse(raw) : [];
      const idx = sessions.findIndex((s) => s.sessionId === id);
      if (idx !== -1) {
        sessions[idx] = { ...sessions[idx], ...sessionData };
        localStorage.setItem("practiceHistory", JSON.stringify(sessions));
      }
    } catch (error) {
      console.error(
        "[dataSync] Failed to update session in localStorage:",
        error,
      );
    }
  }
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

/**
 * Adds a bookmark (saved question).
 * Authenticated → POST /api/user/bookmarks + Redux update.
 * Unauthenticated → localStorage ("savedQuestions" key, keyed by assessment).
 *
 * Validates: Requirement 13.4
 */
export function saveBookmark(
  data: Omit<SavedQuestion, "id" | "userId">,
  dispatch: AppDispatch,
  state: RootState,
): void {
  if (isAuthenticated(state)) {
    withRetry(
      () => dispatch(addBookmarkThunk(data)) as unknown as Promise<unknown>,
    ).catch(() => {
      showNetworkError(
        "Failed to save bookmark. Please check your connection.",
      );
    });
  } else {
    try {
      const raw = localStorage.getItem("savedQuestions");
      const savedQuestions: Record<string, SavedQuestion[]> = raw
        ? JSON.parse(raw)
        : {};
      const key = data.assessment;
      const existing = savedQuestions[key] ?? [];
      const alreadySaved = existing.some(
        (q) => q.questionId === data.questionId,
      );
      if (!alreadySaved) {
        savedQuestions[key] = [...existing, { ...data }];
        localStorage.setItem("savedQuestions", JSON.stringify(savedQuestions));
      }
    } catch (error) {
      console.error(
        "[dataSync] Failed to save bookmark to localStorage:",
        error,
      );
    }
  }
}

/**
 * Removes a bookmark by question ID.
 * Authenticated → DELETE /api/user/bookmarks/:id + Redux update.
 * Unauthenticated → localStorage.
 *
 * Validates: Requirement 13.4
 */
export function removeBookmark(
  questionId: string,
  dispatch: AppDispatch,
  state: RootState,
): void {
  if (isAuthenticated(state)) {
    withRetry(
      () =>
        dispatch(
          removeBookmarkThunk(questionId),
        ) as unknown as Promise<unknown>,
    ).catch(() => {
      showNetworkError(
        "Failed to remove bookmark. Please check your connection.",
      );
    });
  } else {
    try {
      const raw = localStorage.getItem("savedQuestions");
      if (!raw) return;
      const savedQuestions: Record<string, SavedQuestion[]> = JSON.parse(raw);
      for (const key of Object.keys(savedQuestions)) {
        savedQuestions[key] = savedQuestions[key].filter(
          (q) => q.questionId !== questionId,
        );
      }
      localStorage.setItem("savedQuestions", JSON.stringify(savedQuestions));
    } catch (error) {
      console.error(
        "[dataSync] Failed to remove bookmark from localStorage:",
        error,
      );
    }
  }
}

// ─── Collections ──────────────────────────────────────────────────────────────

/**
 * Creates a new collection.
 * Authenticated → POST /api/user/collections + Redux update.
 * Unauthenticated → localStorage ("savedCollections" key).
 *
 * Validates: Requirement 13.5
 */
export function saveCollection(
  data: Omit<SavedCollection, "id" | "userId">,
  dispatch: AppDispatch,
  state: RootState,
): void {
  if (isAuthenticated(state)) {
    withRetry(
      () => dispatch(createCollection(data)) as unknown as Promise<unknown>,
    ).catch(() => {
      showNetworkError(
        "Failed to save collection. Please check your connection.",
      );
    });
  } else {
    try {
      const raw = localStorage.getItem("savedCollections");
      const collections: Record<string, SavedCollection> = raw
        ? JSON.parse(raw)
        : {};
      collections[data.collectionId] = data as SavedCollection;
      localStorage.setItem("savedCollections", JSON.stringify(collections));
    } catch (error) {
      console.error(
        "[dataSync] Failed to save collection to localStorage:",
        error,
      );
    }
  }
}

/**
 * Updates an existing collection.
 * Authenticated → PUT /api/user/collections/:id + Redux update.
 * Unauthenticated → localStorage.
 *
 * Validates: Requirement 13.5
 */
export function updateCollection(
  id: string,
  collectionData: Partial<SavedCollection>,
  dispatch: AppDispatch,
  state: RootState,
): void {
  if (isAuthenticated(state)) {
    withRetry(
      () =>
        dispatch(
          updateCollectionThunk({ id, collectionData }),
        ) as unknown as Promise<unknown>,
    ).catch(() => {
      showNetworkError(
        "Failed to update collection. Please check your connection.",
      );
    });
  } else {
    try {
      const raw = localStorage.getItem("savedCollections");
      if (!raw) return;
      const collections: Record<string, SavedCollection> = JSON.parse(raw);
      if (collections[id]) {
        collections[id] = {
          ...collections[id],
          ...collectionData,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem("savedCollections", JSON.stringify(collections));
      }
    } catch (error) {
      console.error(
        "[dataSync] Failed to update collection in localStorage:",
        error,
      );
    }
  }
}

/**
 * Deletes a collection by ID.
 * Authenticated → DELETE /api/user/collections/:id + Redux update.
 * Unauthenticated → localStorage.
 *
 * Validates: Requirement 13.5
 */
export function removeCollection(
  collectionId: string,
  dispatch: AppDispatch,
  state: RootState,
): void {
  if (isAuthenticated(state)) {
    withRetry(
      () =>
        dispatch(deleteCollection(collectionId)) as unknown as Promise<unknown>,
    ).catch(() => {
      showNetworkError(
        "Failed to delete collection. Please check your connection.",
      );
    });
  } else {
    try {
      const raw = localStorage.getItem("savedCollections");
      if (!raw) return;
      const collections: Record<string, SavedCollection> = JSON.parse(raw);
      delete collections[collectionId];
      localStorage.setItem("savedCollections", JSON.stringify(collections));
    } catch (error) {
      console.error(
        "[dataSync] Failed to remove collection from localStorage:",
        error,
      );
    }
  }
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────

/**
 * Saves vocabulary progress data.
 * Authenticated → PUT /api/user/vocabulary + Redux update.
 * Unauthenticated → localStorage ("vocabsData" key).
 *
 * Validates: Requirement 13.6
 */
export function saveVocabulary(
  data: VocabularyProgress,
  dispatch: AppDispatch,
  state: RootState,
): void {
  if (isAuthenticated(state)) {
    withRetry(
      () =>
        dispatch(updateVocabularyThunk(data)) as unknown as Promise<unknown>,
    ).catch(() => {
      showNetworkError(
        "Failed to save vocabulary progress. Please check your connection.",
      );
    });
  } else {
    try {
      localStorage.setItem("vocabsData", JSON.stringify(data));
    } catch (error) {
      console.error(
        "[dataSync] Failed to save vocabulary to localStorage:",
        error,
      );
    }
  }
}

// ─── Preferences ──────────────────────────────────────────────────────────────

/**
 * Saves user preferences.
 * Authenticated → PUT /api/user/preferences + Redux update.
 * Unauthenticated → localStorage ("userPreferences" key).
 *
 * Validates: Requirement 13.7
 */
export function savePreferences(
  data: UserPreferences,
  dispatch: AppDispatch,
  state: RootState,
): void {
  if (isAuthenticated(state)) {
    withRetry(
      () =>
        dispatch(updatePreferencesThunk(data)) as unknown as Promise<unknown>,
    ).catch(() => {
      showNetworkError(
        "Failed to save preferences. Please check your connection.",
      );
    });
  } else {
    try {
      localStorage.setItem("userPreferences", JSON.stringify(data));
    } catch (error) {
      console.error(
        "[dataSync] Failed to save preferences to localStorage:",
        error,
      );
    }
  }
}

// ─── Debounced Save Functions (500 ms) ───────────────────────────────────────
//
// Use these in high-frequency update paths (e.g., per-keystroke or per-answer
// updates) to coalesce rapid successive calls into a single API request.
//
// Each debounced function maintains its own timer so concurrent operations on
// different data types do not interfere with each other.
//
// Validates: Requirement 19.4

/**
 * Debounced version of saveUserProfile.
 * Delays saving until 500 ms after the last call.
 */
export const debouncedSaveUserProfile = debounce(
  (
    data: Partial<UserProfileWithHistory>,
    dispatch: AppDispatch,
    state: RootState,
  ) => saveUserProfile(data, dispatch, state),
  500,
);

/**
 * Debounced version of saveUserStatistics.
 * Delays saving until 500 ms after the last call.
 */
export const debouncedSaveUserStatistics = debounce(
  (data: PracticeStatistics, dispatch: AppDispatch, state: RootState) =>
    saveUserStatistics(data, dispatch, state),
  500,
);

/**
 * Debounced version of saveVocabulary.
 * Delays saving until 500 ms after the last call.
 */
export const debouncedSaveVocabulary = debounce(
  (data: VocabularyProgress, dispatch: AppDispatch, state: RootState) =>
    saveVocabulary(data, dispatch, state),
  500,
);

/**
 * Debounced version of savePreferences.
 * Delays saving until 500 ms after the last call.
 */
export const debouncedSavePreferences = debounce(
  (data: UserPreferences, dispatch: AppDispatch, state: RootState) =>
    savePreferences(data, dispatch, state),
  500,
);

// ─── Batch Save (19.5) ────────────────────────────────────────────────────────

/**
 * Persists multiple data categories in a single API request.
 * Authenticated → POST /api/user/batch-update (profile, statistics, vocabulary,
 * and/or preferences in one round-trip).
 * Unauthenticated → falls back to individual localStorage writes.
 *
 * Only the keys present in `data` will be updated.
 *
 * Validates: Requirement 19.5
 */
export function batchSaveUserData(
  data: BatchUpdatePayload,
  dispatch: AppDispatch,
  state: RootState,
): void {
  if (isAuthenticated(state)) {
    withRetry(
      () => dispatch(batchUpdateUserData(data)) as unknown as Promise<unknown>,
    ).catch(() => {
      showNetworkError("Failed to save data. Please check your connection.");
    });
  } else {
    // Unauthenticated: fall back to individual localStorage writes
    if (data.profile) {
      saveUserProfile(data.profile, dispatch, state);
    }
    if (data.statistics) {
      saveUserStatistics(
        data.statistics as Parameters<typeof saveUserStatistics>[0],
        dispatch,
        state,
      );
    }
    if (data.vocabulary) {
      saveVocabulary(data.vocabulary, dispatch, state);
    }
    if (data.preferences) {
      savePreferences(data.preferences, dispatch, state);
    }
  }
}

/**
 * Debounced version of batchSaveUserData.
 * Coalesces rapid successive calls into a single API request after 500 ms.
 *
 * Validates: Requirements 19.4, 19.5
 */
export const debouncedBatchSaveUserData = debounce(
  (data: BatchUpdatePayload, dispatch: AppDispatch, state: RootState) =>
    batchSaveUserData(data, dispatch, state),
  500,
);

// ─── In-Progress Session Sync ─────────────────────────────────────────────────

/**
 * Saves or updates the in-progress (current) practice session.
 * Always writes to localStorage immediately (crash-recovery guarantee).
 * For authenticated users, also dispatches createSession or updateSession to the API.
 *
 * Authenticated: write to localStorage immediately, then debounced createSession/updateSession.
 * Unauthenticated: localStorage only.
 *
 * Validates: Requirements 5.1, 5.2
 */
export function saveCurrentSession(
  data: PracticeSession,
  dispatch: AppDispatch,
  state: RootState,
): void {
  // Always write to localStorage first (crash-recovery guarantee)
  try {
    localStorage.setItem("currentPracticeSession", JSON.stringify(data));
  } catch (error) {
    console.error(
      "[dataSync] Failed to save current session to localStorage:",
      error,
    );
  }

  if (isAuthenticated(state)) {
    // Check if session exists in Redux store
    const existingSession = state.userData.sessions.find(
      (s) => s.sessionId === data.sessionId,
    );

    if (existingSession) {
      withRetry(
        () =>
          dispatch(
            updateSessionThunk({ id: data.sessionId, sessionData: data }),
          ) as unknown as Promise<unknown>,
      ).catch(() => {
        showNetworkError(
          "Failed to save your practice session. Please check your connection.",
        );
      });
    } else {
      withRetry(
        () => dispatch(createSession(data)) as unknown as Promise<unknown>,
      ).catch(() => {
        showNetworkError(
          "Failed to save your practice session. Please check your connection.",
        );
      });
    }
  }
}

/**
 * Debounced version of saveCurrentSession (1000 ms).
 * Use this in high-frequency update paths (e.g., per-answer updates) to coalesce
 * rapid successive calls and reduce API traffic.
 *
 * Validates: Requirement 5.2
 */
export const debouncedSaveCurrentSession = debounce(
  (data: PracticeSession, dispatch: AppDispatch, state: RootState) =>
    saveCurrentSession(data, dispatch, state),
  1000,
);

/**
 * Removes the in-progress session from localStorage and optionally syncs final state
 * to the database.
 *
 * - abandon=true: dispatch removeSession only (no prior updateSession call).
 *   This is used when the user exits/abandons the session without completing it.
 * - abandon=false (complete): call updateSession with final state, then dispatch removeSession.
 *   This is used when the session is completed successfully.
 *
 * Always removes from localStorage. For authenticated users, also updates Redux accordingly.
 *
 * Validates: Requirements 5.4, 5.5
 */
export function removeCurrentSession(
  sessionId: string,
  finalData: PracticeSession | null,
  abandon: boolean,
  dispatch: AppDispatch,
  state: RootState,
): void {
  // Always remove from localStorage
  try {
    localStorage.removeItem("currentPracticeSession");
  } catch (error) {
    console.error(
      "[dataSync] Failed to remove current session from localStorage:",
      error,
    );
  }

  if (isAuthenticated(state)) {
    if (abandon) {
      // Abandon path: dispatch removeSession only (no prior updateSession)
      // Per Req 5.4: removeSession is a synchronous Redux action (local store update)
      dispatch(removeSession(sessionId));
    } else {
      // Complete path: first update the session with final data, then remove
      // Per Req 5.5: updateSession then removeSession
      if (finalData) {
        withRetry(
          () =>
            dispatch(
              updateSessionThunk({ id: sessionId, sessionData: finalData }),
            ) as unknown as Promise<unknown>,
        ).catch(() => {
          showNetworkError(
            "Failed to finalize your practice session. Please check your connection.",
          );
        });
      }
      dispatch(removeSession(sessionId));
    }
  }
}
