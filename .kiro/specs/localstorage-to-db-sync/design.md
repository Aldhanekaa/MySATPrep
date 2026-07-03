# Design Document: localStorage-to-DB Sync

## Overview

This design closes the remaining gaps in the user-data sync layer for authenticated users. The application already has a comprehensive sync infrastructure (`dataSync.ts`, `userDataSlice.ts`, all API routes, and LRU caches), but twelve specific gaps remain where writes still go directly to localStorage or where caches are missing, incomplete, or not invalidated correctly.

The changes fall into five logical groups:

1. **Cache layer expansion** — add `notesCache` and `answerHistoryCache` to `cache.ts`; extend `invalidateUserCache` to include them.
2. **API route hardening** — update `GET/PUT /api/user/notes` and `GET/PUT /api/user/answer-history` to use the cache and return the consistent `{ success, data|error }` response shape; expand `GET /api/user/data` to fetch and return `questionNotes` and `answerHistory`.
3. **Type and Redux extension** — add `uiFlags?: Record<string, boolean>` to `UserPreferences`; add `setUiFlag` synchronous action and `selectUiFlag` selector to `userDataSlice`.
4. **UI flag write sites** — update `SuccessFeedback` in `practice-rush-multistep.tsx` and the tour check in `question-results.tsx` to read/write UIFlags through the sync layer instead of raw `localStorage`.
5. **In-progress session sync** — add `saveCurrentSession` / `debouncedSaveCurrentSession` / `removeCurrentSession` to `dataSync.ts` and wire them to the session crash-recovery call sites.
6. **Preferences page fix** — ensure `preferences/page.tsx` initialises from Redux for authenticated users (already partially implemented; this closes the remaining gap).
7. **Migration additions** — add `questionNotes` and `answerHistory` to `MigrationPayloadSchema` and to the `migrateUserData` transaction.

None of the already-implemented items (dataSync functions, hook implementations, existing API routes, existing slice thunks) are redesigned — only the specific gaps are addressed.

---

## Architecture

### Data Flow Layers

```
UI Component
    │  reads: Redux selector (authenticated) │ localStorage hook (unauthenticated)
    │  writes: dataSync function (routes by auth state)
    ▼
dataSync.ts  ──authenticated──►  Redux Thunk Dispatch
                                      │
                 unauthenticated ◄────┤  withRetry (3 attempts)
                 localStorage         │
                                      ▼
                              API Route Handler
                                      │
                              ┌───────┴────────┐
                              │  Cache Layer   │  (LRU, server-side)
                              │  cache.ts      │
                              └───────┬────────┘
                                      │ cache miss
                                      ▼
                              Database (PostgreSQL via pg pool)
                                      │
                              ┌───────┴────────┐
                              │  Cache Write   │  set key after fetch
                              │  Cache Delete  │  invalidate after write
                              └────────────────┘
```

### Authentication Decision Point

Every write in `dataSync.ts` checks `isAuthenticated(state)`:

- **Authenticated** → optimistic Redux dispatch → `withRetry` API call → cache invalidation inside route handler → on failure: `showNetworkError`
- **Unauthenticated** → direct localStorage write, no API call

### Cache Invalidation Strategy

All API write routes (PUT/POST/DELETE) call `cache.delete(getCacheKey(..., userId))` **before** returning the HTTP response. This ensures that any concurrent GET request that arrives immediately after sees the DB value, not a stale cached value.

`GET /api/user/data` uses `getCachedOrFetch` for all categories, so fresh data is served from cache after the first fetch and invalidated on each write.

---

## Components and Interfaces

### Gap 1 & 2 — `src/lib/cache.ts` additions

Add two new LRU cache instances and update `invalidateUserCache`.

**New exports:**

```ts
// Cache config additions (follow existing patterns)
const cacheConfigs = {
  // ...existing entries...
  questionNotes: { max: 1000, ttl: 10 * 60 * 1000 }, // Gap 1
  answerHistory: { max: 1000, ttl: 10 * 60 * 1000 }, // Gap 2
};

export const notesCache = new LRUCache<string, any>(cacheConfigs.questionNotes);
export const answerHistoryCache = new LRUCache<string, any>(
  cacheConfigs.answerHistory,
);
```

**Updated `invalidateUserCache`:**

