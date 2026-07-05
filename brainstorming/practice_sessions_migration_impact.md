# Impact Analysis: Simplifying practice_sessions JSONB (session_data)

## The change in one sentence

Strip `plainQuestion` from every `answeredQuestionDetails` entry,
`questionCorrectChoices`, `correctAnswers`, and `accuracyPercentage`
from the `session_data` JSONB blob before it is written to Postgres —
while leaving both localStorage structures (`currentPracticeSession` and
`practiceHistory`) completely unchanged.

---

## Critical distinction: two separate data flows

The celebration screen (`PracticeRushCelebration`) reads
`sessionData.answeredQuestionDetails` **from React state**, not from
storage. The `completedSession` object is built in memory inside
`practice-rush-multistep.tsx` and passed directly as a prop to
`PracticeRushCelebration`. It is **never read back from the DB or from
localStorage** for the celebration render.

This means stripping these fields from the DB does not affect the
celebration screen at all, as long as localStorage still carries the full
object (for crash recovery / "continue" flow).

---

## Field verdict summary

| Field                                           | DB needed? | Reason                                                                                                            |
| ----------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `sessionId`                                     | ✅ Yes     | Identity, dedup key, review routing                                                                               |
| `timestamp`                                     | ✅ Yes     | Session sorting, sessions tab display                                                                             |
| `status`                                        | ✅ Yes     | Session tab display, review routing (also a separate column)                                                      |
| `practiceSelections`                            | ✅ Yes     | Needed to reconstruct review session in `review/page.tsx`, displayed in sessions tab                              |
| `currentQuestionStep`                           | ✅ Yes     | Resume flow — "continue where you left off"                                                                       |
| `questionAnswers`                               | ✅ Yes     | Resume flow — restores user's per-question answers                                                                |
| `questionTimes`                                 | ✅ Yes     | Resume flow + sessions tab time display                                                                           |
| `totalQuestions`                                | ✅ Yes     | Sessions tab                                                                                                      |
| `answeredQuestions`                             | ✅ Yes     | Sessions tab count, MigrationChecker dedup                                                                        |
| `averageTimePerQuestion`                        | ✅ Yes     | Celebration screen + sessions tab                                                                                 |
| `totalTimeSpent`                                | ✅ Yes     | Celebration screen + sessions tab                                                                                 |
| `totalXPReceived`                               | ✅ Yes     | Sessions tab "XP Gained" column                                                                                   |
| `currentSession`                                | ✅ Yes     | Mirrors DB column, used by `rowToPracticeSession()`                                                               |
| `answeredQuestionDetails` (the array, stripped) | ✅ Yes     | Lightweight — `questionId`, `externalId`, `ibn` kept                                                              |
| `answeredQuestionDetails[].plainQuestion`       | ❌ No      | Only read by celebration screen from in-memory React state                                                        |
| `questionCorrectChoices`                        | ❌ No      | Only used during session for correctness check; re-derivable from question bank                                   |
| `correctAnswers` (numeric)                      | ❌ No      | Computed at completion for celebration screen; sessions tab derives correctness from `practiceStatistics` instead |
| `accuracyPercentage`                            | ❌ No      | Same as above                                                                                                     |

---

## Component and function impact

### 1. `src/lib/utils/dataSync.ts`

**Functions:** `saveCurrentSession()`, `savePracticeSession()`,
`updatePracticeSession()`, `removeCurrentSession()`

These are the primary write paths. They call Redux thunks or write to
localStorage. The localStorage writes are unchanged. The authenticated path
dispatches thunks which hit the API.

`saveCurrentSession()` writes to localStorage first (always), then calls
`createSession` or `updateSessionThunk`. The strip must happen before the
API call in the DB layer, not here.

**Direct code change required:** No.

---

### 2. `src/lib/redux/slices/userDataSlice.ts`

**Thunks:** `createSession`, `updateSessionThunk`, `migrateLocalStorageData`,
`syncLocalStorageData`

- `createSession` / `updateSessionThunk` post the full `PracticeSession`
  object (as received from `dataSync.ts`) to the API. The API route receives
  it and calls `createPracticeSession()` / `updatePracticeSession()` in
  `userOperations.ts`. Strip happens in `userOperations.ts`.

- `migrateLocalStorageData` reads sessions from `localStorage["practiceHistory"]`
  and sends them in the payload to `/api/user/migrate-data`. Strip happens in
  `migrationOperations.ts`.

- `syncLocalStorageData` merges DB sessions + localStorage sessions by
  `sessionId` (first-seen wins — no deep merge). The merged array is sent to
  `/api/user/sync-data`. Strip happens in `syncOperations.ts`.

