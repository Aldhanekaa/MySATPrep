/**
 * Unit tests for the userData Redux slice
 * Validates: Requirement 20.1
 */

import userDataReducer, {
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
} from "../userDataSlice";
import type { UserDataState } from "@/lib/types/userData";
import type { UserProfileWithHistory } from "@/types/userProfile";
import type { PracticeSession } from "@/types";
import type { SavedQuestion, SavedCollection } from "@/lib/types/userData";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockProfile: UserProfileWithHistory = {
  totalXP: 500,
  level: 2,
  questionsAnswered: 50,
  correctAnswers: 35,
  incorrectAnswers: 15,
  lastActivity: "2024-01-15T10:00:00.000Z",
  createdAt: "2024-01-01T00:00:00.000Z",
  xpHistory: [
    {
      questionId: "q-001",
      change: 20,
      reason: "correct_answer",
      timestamp: "2024-01-10T10:00:00.000Z",
      scoreBandRange: 2,
    },
  ],
};

const mockProfile2: UserProfileWithHistory = {
  totalXP: 1000,
  level: 3,
  questionsAnswered: 100,
  correctAnswers: 70,
  incorrectAnswers: 30,
  lastActivity: "2024-01-20T10:00:00.000Z",
  createdAt: "2024-01-01T00:00:00.000Z",
  xpHistory: [],
};

const mockSession: PracticeSession = {
  sessionId: "session-001",
  timestamp: "2024-01-15T10:00:00.000Z",
  status: "completed" as any,
  practiceSelections: {} as any,
  currentQuestionStep: 10,
  questionAnswers: {},
  questionTimes: {},
  answeredQuestionDetails: [],
  totalQuestions: 10,
  answeredQuestions: ["q-1", "q-2"],
  averageTimePerQuestion: 45,
  totalTimeSpent: 450,
  totalXPReceived: 100,
};

const mockSession2: PracticeSession = {
  ...mockSession,
  sessionId: "session-002",
  timestamp: "2024-01-16T10:00:00.000Z",
  totalXPReceived: 80,
};

const mockBookmark: SavedQuestion = {
  id: "bm-001",
  userId: "user-123",
  assessment: "SAT",
  questionId: "q-abc",
  externalId: "ext-001",
  ibn: null,
  plainQuestion: null,
  timestamp: "2024-01-15T10:00:00.000Z",
};

const mockBookmark2: SavedQuestion = {
  id: "bm-002",
  userId: "user-123",
  assessment: "SAT",
  questionId: "q-def",
  externalId: "ext-002",
  ibn: null,
  plainQuestion: null,
  timestamp: "2024-01-16T10:00:00.000Z",
};

const mockCollection: SavedCollection = {
  id: "col-001",
  userId: "user-123",
  collectionId: "coll-abc",
  name: "Hard Questions",
  description: "Questions I found difficult",
  questionIds: ["q-1", "q-2"],
  questionDetails: [],
  color: "#ff0000",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-15T10:00:00.000Z",
};

const mockCollection2: SavedCollection = {
  ...mockCollection,
  id: "col-002",
  collectionId: "coll-def",
  name: "Favorites",
};

// ─── Initial state ────────────────────────────────────────────────────────────

describe("userDataSlice – initial state", () => {
  it("should have the correct initial state shape", () => {
    const state = userDataReducer(undefined, { type: "@@INIT" });

    expect(state).toEqual({
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
    });
  });

  it("should initialise profile as null", () => {
    const state = userDataReducer(undefined, { type: "@@INIT" });
    expect(state.profile).toBeNull();
  });

  it("should initialise statistics as an empty object", () => {
    const state = userDataReducer(undefined, { type: "@@INIT" });
    expect(state.statistics).toEqual({});
  });

  it("should initialise sessions as an empty array", () => {
    const state = userDataReducer(undefined, { type: "@@INIT" });
    expect(state.sessions).toEqual([]);
  });

  it("should initialise bookmarks as an empty array", () => {
    const state = userDataReducer(undefined, { type: "@@INIT" });
    expect(state.bookmarks).toEqual([]);
  });

  it("should initialise collections as an empty array", () => {
    const state = userDataReducer(undefined, { type: "@@INIT" });
    expect(state.collections).toEqual([]);
  });

  it("should initialise vocabulary as null", () => {
    const state = userDataReducer(undefined, { type: "@@INIT" });
    expect(state.vocabulary).toBeNull();
  });

  it("should initialise preferences as null", () => {
    const state = userDataReducer(undefined, { type: "@@INIT" });
    expect(state.preferences).toBeNull();
  });

  it("should initialise all loading flags as false", () => {
    const state = userDataReducer(undefined, { type: "@@INIT" });
    Object.values(state.loading).forEach((flag) => {
      expect(flag).toBe(false);
    });
  });

  it("should initialise error as null", () => {
    const state = userDataReducer(undefined, { type: "@@INIT" });
    expect(state.error).toBeNull();
  });
});