```ts
export function invalidateUserCache(userId: string): void {
  // ...existing deletions...
  notesCache.delete(getCacheKey("notes", userId)); // Gap 4 (was missing)
  answerHistoryCache.delete(getCacheKey("answerHistory", userId)); // Gap 4
}
```

---

### Gap 5 & 2 — `src/app/api/user/notes/route.ts` hardening

The current route has informal error shapes and no cache usage. Updated signature contract:

**GET handler:**

```ts
// Uses getCachedOrFetch(notesCache, getCacheKey("notes", userId), () => getQuestionNotes(userId))
// Returns: { success: true, data: QuestionNotes | {} } on success
// Returns: { success: false, error: "Unauthorized" } on 401
// Returns: { success: false, error: "Service temporarily unavailable" } on DB error (503)
export async function GET(request: NextRequest): Promise<NextResponse>;
```

**PUT handler:**

```ts
// Validates payload; calls updateQuestionNotes(userId, data)
// Calls notesCache.delete(getCacheKey("notes", userId)) BEFORE returning response
// Returns: { success: true, data: updatedNotes } on success
// Returns: { success: false, error: "Unauthorized" } on 401
// Returns: { success: false, error: "...", details: string[] } on 400 validation failure
// Returns: { success: false, error: "Service temporarily unavailable" } on 503
export async function PUT(request: NextRequest): Promise<NextResponse>;
```

---

### Gap 2 & Gap 3 — `src/app/api/user/answer-history/route.ts` hardening

Same pattern as notes. Updated to use `answerHistoryCache`:

**GET handler:**

```ts
// Uses getCachedOrFetch(answerHistoryCache, getCacheKey("answerHistory", userId), ...)
// Returns: { success: true, data: AnswerHistory | {} }
export async function GET(request: NextRequest): Promise<NextResponse>;
```

**PUT handler:**

```ts
// Calls answerHistoryCache.delete(getCacheKey("answerHistory", userId)) before response
// Returns: { success: true, data: updatedHistory }
export async function PUT(request: NextRequest): Promise<NextResponse>;
```

---

### Gap 3 — `src/app/api/user/data/route.ts` expansion

Add parallel fetches for `questionNotes` and `answerHistory` alongside the existing seven categories.

**Added imports:**

```ts
import { notesCache, answerHistoryCache } from "@/lib/cache";
import { getQuestionNotes, getAnswerHistory } from "@/lib/db/miscOperations";
```

**Parallel fetch additions inside `Promise.all`:**

```ts
// Notes
safe("notes", getCachedOrFetch(notesCache, getCacheKey("notes", userId), () => getQuestionNotes(userId))),
// Answer history
safe("answerHistory", getCachedOrFetch(answerHistoryCache, getCacheKey("answerHistory", userId), () => getAnswerHistory(userId))),
```

**Updated response `data` object:**

```ts
data: {
  profile: profile ?? null,
  statistics: mergedStatistics,
  sessions: sessions ?? [],
  bookmarks: bookmarks ?? [],
  collections: collections ?? [],
  vocabulary: vocabulary ?? null,
  preferences: preferences ?? null,
  questionNotes: questionNotes ?? null,   // NEW
  answerHistory: answerHistory ?? null,   // NEW
},
```

This ensures `fetchUserData` in the Redux slice (which already handles `questionNotes` and `answerHistory` in `extraReducers`) will populate those fields after login.

---

### Gap 12 — `src/lib/types/userData.ts` — explicit `uiFlags` field

```ts
export interface UserPreferences {
  theme?: "light" | "dark";
  data_mode_priority?: "localstorage" | "cloud";
  assessment?: "SAT" | "PSAT/NMSQT" | "PSAT";
  soundEnabled?: boolean;
  notifications?: boolean;
  uiFlags?: Record<string, boolean>; // NEW — explicit typed field
  [key: string]: any; // keep for backward compat
}
```

---

### Gap 12 — `src/lib/redux/slices/userDataSlice.ts` additions

Add one synchronous action to set a single UI flag and merge it into preferences:

**New synchronous reducer:**

```ts
// Merges a single boolean UI flag into preferences.uiFlags
setUiFlag: (state, action: PayloadAction<{ key: string; value: boolean }>) => {
  if (!state.preferences) {
    state.preferences = { uiFlags: {} };
  }
  if (!state.preferences.uiFlags) {
    state.preferences.uiFlags = {};
  }
  state.preferences.uiFlags[action.payload.key] = action.payload.value;
},
```

