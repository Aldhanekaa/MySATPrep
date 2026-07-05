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
import type { QuestionNotes } from "@/types/questionNotes";
import type { PracticePerformanceData } from "@/types/vocabulary";

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

      const json = (await response.json()) as {
        data?: unknown;
        summary?: unknown;
        error?: string;
      };
      return (json.data as UserData) ?? null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch user data",
      );
    }
  },
  {
    // Skip dispatch entirely if data is already initialized or a fetch is in-flight.
    // This prevents duplicate network requests from React StrictMode double-mounts
    // or any other re-render that re-triggers the SessionInitializer effect.
    condition: (_, { getState }) => {
      const state = getState() as { userData: UserDataState };
      const { dataInitialized, loading } = state.userData;
      if (dataInitialized) return false;
      if (loading.profile) return false; // fetch already in-flight
      return true;
    },
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
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(
        json.error ?? `Failed to update profile: ${response.status}`,
      );
    }

    const json = (await response.json()) as {
      data?: unknown;
      summary?: unknown;
      error?: string;
    };
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
      // The API expects one request per assessment with the shape:
      // { assessment, answeredQuestions, answeredQuestionsDetailed, statistics }
      // statisticsData is a PracticeStatistics map keyed by assessment name,
      // so we send one PUT per assessment entry.
      const assessments = Object.keys(statisticsData);
      if (assessments.length === 0) {
        return statisticsData;
      }

      const merged: PracticeStatistics = {};

      for (const assessment of assessments) {
        const assessmentData = statisticsData[assessment];

        const payload = {
          assessment,
          answeredQuestions: assessmentData.answeredQuestions,
          answeredQuestionsDetailed: assessmentData.answeredQuestionsDetailed,
          statistics: assessmentData.statistics,
        };

        const response = await fetch("/api/user/statistics", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (response.status === 401) {
          throw new Error("Unauthorized");
        }

        if (!response.ok) {
          const json = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(
            json.error ?? `Failed to update statistics: ${response.status}`,
          );
        }

        const json = (await response.json()) as {
          data?: { statistics?: PracticeStatistics };
          error?: string;
        };

        // Merge the returned assessment data back into the result
        const returned = json.data?.statistics;
        if (returned) {
          Object.assign(merged, returned);
        }
      }

      return Object.keys(merged).length > 0 ? merged : statisticsData;
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
      // Mark this session as the current active one.
      // The DB layer (createPracticeSession) will clear the flag on any
      // pre-existing current session for this user before inserting.
      const payload: PracticeSession = { ...sessionData, currentSession: true };

      const response = await fetch("/api/user/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          json.error ?? `Failed to create session: ${response.status}`,
        );
      }

      const json = (await response.json()) as {
        data?: unknown;
        summary?: unknown;
        error?: string;
      };
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
        const json = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          json.error ?? `Failed to update session: ${response.status}`,
        );
      }

      const json = (await response.json()) as {
        data?: unknown;
        summary?: unknown;
        error?: string;
      };
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
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(
        json.error ?? `Failed to add bookmark: ${response.status}`,
      );
    }

    const json = (await response.json()) as {
      data?: unknown;
      summary?: unknown;
      error?: string;
    };
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
        const json = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
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
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(
        json.error ?? `Failed to create collection: ${response.status}`,
      );
    }

    const json = (await response.json()) as {
      data?: { collection?: SavedCollection };
      error?: string;
    };
    // API returns { success: true, data: { collection: {...} } }
    const collection = json.data?.collection;
    if (!collection) {
      throw new Error("Invalid response: missing collection data");
    }
    return collection;
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
        const json = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          json.error ?? `Failed to update collection: ${response.status}`,
        );
      }

      const json = (await response.json()) as {
        data?: { collection?: SavedCollection };
        error?: string;
      };
      // API returns { success: true, data: { collection: {...} } }
      const collection = json.data?.collection;
      if (!collection) {
        throw new Error("Invalid response: missing collection data");
      }
      return collection;
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
        const json = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
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
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(
        json.error ?? `Failed to update vocabulary: ${response.status}`,
      );
    }

    const json = (await response.json()) as {
      data?: unknown;
      summary?: unknown;
      error?: string;
    };
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
        const json = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          json.error ?? `Failed to update preferences: ${response.status}`,
        );
      }

      const json = (await response.json()) as {
        data?: unknown;
        summary?: unknown;
        error?: string;
      };
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

    const practicePerformance = (() => {
      try {
        const raw = localStorage.getItem("practicePerformanceData");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    const questionNotes = (() => {
      try {
        const raw = localStorage.getItem("questionNotes");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    const answerHistory = (() => {
      try {
        const raw = localStorage.getItem("answerHistory");
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
      ...(questionNotes ? { questionNotes } : {}),
      ...(answerHistory ? { answerHistory } : {}),
      ...(practicePerformance ? { practicePerformance } : {}),
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
        const json = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(json.error ?? `Migration failed: ${response.status}`);
      }

      const json = (await response.json()) as {
        data?: unknown;
        summary?: unknown;
        error?: string;
      };
      const summary = json.summary as MigrationSummary;

      // After successful migration, reset the initialized flag so the
      // fetchUserData condition guard allows the re-fetch to proceed, then
      // refresh Redux state from the freshly written database rows.
      dispatch(userDataSlice.actions.resetDataInitialized());
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
    const { profile, statistics, preferences } = state.userData;

    // The four lazy fields (sessions, bookmarks, collections, vocabulary) are
    // NOT populated by fetchUserData (/api/user/data). We need the real DB
    // values to merge against, so fetch them now if they haven't been loaded
    // yet (i.e. the user hasn't visited the pages that trigger lazy fetches).
    let sessions = state.userData.sessions;
    let bookmarks = state.userData.bookmarks;
    let collections = state.userData.collections;
    let vocabulary = state.userData.vocabulary;

    // Always fetch complete DB data before merging — we need the real DB state
    // for bookmarks, collections, sessions, and vocabulary to avoid wiping DB
    // rows that haven't been loaded into Redux yet (e.g. the user hasn't
    // visited the bookmarks page this session).
    try {
      const res = await fetch("/api/user/complete-data", {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const json = (await res.json()) as {
          data?: {
            sessions?: typeof sessions;
            bookmarks?: typeof bookmarks;
            collections?: typeof collections;
            vocabulary?: typeof vocabulary;
          };
        };
        if (json.data) {
          sessions = json.data.sessions ?? sessions;
          bookmarks = json.data.bookmarks ?? bookmarks;
          collections = json.data.collections ?? collections;
          vocabulary = json.data.vocabulary ?? vocabulary;
        }
      }
    } catch {
      // Network failure — fall back to whatever Redux has. The DB-side upserts
      // are idempotent, so no data is lost; we just may not merge stale DB rows.
    }
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

    const localPracticePerformance = (() => {
      try {
        const raw = localStorage.getItem("practicePerformanceData");
        return raw ? (JSON.parse(raw) as PracticePerformanceData) : null;
      } catch {
        return null;
      }
    })();

    const localQuestionNotes = (() => {
      try {
        const raw = localStorage.getItem("questionNotes");
        return raw ? (JSON.parse(raw) as QuestionNotes) : null;
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

    // Practice performance: merge attempts (dedupe by timestamp+word), take
    // the more recent wordPerformance entry per word, keep aggregate stats from
    // whichever dataset has the higher totalQuizzesTaken.
    const reduxPerformance = state.userData.vocabPracticePerformance;
    const mergedPracticePerformance = (() => {
      if (!reduxPerformance && !localPracticePerformance) return null;
      const db = reduxPerformance ?? {
        attempts: [],
        wordPerformance: {},
        lastUpdated: 0,
        totalQuizzesTaken: 0,
        overallAccuracy: 0,
        strongWords: [],
        weakWords: [],
        improvingWords: [],
      };
      const ls = localPracticePerformance ?? {
        attempts: [],
        wordPerformance: {},
        lastUpdated: 0,
        totalQuizzesTaken: 0,
        overallAccuracy: 0,
        strongWords: [],
        weakWords: [],
        improvingWords: [],
      };

      // Dedupe attempts by (word + timestamp)
      const attemptMap = new Map<string, (typeof db.attempts)[0]>();
      for (const a of [...db.attempts, ...ls.attempts]) {
        const key = `${a.word}::${a.timestamp}`;
        if (!attemptMap.has(key)) attemptMap.set(key, a);
      }

      // Per-word: keep the entry with the higher totalAttempts
      const wordPerformance: PracticePerformanceData["wordPerformance"] = {};
      const allWords = new Set([
        ...Object.keys(db.wordPerformance),
        ...Object.keys(ls.wordPerformance),
      ]);
      for (const word of allWords) {
        const dbWord = db.wordPerformance[word];
        const lsWord = ls.wordPerformance[word];
        if (!dbWord) {
          wordPerformance[word] = lsWord;
        } else if (!lsWord) {
          wordPerformance[word] = dbWord;
        } else {
          wordPerformance[word] =
            (dbWord.totalAttempts ?? 0) >= (lsWord.totalAttempts ?? 0)
              ? dbWord
              : lsWord;
        }
      }

      // Aggregate stats: take higher totalQuizzesTaken set
      const winner =
        (db.totalQuizzesTaken ?? 0) >= (ls.totalQuizzesTaken ?? 0) ? db : ls;

      return {
        attempts: Array.from(attemptMap.values()),
        wordPerformance,
        lastUpdated: Math.max(db.lastUpdated ?? 0, ls.lastUpdated ?? 0),
        totalQuizzesTaken: winner.totalQuizzesTaken,
        overallAccuracy: winner.overallAccuracy,
        strongWords: winner.strongWords,
        weakWords: winner.weakWords,
        improvingWords: winner.improvingWords,
      } satisfies PracticePerformanceData;
    })();

    // Question notes: merge by questionId key — union of per-question note
    // arrays, deduped by note content. Local notes take precedence on conflict.
    const mergedQuestionNotes = (() => {
      const dbNotes = state.userData.questionNotes ?? {};
      const lsNotes = localQuestionNotes ?? {};
      if (!Object.keys(dbNotes).length && !Object.keys(lsNotes).length)
        return null;

      const allKeys = new Set([
        ...Object.keys(dbNotes),
        ...Object.keys(lsNotes),
      ]);
      const result: QuestionNotes = {};
      for (const questionId of allKeys) {
        const dbEntries = Array.isArray(
          (dbNotes as Record<string, unknown>)[questionId],
        )
          ? ((dbNotes as Record<string, unknown[]>)[questionId] as unknown[])
          : [];
        const lsEntries = Array.isArray(
          (lsNotes as Record<string, unknown>)[questionId],
        )
          ? ((lsNotes as Record<string, unknown[]>)[questionId] as unknown[])
          : [];
        // Union: local entries first (most recent edits), db entries fill in the rest
        const seen = new Set<string>();
        const merged: unknown[] = [];
        for (const entry of [...lsEntries, ...dbEntries]) {
          const key = JSON.stringify(entry);
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(entry);
          }
        }
        result[questionId as keyof typeof result] = merged as never;
      }
      return result;
    })();

    // Answer history: merge by questionId key — union per-question attempt
    // arrays. Answer history is never stored in localStorage; we just carry
    // the Redux (DB) copy through so it isn't dropped from the sync payload.
    const mergedAnswerHistory = (() => {
      const dbHistory = state.userData.answerHistory ?? {};
      if (!Object.keys(dbHistory).length) return null;
      return dbHistory;
    })();

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
      ...(mergedQuestionNotes ? { questionNotes: mergedQuestionNotes } : {}),
      ...(mergedAnswerHistory ? { answerHistory: mergedAnswerHistory } : {}),
      ...(mergedPracticePerformance
        ? { practicePerformance: mergedPracticePerformance }
        : {}),
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
        const json = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(json.error ?? `Sync failed: ${response.status}`);
      }

      const json = (await response.json()) as {
        data?: unknown;
        summary?: unknown;
        error?: string;
      };
      const summary = json.summary as MigrationSummary;

      // After successful sync, reset the initialized flag so the
      // fetchUserData condition guard allows the re-fetch to proceed, then
      // refresh Redux state from the freshly written database rows.
      dispatch(userDataSlice.actions.resetDataInitialized());
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
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(json.error ?? `Batch update failed: ${response.status}`);
    }

    const json = (await response.json()) as {
      data?: unknown;
      summary?: unknown;
      error?: string;
    };
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
      const json = (await response.json()) as {
        data?: { sessions?: PracticeSession[] };
      };
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
>(
  "userData/fetchBookmarksAndCollections",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/user/bookmarks", {
        method: "GET",
        credentials: "include",
      });
      if (response.status === 401) return rejectWithValue("Unauthorized");
      if (!response.ok)
        throw new Error(`Failed to fetch bookmarks: ${response.status}`);
      const json = (await response.json()) as {
        data?: { bookmarks?: SavedQuestion[]; collections?: SavedCollection[] };
      };
      return {
        bookmarks: (json.data?.bookmarks ?? []) as SavedQuestion[],
        collections: (json.data?.collections ?? []) as SavedCollection[],
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch bookmarks",
      );
    }
  },
  {
    // Must not run before fetchUserData/fulfilled has set dataInitialized.
    // This ensures user identity is established before fetching bookmarks.
    condition: (_, { getState }) => {
      const state = getState() as { userData: UserDataState };
      return state.userData.dataInitialized;
    },
  },
);

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
    const json = (await response.json()) as {
      data?: { vocabulary?: VocabularyProgress };
    };
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
      const json = (await response.json()) as {
        data?: { answerHistory?: AnswerHistory };
      };
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

/**
 * Fetches question notes from the server on demand.
 * Dispatched when the user visits the practice page so that
 * practice-rush-multistep can read/write notes from Redux instead of
 * raw localStorage.
 */
export const fetchNotes = createAsyncThunk<QuestionNotes | null, void>(
  "userData/fetchNotes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/user/notes", {
        method: "GET",
        credentials: "include",
      });
      if (response.status === 401) return rejectWithValue("Unauthorized");
      if (!response.ok)
        throw new Error(`Failed to fetch notes: ${response.status}`);
      const json = (await response.json()) as {
        data?: unknown;
        summary?: unknown;
        error?: string;
      };
      return (json.data ?? null) as QuestionNotes | null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch notes",
      );
    }
  },
);

/**
 * Fetches vocabulary practice performance from the server on demand.
 * Dispatched when the user visits the vocab practice or wordbank page.
 */
export const fetchVocabPracticePerformance = createAsyncThunk<
  PracticePerformanceData | null,
  void
>("userData/fetchVocabPracticePerformance", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/user/vocab-practice-performance", {
      method: "GET",
      credentials: "include",
    });
    if (response.status === 401) return rejectWithValue("Unauthorized");
    if (!response.ok)
      throw new Error(
        `Failed to fetch vocab practice performance: ${response.status}`,
      );
    const json = (await response.json()) as {
      data?: { performance?: PracticePerformanceData };
    };
    return (json.data?.performance ?? null) as PracticePerformanceData | null;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : "Failed to fetch vocab practice performance",
    );
  }
});