// ─── setProfile / updateProfile ───────────────────────────────────────────────

describe("userDataSlice – setProfile", () => {
  it("should set the profile in state", () => {
    const state = userDataReducer(undefined, setProfile(mockProfile));
    expect(state.profile).toEqual(mockProfile);
  });

  it("should accept null to clear the profile", () => {
    const withProfile = userDataReducer(undefined, setProfile(mockProfile));
    const state = userDataReducer(withProfile, setProfile(null));
    expect(state.profile).toBeNull();
  });

  it("should set loading.profile to false", () => {
    const loadingState = userDataReducer(
      undefined,
      setDataLoading({ dataType: "profile", loading: true }),
    );
    const state = userDataReducer(loadingState, setProfile(mockProfile));
    expect(state.loading.profile).toBe(false);
  });
});

describe("userDataSlice – updateProfile", () => {
  it("should merge partial updates into existing profile", () => {
    const withProfile = userDataReducer(undefined, setProfile(mockProfile));
    const state = userDataReducer(withProfile, updateProfile({ totalXP: 999 }));
    expect(state.profile?.totalXP).toBe(999);
    expect(state.profile?.level).toBe(mockProfile.level);
  });

  it("should not change profile when none exists (no-op)", () => {
    const state = userDataReducer(undefined, updateProfile({ totalXP: 999 }));
    expect(state.profile).toBeNull();
  });

  it("should set loading.profile to false", () => {
    const withProfile = userDataReducer(undefined, setProfile(mockProfile));
    const loadingState = userDataReducer(
      withProfile,
      setDataLoading({ dataType: "profile", loading: true }),
    );
    const state = userDataReducer(loadingState, updateProfile({ totalXP: 1 }));
    expect(state.loading.profile).toBe(false);
  });
});

// ─── setStatistics / updateStatistics ─────────────────────────────────────────

describe("userDataSlice – setStatistics", () => {
  it("should replace statistics in state", () => {
    const stats = { SAT: { answered: [], statistics: {} } } as any;
    const state = userDataReducer(undefined, setStatistics(stats));
    expect(state.statistics).toEqual(stats);
  });

  it("should set loading.statistics to false", () => {
    const loadingState = userDataReducer(
      undefined,
      setDataLoading({ dataType: "statistics", loading: true }),
    );
    const state = userDataReducer(loadingState, setStatistics({} as any));
    expect(state.loading.statistics).toBe(false);
  });
});

describe("userDataSlice – updateStatistics", () => {
  it("should merge new statistics with existing ones", () => {
    const initial = { SAT: { answeredQuestions: ["q-1"] } } as any;
    const update = { PSAT: { answeredQuestions: ["q-2"] } } as any;

    const withStats = userDataReducer(undefined, setStatistics(initial));
    const state = userDataReducer(withStats, updateStatistics(update));

    expect(state.statistics).toMatchObject({
      SAT: { answeredQuestions: ["q-1"] },
      PSAT: { answeredQuestions: ["q-2"] },
    });
  });

  it("should overwrite statistics for the same assessment key", () => {
    const initial = { SAT: { answeredQuestions: ["q-1"] } } as any;
    const update = { SAT: { answeredQuestions: ["q-2", "q-3"] } } as any;

    const withStats = userDataReducer(undefined, setStatistics(initial));
    const state = userDataReducer(withStats, updateStatistics(update));
    expect(state.statistics).toEqual(update);
  });

  it("should set loading.statistics to false", () => {
    const loadingState = userDataReducer(
      undefined,
      setDataLoading({ dataType: "statistics", loading: true }),
    );
    const state = userDataReducer(loadingState, updateStatistics({} as any));
    expect(state.loading.statistics).toBe(false);
  });
});