**New selector in `selectors.ts`:**

```ts
// Returns the boolean value for a specific UI flag key, or false if not found
export const selectUiFlag = (key: string) =>
  createSelector(
    selectUserPreferences,
    (prefs): boolean => prefs?.uiFlags?.[key] ?? false,
  );
```

---

### Gap 6 — UIFlag write sites — `practice-rush-multistep.tsx` (`SuccessFeedback`)

The `SuccessFeedback` component currently reads/writes `hideSuccessFeedback` directly via `localStorage`.

**Required change** (inside `SuccessFeedback` component):

- Receive `isAuthenticated`, `dispatch`, and `reduxState` as props (or use hooks internally).
- On mount: if `isAuthenticated`, read from `selectUiFlag("hideSuccessFeedback")(reduxState)` and fall back to `localStorage.getItem("hideSuccessFeedback") === "true"` if Redux value is `false` and localStorage has `"true"`.
- On `handleContinue` when `dontShowAgain` is checked:
  - Write `localStorage.setItem("hideSuccessFeedback", "true")` (optimistic local mirror).
  - If `isAuthenticated`: dispatch `setUiFlag({ key: "hideSuccessFeedback", value: true })` and call `debouncedSavePreferences({ ...currentPrefs, uiFlags: { ...currentPrefs.uiFlags, hideSuccessFeedback: true } }, dispatch, state)`.
  - If unauthenticated: `localStorage.setItem` only (current behavior).

---

### Gap 7 — UIFlag write sites — `question-results.tsx` (tour check)

The `useEffect` that reads `localStorage.getItem("questionbank-onboarding")` must be updated:

```ts
useEffect(() => {
  const tourKey = "questionbank-onboarding";
  let hasCompletedTour: boolean;

  if (isAuthenticated) {
    // Read from Redux first; fall back to localStorage for legacy data
    hasCompletedTour =
      selectUiFlag(tourKey)(reduxState) ||
      localStorage.getItem(tourKey) === "true";
  } else {
    hasCompletedTour = localStorage.getItem(tourKey) === "true";
  }

  tourDispatch({ type: "SET_SHOW_TOUR_DIALOG", payload: !hasCompletedTour });
}, [isAuthenticated]);
```

When the `TourAlertDialog` or `InteractiveOnboardingChecklist` sets the tour as complete (via `tourLocalStorageKey`), the existing `localStorage.setItem` call in those components remains, but a new hook is needed to sync the flag to Redux + API:

```ts
// After tour completion for authenticated users:
dispatch(setUiFlag({ key: "questionbank-onboarding", value: true }));
debouncedSavePreferences(
  {
    ...currentPrefs,
    uiFlags: { ...currentPrefs.uiFlags, "questionbank-onboarding": true },
  },
  dispatch,
  state,
);
```

This should be wired in the `handleFinish` / `setIsOpen(false)` callback that already calls `localStorage.setItem` with `tourLocalStorageKey`.

---

### Gap 8 — In-progress session sync — `src/lib/utils/dataSync.ts` additions

Three new exported functions for the crash-recovery session flow:

```ts
/**
 * Saves or updates the in-progress (current) practice session.
 * Authenticated: write to localStorage immediately, then debounced createSession/updateSession.
 * Unauthenticated: localStorage only.
 *
 * Validates: Requirement 5.1, 5.2
 */
export function saveCurrentSession(
  data: PracticeSession,
  dispatch: AppDispatch,
  state: RootState,
): void;

/**
 * Debounced version of saveCurrentSession (1000 ms).
 * Validates: Requirement 5.2
 */
export const debouncedSaveCurrentSession: DebouncedFunction<
  typeof saveCurrentSession
>;

/**
 * Removes the in-progress session.
 * - abandon=true: dispatch removeSession only (no prior updateSession call).
 * - abandon=false (complete): call updateSession with final state, then dispatch removeSession.
 * Authenticated only; unauthenticated removes from localStorage.
 *
 * Validates: Requirements 5.4, 5.5
 */
export function removeCurrentSession(
  sessionId: string,
  finalData: PracticeSession | null,
  abandon: boolean,
  dispatch: AppDispatch,
  state: RootState,
): void;
```

**`saveCurrentSession` implementation sketch:**

