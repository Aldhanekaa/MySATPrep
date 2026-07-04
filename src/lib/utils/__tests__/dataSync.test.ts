/**
 * Unit tests for dataSync utilities – backward compatibility for unauthenticated users
 *
 * Verifies that:
 * 1. All dataSync functions persist data to localStorage when the user is NOT authenticated
 * 2. No API calls (Redux thunks) are dispatched for unauthenticated users
 * 3. Existing localStorage utility functions (userProfile, practiceStatistics) still work
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Prevent imports that pull in better-auth or Next.js server code
jest.mock("@/lib/api/authClient", () => ({
  loginWithGoogle: jest.fn(),
  loginWithEmail: jest.fn(),
  registerWithEmail: jest.fn(),
  logout: jest.fn(),
  checkSession: jest.fn(),
}));

jest.mock("@/lib/redux/slices/userDataSlice", () => ({
  updateUserProfile: jest
    .fn()
    .mockReturnValue({ type: "userData/updateUserProfile" }),
  updateUserStatistics: jest
    .fn()
    .mockReturnValue({ type: "userData/updateUserStatistics" }),
  createSession: jest.fn().mockReturnValue({ type: "userData/createSession" }),
  updateSession: jest.fn().mockReturnValue({ type: "userData/updateSession" }),
  addBookmarkThunk: jest
    .fn()
    .mockReturnValue({ type: "userData/addBookmarkThunk" }),
  removeBookmarkThunk: jest
    .fn()
    .mockReturnValue({ type: "userData/removeBookmarkThunk" }),
  createCollection: jest
    .fn()
    .mockReturnValue({ type: "userData/createCollection" }),
  updateCollectionThunk: jest
    .fn()
    .mockReturnValue({ type: "userData/updateCollectionThunk" }),
  deleteCollection: jest
    .fn()
    .mockReturnValue({ type: "userData/deleteCollection" }),
  updateVocabularyThunk: jest
    .fn()
    .mockReturnValue({ type: "userData/updateVocabularyThunk" }),
  updatePreferencesThunk: jest
    .fn()
    .mockReturnValue({ type: "userData/updatePreferencesThunk" }),
}));

// Mock the localStorage utility functions so they don't cause issues in node env
jest.mock("@/lib/userProfile", () => ({
  saveUserProfile: jest.fn(),
  getUserProfile: jest.fn().mockReturnValue({
    totalXP: 0,
    level: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    lastActivity: "2024-01-01T00:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z",
    xpHistory: [],
  }),
}));

jest.mock("@/lib/practiceStatistics", () => ({
  savePracticeStatistics: jest.fn(),
  getPracticeStatistics: jest.fn().mockReturnValue({}),
}));

import {
  saveUserProfile,
  saveUserStatistics,
  savePracticeSession,
  updatePracticeSession,
  saveBookmark,
  removeBookmark,
  saveCollection,
  updateCollection,
  removeCollection,
  saveVocabulary,
  savePreferences,
} from "../dataSync";

import * as userDataSlice from "@/lib/redux/slices/userDataSlice";
import * as userProfileLib from "@/lib/userProfile";
import * as practiceStatisticsLib from "@/lib/practiceStatistics";

import type { AppDispatch, RootState } from "@/lib/redux/store";
import type { PracticeStatistics, PracticeSession } from "@/types";
import { SessionStatus } from "@/types/session";
import type {
  SavedQuestion,
  SavedCollection,
  VocabularyProgress,
  UserPreferences,
} from "@/lib/types/userData";

// ─── localStorage mock ───────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(global, "localStorage", { value: localStorageMock });

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Creates an unauthenticated RootState stub */
function unauthState(): RootState {
  return {
    auth: {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
      sessionChecked: true,
    },
    userData: {
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
    },
  } as unknown as RootState;
}

/** Creates an authenticated RootState stub */
function authState(): RootState {
  return {
    auth: {
      isAuthenticated: true,
      user: {
        id: "u1",
        email: "a@a.com",
        name: "A",
        provider: "email",
        createdAt: "",
      },
      loading: false,
      error: null,
      sessionChecked: true,
    },
    userData: {
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
    },
  } as unknown as RootState;
}

const mockDispatch = jest.fn() as unknown as AppDispatch;

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════════
// Profile
// ═══════════════════════════════════════════════════════════════════════════════