// ─── setSessions / addSession / updateSession ─────────────────────────────────

describe("userDataSlice – setSessions", () => {
  it("should replace sessions in state", () => {
    const state = userDataReducer(undefined, setSessions([mockSession]));
    expect(state.sessions).toEqual([mockSession]);
  });

  it("should replace existing sessions with a new array", () => {
    const withSession = userDataReducer(undefined, setSessions([mockSession]));
    const state = userDataReducer(withSession, setSessions([mockSession2]));
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]).toEqual(mockSession2);
  });

  it("should accept an empty array to clear sessions", () => {
    const withSession = userDataReducer(undefined, setSessions([mockSession]));
    const state = userDataReducer(withSession, setSessions([]));
    expect(state.sessions).toEqual([]);
  });

  it("should set loading.sessions to false", () => {
    const loadingState = userDataReducer(
      undefined,
      setDataLoading({ dataType: "sessions", loading: true }),
    );
    const state = userDataReducer(loadingState, setSessions([]));
    expect(state.loading.sessions).toBe(false);
  });
});

describe("userDataSlice – addSession", () => {
  it("should prepend a session to the front of the list", () => {
    const withSession = userDataReducer(undefined, setSessions([mockSession]));
    const state = userDataReducer(withSession, addSession(mockSession2));
    expect(state.sessions[0]).toEqual(mockSession2);
    expect(state.sessions[1]).toEqual(mockSession);
  });

  it("should add a session to an empty list", () => {
    const state = userDataReducer(undefined, addSession(mockSession));
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]).toEqual(mockSession);
  });

  it("should set loading.sessions to false", () => {
    const loadingState = userDataReducer(
      undefined,
      setDataLoading({ dataType: "sessions", loading: true }),
    );
    const state = userDataReducer(loadingState, addSession(mockSession));
    expect(state.loading.sessions).toBe(false);
  });
});

describe("userDataSlice – updateSession", () => {
  it("should update an existing session by sessionId", () => {
    const withSession = userDataReducer(undefined, setSessions([mockSession]));
    const updatedSession = { ...mockSession, totalXPReceived: 999 };
    const state = userDataReducer(withSession, updateSession(updatedSession));
    expect(state.sessions[0].totalXPReceived).toBe(999);
  });

  it("should not add a new session if the sessionId does not match", () => {
    const withSession = userDataReducer(undefined, setSessions([mockSession]));
    const unknownSession = { ...mockSession, sessionId: "unknown-id" };
    const state = userDataReducer(withSession, updateSession(unknownSession));
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]).toEqual(mockSession);
  });

  it("should be a no-op when sessions list is empty", () => {
    const state = userDataReducer(undefined, updateSession(mockSession));
    expect(state.sessions).toEqual([]);
  });

  it("should set loading.sessions to false", () => {
    const withSession = userDataReducer(undefined, setSessions([mockSession]));
    const loadingState = userDataReducer(
      withSession,
      setDataLoading({ dataType: "sessions", loading: true }),
    );
    const state = userDataReducer(loadingState, updateSession(mockSession));
    expect(state.loading.sessions).toBe(false);
  });
});

// ─── setBookmarks / addBookmark / removeBookmark ──────────────────────────────

describe("userDataSlice – setBookmarks", () => {
  it("should replace bookmarks in state", () => {
    const state = userDataReducer(
      undefined,
      setBookmarks([mockBookmark, mockBookmark2]),
    );
    expect(state.bookmarks).toHaveLength(2);
    expect(state.bookmarks).toEqual([mockBookmark, mockBookmark2]);
  });

  it("should accept an empty array to clear bookmarks", () => {
    const withBookmarks = userDataReducer(
      undefined,
      setBookmarks([mockBookmark]),
    );
    const state = userDataReducer(withBookmarks, setBookmarks([]));
    expect(state.bookmarks).toEqual([]);
  });

  it("should set loading.bookmarks to false", () => {
    const loadingState = userDataReducer(
      undefined,
      setDataLoading({ dataType: "bookmarks", loading: true }),
    );
    const state = userDataReducer(loadingState, setBookmarks([]));
    expect(state.loading.bookmarks).toBe(false);
  });
});

