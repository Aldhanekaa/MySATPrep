/**
 * User Data Redux Slice
 * Manages all user-specific data including profile, statistics, sessions, bookmarks, collections, vocabulary, and preferences
 *
 * Validates: Requirement 4.3
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { UserDataState } from "@/lib/types/userData";
import type { UserProfileWithHistory } from "@/types/userProfile";
import type { PracticeStatistics, PracticeSession } from "@/types";
import type {
  SavedQuestion,
  SavedCollection,
  VocabularyProgress,
  UserPreferences,
  UserData,
  AnswerHistory,
} from "@/lib/types/userData";
import type { MigrationSummary } from "@/lib/types/api";

// ─── Async Thunks ────────────────────────────────────────────────────────────

/**
 * Fetches all user data from the backend after session validation.
 * Populates the userData Redux slice with profile, statistics, sessions,
 * bookmarks, collections, vocabulary, and preferences.
 * Validates: Requirements 10.4, 10.5
 */
export const fetchUserData = createAsyncThunk<UserData | null, void>(
  "userData/fetchUserData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/user/data", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        // Not authenticated — return null rather than reject
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const json = await response.json();
      return (json.data as UserData) ?? null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch user data",
      );
    }
  },
);

/**
 * Updates the user's profile in the backend.
 * Validates: Requirements 4.8, 8.1, 13.1
 */
export const updateUserProfile = createAsyncThunk<
  UserProfileWithHistory,
  Partial<UserProfileWithHistory>
>("userData/updateUserProfile", async (profileData, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(profileData),
    });

    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error(
        json.error ?? `Failed to update profile: ${response.status}`,
      );
    }

    const json = await response.json();
    return json.data as UserProfileWithHistory;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to update profile",
    );
  }
});

/**
 * Updates the user's practice statistics in the backend.
 * Validates: Requirements 4.8, 8.2, 13.2
 */
export const updateUserStatistics = createAsyncThunk<
  PracticeStatistics,
  PracticeStatistics
>(
  "userData/updateUserStatistics",
  async (statisticsData, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/user/statistics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(statisticsData),
      });

      if (response.status === 401) {
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(
          json.error ?? `Failed to update statistics: ${response.status}`,
        );
      }

      const json = await response.json();
      return json.data as PracticeStatistics;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update statistics",
      );
    }
  },
);

/**
 * Creates a new practice session in the backend.
 * Validates: Requirements 4.8, 8.3, 13.3
 */
export const createSession = createAsyncThunk<PracticeSession, PracticeSession>(
  "userData/createSession",
  async (sessionData, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/user/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(sessionData),
      });

      if (response.status === 401) {
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(
          json.error ?? `Failed to create session: ${response.status}`,
        );
      }

      const json = await response.json();
      return json.data as PracticeSession;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to create session",
      );
    }
  },
);

/**
 * Updates an existing practice session in the backend.
 * Validates: Requirements 4.8, 8.4, 13.3
 */
export const updateSessionThunk = createAsyncThunk<
  PracticeSession,
  { id: string; sessionData: Partial<PracticeSession> }
>(
  "userData/updateSession",
  async ({ id, sessionData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/user/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(sessionData),
      });

      if (response.status === 401) {
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(
          json.error ?? `Failed to update session: ${response.status}`,
        );
      }

      const json = await response.json();
      return json.data as PracticeSession;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update session",
      );
    }
  },
);

/**
 * Adds a bookmark (saved question) in the backend.
 * Validates: Requirements 4.8, 8.5, 13.4
 */
export const addBookmarkThunk = createAsyncThunk<
  SavedQuestion,
  Omit<SavedQuestion, "id" | "userId">
>("userData/addBookmark", async (bookmarkData, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/user/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(bookmarkData),
    });

    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error(
        json.error ?? `Failed to add bookmark: ${response.status}`,
      );
    }

    const json = await response.json();
    return json.data as SavedQuestion;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to add bookmark",
    );
  }
});

/**
 * Removes a bookmark by ID in the backend.
 * Validates: Requirements 4.8, 8.6, 13.4
 */
export const removeBookmarkThunk = createAsyncThunk<string, string>(
  "userData/removeBookmark",
  async (questionId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/user/bookmarks/${questionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.status === 401) {
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(
          json.error ?? `Failed to remove bookmark: ${response.status}`,
        );
      }

      return questionId;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to remove bookmark",
      );
    }
  },
);