/**
 * Updates vocabulary practice performance in the backend.
 */
export const updateVocabPracticePerformanceThunk = createAsyncThunk<
  PracticePerformanceData,
  PracticePerformanceData
>(
  "userData/updateVocabPracticePerformance",
  async (performanceData, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/user/vocab-practice-performance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(performanceData),
      });

      if (response.status === 401) throw new Error("Unauthorized");

      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          json.error ??
            `Failed to update vocab practice performance: ${response.status}`,
        );
      }

      const json = (await response.json()) as {
        data?: { performance?: PracticePerformanceData };
      };
      return json.data?.performance as PracticePerformanceData;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to update vocab practice performance",
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
  questionNotes: null,
  vocabPracticePerformance: null,
  dataInitialized: false,
  loading: {
    profile: false,
    statistics: false,
    sessions: false,
    bookmarks: false,
    collections: false,
    vocabulary: false,
    answerHistory: false,
    questionNotes: false,
    vocabPracticePerformance: false,
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

    // Add a new practice session.
    // If the incoming session has currentSession=true, clear the flag on all
    // other sessions first to keep the at-most-one invariant in the local store.
    addSession: (state, action: PayloadAction<PracticeSession>) => {
      if (action.payload.currentSession) {
        state.sessions.forEach((s) => {
          s.currentSession = false;
        });
      }
      state.sessions.unshift(action.payload); // Add to beginning
      state.loading.sessions = false;
    },

    // Update an existing session.
    // If the update sets currentSession=true, clear the flag on all other
    // sessions to keep the at-most-one invariant in the local store.
    updateSession: (state, action: PayloadAction<PracticeSession>) => {
      if (action.payload.currentSession) {
        state.sessions.forEach((s) => {
          if (s.sessionId !== action.payload.sessionId) {
            s.currentSession = false;
          }
        });
      }
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

    // Set question notes
    setNotes: (state, action: PayloadAction<QuestionNotes | null>) => {
      state.questionNotes = action.payload;
      state.loading.questionNotes = false;
    },

    // Merge question notes (shallow merge by assessment key)
    mergeNotes: (state, action: PayloadAction<QuestionNotes>) => {
      state.questionNotes = {
        ...(state.questionNotes ?? {}),
        ...action.payload,
      };
      state.loading.questionNotes = false;
    },

    // Set vocab practice performance
    setVocabPracticePerformance: (
      state,
      action: PayloadAction<PracticePerformanceData | null>,
    ) => {
      state.vocabPracticePerformance = action.payload;
      state.loading.vocabPracticePerformance = false;
    },

    // Update vocab practice performance (full replace — performance data is
    // always computed fresh by the practice components and stored whole)
    updateVocabPracticePerformance: (
      state,
      action: PayloadAction<PracticePerformanceData>,
    ) => {
      state.vocabPracticePerformance = action.payload;
      state.loading.vocabPracticePerformance = false;
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

    // Reset dataInitialized flag so fetchUserData will re-run on next dispatch.
    // Used after a successful migration or sync so the Redux state reflects
    // the freshly written database rows.
    resetDataInitialized: (state) => {
      state.dataInitialized = false;
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
      state.questionNotes = null;
      state.vocabPracticePerformance = null;
      state.dataInitialized = false;
      state.loading = {
        profile: false,
        statistics: false,
        sessions: false,
        bookmarks: false,
        collections: false,
        vocabulary: false,
        answerHistory: false,
        questionNotes: false,
        vocabPracticePerformance: false,
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
          questionNotes: false,
          vocabPracticePerformance: false,
        };
        state.dataInitialized = true;
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
          questionNotes: false,
          vocabPracticePerformance: false,
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
        // The new session is the active current one — clear the flag on all
        // existing sessions so the at-most-one invariant holds in the local store.
        if (action.payload.currentSession) {
          state.sessions.forEach((s) => {
            s.currentSession = false;
          });
        }
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

    // ── fetchNotes (lazy practice-page fetch) ────────────────────────────────
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.loading.questionNotes = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.questionNotes = action.payload;
        state.loading.questionNotes = false;
        state.error = null;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading.questionNotes = false;
        state.error = action.payload as string;
      });

    // ── fetchVocabPracticePerformance ────────────────────────────────────────
    builder
      .addCase(fetchVocabPracticePerformance.pending, (state) => {
        state.loading.vocabPracticePerformance = true;
        state.error = null;
      })
      .addCase(fetchVocabPracticePerformance.fulfilled, (state, action) => {
        state.vocabPracticePerformance = action.payload;
        state.loading.vocabPracticePerformance = false;
        state.error = null;
      })
      .addCase(fetchVocabPracticePerformance.rejected, (state, action) => {
        state.loading.vocabPracticePerformance = false;
        state.error = action.payload as string;
      });

    // ── updateVocabPracticePerformanceThunk ──────────────────────────────────
    builder
      .addCase(updateVocabPracticePerformanceThunk.pending, (state) => {
        state.loading.vocabPracticePerformance = true;
        state.error = null;
      })
      .addCase(
        updateVocabPracticePerformanceThunk.fulfilled,
        (state, action) => {
          state.vocabPracticePerformance = action.payload;
          state.loading.vocabPracticePerformance = false;
          state.error = null;
        },
      )
      .addCase(
        updateVocabPracticePerformanceThunk.rejected,
        (state, action) => {
          state.loading.vocabPracticePerformance = false;
          state.error = action.payload as string;
        },
      );

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
  setNotes,
  mergeNotes,
  setVocabPracticePerformance,
  updateVocabPracticePerformance,
  setDataLoading,
  setDataError,
  clearUserData,
  resetDataInitialized,
} = userDataSlice.actions;

// Alias: updateCollection → updateCollectionLocal (sync reducer)
// The async thunk is updateCollectionThunk (follows updateCollectionThunk pattern)
export const updateCollection = updateCollectionLocal;

// Export reducer
export default userDataSlice.reducer;