describe("userDataSlice – addBookmark", () => {
  it("should append a new bookmark", () => {
    const state = userDataReducer(undefined, addBookmark(mockBookmark));
    expect(state.bookmarks).toHaveLength(1);
    expect(state.bookmarks[0]).toEqual(mockBookmark);
  });

  it("should not add a duplicate bookmark (same questionId)", () => {
    const withBookmark = userDataReducer(undefined, addBookmark(mockBookmark));
    const state = userDataReducer(withBookmark, addBookmark(mockBookmark));
    expect(state.bookmarks).toHaveLength(1);
  });

  it("should add a second bookmark with a different questionId", () => {
    const withFirst = userDataReducer(undefined, addBookmark(mockBookmark));
    const state = userDataReducer(withFirst, addBookmark(mockBookmark2));
    expect(state.bookmarks).toHaveLength(2);
  });

  it("should set loading.bookmarks to false", () => {
    const loadingState = userDataReducer(
      undefined,
      setDataLoading({ dataType: "bookmarks", loading: true }),
    );
    const state = userDataReducer(loadingState, addBookmark(mockBookmark));
    expect(state.loading.bookmarks).toBe(false);
  });
});

describe("userDataSlice – removeBookmark", () => {
  it("should remove a bookmark by questionId", () => {
    const withBookmarks = userDataReducer(
      undefined,
      setBookmarks([mockBookmark, mockBookmark2]),
    );
    const state = userDataReducer(
      withBookmarks,
      removeBookmark(mockBookmark.questionId),
    );
    expect(state.bookmarks).toHaveLength(1);
    expect(state.bookmarks[0].questionId).toBe(mockBookmark2.questionId);
  });

  it("should be a no-op when the questionId is not in bookmarks", () => {
    const withBookmark = userDataReducer(
      undefined,
      setBookmarks([mockBookmark]),
    );
    const state = userDataReducer(withBookmark, removeBookmark("nonexistent"));
    expect(state.bookmarks).toHaveLength(1);
  });

  it("should result in an empty array when the only bookmark is removed", () => {
    const withBookmark = userDataReducer(
      undefined,
      setBookmarks([mockBookmark]),
    );
    const state = userDataReducer(
      withBookmark,
      removeBookmark(mockBookmark.questionId),
    );
    expect(state.bookmarks).toEqual([]);
  });

  it("should set loading.bookmarks to false", () => {
    const withBookmark = userDataReducer(
      undefined,
      setBookmarks([mockBookmark]),
    );
    const loadingState = userDataReducer(
      withBookmark,
      setDataLoading({ dataType: "bookmarks", loading: true }),
    );
    const state = userDataReducer(
      loadingState,
      removeBookmark(mockBookmark.questionId),
    );
    expect(state.loading.bookmarks).toBe(false);
  });
});

// ─── setCollections / addCollection / updateCollection / removeCollection ──────

describe("userDataSlice – setCollections", () => {
  it("should replace collections in state", () => {
    const state = userDataReducer(
      undefined,
      setCollections([mockCollection, mockCollection2]),
    );
    expect(state.collections).toHaveLength(2);
  });

  it("should accept an empty array to clear collections", () => {
    const withCollection = userDataReducer(
      undefined,
      setCollections([mockCollection]),
    );
    const state = userDataReducer(withCollection, setCollections([]));
    expect(state.collections).toEqual([]);
  });

  it("should set loading.collections to false", () => {
    const loadingState = userDataReducer(
      undefined,
      setDataLoading({ dataType: "collections", loading: true }),
    );
    const state = userDataReducer(loadingState, setCollections([]));
    expect(state.loading.collections).toBe(false);
  });
});

describe("userDataSlice – addCollection", () => {
  it("should append a new collection", () => {
    const state = userDataReducer(undefined, addCollection(mockCollection));
    expect(state.collections).toHaveLength(1);
    expect(state.collections[0]).toEqual(mockCollection);
  });

  it("should set loading.collections to false", () => {
    const loadingState = userDataReducer(
      undefined,
      setDataLoading({ dataType: "collections", loading: true }),
    );
    const state = userDataReducer(loadingState, addCollection(mockCollection));
    expect(state.loading.collections).toBe(false);
  });
});