```ts
export function saveCurrentSession(data, dispatch, state) {
  // Always write localStorage first (crash-recovery guarantee)
  try { localStorage.setItem("currentPracticeSession", JSON.stringify(data)); } catch { ... }

  if (isAuthenticated(state)) {
    const existingSession = state.userData.sessions.find(
      s => s.sessionId === data.sessionId
    );
    const thunk = existingSession
      ? updateSession({ id: data.sessionId, sessionData: data })
      : createSession(data);

    withRetry(() => dispatch(thunk) as unknown as Promise<unknown>)
      .catch(() => showNetworkError("Failed to save your practice session. ..."));
  }
}
```

**Call sites to update** (wherever `localStorage.setItem("currentPracticeSession", ...)` is called):

- `src/types/session.ts` → `saveSessionToStorage` helper: replace `localStorage.setItem("currentPracticeSession", ...)` with `saveCurrentSession(session, dispatch, state)` — callers need to pass `dispatch` and `state`.
- `src/components/practice-rush-multistep.tsx` → any direct `localStorage.setItem("currentPracticeSession", ...)` call: replace with `debouncedSaveCurrentSession(sessionData, dispatch, getState())`.
- Session abandon path: call `removeCurrentSession(sessionId, null, true, dispatch, state)`.
- Session complete path: call `removeCurrentSession(sessionId, finalData, false, dispatch, state)`.

---

### Gap 9 — `src/app/dashboard/preferences/page.tsx`

The current implementation already has a `resolveInitial` helper that correctly prefers `reduxPrefs` and falls back to localStorage. However it uses `localStorage.getItem` even when authenticated. The `resolveInitial` function should only read localStorage as a fallback when `reduxPrefs` is `null`, not as a default path for authenticated users.

**Required change:** Remove the localStorage fallback branch in `resolveInitial` when `isAuthenticated` is true:

```ts
const resolveInitial = <T extends string>(
  key: keyof UserPreferences,
  fallback: T,
): T => {
  if (reduxPrefs?.[key] !== undefined) return reduxPrefs[key] as T;
  if (!isAuthenticated) {
    // Only read localStorage for unauthenticated users
    try {
      const raw = localStorage.getItem("userPreferences");
      if (raw) {
        const parsed: UserPreferences = JSON.parse(raw);
        if (parsed[key] !== undefined) return parsed[key] as T;
      }
    } catch {
      /* ignore */
    }
  }
  return fallback;
};
```

---

### Gaps 10 & 11 — Migration additions

#### `src/lib/validation/migrationSchema.ts`

Add new fields to `MigrationPayloadSchema`:

```ts
// New schemas
const QuestionNoteSchema = z.object({
  note: z.string().optional(),
  timestamp: z.string().optional(),
  createdAt: z.string().optional(),
  difficulty: z.string().optional().nullable(),
  primaryClassCd: z.string().optional().nullable(),
  skillCd: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  createdDate: z.string().optional().nullable(),
  updatedDate: z.string().optional().nullable(),
});

export const QuestionNotesSchema = z.record(
  z.string(),
  z.array(QuestionNoteSchema).or(z.unknown()),
);

export const AnswerHistorySchema = z.record(
  z.string(),
  z.array(
    z.object({
      userChoice: z.string(),
      time: z.number(),
      status: z.enum(["correct", "incorrect"]),
    }),
  ),
);
```

Update `MigrationPayloadSchema`:

```ts
export const MigrationPayloadSchema = z.object({
  // ...existing fields...
  questionNotes: QuestionNotesSchema.optional().nullable(), // NEW
  answerHistory: AnswerHistorySchema.optional().nullable(), // NEW
});
```

Update `ValidatedMigrationPayload` type to include the new fields.

#### `src/lib/db/migrationOperations.ts`

Add handling in the transaction after preferences:

```ts
// ── Question Notes ────────────────────────────────────────────────────────────
if (data.questionNotes && Object.keys(data.questionNotes).length > 0) {
  await client.query(
    `INSERT INTO question_notes (user_id, notes_data)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, JSON.stringify(data.questionNotes)],
  );
  summary.notesMigrated = true;
}