**Direct code change required:** No.

---

### 3. `src/lib/db/userOperations.ts`

**Functions:** `createPracticeSession()`, `updatePracticeSession()`

`createPracticeSession()` does:

```ts
JSON.stringify(sessionData); // → session_data column
```

`updatePracticeSession()` does:

```ts
const merged = { ...existing.rows[0].sessionData, ...data };
// ...
JSON.stringify(merged);
```

**What needs to change:**
Before `JSON.stringify`, strip the fields. Add a helper:

```ts
function stripSessionForDb(
  session: PracticeSession | Partial<PracticeSession>,
): DB_PracticeSession {
  const { answeredQuestionDetails, questionCorrectChoices, ...rest } =
    session as any;
  return {
    ...rest,
    answeredQuestionDetails: (answeredQuestionDetails ?? []).map(
      ({ questionId, externalId, ibn }: any) => ({
        questionId,
        externalId,
        ibn,
      }),
    ),
    // correctAnswers and accuracyPercentage omitted (not on PracticeSession type anyway)
  };
}
```

Note: `updatePracticeSession()` merges existing DB data with the incoming
partial. After the change, the existing DB data won't have `plainQuestion`.
The incoming `data` (from localStorage) may still have it. The strip is
applied to the merged result before writing.

**Direct code change required: YES**

---

### 4. `src/lib/db/syncOperations.ts`

**Function:** `syncUserData()` — the sessions block

```ts
JSON.stringify(session); // → session_data column
```

Same fix needed — call `stripSessionForDb(session)` before serialising.

**Direct code change required: YES**

---

### 5. `src/lib/db/migrationOperations.ts`

**Function:** migration upsert for sessions

Same pattern.

**Direct code change required: YES**

---

### 6. `src/components/celebrating-section/practice-rush-celebration.tsx`

Reads `sessionData.answeredQuestionDetails` and accesses
`aq.plainQuestion.primary_class_cd` / `aq.plainQuestion.skill_cd` to
build the per-skill bar chart.

`sessionData` here is the in-memory `completedSession` object built in
`practice-rush-multistep.tsx` and passed as a React prop. It is **never
fetched from the DB or read from localStorage** for this purpose.

**Direct code change required:** No.

---

### 7. `src/components/practice.tsx` — session continue / review flows

`practice.tsx` reads session data in two paths:

**Continue flow (`session=continue` param):**

- Authenticated: reads `reduxSessions.find(s => s.currentSession === true)`.
  After the change, this session won't have `plainQuestion` in
  `answeredQuestionDetails`. The continue flow only needs `currentQuestionStep`,
  `questionAnswers`, `questionTimes`, and `practiceSelections` to resume — all
  of which are kept. `questionCorrectChoices` is stripped but is reconstructed
  by `practice-rush-multistep.tsx` when it re-fetches questions.
- Unauthenticated: reads `localStorage["currentPracticeSession"]` — unchanged.

**Review mode (`session=<sessionId>` param):**

- Authenticated: searches `reduxSessions`. Uses `session.practiceSelections`,
  `session.status`, `session.totalQuestions`, `session.answeredQuestions`,
  `session.timestamp` — all kept.
- Unauthenticated: `getSessionHistory()` from localStorage — unchanged.

**Direct code change required:** No.

---

### 8. `src/components/practice-rush-multistep.tsx`

**Session restoration** (`restoredSessionData` prop):

```ts
// ~line 1224
currentQuestionStep: action.payload.currentQuestionStep,
questionAnswers: action.payload.questionAnswers,
questionTimes: action.payload.questionTimes,
answeredQuestionDetails: action.payload.answeredQuestionDetails,
```

Restores the session state from the restored session object. After the
change, `answeredQuestionDetails` from the DB won't carry `plainQuestion`.
The celebration chart (which uses `plainQuestion`) is only shown on session
completion, at which point the user has just answered questions in the
current session — so `answeredQuestionDetails` in React state has been
rebuilt fresh from the current run, not from the restored data.

`questionCorrectChoices` is never restored from session data — it's always
rebuilt by re-fetching questions from the API when the session loads.

**Direct code change required:** No.

---

### 9. `src/components/dashboard/sessions.tsx`

**Function:** `getQuestionResults(session)`

Reads from `session.answeredQuestions` (string IDs) and cross-references
with `practiceStatistics.answeredQuestionsDetailed` for `isCorrect`,
`timeSpent`, `selectedAnswer`. Does **not** read `answeredQuestionDetails`,
`questionCorrectChoices`, or `plainQuestion` from the session object.