describe("userDataSlice – updateCollection", () => {
  it("should update an existing collection by collectionId", () => {
    const withCollection = userDataReducer(
      undefined,
      setCollections([mockCollection]),
    );
    const updated = { ...mockCollection, name: "Updated Name" };
    const state = userDataReducer(withCollection, updateCollection(updated));
    expect(state.collections[0].name).toBe("Updated Name");
  });

  it("should not add a new collection if collectionId does not match", () => {
    const withCollection = userDataReducer(
      undefined,
      setCollections([mockCollection]),
    );
    const unknown = { ...mockCollection, collectionId: "no-match" };
    const state = userDataReducer(withCollection, updateCollection(unknown));
    expect(state.collections).toHaveLength(1);
    expect(state.collections[0].name).toBe(mockCollection.name);
  });

  it("should be a no-op when collections list is empty", () => {
    const state = userDataReducer(undefined, updateCollection(mockCollection));
    expect(state.collections).toEqual([]);
  });

  it("should set loading.collections to false", () => {
    const withCollection = userDataReducer(
      undefined,
      setCollections([mockCollection]),
    );
    const loadingState = userDataReducer(
      withCollection,
      setDataLoading({ dataType: "collections", loading: true }),
    );
    const state = userDataReducer(
      loadingState,
      updateCollection(mockCollection),
    );
    expect(state.loading.collections).toBe(false);
  });
});

describe("userDataSlice – removeCollection", () => {
  it("should remove a collection by collectionId", () => {
    const withCollections = userDataReducer(
      undefined,
      setCollections([mockCollection, mockCollection2]),
    );
    const state = userDataReducer(
      withCollections,
      removeCollection(mockCollection.collectionId),
    );
    expect(state.collections).toHaveLength(1);
    expect(state.collections[0].collectionId).toBe(
      mockCollection2.collectionId,
    );
  });

  it("should be a no-op when collectionId is not found", () => {
    const withCollection = userDataReducer(
      undefined,
      setCollections([mockCollection]),
    );
    const state = userDataReducer(
      withCollection,
      removeCollection("nonexistent"),
    );
    expect(state.collections).toHaveLength(1);
  });

  it("should result in an empty array when the only collection is removed", () => {
    const withCollection = userDataReducer(
      undefined,
      setCollections([mockCollection]),
    );
    const state = userDataReducer(
      withCollection,
      removeCollection(mockCollection.collectionId),
    );
    expect(state.collections).toEqual([]);
  });

  it("should set loading.collections to false", () => {
    const withCollection = userDataReducer(
      undefined,
      setCollections([mockCollection]),
    );
    const loadingState = userDataReducer(
      withCollection,
      setDataLoading({ dataType: "collections", loading: true }),
    );
    const state = userDataReducer(
      loadingState,
      removeCollection(mockCollection.collectionId),
    );
    expect(state.loading.collections).toBe(false);
  });
});

// ─── setVocabulary / updateVocabulary ─────────────────────────────────────────

describe("userDataSlice – setVocabulary", () => {
  it("should set vocabulary progress in state", () => {
    const vocab = { word1: { seen: 3, correct: 2 } };
    const state = userDataReducer(undefined, setVocabulary(vocab));
    expect(state.vocabulary).toEqual(vocab);
  });

  it("should accept null to clear vocabulary", () => {
    const withVocab = userDataReducer(
      undefined,
      setVocabulary({ word1: { seen: 1 } }),
    );
    const state = userDataReducer(withVocab, setVocabulary(null));
    expect(state.vocabulary).toBeNull();
  });

  it("should set loading.vocabulary to false", () => {
    const loadingState = userDataReducer(
      undefined,
      setDataLoading({ dataType: "vocabulary", loading: true }),
    );
    const state = userDataReducer(loadingState, setVocabulary(null));
    expect(state.loading.vocabulary).toBe(false);
  });
});

