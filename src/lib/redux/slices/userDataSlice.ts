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
export const updateSession = createAsyncThunk<
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
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    })();

    const collections = (() => {
      try {
        const raw = localStorage.getItem("savedCollections");
        return raw ? JSON.parse(raw) : [];
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
    updateSessionLocal: (state, action: PayloadAction<PracticeSession>) => {
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
        }
        state.loading = {
          profile: false,
          statistics: false,
          sessions: false,
          bookmarks: false,
          collections: false,
          vocabulary: false,
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
      .addCase(updateSession.pending, (state) => {
        state.loading.sessions = true;
        state.error = null;
      })
      .addCase(updateSession.fulfilled, (state, action) => {
        const index = state.sessions.findIndex(
          (s) => s.sessionId === action.payload.sessionId,
        );
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
        state.loading.sessions = false;
        state.error = null;
      })
      .addCase(updateSession.rejected, (state, action) => {
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
  updateSessionLocal,
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
  setDataLoading,
  setDataError,
  clearUserData,
} = userDataSlice.actions;

// Export reducer
export default userDataSlice.reducer;