/**
 * Creates a new collection in the backend.
 * Validates: Requirements 4.8, 8.7, 13.5
 */
export const createCollection = createAsyncThunk<
  SavedCollection,
  Omit<SavedCollection, "id" | "userId">
>("userData/createCollection", async (collectionData, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/user/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(collectionData),
    });

    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error(
        json.error ?? `Failed to create collection: ${response.status}`,
      );
    }

    const json = await response.json();
    return json.data as SavedCollection;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to create collection",
    );
  }
});

/**
 * Updates an existing collection in the backend.
 * Validates: Requirements 4.8, 8.8, 13.5
 */
export const updateCollectionThunk = createAsyncThunk<
  SavedCollection,
  { id: string; collectionData: Partial<SavedCollection> }
>(
  "userData/updateCollection",
  async ({ id, collectionData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/user/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(collectionData),
      });

      if (response.status === 401) {
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(
          json.error ?? `Failed to update collection: ${response.status}`,
        );
      }

      const json = await response.json();
      return json.data as SavedCollection;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update collection",
      );
    }
  },
);

/**
 * Deletes a collection in the backend.
 * Validates: Requirements 4.8, 8.9, 13.5
 */
export const deleteCollection = createAsyncThunk<string, string>(
  "userData/deleteCollection",
  async (collectionId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/user/collections/${collectionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.status === 401) {
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(
          json.error ?? `Failed to delete collection: ${response.status}`,
        );
      }

      return collectionId;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete collection",
      );
    }
  },
);

/**
 * Updates vocabulary progress in the backend.
 * Validates: Requirements 4.8, 8.10, 13.6
 */
export const updateVocabularyThunk = createAsyncThunk<
  VocabularyProgress,
  VocabularyProgress
>("userData/updateVocabulary", async (vocabularyData, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/user/vocabulary", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(vocabularyData),
    });

    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error(
        json.error ?? `Failed to update vocabulary: ${response.status}`,
      );
    }

    const json = await response.json();
    return json.data as VocabularyProgress;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to update vocabulary",
    );
  }
});

/**
 * Updates user preferences in the backend.
 * Validates: Requirements 4.8, 13.7
 */
export const updatePreferencesThunk = createAsyncThunk<
  UserPreferences,
  UserPreferences
>(
  "userData/updatePreferences",
  async (preferencesData, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(preferencesData),
      });

      if (response.status === 401) {
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(
          json.error ?? `Failed to update preferences: ${response.status}`,
        );
      }

      const json = await response.json();
      return json.data as UserPreferences;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update preferences",
      );
    }
  },
);

/**
 * Migrates all localStorage data to the database for an authenticated user.
 * Reads data from all known localStorage keys, sends it to the migration
 * endpoint, and updates the Redux store with the migrated data on success.
 * Validates: Requirements 4.8, 11.4
 */