// ── Answer History ─────────────────────────────────────────────────────────────
if (data.answerHistory && Object.keys(data.answerHistory).length > 0) {
  await client.query(
    `INSERT INTO answer_history (user_id, history_data)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, JSON.stringify(data.answerHistory)],
  );
  summary.answerHistoryMigrated = true;
}
```

Also extend `MigrationSummary` type in `src/lib/types/api.ts`:

```ts
export interface MigrationSummary {
  // ...existing fields...
  notesMigrated: boolean; // NEW
  answerHistoryMigrated: boolean; // NEW
}
```

---

## Data Models

### `UserPreferences` (updated)

```ts
export interface UserPreferences {
  theme?: "light" | "dark";
  data_mode_priority?: "localstorage" | "cloud";
  assessment?: "SAT" | "PSAT/NMSQT" | "PSAT";
  soundEnabled?: boolean;
  notifications?: boolean;
  uiFlags?: Record<string, boolean>; // NEW: keyed boolean flags (hideSuccessFeedback, questionbank-onboarding, etc.)
  [key: string]: any; // backward compatibility
}
```

### `MigrationSummary` (updated)

```ts
export interface MigrationSummary {
  profileMigrated: boolean;
  statisticsMigrated: boolean;
  sessionsMigrated: number;
  bookmarksMigrated: number;
  collectionsMigrated: number;
  vocabularyMigrated: boolean;
  preferencesMigrated: boolean;
  notesMigrated: boolean; // NEW
  answerHistoryMigrated: boolean; // NEW
}
```

### `ValidatedMigrationPayload` additions

```ts
// Added to MigrationPayloadSchema
questionNotes?: Record<string, unknown> | null;
answerHistory?: Record<string, Array<{ userChoice: string; time: number; status: "correct" | "incorrect" }>> | null;
```

### UIFlag pattern

UIFlags are stored as a flat map inside `UserPreferences.uiFlags`:

```ts
// Stored in DB as part of user_preferences.preferences_data JSON:
{
  "theme": "dark",
  "assessment": "SAT",
  "uiFlags": {
    "hideSuccessFeedback": true,
    "questionbank-onboarding": true
  }
}
```

Read priority for authenticated users:

1. `preferences.uiFlags[key]` from Redux (populated via `GET /api/user/data`)
2. `localStorage.getItem("uiFlag_<key>")` or the key-specific localStorage entry as fallback

---

## Authenticated Write Sequence

The following sequence applies uniformly to every new authenticated write path added in this feature:

```
1. Component dispatches setXxx(optimisticValue) — synchronous Redux update (immediate UI)
2. Component calls debouncedSaveXxx(newValue, dispatch, state) — coalesces rapid writes
3. dataSync.ts fires after debounce delay:
   a. Checks isAuthenticated(state)
   b. Calls withRetry(() => dispatch(updateXxxThunk(newValue)), { maxAttempts: 3 })
4. updateXxxThunk (async thunk):
   a. PUT /api/user/xxx with newValue payload
   b. On success: returns persisted data → extraReducer replaces slice state
5. API route handler:
   a. Validates session (401 if absent)
   b. Validates payload (400 with details[] if malformed)
   c. Calls db upsert function
   d. Calls xxxCache.delete(getCacheKey("xxx", userId))  ← BEFORE response
   e. Returns { success: true, data: persistedValue }
6. On withRetry exhaustion: showNetworkError("Failed to save <category>...")
   — local state (Redux + localStorage) is unchanged
```

### Session-specific sequence (in-progress session)

```
1. Practice session state changes (answer submitted, question navigated)
2. debouncedSaveCurrentSession(updatedSession, dispatch, state) [1000ms debounce]
3. saveCurrentSession:
   a. localStorage.setItem("currentPracticeSession", ...) — synchronous crash-recovery write
   b. isAuthenticated? → check if sessionId in Redux sessions
      - Not found: dispatch createSession(data)
      - Found: dispatch updateSession({ id, sessionData: data })
4. On session abandon: removeCurrentSession(id, null, abandon=true)
   - localStorage.removeItem("currentPracticeSession")
   - isAuthenticated? → dispatch removeSession(id) [no updateSession]
5. On session complete: removeCurrentSession(id, finalData, abandon=false)
   - isAuthenticated? → dispatch updateSession(id, finalData), then dispatch removeSession(id)
   - localStorage.removeItem("currentPracticeSession")
```

---

## Error Handling

| Failure Scenario                    | Behaviour                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| API returns 401                     | `withRetry` does not retry 401s — treated as auth failure, logged silently                        |
| API returns 400 (validation)        | No retry — `showNetworkError` with validation message                                             |
| API returns 503 / network error     | `withRetry` retries up to 3 times with exponential backoff                                        |
| All retries exhausted               | `showNetworkError("Failed to save <category>. Please check your connection.")`                    |
| Notes write fails                   | `useLocalStorage` value for `questionNotes` is unchanged — user's edits not lost                  |
| Session write fails                 | `localStorage.setItem("currentPracticeSession", ...)` was already done — crash-recovery preserved |
| Migration notes/answerHistory fails | Transaction rolled back; malformed/missing fields silently skipped (no rethrow for null fields)   |

### API Route Error Shape (standardised)

All routes return one of:

```ts
{ success: true,  data: T }                          // 200
{ success: false, error: string }                    // 401, 500, 503
{ success: false, error: string, details: string[] } // 400 validation failure
```

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Notes round-trip

_For any_ valid `QuestionNotes` object written via `PUT /api/user/notes`, reading back via `GET /api/user/notes` for the same user SHALL return an equivalent `QuestionNotes` object where every field of every `QuestionNote` entry has equal values.

**Validates: Requirements 1.4, 1.5, 1.7, 10.1, 13.1, 13.4**

---

### Property 2: Question notes state preservation on failure

_For any_ pre-existing `QuestionNotes` value in `useLocalStorage`, when an authenticated write via `saveQuestionNotes` ultimately fails (all retries exhausted), the `useLocalStorage` value SHALL remain equal to its value before the write attempt.

**Validates: Requirements 2.6, 12.3**

---

### Property 3: Notes sync layer routing

_For any_ `QuestionNotes` input and any authentication state, `saveQuestionNotes` SHALL route writes exclusively to the API+Redux path when authenticated and exclusively to localStorage when unauthenticated, with no cross-contamination between the two paths.

**Validates: Requirements 2.3, 11.1, 11.2**

---

### Property 4: UIFlag persistence round-trip

_For any_ flag key string and boolean value written via the authenticated UIFlag path (through `debouncedSavePreferences` with updated `uiFlags`), reading back `preferences.uiFlags[flagKey]` via `GET /api/user/data` SHALL return the same boolean value that was written.

**Validates: Requirements 9.2, 13.5**

---

### Property 5: UIFlag read priority

_For any_ flag key, when the user is authenticated and `preferences.uiFlags[key]` has a defined value in Redux state, the UI components SHALL use the Redux value and SHALL NOT read the same key from localStorage.

**Validates: Requirement 9.6**

---

### Property 6: Unauthenticated writes never call the API

_For any_ user data write (notes, session, preferences, UIFlags, vocabulary, bookmarks, collections) when `isAuthenticated` returns `false`, the sync layer SHALL make zero outbound API calls and SHALL write exclusively to localStorage.

**Validates: Requirements 11.1, 11.2**

---

### Property 7: Session cache coherence after write

_For any_ in-progress session write via `saveCurrentSession` that succeeds for an authenticated user, a subsequent read of the sessions list for that user via `GET /api/user/data` SHALL NOT return a stale version of that session (i.e., `sessionsCache` is invalidated as part of the write).

**Validates: Requirements 5.3, 10.2**

---

### Property 8: Preferences page reads from correct source

_For any_ `UserPreferences` value present in Redux state when the user is authenticated, the `preferences/page.tsx` initial form state SHALL equal the Redux value and SHALL NOT be overridden by any `localStorage.getItem("userPreferences")` call.

**Validates: Requirement 8.1**

---

### Property 9: Migration handles notes and answerHistory without error for any valid payload

_For any_ migration payload containing valid `questionNotes` and/or `answerHistory` fields, the `migrateUserData` transaction SHALL insert them into the database using `ON CONFLICT DO NOTHING` semantics. _For any_ migration payload where these fields are `null`, `undefined`, or absent, the transaction SHALL complete successfully without errors.

**Validates: Requirements 11.4, 11.5**

---

### Property 10: Authenticated session delete dispatches thunk, not localStorage write

_For any_ session ID that exists in Redux state, when an authenticated user deletes that session in `sessions.tsx`, the component SHALL dispatch the Redux delete action and SHALL NOT write to `localStorage.setItem("practiceHistory", ...)`.

**Validates: Requirement 7.1**

---

## Testing Strategy

### Dual Testing Approach

Unit tests verify specific examples and edge cases; property tests verify universal behavior across many generated inputs.

### Property-Based Testing Setup

This project uses TypeScript/Jest. The recommended library is **fast-check** (`npm install --save-dev fast-check`).

Each property test runs a minimum of **100 iterations**. Tests are tagged with the design property they validate.

**Tag format:** `// Feature: localstorage-to-db-sync, Property N: <property_text>`

#### Property Test Implementations

**Property 1 — Notes round-trip**

```ts
// Feature: localstorage-to-db-sync, Property 1: Notes round-trip
it("notes round-trip: PUT then GET returns equivalent data", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.dictionary(fc.string(), fc.array(arbitraryQuestionNote())),
      async (notes) => {
        // Mock db upsert to return what was written; mock cache
        const result = await putThenGetNotes(notes, mockUserId);
        expect(result).toEqual(notes);
      },
    ),
    { numRuns: 100 },
  );
});
```

**Property 2 — Notes state preservation on failure**

```ts
// Feature: localstorage-to-db-sync, Property 2: Question notes state preservation on failure
it("failed write leaves localStorage notes unchanged", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.dictionary(fc.string(), fc.array(arbitraryQuestionNote())),
      fc.dictionary(fc.string(), fc.array(arbitraryQuestionNote())),
      async (existingNotes, newNotes) => {
        mockApiToAlwaysFail();
        localStorage.setItem("questionNotes", JSON.stringify(existingNotes));
        await saveQuestionNotes(newNotes, mockDispatch, authenticatedState);
        const afterAttempt = JSON.parse(localStorage.getItem("questionNotes")!);
        expect(afterAttempt).toEqual(existingNotes);
      },
    ),
    { numRuns: 100 },
  );
});
```

**Property 3 — Sync layer routing**

```ts
// Feature: localstorage-to-db-sync, Property 3: Notes sync layer routing
it("authenticated writes go to API, unauthenticated writes go to localStorage", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.dictionary(fc.string(), fc.array(arbitraryQuestionNote())),
      fc.boolean(),
      async (notes, isAuth) => {
        const apiCallCount = await countApiCallsDuring(() =>
          saveQuestionNotes(
            notes,
            mockDispatch,
            isAuth ? authState : unauthState,
          ),
        );
        if (isAuth) {
          expect(apiCallCount).toBeGreaterThan(0);
        } else {
          expect(apiCallCount).toBe(0);
          expect(JSON.parse(localStorage.getItem("questionNotes")!)).toEqual(
            notes,
          );
        }
      },
    ),
    { numRuns: 100 },
  );
});
```

**Property 4 — UIFlag persistence round-trip**

```ts
// Feature: localstorage-to-db-sync, Property 4: UIFlag persistence round-trip
it("UIFlag round-trip: write then read returns same boolean", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1 }),
      fc.boolean(),
      async (flagKey, flagValue) => {
        await writeUiFlagAndPersist(
          flagKey,
          flagValue,
          mockDispatch,
          authState,
        );
        const readBack = await getPrefsFromApi(mockUserId);
        expect(readBack.uiFlags?.[flagKey]).toBe(flagValue);
      },
    ),
    { numRuns: 100 },
  );
});
```

**Properties 5–10** follow the same fast-check pattern with appropriate arbitraries and mocked dependencies.

### Unit Tests (Example-Based)

- API routes: test 401, 400 (malformed payload), 503 (mocked DB failure), and 200 happy path.
- Redux actions: test `setUiFlag` reducer updates `preferences.uiFlags` correctly; test `clearUserData` resets the full slice including `uiFlags`.
- `invalidateUserCache`: verify all 9 keys are deleted (including the two new ones).
- `preferences/page.tsx`: snapshot test for authenticated vs. unauthenticated initial state rendering.
- Migration: test `migrateUserData` with a payload that includes `questionNotes` and `answerHistory`; test with `null` values for both.

### Integration Tests

- **End-to-end round-trip**: sign in → write notes via UI → sign out → sign back in → verify notes appear (uses real DB in test env).
- **Session crash recovery**: write in-progress session → simulate reload → verify session is restored from DB for authenticated user.
- **`invalidateUserCache` completeness**: call all write API endpoints → then call `invalidateUserCache` → verify `notesCache` and `answerHistoryCache` are empty for that user.

---