describe("userDataSlice – updateVocabulary", () => {
  it("should merge new vocabulary data into existing vocabulary", () => {
    const withVocab = userDataReducer(
      undefined,
      setVocabulary({ word1: { seen: 1 } }),
    );
    const state = userDataReducer(
      withVocab,
      updateVocabulary({ word2: { seen: 2 } }),
    );
    expect(state.vocabulary).toMatchObject({
      word1: { seen: 1 },
      word2: { seen: 2 },
    });
  });

  it("should overwrite vocabulary data for the same key", () => {
    const withVocab = userDataReducer(
      undefined,
      setVocabulary({ word1: { seen: 1 } }),
    );
    const state = userDataReducer(
      withVocab,
      updateVocabulary({ word1: { seen: 99 } }),
    );
    expect(state.vocabulary?.word1).toEqual({ seen: 99 });
  });

  it("should set loading.vocabulary to false", () => {
    const loadingState = userDataReducer(
      undefined,
      setDataLoading({ dataType: "vocabulary", loading: true }),
    );
    const state = userDataReducer(
      loadingState,
      updateVocabulary({ word1: { seen: 1 } }),
    );
    expect(state.loading.vocabulary).toBe(false);
  });
});

// ─── setPreferences / updatePreferences ───────────────────────────────────────

describe("userDataSlice – setPreferences", () => {
  it("should set preferences in state", () => {
    const prefs = { theme: "dark" as const, soundEnabled: true };
    const state = userDataReducer(undefined, setPreferences(prefs));
    expect(state.preferences).toEqual(prefs);
  });

  it("should accept null to clear preferences", () => {
    const withPrefs = userDataReducer(
      undefined,
      setPreferences({ theme: "light" }),
    );
    const state = userDataReducer(withPrefs, setPreferences(null));
    expect(state.preferences).toBeNull();
  });

  it("should replace existing preferences entirely", () => {
    const withPrefs = userDataReducer(
      undefined,
      setPreferences({ theme: "light", soundEnabled: true }),
    );
    const state = userDataReducer(withPrefs, setPreferences({ theme: "dark" }));
    expect(state.preferences).toEqual({ theme: "dark" });
    // soundEnabled should no longer be present
    expect(state.preferences?.soundEnabled).toBeUndefined();
  });
});

describe("userDataSlice – updatePreferences", () => {
  it("should merge new preferences with existing ones", () => {
    const withPrefs = userDataReducer(
      undefined,
      setPreferences({ theme: "light", soundEnabled: true }),
    );
    const state = userDataReducer(
      withPrefs,
      updatePreferences({ notifications: false }),
    );
    expect(state.preferences).toMatchObject({
      theme: "light",
      soundEnabled: true,
      notifications: false,
    });
  });

  it("should overwrite an existing preference key", () => {
    const withPrefs = userDataReducer(
      undefined,
      setPreferences({ theme: "light" }),
    );
    const state = userDataReducer(
      withPrefs,
      updatePreferences({ theme: "dark" }),
    );
    expect(state.preferences?.theme).toBe("dark");
  });

  it("should merge into null preferences (treating null as empty)", () => {
    // preferences starts as null; spread: { ...null, theme: "dark" } => { theme: "dark" }
    const state = userDataReducer(
      undefined,
      updatePreferences({ theme: "dark" }),
    );
    expect(state.preferences?.theme).toBe("dark");
  });
});

// ─── setDataLoading ───────────────────────────────────────────────────────────

describe("userDataSlice – setDataLoading", () => {
  it("should set a specific loading flag to true", () => {
    const state = userDataReducer(
      undefined,
      setDataLoading({ dataType: "profile", loading: true }),
    );
    expect(state.loading.profile).toBe(true);
  });

  it("should set a specific loading flag to false", () => {
    const loadingState = userDataReducer(
      undefined,
      setDataLoading({ dataType: "sessions", loading: true }),
    );
    const state = userDataReducer(
      loadingState,
      setDataLoading({ dataType: "sessions", loading: false }),
    );
    expect(state.loading.sessions).toBe(false);
  });

  it("should not affect other loading flags", () => {
    const state = userDataReducer(
      undefined,
      setDataLoading({ dataType: "bookmarks", loading: true }),
    );
    expect(state.loading.profile).toBe(false);
    expect(state.loading.statistics).toBe(false);
    expect(state.loading.sessions).toBe(false);
    expect(state.loading.bookmarks).toBe(true);
    expect(state.loading.collections).toBe(false);
    expect(state.loading.vocabulary).toBe(false);
  });
});