Also reads for display: `session.practiceSelections`, `session.totalQuestions`,
`session.answeredQuestions.length`, `session.totalTimeSpent`,
`session.totalXPReceived`, `session.status`, `session.timestamp` — all kept.

**Direct code change required:** No.

---

### 10. `src/components/auth/MigrationChecker.tsx`

Statistics diff uses `answeredQuestions` arrays. Sessions diff uses
`sessionId` for dedup. Neither reads `answeredQuestionDetails` or
`questionCorrectChoices` from session objects.

`isDatabaseEmpty()` checks `sessions.length > 0` — unaffected.

**Direct code change required:** No.

---

### 11. `src/lib/validation/migrationSchema.ts`

`PracticeSessionSchema` has `answeredQuestionDetails: z.array(z.unknown())`.
The schema accepts any shape for these entries, so stripping `plainQuestion`
passes validation without any schema change.
`questionCorrectChoices` is optional. No change needed.

**Direct code change required:** No.

---

### 12. `src/components/continue-practice-rush-button.tsx` and

`src/components/session-info-display.tsx`

Both check session existence and `status === "in_progress"`. Neither reads
`answeredQuestionDetails` or `questionCorrectChoices`.

**Direct code change required:** No.

---

### 13. Tests

`dataSync.test.ts` and `userDataSlice.test.ts` fixture sessions may include
`questionCorrectChoices` or `plainQuestion` on `answeredQuestionDetails`.
Update fixtures for DB-bound paths to reflect the stripped shape.

**Direct code change required:** YES — update test fixtures.

---

## Summary table

| File                                                               | Change needed                                                                                                                                            | Risk |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `src/lib/db/userOperations.ts`                                     | Add `stripSessionForDb()` before `JSON.stringify(sessionData)` in `createPracticeSession` and before `JSON.stringify(merged)` in `updatePracticeSession` | Low  |
| `src/lib/db/syncOperations.ts`                                     | Same strip before each session `JSON.stringify`                                                                                                          | Low  |
| `src/lib/db/migrationOperations.ts`                                | Same strip                                                                                                                                               | Low  |
| `src/components/celebrating-section/practice-rush-celebration.tsx` | **No change** — reads from in-memory React state prop, never from DB                                                                                     | —    |
| `src/components/practice-rush-multistep.tsx`                       | **No change** — `questionCorrectChoices` rebuilt from API; celebration data from current-run state                                                       | —    |
| `src/components/practice.tsx`                                      | **No change** — continue/review flows don't need stripped fields                                                                                         | —    |
| `src/components/dashboard/sessions.tsx`                            | **No change** — uses `practiceStatistics` for correctness, not session blob                                                                              | —    |
| `src/components/auth/MigrationChecker.tsx`                         | **No change**                                                                                                                                            | —    |
| `src/lib/redux/slices/userDataSlice.ts`                            | **No change** — strip happens downstream in DB layer                                                                                                     | —    |
| `src/lib/utils/dataSync.ts`                                        | **No change**                                                                                                                                            | —    |
| `src/lib/validation/migrationSchema.ts`                            | **No change** — schema is permissive (`z.unknown()`)                                                                                                     | —    |
| Test fixtures                                                      | Update to reflect stripped DB shape                                                                                                                      | Low  |

---

## Important: the resume flow and questionCorrectChoices

When an authenticated user resumes a session, the Redux session (from DB)
won't have `questionCorrectChoices`. This is fine because
`practice-rush-multistep.tsx` never reads `questionCorrectChoices` from the
restored session data to initialise its state. It re-fetches questions from
the API and gets the correct answers fresh. The session restore only reads:

- `currentQuestionStep` — what question to start on
- `questionAnswers` — which questions are already answered
- `questionTimes` — time already spent per question
- `answeredQuestionDetails` — the lightweight array (questionId/externalId/ibn)

All of these are kept in the DB shape. No resume regression.

---

## Implementation order

1. Write `stripSessionForDb()` utility in `src/lib/db/sessionTransforms.ts`
2. Apply in `userOperations.ts` (`createPracticeSession`, `updatePracticeSession`)
3. Apply in `syncOperations.ts`
4. Apply in `migrationOperations.ts`
5. Write migration `008_strip_session_data.sql` to backfill existing rows:
   ```sql
   UPDATE practice_sessions
   SET session_data = session_data
     #- '{answeredQuestionDetails,0,plainQuestion}'  -- needs jsonb path iteration
   -- In practice, use a DO block with jsonb_array_elements and reconstruction
   ```
   The backfill is optional (the old data is harmless) but reduces ongoing
   DB bloat for existing users.
6. Update test fixtures