export const migrateLocalStorageData = createAsyncThunk<MigrationSummary, void>(
  "userData/migrateLocalStorageData",
  async (_, { dispatch, rejectWithValue }) => {
    // Collect localStorage data for all known keys
    const profile = (() => {
      try {
        const raw = localStorage.getItem("userProfile");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    const statistics = (() => {
      try {
        const raw = localStorage.getItem("practiceStatistics");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    const sessions = (() => {
      try {
        const raw = localStorage.getItem("practiceHistory");
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    })();

    const bookmarks = (() => {
      try {
        const raw = localStorage.getItem("savedQuestions");
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        // localStorage stores bookmarks as Record<assessment, SavedQuestion[]>
        // The assessment key is not stored inside each item, so inject it.
        if (Array.isArray(parsed)) return parsed;
        return Object.entries(parsed).flatMap(([assessment, questions]) =>
          (questions as Record<string, unknown>[]).map((q) => ({
            ...q,
            assessment,
          })),
        );
      } catch {
        return [];
      }
    })();

    const collections = (() => {
      try {
        const raw = localStorage.getItem("savedCollections");
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        // localStorage stores collections as Record<collectionId, SavedCollection>
        // The collectionId key is not stored inside each item, so inject it.
        if (Array.isArray(parsed)) return parsed;
        return Object.entries(parsed).map(([collectionId, col]) => ({
          ...(col as Record<string, unknown>),
          collectionId,
        }));
      } catch {
        return [];
      }
    })();

    const vocabulary = (() => {
      try {
        const raw = localStorage.getItem("vocabsData");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    const preferences = (() => {
      try {
        const raw = localStorage.getItem("userPreferences");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    const payload = {
      ...(profile ? { profile } : {}),
      ...(statistics ? { statistics } : {}),
      sessions: sessions ?? [],
      bookmarks: bookmarks ?? [],
      collections: collections ?? [],
      ...(vocabulary ? { vocabulary } : {}),
      ...(preferences ? { preferences } : {}),
    };

    try {
      const response = await fetch("/api/user/migrate-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error ?? `Migration failed: ${response.status}`);
      }

      const json = await response.json();
      const summary = json.summary as MigrationSummary;

      // After successful migration, refresh user data from the database
      dispatch(fetchUserData());

      return summary;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Migration failed",
      );
    }
  },
);

// ─── Sync (Merge) LocalStorage Data Thunk ─────────────────────────────────────

/**
 * Merges localStorage data with current Redux state (DB data) and syncs the
 * result back to the database. Used when the user already has DB data but
 * their localStorage contains additional progress not yet uploaded.
 *
 * Merge strategy:
 * - Profile: take higher counts (XP, questions answered, correct/incorrect)
 * - Statistics: union of answeredQuestions arrays
 * - Sessions: union by sessionId
 * - Bookmarks: union by questionId
 * - Collections: union by collectionId, merging questionIds inside each
 * - Vocabulary: shallow merge (localStorage keys overwrite DB keys)
 * - Preferences: localStorage wins (user's most recent local choice)
 */
export const syncLocalStorageData = createAsyncThunk<
  MigrationSummary,
  void,
  { state: { userData: UserDataState } }
>(
  "userData/syncLocalStorageData",
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const {
      profile,
      statistics,
      sessions,
      bookmarks,
      collections,
      vocabulary,
      preferences,
    } = state.userData;

    // ── Read localStorage data ─────────────────────────────────────────────
    const localProfile = (() => {
      try {
        const raw = localStorage.getItem("userProfile");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    const localStatistics = (() => {
      try {
        const raw = localStorage.getItem("practiceStatistics");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    const localSessions = (() => {
      try {
        const raw = localStorage.getItem("practiceHistory");
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    })();

    const localBookmarks = (() => {
      try {
        const raw = localStorage.getItem("savedQuestions");
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        return Object.entries(parsed).flatMap(([assessment, questions]) =>
          (questions as Record<string, unknown>[]).map((q) => ({
            ...q,
            assessment,
          })),
        );
      } catch {
        return [];
      }
    })();

    const localCollections = (() => {
      try {
        const raw = localStorage.getItem("savedCollections");
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        return Object.entries(parsed).map(([collectionId, col]) => ({
          ...(col as Record<string, unknown>),
          collectionId,
        }));
      } catch {
        return [];
      }
    })();

    const localVocabulary = (() => {
      try {
        const raw = localStorage.getItem("vocabsData");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    const localPreferences = (() => {
      try {
        const raw = localStorage.getItem("userPreferences");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    // ── Merge logic ─────────────────────────────────────────────────────────

    // Profile: take max of all numeric fields, merge xpHistory by (questionId, timestamp)
    const mergedProfile = (() => {
      if (!profile && !localProfile) return null;
      const dbProfile = (profile ?? {}) as Partial<UserProfileWithHistory>;
      const lsProfile = (localProfile ?? {}) as Partial<UserProfileWithHistory>;

      const mergedXpHistory = [
        ...(dbProfile.xpHistory ?? []),
        ...(lsProfile.xpHistory ?? []),
      ];
      // Dedupe by (questionId + timestamp)
      const xpMap = new Map<string, (typeof mergedXpHistory)[0]>();
      for (const tx of mergedXpHistory) {
        const key = `${tx.questionId}::${tx.timestamp}`;
        if (!xpMap.has(key)) xpMap.set(key, tx);
      }

      return {
        totalXP: Math.max(dbProfile.totalXP ?? 0, lsProfile.totalXP ?? 0),
        level: Math.max(dbProfile.level ?? 0, lsProfile.level ?? 0),
        questionsAnswered: Math.max(
          dbProfile.questionsAnswered ?? 0,
          lsProfile.questionsAnswered ?? 0,
        ),
        correctAnswers: Math.max(
          dbProfile.correctAnswers ?? 0,
          lsProfile.correctAnswers ?? 0,
        ),
        incorrectAnswers: Math.max(
          dbProfile.incorrectAnswers ?? 0,
          lsProfile.incorrectAnswers ?? 0,
        ),
        lastActivity:
          (dbProfile.lastActivity ?? "") > (lsProfile.lastActivity ?? "")
            ? dbProfile.lastActivity
            : lsProfile.lastActivity,
        xpHistory: Array.from(xpMap.values()).sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        ),
        createdAt:
          dbProfile.createdAt ??
          lsProfile.createdAt ??
          new Date().toISOString(),
      };
    })();

    // Statistics: merge per-assessment answeredQuestions arrays
    const mergedStatistics = (() => {
      const dbStats = statistics ?? {};
      const lsStats = localStatistics ?? {};
      const allAssessments = new Set([
        ...Object.keys(dbStats),
        ...Object.keys(lsStats),
      ]);

      const result: Record<string, any> = {};
      for (const assessment of allAssessments) {
        const dbData = (dbStats as Record<string, any>)[assessment] ?? {};
        const lsData = (lsStats as Record<string, any>)[assessment] ?? {};

        const answeredQuestionsSet = new Set([
          ...(dbData.answeredQuestions ?? []),
          ...(lsData.answeredQuestions ?? []),
        ]);

        const detailedMap = new Map();
        for (const detail of [
          ...(dbData.answeredQuestionsDetailed ?? []),
          ...(lsData.answeredQuestionsDetailed ?? []),
        ]) {
          const key = detail.questionId;
          if (
            !detailedMap.has(key) ||
            detail.timestamp > (detailedMap.get(key).timestamp ?? "")
          ) {
            detailedMap.set(key, detail);
          }
        }

        result[assessment] = {
          answeredQuestions: Array.from(answeredQuestionsSet),
          answeredQuestionsDetailed: Array.from(detailedMap.values()),
          statistics: {
            ...(dbData.statistics ?? {}),
            ...(lsData.statistics ?? {}),
          },
        };
      }
      return result;
    })();

    // Sessions: union by sessionId
    const mergedSessions = (() => {
      const sessionMap = new Map();
      for (const session of [...sessions, ...localSessions]) {
        if (!sessionMap.has(session.sessionId)) {
          sessionMap.set(session.sessionId, session);
        }
      }
      return Array.from(sessionMap.values());
    })();

    // Bookmarks: union by questionId
    const mergedBookmarks = (() => {
      const bookmarkMap = new Map();
      for (const bookmark of [...bookmarks, ...localBookmarks]) {
        if (!bookmarkMap.has(bookmark.questionId)) {
          bookmarkMap.set(bookmark.questionId, bookmark);
        }
      }
      return Array.from(bookmarkMap.values());
    })();

    // Collections: union by collectionId, merge questionIds within each
    const mergedCollections = (() => {
      const collectionMap = new Map();
      for (const collection of [...collections, ...localCollections]) {
        if (!collectionMap.has(collection.collectionId)) {
          collectionMap.set(collection.collectionId, collection);
        } else {
          // Merge questionIds
          const existing = collectionMap.get(collection.collectionId);
          const mergedQuestionIds = new Set([
            ...(existing.questionIds ?? []),
            ...(collection.questionIds ?? []),
          ]);
          const detailsMap = new Map();
          for (const detail of [
            ...(existing.questionDetails ?? []),
            ...(collection.questionDetails ?? []),
          ]) {
            if (!detailsMap.has(detail.questionId)) {
              detailsMap.set(detail.questionId, detail);
            }
          }
          collectionMap.set(collection.collectionId, {
            ...existing,
            ...collection,
            questionIds: Array.from(mergedQuestionIds),
            questionDetails: Array.from(detailsMap.values()),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      return Array.from(collectionMap.values());
    })();

    // Vocabulary: shallow merge (local keys win)
    const mergedVocabulary =
      vocabulary || localVocabulary
        ? { ...(vocabulary ?? {}), ...(localVocabulary ?? {}) }
        : null;

    // Preferences: local preferences win (most recent user choice)
    const mergedPreferences =
      preferences || localPreferences
        ? { ...(preferences ?? {}), ...(localPreferences ?? {}) }
        : null;

    // ── Build sync payload ──────────────────────────────────────────────────
    const payload = {
      ...(mergedProfile ? { profile: mergedProfile } : {}),
      ...(mergedStatistics && Object.keys(mergedStatistics).length > 0
        ? { statistics: mergedStatistics }
        : {}),
      sessions: mergedSessions,
      bookmarks: mergedBookmarks,
      collections: mergedCollections,
      ...(mergedVocabulary ? { vocabulary: mergedVocabulary } : {}),
      ...(mergedPreferences ? { preferences: mergedPreferences } : {}),
    };

    try {
      const response = await fetch("/api/user/sync-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error ?? `Sync failed: ${response.status}`);
      }

      const json = await response.json();
      const summary = json.summary as MigrationSummary;

      // After successful sync, refresh user data from the database
      dispatch(fetchUserData());

      return summary;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Sync failed",
      );
    }
  },
);

// ─── Batch Update Thunk ───────────────────────────────────────────────────────

/**
 * Batch update payload type — all fields are optional;
 * only the keys present will be sent and updated.
 */
export interface BatchUpdatePayload {
  profile?: Partial<UserProfileWithHistory>;
  statistics?: PracticeStatistics;
  vocabulary?: VocabularyProgress;
  preferences?: UserPreferences;
}

export interface BatchUpdateResult {
  profile?: UserProfileWithHistory;
  statistics?: PracticeStatistics;
  vocabulary?: VocabularyProgress;
  preferences?: UserPreferences;
}

/**
 * Sends multiple user data updates in a single POST /api/user/batch-update
 * request, reducing network round-trips when several categories need to be
 * persisted at the same time (e.g. profile + statistics after a practice session).
 *
 * Validates: Requirement 19.5
 */
export const batchUpdateUserData = createAsyncThunk<
  BatchUpdateResult,
  BatchUpdatePayload
>("userData/batchUpdateUserData", async (payload, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/user/batch-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error(json.error ?? `Batch update failed: ${response.status}`);
    }

    const json = await response.json();
    return json.data as BatchUpdateResult;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Batch update failed",
    );
  }
});

// ─── Lazy Page-Level Fetch Thunks ─────────────────────────────────────────────

/**
 * Fetches practice sessions from the server on demand.
 * Dispatched when the user navigates to /dashboard/sessions.
 */
export const fetchSessions = createAsyncThunk<PracticeSession[], void>(
  "userData/fetchSessions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/user/sessions", {
        method: "GET",
        credentials: "include",
      });
      if (response.status === 401) return rejectWithValue("Unauthorized");
      if (!response.ok)
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      const json = await response.json();
      return (json.data?.sessions ?? []) as PracticeSession[];
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch sessions",
      );
    }
  },
);

/**
 * Fetches bookmarks (saved questions) and collections from the server on demand.
 * Dispatched when the user navigates to /dashboard/bookmarks.
 */
export const fetchBookmarksAndCollections = createAsyncThunk<
  { bookmarks: SavedQuestion[]; collections: SavedCollection[] },
  void
>("userData/fetchBookmarksAndCollections", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/user/bookmarks", {
      method: "GET",
      credentials: "include",
    });
    if (response.status === 401) return rejectWithValue("Unauthorized");
    if (!response.ok)
      throw new Error(`Failed to fetch bookmarks: ${response.status}`);
    const json = await response.json();
    return {
      bookmarks: (json.data?.bookmarks ?? []) as SavedQuestion[],
      collections: (json.data?.collections ?? []) as SavedCollection[],
    };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to fetch bookmarks",
    );
  }
});

/**
 * Fetches vocabulary progress from the server on demand.
 * Dispatched when the user navigates to /dashboard/vocabs.
 */
export const fetchVocabulary = createAsyncThunk<
  VocabularyProgress | null,
  void
>("userData/fetchVocabulary", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/user/vocabulary", {
      method: "GET",
      credentials: "include",
    });
    if (response.status === 401) return rejectWithValue("Unauthorized");
    if (!response.ok)
      throw new Error(`Failed to fetch vocabulary: ${response.status}`);
    const json = await response.json();
    return (json.data?.vocabulary ?? null) as VocabularyProgress | null;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to fetch vocabulary",
    );
  }
});

/**
 * Fetches answer history from the server on demand.
 * Dispatched when the user navigates to /dashboard/tracker or /dashboard/answered.
 */
export const fetchAnswerHistory = createAsyncThunk<AnswerHistory | null, void>(
  "userData/fetchAnswerHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/user/answer-history", {
        method: "GET",
        credentials: "include",
      });
      if (response.status === 401) return rejectWithValue("Unauthorized");
      if (!response.ok)
        throw new Error(`Failed to fetch answer history: ${response.status}`);
      const json = await response.json();
      return (json.data?.answerHistory ?? null) as AnswerHistory | null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch answer history",
      );
    }
  },
);

// Initial user data state
const initialState: UserDataState = {
  profile: null,
  statistics: {},
  sessions: [],
  bookmarks: [],
  collections: [],
  vocabulary: null,
  preferences: null,
  answerHistory: null,
  loading: {
    profile: false,
    statistics: false,
    sessions: false,
    bookmarks: false,
    collections: false,
    vocabulary: false,
    answerHistory: false,
  },
  error: null,
};

// User data slice with reducers and extraReducers for async thunks
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

    // Remove a session by session ID (local store update only)
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(
        (s) => s.sessionId !== action.payload,
      );
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
    updateCollectionLocal: (state, action: PayloadAction<SavedCollection>) => {
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

    // Set a single UI flag (lazily initialises uiFlags if not present)
    setUiFlag: (
      state,
      action: PayloadAction<{ key: string; value: boolean }>,
    ) => {
      if (!state.preferences) {
        state.preferences = { uiFlags: {} };
      }
      if (!state.preferences.uiFlags) {
        state.preferences.uiFlags = {};
      }
      state.preferences.uiFlags[action.payload.key] = action.payload.value;
    },

    // Set answer history
    setAnswerHistory: (state, action: PayloadAction<AnswerHistory | null>) => {
      state.answerHistory = action.payload;
      state.loading.answerHistory = false;
    },

    // Merge answer history entries (shallow merge by questionId)
    mergeAnswerHistory: (state, action: PayloadAction<AnswerHistory>) => {
      state.answerHistory = {
        ...(state.answerHistory ?? {}),
        ...action.payload,
      };
      state.loading.answerHistory = false;
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
      state.answerHistory = null;
      state.loading = {
        profile: false,
        statistics: false,
        sessions: false,
        bookmarks: false,
        collections: false,
        vocabulary: false,
        answerHistory: false,
      };
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── fetchUserData ────────────────────────────────────────────────────────
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.loading.profile = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        if (action.payload) {
          state.profile = action.payload.profile;
          state.statistics = action.payload.statistics ?? {};
          state.sessions = action.payload.sessions ?? [];
          state.bookmarks = action.payload.bookmarks ?? [];
          state.collections = action.payload.collections ?? [];
          state.vocabulary = action.payload.vocabulary ?? null;
          state.preferences = action.payload.preferences ?? null;
          // Only overwrite answerHistory if the API explicitly returned it.
          // /api/user/data lazy-excludes this field; it is fetched on demand
          // via fetchAnswerHistory. Overwriting with undefined → null would
          // wipe data already loaded by fetchAnswerHistory.
          if ("answerHistory" in (action.payload as object)) {
            state.answerHistory = action.payload.answerHistory ?? null;
          }
        }
        state.loading = {
          profile: false,
          statistics: false,
          sessions: false,
          bookmarks: false,
          collections: false,
          vocabulary: false,
          answerHistory: false,
        };
        state.error = null;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = {
          profile: false,
          statistics: false,
          sessions: false,
          bookmarks: false,
          collections: false,
          vocabulary: false,
          answerHistory: false,
        };
        state.error = action.payload as string;
      });

    // ── updateUserProfile ────────────────────────────────────────────────────
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading.profile = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.loading.profile = false;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error = action.payload as string;
      });

    // ── updateUserStatistics ─────────────────────────────────────────────────
    builder
      .addCase(updateUserStatistics.pending, (state) => {
        state.loading.statistics = true;
        state.error = null;
      })
      .addCase(updateUserStatistics.fulfilled, (state, action) => {
        state.statistics = { ...state.statistics, ...action.payload };
        state.loading.statistics = false;
        state.error = null;
      })
      .addCase(updateUserStatistics.rejected, (state, action) => {
        state.loading.statistics = false;
        state.error = action.payload as string;
      });

    // ── createSession ────────────────────────────────────────────────────────
    builder
      .addCase(createSession.pending, (state) => {
        state.loading.sessions = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.sessions.unshift(action.payload);
        state.loading.sessions = false;
        state.error = null;
      })
      .addCase(createSession.rejected, (state, action) => {
        state.loading.sessions = false;
        state.error = action.payload as string;
      });

    // ── updateSession ────────────────────────────────────────────────────────
    builder
      .addCase(updateSessionThunk.pending, (state) => {
        state.loading.sessions = true;
        state.error = null;
      })
      .addCase(updateSessionThunk.fulfilled, (state, action) => {
        const index = state.sessions.findIndex(
          (s) => s.sessionId === action.payload.sessionId,
        );
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
        state.loading.sessions = false;
        state.error = null;
      })
      .addCase(updateSessionThunk.rejected, (state, action) => {
        state.loading.sessions = false;
        state.error = action.payload as string;
      });

    // ── addBookmarkThunk ─────────────────────────────────────────────────────
    builder
      .addCase(addBookmarkThunk.pending, (state) => {
        state.loading.bookmarks = true;
        state.error = null;
      })
      .addCase(addBookmarkThunk.fulfilled, (state, action) => {
        const exists = state.bookmarks.some(
          (b) => b.questionId === action.payload.questionId,
        );
        if (!exists) {
          state.bookmarks.push(action.payload);
        }
        state.loading.bookmarks = false;
        state.error = null;
      })
      .addCase(addBookmarkThunk.rejected, (state, action) => {
        state.loading.bookmarks = false;
        state.error = action.payload as string;
      });

    // ── removeBookmarkThunk ──────────────────────────────────────────────────
    builder
      .addCase(removeBookmarkThunk.pending, (state) => {
        state.loading.bookmarks = true;
        state.error = null;
      })
      .addCase(removeBookmarkThunk.fulfilled, (state, action) => {
        state.bookmarks = state.bookmarks.filter(
          (b) => b.questionId !== action.payload,
        );
        state.loading.bookmarks = false;
        state.error = null;
      })
      .addCase(removeBookmarkThunk.rejected, (state, action) => {
        state.loading.bookmarks = false;
        state.error = action.payload as string;
      });

    // ── createCollection ─────────────────────────────────────────────────────
    builder
      .addCase(createCollection.pending, (state) => {
        state.loading.collections = true;
        state.error = null;
      })
      .addCase(createCollection.fulfilled, (state, action) => {
        state.collections.push(action.payload);
        state.loading.collections = false;
        state.error = null;
      })
      .addCase(createCollection.rejected, (state, action) => {
        state.loading.collections = false;
        state.error = action.payload as string;
      });

    // ── updateCollectionThunk ────────────────────────────────────────────────
    builder
      .addCase(updateCollectionThunk.pending, (state) => {
        state.loading.collections = true;
        state.error = null;
      })
      .addCase(updateCollectionThunk.fulfilled, (state, action) => {
        const index = state.collections.findIndex(
          (c) => c.collectionId === action.payload.collectionId,
        );
        if (index !== -1) {
          state.collections[index] = action.payload;
        }
        state.loading.collections = false;
        state.error = null;
      })
      .addCase(updateCollectionThunk.rejected, (state, action) => {
        state.loading.collections = false;
        state.error = action.payload as string;
      });

    // ── deleteCollection ─────────────────────────────────────────────────────
    builder
      .addCase(deleteCollection.pending, (state) => {
        state.loading.collections = true;
        state.error = null;
      })
      .addCase(deleteCollection.fulfilled, (state, action) => {
        state.collections = state.collections.filter(
          (c) => c.collectionId !== action.payload,
        );
        state.loading.collections = false;
        state.error = null;
      })
      .addCase(deleteCollection.rejected, (state, action) => {
        state.loading.collections = false;
        state.error = action.payload as string;
      });

    // ── updateVocabularyThunk ────────────────────────────────────────────────
    builder
      .addCase(updateVocabularyThunk.pending, (state) => {
        state.loading.vocabulary = true;
        state.error = null;
      })
      .addCase(updateVocabularyThunk.fulfilled, (state, action) => {
        state.vocabulary = { ...state.vocabulary, ...action.payload };
        state.loading.vocabulary = false;
        state.error = null;
      })
      .addCase(updateVocabularyThunk.rejected, (state, action) => {
        state.loading.vocabulary = false;
        state.error = action.payload as string;
      });

    // ── updatePreferencesThunk ───────────────────────────────────────────────
    builder
      .addCase(updatePreferencesThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(updatePreferencesThunk.fulfilled, (state, action) => {
        state.preferences = { ...state.preferences, ...action.payload };
        state.error = null;
      })
      .addCase(updatePreferencesThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // ── migrateLocalStorageData ──────────────────────────────────────────────
    builder
      .addCase(migrateLocalStorageData.pending, (state) => {
        state.error = null;
      })
      .addCase(migrateLocalStorageData.fulfilled, (state) => {
        // Data refresh is handled by the dispatched fetchUserData within the thunk
        state.error = null;
      })
      .addCase(migrateLocalStorageData.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // ── fetchSessions (lazy page fetch) ─────────────────────────────────────
    builder
      .addCase(fetchSessions.pending, (state) => {
        state.loading.sessions = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.sessions = action.payload;
        state.loading.sessions = false;
        state.error = null;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading.sessions = false;
        state.error = action.payload as string;
      });

    // ── fetchBookmarksAndCollections (lazy page fetch) ───────────────────────
    builder
      .addCase(fetchBookmarksAndCollections.pending, (state) => {
        state.loading.bookmarks = true;
        state.loading.collections = true;
        state.error = null;
      })
      .addCase(fetchBookmarksAndCollections.fulfilled, (state, action) => {
        state.bookmarks = action.payload.bookmarks;
        state.collections = action.payload.collections;
        state.loading.bookmarks = false;
        state.loading.collections = false;
        state.error = null;
      })
      .addCase(fetchBookmarksAndCollections.rejected, (state, action) => {
        state.loading.bookmarks = false;
        state.loading.collections = false;
        state.error = action.payload as string;
      });

    // ── fetchVocabulary (lazy page fetch) ────────────────────────────────────
    builder
      .addCase(fetchVocabulary.pending, (state) => {
        state.loading.vocabulary = true;
        state.error = null;
      })
      .addCase(fetchVocabulary.fulfilled, (state, action) => {
        state.vocabulary = action.payload;
        state.loading.vocabulary = false;
        state.error = null;
      })
      .addCase(fetchVocabulary.rejected, (state, action) => {
        state.loading.vocabulary = false;
        state.error = action.payload as string;
      });

    // ── fetchAnswerHistory (lazy page fetch) ─────────────────────────────────
    builder
      .addCase(fetchAnswerHistory.pending, (state) => {
        state.loading.answerHistory = true;
        state.error = null;
      })
      .addCase(fetchAnswerHistory.fulfilled, (state, action) => {
        state.answerHistory = action.payload;
        state.loading.answerHistory = false;
        state.error = null;
      })
      .addCase(fetchAnswerHistory.rejected, (state, action) => {
        state.loading.answerHistory = false;
        state.error = action.payload as string;
      });

    // ── batchUpdateUserData ──────────────────────────────────────────────────
    builder
      .addCase(batchUpdateUserData.pending, (state) => {
        // Mark all categories that could be affected as loading
        state.loading.profile = true;
        state.loading.statistics = true;
        state.loading.vocabulary = true;
        state.error = null;
      })
      .addCase(batchUpdateUserData.fulfilled, (state, action) => {
        const result = action.payload;

        if (result.profile !== undefined) {
          state.profile = result.profile;
        }

        if (result.statistics !== undefined) {
          state.statistics = { ...state.statistics, ...result.statistics };
        }

        if (result.vocabulary !== undefined) {
          state.vocabulary = result.vocabulary;
        }

        if (result.preferences !== undefined) {
          state.preferences = result.preferences;
        }

        // Reset loading flags
        state.loading.profile = false;
        state.loading.statistics = false;
        state.loading.vocabulary = false;
        state.error = null;
      })
      .addCase(batchUpdateUserData.rejected, (state, action) => {
        state.loading.profile = false;
        state.loading.statistics = false;
        state.loading.vocabulary = false;
        state.error = action.payload as string;
      });
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
  removeSession,
  setBookmarks,
  addBookmark,
  removeBookmark,
  setCollections,
  addCollection,
  updateCollectionLocal,
  removeCollection,
  setVocabulary,
  updateVocabulary,
  setPreferences,
  updatePreferences,
  setUiFlag,
  setAnswerHistory,
  mergeAnswerHistory,
  setDataLoading,
  setDataError,
  clearUserData,
} = userDataSlice.actions;

// Alias: updateCollection → updateCollectionLocal (sync reducer)
// The async thunk is updateCollectionThunk (follows updateCollectionThunk pattern)
export const updateCollection = updateCollectionLocal;

// Export reducer
export default userDataSlice.reducer;