describe("saveUserProfile – unauthenticated", () => {
  it("calls localStorage saveUserProfile utility, not Redux thunk", () => {
    saveUserProfile({ totalXP: 100 }, mockDispatch, unauthState());

    expect(userProfileLib.saveUserProfile).toHaveBeenCalled();
    expect(userDataSlice.updateUserProfile).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

describe("saveUserProfile – authenticated", () => {
  it("dispatches Redux thunk, not localStorage", () => {
    saveUserProfile({ totalXP: 200 }, mockDispatch, authState());

    expect(mockDispatch).toHaveBeenCalled();
    expect(userProfileLib.saveUserProfile).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════════════════════

describe("saveUserStatistics – unauthenticated", () => {
  it("calls localStorage savePracticeStatistics, not Redux thunk", () => {
    const stats: PracticeStatistics = {
      SAT: {
        answeredQuestions: ["q1"],
        answeredQuestionsDetailed: [],
        statistics: {},
      },
    };

    saveUserStatistics(stats, mockDispatch, unauthState());

    expect(practiceStatisticsLib.savePracticeStatistics).toHaveBeenCalledWith(
      stats,
    );
    expect(userDataSlice.updateUserStatistics).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

describe("saveUserStatistics – authenticated", () => {
  it("dispatches Redux thunk", () => {
    const stats: PracticeStatistics = {};
    saveUserStatistics(stats, mockDispatch, authState());
    expect(mockDispatch).toHaveBeenCalled();
    expect(practiceStatisticsLib.savePracticeStatistics).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Practice Sessions
// ═══════════════════════════════════════════════════════════════════════════════

const mockSession: PracticeSession = {
  sessionId: "sess-1",
  timestamp: "2024-01-01T00:00:00.000Z",
  status: SessionStatus.COMPLETED,
  practiceSelections: {} as PracticeSession["practiceSelections"],
  currentQuestionStep: 5,
  questionAnswers: {},
  questionTimes: {},
  answeredQuestionDetails: [],
  totalQuestions: 5,
  answeredQuestions: [],
  averageTimePerQuestion: 30,
  totalTimeSpent: 150,
};

describe("savePracticeSession – unauthenticated", () => {
  it("writes to localStorage practiceHistory, not Redux", () => {
    savePracticeSession(mockSession, mockDispatch, unauthState());

    const raw = localStorageMock.getItem("practiceHistory");
    expect(raw).not.toBeNull();
    const sessions: PracticeSession[] = JSON.parse(raw!);
    expect(sessions[0].sessionId).toBe("sess-1");
    expect(userDataSlice.createSession).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("does not create duplicates when saving the same sessionId twice", () => {
    savePracticeSession(mockSession, mockDispatch, unauthState());
    savePracticeSession(
      { ...mockSession, totalQuestions: 10 },
      mockDispatch,
      unauthState(),
    );

    const raw = localStorageMock.getItem("practiceHistory");
    const sessions: PracticeSession[] = JSON.parse(raw!);
    expect(sessions.length).toBe(1);
    expect(sessions[0].totalQuestions).toBe(10);
  });

  it("caps practiceHistory at 20 entries", () => {
    for (let i = 0; i < 25; i++) {
      savePracticeSession(
        { ...mockSession, sessionId: `sess-${i}` },
        mockDispatch,
        unauthState(),
      );
    }
    const raw = localStorageMock.getItem("practiceHistory");
    const sessions: PracticeSession[] = JSON.parse(raw!);
    expect(sessions.length).toBeLessThanOrEqual(20);
  });
});

describe("updatePracticeSession – unauthenticated", () => {
  it("updates existing session in localStorage", () => {
    // Pre-populate
    localStorageMock.setItem("practiceHistory", JSON.stringify([mockSession]));

    updatePracticeSession(
      "sess-1",
      { status: SessionStatus.COMPLETED },
      mockDispatch,
      unauthState(),
    );

    const raw = localStorageMock.getItem("practiceHistory");
    const sessions: PracticeSession[] = JSON.parse(raw!);
    expect(sessions[0].status).toBe(SessionStatus.COMPLETED);
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Bookmarks
// ═══════════════════════════════════════════════════════════════════════════════

const mockBookmark: Omit<SavedQuestion, "id" | "userId"> = {
  assessment: "SAT",
  questionId: "q-abc",
  externalId: null,
  ibn: null,
  plainQuestion: null,
  timestamp: "2024-01-01T00:00:00.000Z",
};

describe("saveBookmark – unauthenticated", () => {
  it("writes to localStorage savedQuestions, not Redux", () => {
    saveBookmark(mockBookmark, mockDispatch, unauthState());

    const raw = localStorageMock.getItem("savedQuestions");
    expect(raw).not.toBeNull();
    const saved: Record<string, SavedQuestion[]> = JSON.parse(raw!);
    expect(saved["SAT"]).toBeDefined();
    expect(saved["SAT"][0].questionId).toBe("q-abc");
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("does not save the same question twice", () => {
    saveBookmark(mockBookmark, mockDispatch, unauthState());
    saveBookmark(mockBookmark, mockDispatch, unauthState());

    const raw = localStorageMock.getItem("savedQuestions");
    const saved: Record<string, SavedQuestion[]> = JSON.parse(raw!);
    expect(saved["SAT"].length).toBe(1);
  });
});

describe("removeBookmark – unauthenticated", () => {
  it("removes bookmark from localStorage", () => {
    localStorageMock.setItem(
      "savedQuestions",
      JSON.stringify({ SAT: [mockBookmark] }),
    );

    removeBookmark("q-abc", mockDispatch, unauthState());

    const raw = localStorageMock.getItem("savedQuestions");
    const saved: Record<string, SavedQuestion[]> = JSON.parse(raw!);
    expect(saved["SAT"].length).toBe(0);
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Collections
// ═══════════════════════════════════════════════════════════════════════════════

const mockCollection: Omit<SavedCollection, "id" | "userId"> = {
  collectionId: "col-1",
  name: "My Collection",
  questionIds: ["q1"],
  questionDetails: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("saveCollection – unauthenticated", () => {
  it("writes to localStorage savedCollections, not Redux", () => {
    saveCollection(mockCollection, mockDispatch, unauthState());

    const raw = localStorageMock.getItem("savedCollections");
    expect(raw).not.toBeNull();
    const cols: Record<string, SavedCollection> = JSON.parse(raw!);
    expect(cols["col-1"]).toBeDefined();
    expect(cols["col-1"].name).toBe("My Collection");
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

describe("updateCollection – unauthenticated", () => {
  it("merges updates into existing localStorage collection", () => {
    localStorageMock.setItem(
      "savedCollections",
      JSON.stringify({ "col-1": mockCollection }),
    );

    updateCollection("col-1", { name: "Renamed" }, mockDispatch, unauthState());

    const raw = localStorageMock.getItem("savedCollections");
    const cols: Record<string, SavedCollection> = JSON.parse(raw!);
    expect(cols["col-1"].name).toBe("Renamed");
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

describe("removeCollection – unauthenticated", () => {
  it("deletes collection from localStorage", () => {
    localStorageMock.setItem(
      "savedCollections",
      JSON.stringify({ "col-1": mockCollection }),
    );

    removeCollection("col-1", mockDispatch, unauthState());

    const raw = localStorageMock.getItem("savedCollections");
    const cols: Record<string, SavedCollection> = JSON.parse(raw!);
    expect(cols["col-1"]).toBeUndefined();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Vocabulary
// ═══════════════════════════════════════════════════════════════════════════════

describe("saveVocabulary – unauthenticated", () => {
  it("writes to localStorage vocabsData, not Redux", () => {
    const vocab: VocabularyProgress = { word1: { status: "learned" } };

    saveVocabulary(vocab, mockDispatch, unauthState());

    const raw = localStorageMock.getItem("vocabsData");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(vocab);
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

describe("saveVocabulary – authenticated", () => {
  it("dispatches Redux thunk, not localStorage", () => {
    const vocab: VocabularyProgress = {};
    saveVocabulary(vocab, mockDispatch, authState());
    expect(mockDispatch).toHaveBeenCalled();
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
      "vocabsData",
      expect.any(String),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Preferences
// ═══════════════════════════════════════════════════════════════════════════════

describe("savePreferences – unauthenticated", () => {
  it("writes to localStorage userPreferences, not Redux", () => {
    const prefs: UserPreferences = { theme: "dark", soundEnabled: true };

    savePreferences(prefs, mockDispatch, unauthState());

    const raw = localStorageMock.getItem("userPreferences");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(prefs);
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

describe("savePreferences – authenticated", () => {
  it("dispatches Redux thunk, not localStorage", () => {
    const prefs: UserPreferences = {};
    savePreferences(prefs, mockDispatch, authState());
    expect(mockDispatch).toHaveBeenCalled();
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
      "userPreferences",
      expect.any(String),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Requirement 12.3 – no API calls for unauthenticated users
// ═══════════════════════════════════════════════════════════════════════════════

describe("Requirement 12.3 – no Redux thunks dispatched for unauthenticated users", () => {
  it("none of the dataSync functions dispatch a thunk when unauthenticated", () => {
    const state = unauthState();

    saveUserProfile({ totalXP: 50 }, mockDispatch, state);
    saveUserStatistics({}, mockDispatch, state);
    savePracticeSession(mockSession, mockDispatch, state);
    saveBookmark(mockBookmark, mockDispatch, state);
    saveCollection(mockCollection, mockDispatch, state);
    saveVocabulary({}, mockDispatch, state);
    savePreferences({}, mockDispatch, state);

    // dispatch should never have been called for any of the above
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
