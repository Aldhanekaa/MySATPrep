/**
 * MSW (Mock Service Worker) Handlers
 *
 * Defines request handlers for all API routes used in tests.
 * Uses MSW v2 syntax with http from 'msw'.
 */

import { http, HttpResponse } from "msw";

// ---------------------------------------------------------------------------
// Mock data fixtures
// ---------------------------------------------------------------------------

export const MOCK_USER = {
  id: "test-user-id-123",
  email: "test@example.com",
  name: "Test User",
  emailVerified: true,
  createdAt: new Date("2024-01-01").toISOString(),
  updatedAt: new Date("2024-01-01").toISOString(),
};

export const MOCK_SESSION = {
  session: {
    id: "test-session-id-456",
    userId: MOCK_USER.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-01-01").toISOString(),
  },
  user: MOCK_USER,
};

export const MOCK_PROFILE = {
  userId: MOCK_USER.id,
  totalXp: 500,
  level: 3,
  questionsAnswered: 50,
  correctAnswers: 40,
  incorrectAnswers: 10,
  lastActivity: new Date("2024-01-15").toISOString(),
  xpHistory: [],
};

export const MOCK_USER_DATA = {
  profile: MOCK_PROFILE,
  statistics: [],
  sessions: [],
  bookmarks: [],
  collections: [],
  vocabulary: {},
  preferences: {},
};

export const MOCK_BOOKMARK = {
  id: "bookmark-id-789",
  userId: MOCK_USER.id,
  assessment: "SAT",
  questionId: "question-id-001",
  externalId: null,
  ibn: null,
  plainQuestion: null,
  timestamp: new Date("2024-01-10").toISOString(),
};

export const MOCK_COLLECTION = {
  id: "collection-id-101",
  userId: MOCK_USER.id,
  collectionId: "col-001",
  name: "My Collection",
  description: "A test collection",
  questionIds: [],
  questionDetails: [],
  color: "blue",
  createdAt: new Date("2024-01-10").toISOString(),
  updatedAt: new Date("2024-01-10").toISOString(),
};

export const MOCK_SESSION_DATA = {
  id: "session-data-id-202",
  userId: MOCK_USER.id,
  sessionId: "sess-001",
  sessionData: {},
  status: "in_progress",
  createdAt: new Date("2024-01-12").toISOString(),
  updatedAt: new Date("2024-01-12").toISOString(),
};

export const MOCK_MIGRATION_SUMMARY = {
  profile: true,
  statistics: true,
  sessions: true,
  bookmarks: true,
  collections: true,
  vocabulary: true,
  preferences: true,
  counts: {
    sessions: 0,
    bookmarks: 0,
    collections: 0,
  },
};

// ---------------------------------------------------------------------------
// Handler state — tests can mutate these to simulate different scenarios
// ---------------------------------------------------------------------------

/** Set to true to make the session endpoint return null (unauthenticated) */
export let mockSessionAuthenticated = true;

export function setMockSessionAuthenticated(value: boolean): void {
  mockSessionAuthenticated = value;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const handlers = [
  // ------------------------------------------------------------------
  // Better Auth endpoints
  // ------------------------------------------------------------------

  /** GET /api/auth/session — returns mock session or null */
  http.get("/api/auth/session", () => {
    if (mockSessionAuthenticated) {
      return HttpResponse.json(MOCK_SESSION);
    }
    return HttpResponse.json(null);
  }),

  /** POST /api/auth/sign-in/email — simulates successful email sign-in */
  http.post("/api/auth/sign-in/email", async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }
    if (body.password.length < 8) {
      return HttpResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }
    return HttpResponse.json(MOCK_SESSION);
  }),

  /** POST /api/auth/sign-up/email — simulates successful registration */
  http.post("/api/auth/sign-up/email", async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }
    if (body.password.length < 8) {
      return HttpResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }
    return HttpResponse.json({ user: MOCK_USER }, { status: 201 });
  }),

  /** POST /api/auth/sign-out — clears session */
  http.post("/api/auth/sign-out", () => {
    return HttpResponse.json({ success: true });
  }),

  // ------------------------------------------------------------------
  // User data endpoints
  // ------------------------------------------------------------------

  /** GET /api/user/data — returns full mock user data */
  http.get("/api/user/data", () => {
    if (!mockSessionAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json(MOCK_USER_DATA);
  }),

  /** PUT /api/user/profile — returns updated profile */
  http.put("/api/user/profile", async ({ request }) => {
    if (!mockSessionAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const updates = await request.json();
    return HttpResponse.json({ ...MOCK_PROFILE, ...(updates as object) });
  }),

  /** PUT /api/user/statistics — returns updated statistics */
  http.put("/api/user/statistics", async ({ request }) => {
    if (!mockSessionAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const updates = await request.json();
    return HttpResponse.json(updates);
  }),

  /** POST /api/user/sessions — creates a new practice session */
  http.post("/api/user/sessions", async ({ request }) => {
    if (!mockSessionAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    return HttpResponse.json(
      { ...MOCK_SESSION_DATA, ...(body as object) },
      { status: 201 },
    );
  }),

  /** PUT /api/user/sessions/:id — updates a practice session */
  http.put("/api/user/sessions/:id", async ({ params, request }) => {
    if (!mockSessionAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const updates = await request.json();
    return HttpResponse.json({
      ...MOCK_SESSION_DATA,
      id: params.id,
      ...(updates as object),
    });
  }),

  /** POST /api/user/bookmarks — adds a new bookmark */
  http.post("/api/user/bookmarks", async ({ request }) => {
    if (!mockSessionAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    return HttpResponse.json(
      { ...MOCK_BOOKMARK, ...(body as object) },
      { status: 201 },
    );
  }),

  /** DELETE /api/user/bookmarks/:id — removes a bookmark */
  http.delete("/api/user/bookmarks/:id", ({ params }) => {
    if (!mockSessionAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json({ success: true, id: params.id });
  }),

  /** POST /api/user/collections — creates a new collection */
  http.post("/api/user/collections", async ({ request }) => {
    if (!mockSessionAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    return HttpResponse.json(
      { ...MOCK_COLLECTION, ...(body as object) },
      { status: 201 },
    );
  }),

  /** PUT /api/user/collections/:id — updates a collection */
  http.put("/api/user/collections/:id", async ({ params, request }) => {
    if (!mockSessionAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const updates = await request.json();
    return HttpResponse.json({
      ...MOCK_COLLECTION,
      id: params.id,
      ...(updates as object),
    });
  }),

  /** DELETE /api/user/collections/:id — removes a collection */
  http.delete("/api/user/collections/:id", ({ params }) => {
    if (!mockSessionAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json({ success: true, id: params.id });
  }),

  /** PUT /api/user/vocabulary — updates vocabulary progress */
  http.put("/api/user/vocabulary", async ({ request }) => {
    if (!mockSessionAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const updates = await request.json();
    return HttpResponse.json(updates);
  }),

  /** PUT /api/user/preferences — updates user preferences */
  http.put("/api/user/preferences", async ({ request }) => {
    if (!mockSessionAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const updates = await request.json();
    return HttpResponse.json(updates);
  }),

  /** POST /api/user/migrate-data — runs localStorage migration */
  http.post("/api/user/migrate-data", async () => {
    if (!mockSessionAuthenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json(MOCK_MIGRATION_SUMMARY);
  }),
];