// ─── setDataError ─────────────────────────────────────────────────────────────

describe("userDataSlice – setDataError", () => {
  it("should set an error string", () => {
    const state = userDataReducer(
      undefined,
      setDataError("Failed to load data"),
    );
    expect(state.error).toBe("Failed to load data");
  });

  it("should accept null to clear the error", () => {
    const withError = userDataReducer(undefined, setDataError("Some error"));
    const state = userDataReducer(withError, setDataError(null));
    expect(state.error).toBeNull();
  });

  it("should replace an existing error", () => {
    const withError = userDataReducer(undefined, setDataError("Old error"));
    const state = userDataReducer(withError, setDataError("New error"));
    expect(state.error).toBe("New error");
  });

  it("should not affect other state fields", () => {
    const withProfile = userDataReducer(undefined, setProfile(mockProfile));
    const state = userDataReducer(withProfile, setDataError("Network error"));
    expect(state.profile).toEqual(mockProfile);
    expect(state.sessions).toEqual([]);
    expect(state.bookmarks).toEqual([]);
  });
});

// ─── clearUserData ────────────────────────────────────────────────────────────

describe("userDataSlice – clearUserData", () => {
  it("should reset state to the initial shape", () => {
    // Build up a rich state
    let state = userDataReducer(undefined, setProfile(mockProfile));
    state = userDataReducer(state, setSessions([mockSession]));
    state = userDataReducer(state, setBookmarks([mockBookmark]));
    state = userDataReducer(state, setCollections([mockCollection]));
    state = userDataReducer(state, setVocabulary({ word1: { seen: 1 } }));
    state = userDataReducer(state, setPreferences({ theme: "dark" }));
    state = userDataReducer(state, setDataError("Some error"));

    const cleared = userDataReducer(state, clearUserData());

    expect(cleared).toEqual({
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
    });
  });

  it("should be idempotent when called on already-cleared state", () => {
    const clearedOnce = userDataReducer(undefined, clearUserData());
    const clearedTwice = userDataReducer(clearedOnce, clearUserData());
    expect(clearedTwice).toEqual(clearedOnce);
  });

  it("should reset all loading flags to false even if some were true", () => {
    let state = userDataReducer(
      undefined,
      setDataLoading({ dataType: "profile", loading: true }),
    );
    state = userDataReducer(
      state,
      setDataLoading({ dataType: "sessions", loading: true }),
    );
    const cleared = userDataReducer(state, clearUserData());
    Object.values(cleared.loading).forEach((flag) => {
      expect(flag).toBe(false);
    });
  });
});

// ─── Action composition ───────────────────────────────────────────────────────

describe("userDataSlice – action composition", () => {
  it("should handle a typical data load sequence: loading → setProfile → clearError", () => {
    let state = userDataReducer(
      undefined,
      setDataLoading({ dataType: "profile", loading: true }),
    );
    expect(state.loading.profile).toBe(true);

    state = userDataReducer(state, setProfile(mockProfile));
    expect(state.profile).toEqual(mockProfile);
    expect(state.loading.profile).toBe(false);

    state = userDataReducer(state, setDataError(null));
    expect(state.error).toBeNull();
  });

  it("should handle adding and removing bookmarks in sequence", () => {
    let state = userDataReducer(undefined, addBookmark(mockBookmark));
    state = userDataReducer(state, addBookmark(mockBookmark2));
    expect(state.bookmarks).toHaveLength(2);

    state = userDataReducer(state, removeBookmark(mockBookmark.questionId));
    expect(state.bookmarks).toHaveLength(1);
    expect(state.bookmarks[0].questionId).toBe(mockBookmark2.questionId);
  });

  it("should clear all data on logout via clearUserData", () => {
    let state = userDataReducer(undefined, setProfile(mockProfile));
    state = userDataReducer(state, setSessions([mockSession]));
    state = userDataReducer(state, addBookmark(mockBookmark));

    state = userDataReducer(state, clearUserData());
    expect(state.profile).toBeNull();
    expect(state.sessions).toEqual([]);
    expect(state.bookmarks).toEqual([]);
  });
});
