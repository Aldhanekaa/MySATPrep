# Implementation Plan: localStorage-to-DB Sync

## Overview

Close the twelve remaining gaps in the user-data sync layer. The existing infrastructure (dataSync functions, hooks, Redux thunks, and API routes) is already in place; these tasks add the missing cache instances, harden two API routes, extend types and Redux, wire UI flag write sites, sync in-progress sessions, fix the preferences page, and extend the migration path. All code is TypeScript/Next.js.

## Tasks

- [ ] 1. Expand the cache layer (`src/lib/cache.ts`)
  - [ ] 1.1 Add `notesCache` and `answerHistoryCache` LRU instances
    - Add `questionNotes: { max: 1000, ttl: 10 * 60 * 1000 }` and `answerHistory: { max: 1000, ttl: 10 * 60 * 1000 }` to the cache config map
    - Instantiate and export `notesCache` and `answerHistoryCache` following the same `new LRUCache(...)` pattern as `bookmarksCache`
    - Update `invalidateUserCache` to also call `notesCache.delete(getCacheKey("notes", userId))` and `answerHistoryCache.delete(getCacheKey("answerHistory", userId))`
    - _Requirements: 1.10, 10.1, 10.4_

- [ ] 2. Harden `src/app/api/user/notes/route.ts`
  - [ ] 2.1 Add cache read on GET and cache invalidation on PUT
    - Wrap the DB fetch in `GET` with `getCachedOrFetch(notesCache, getCacheKey("notes", userId), () => getQuestionNotes(userId))`
    - Call `notesCache.delete(getCacheKey("notes", userId))` inside the `PUT` handler before returning the response
    - Standardise all response shapes to `{ success: true, data }` / `{ success: false, error }` / `{ success: false, error, details[] }`
    - Add Zod (or equivalent) payload validation; return HTTP 400 with `details` array on failure
    - Return HTTP 503 with `{ success: false, error: "Service temporarily unavailable" }` on DB errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 10.1, 10.5, 12.4, 12.5_
  - [ ]\* 2.2 Write property test for notes round-trip (Property 1)
    - **Property 1: Notes round-trip** — for any valid `QuestionNotes` written via PUT then read via GET, the response SHALL be equivalent
    - **Validates: Requirements 1.4, 1.5, 1.7, 10.1, 13.1, 13.4**
    - Place test in `src/app/api/user/__tests__/notes.property.test.ts`
    - Install `fast-check` dev dependency if not present; tag test with `// Feature: localstorage-to-db-sync, Property 1`

- [ ] 3. Harden `src/app/api/user/answer-history/route.ts`
  - [ ] 3.1 Add cache read on GET and cache invalidation on PUT
    - Wrap the DB fetch in `GET` with `getCachedOrFetch(answerHistoryCache, getCacheKey("answerHistory", userId), ...)`
    - Call `answerHistoryCache.delete(getCacheKey("answerHistory", userId))` inside `PUT` before returning
    - Apply the same standardised response shapes and payload validation as task 2.1
    - _Requirements: 10.1, 10.5, 12.4, 12.5_

- [ ] 4. Expand `src/app/api/user/data/route.ts` to include notes and answer history
  - [ ] 4.1 Add parallel fetches for `questionNotes` and `answerHistory`
    - Import `notesCache` and `answerHistoryCache` from `@/lib/cache`
    - Add two new `safe(...)` calls inside the existing `Promise.all` using `getCachedOrFetch` for `questionNotes` and `answerHistory`
    - Add `questionNotes: questionNotes ?? null` and `answerHistory: answerHistory ?? null` to the returned `data` object
    - _Requirements: 2.1, 2.2, 10.1_

- [ ] 5. Checkpoint — cache and API routes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Extend types and Redux for UIFlags
  - [ ] 6.1 Add `uiFlags` field to `UserPreferences` in `src/lib/types/userData.ts`
    - Add `uiFlags?: Record<string, boolean>` as an explicit typed field alongside the existing index signature
    - _Requirements: 9.1_
  - [ ] 6.2 Add `setUiFlag` reducer and `selectUiFlag` selector
    - Add `setUiFlag(state, action: PayloadAction<{ key: string; value: boolean }>)` synchronous reducer to `userDataSlice.ts` that lazily initialises `state.preferences.uiFlags`
    - Add `export const selectUiFlag = (key: string) => createSelector(selectUserPreferences, (prefs): boolean => prefs?.uiFlags?.[key] ?? false)` to `src/lib/redux/selectors.ts`
    - _Requirements: 9.1, 9.2, 9.6_
  - [ ]\* 6.3 Write property test for UIFlag read priority (Property 5)
    - **Property 5: UIFlag read priority** — when Redux has a defined value for a flag key, UI components SHALL use it and SHALL NOT read localStorage
    - **Validates: Requirement 9.6**
    - Place test in `src/lib/utils/__tests__/dataSync.sync.test.ts`
    - Tag with `// Feature: localstorage-to-db-sync, Property 5`

- [ ] 7. Update UIFlag write site — `SuccessFeedback` in `src/components/practice-rush-multistep.tsx`
  - [ ] 7.1 Read `hideSuccessFeedback` from Redux for authenticated users
    - Inside `SuccessFeedback`, call `useAppSelector(selectUiFlag("hideSuccessFeedback"))` for the Redux value
    - Fall back to `localStorage.getItem("hideSuccessFeedback") === "true"` only when Redux value is `false` and `!isAuthenticated`
    - On `handleContinue` when `dontShowAgain` is checked and user is authenticated: dispatch `setUiFlag({ key: "hideSuccessFeedback", value: true })` and call `debouncedSavePreferences` with updated `uiFlags`
    - Retain existing `localStorage.setItem` for unauthenticated users
    - _Requirements: 9.2, 9.4, 9.6_
  - [ ]\* 7.2 Write property test for UIFlag persistence round-trip (Property 4)
    - **Property 4: UIFlag persistence round-trip** — for any flag key and boolean value written via the authenticated path, reading back via `GET /api/user/data` SHALL return the same boolean
    - **Validates: Requirements 9.2, 13.5**
    - Place test in `src/lib/utils/__tests__/dataSync.sync.test.ts`
    - Tag with `// Feature: localstorage-to-db-sync, Property 4`

- [ ] 8. Update UIFlag write site — `src/components/questionbank/question-results.tsx`
  - [ ] 8.1 Read `questionbank-onboarding` from Redux and sync on completion
    - Import `selectUiFlag` and `setUiFlag` at the top of the file
    - In the `useEffect` that checks `localStorage.getItem("questionbank-onboarding")`, read from `selectUiFlag("questionbank-onboarding")(reduxState)` first when `isAuthenticated`; fall back to localStorage
    - In the `handleFinish` / `setIsOpen(false)` callback (after the existing `localStorage.setItem`), when authenticated: dispatch `setUiFlag({ key: "questionbank-onboarding", value: true })` and call `debouncedSavePreferences` with updated `uiFlags`
    - _Requirements: 9.2, 9.5, 9.6_

- [ ] 9. Add in-progress session sync to `src/lib/utils/dataSync.ts`
  - [ ] 9.1 Implement `saveCurrentSession`, `debouncedSaveCurrentSession`, and `removeCurrentSession`
    - `saveCurrentSession(data, dispatch, state)`: always `localStorage.setItem("currentPracticeSession", ...)` first; if authenticated check Redux sessions for matching `sessionId` and dispatch `updateSession` or `createSession` via `withRetry`; on exhaustion call `showNetworkError`
    - `debouncedSaveCurrentSession`: debounce `saveCurrentSession` by 1000 ms
    - `removeCurrentSession(sessionId, finalData, abandon, dispatch, state)`: if `abandon=true` dispatch `removeSession` only; if `abandon=false` dispatch `updateSession(finalData)` then `removeSession`; always `localStorage.removeItem("currentPracticeSession")`
    - Export all three from `dataSync.ts`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ] 9.2 Wire `saveCurrentSession` / `removeCurrentSession` to call sites in `src/components/practice-rush-multistep.tsx`
    - Replace every `localStorage.setItem("currentPracticeSession", ...)` with `debouncedSaveCurrentSession(sessionData, dispatch, getState())`
    - Replace the session-abandon `localStorage.removeItem` with `removeCurrentSession(sessionId, null, true, dispatch, getState())`
    - Replace the session-complete `localStorage.removeItem` with `removeCurrentSession(sessionId, finalData, false, dispatch, getState())`
    - _Requirements: 5.1, 5.2, 5.4, 5.5_
  - [ ]\* 9.3 Write property test for session cache coherence (Property 7)
    - **Property 7: Session cache coherence after write** — for any session write that succeeds for an authenticated user, a subsequent read of sessions SHALL NOT return a stale version (sessionsCache is invalidated)
    - **Validates: Requirements 5.3, 10.2**
    - Place test in `src/lib/utils/__tests__/dataSync.sync.test.ts`
    - Tag with `// Feature: localstorage-to-db-sync, Property 7`

- [ ] 10. Fix preferences page initialisation in `src/app/dashboard/preferences/page.tsx`
  - [ ] 10.1 Skip localStorage fallback in `resolveInitial` for authenticated users
    - In `resolveInitial`, guard the `localStorage.getItem("userPreferences")` block with `if (!isAuthenticated)` so authenticated users always initialise exclusively from Redux state
    - _Requirements: 8.1, 8.2_
  - [ ]\* 10.2 Write property test for preferences page source (Property 8)
    - **Property 8: Preferences page reads from correct source** — for any `UserPreferences` value present in Redux state when authenticated, the initial form state SHALL equal the Redux value and SHALL NOT be overridden by localStorage
    - **Validates: Requirement 8.1**
    - Place test in `src/lib/utils/__tests__/dataSync.sync.test.ts`
    - Tag with `// Feature: localstorage-to-db-sync, Property 8`

- [ ] 11. Checkpoint — Redux, UI flags, sessions, and preferences
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Add migration support for `questionNotes` and `answerHistory`
  - [ ] 12.1 Add `QuestionNotesSchema` and `AnswerHistorySchema` to `src/lib/validation/migrationSchema.ts`
    - Define `QuestionNoteSchema` with all optional note fields
    - Export `QuestionNotesSchema = z.record(z.string(), z.array(QuestionNoteSchema).or(z.unknown()))`
    - Export `AnswerHistorySchema = z.record(z.string(), z.array(z.object({ userChoice, time, status })))`
    - Add `questionNotes: QuestionNotesSchema.optional().nullable()` and `answerHistory: AnswerHistorySchema.optional().nullable()` to `MigrationPayloadSchema`
    - Update the `ValidatedMigrationPayload` type to include the new fields
    - _Requirements: 11.4_
  - [ ] 12.2 Add `notesMigrated` and `answerHistoryMigrated` to `MigrationSummary` in `src/lib/types/api.ts`
    - Add `notesMigrated: boolean` and `answerHistoryMigrated: boolean` to the `MigrationSummary` interface
    - _Requirements: 11.4, 11.5_
  - [ ] 12.3 Handle `questionNotes` and `answerHistory` in the migration transaction in `src/lib/db/migrationOperations.ts`
    - After the preferences upsert block, add an `INSERT INTO question_notes ... ON CONFLICT (user_id) DO NOTHING` block gated on `data.questionNotes` having entries; set `summary.notesMigrated = true`
    - Add a matching `INSERT INTO answer_history ... ON CONFLICT (user_id) DO NOTHING` block; set `summary.answerHistoryMigrated = true`
    - Ensure `null`/`undefined`/empty `questionNotes` or `answerHistory` are silently skipped without error
    - _Requirements: 11.4, 11.5_
  - [ ]\* 12.4 Write property test for migration robustness (Property 9)
    - **Property 9: Migration handles notes and answerHistory without error for any valid payload** — for any valid payload containing `questionNotes`/`answerHistory`, the transaction SHALL insert them; for null/absent fields the transaction SHALL complete without errors
    - **Validates: Requirements 11.4, 11.5**
    - Place test in `src/lib/utils/__tests__/dataSync.sync.test.ts`
    - Tag with `// Feature: localstorage-to-db-sync, Property 9`

- [ ] 13. Write remaining property-based tests
  - [ ]\* 13.1 Write property test for notes state preservation on failure (Property 2)
    - **Property 2: Question notes state preservation on failure** — when all retries are exhausted, `useLocalStorage` SHALL remain equal to its pre-write value
    - **Validates: Requirements 2.6, 12.3**
    - Place test in `src/lib/utils/__tests__/dataSync.sync.test.ts`
    - Tag with `// Feature: localstorage-to-db-sync, Property 2`
  - [ ]\* 13.2 Write property test for sync layer routing (Property 3)
    - **Property 3: Notes sync layer routing** — authenticated writes go to API+Redux, unauthenticated writes go to localStorage, with no cross-contamination
    - **Validates: Requirements 2.3, 11.1, 11.2**
    - Place test in `src/lib/utils/__tests__/dataSync.sync.test.ts`
    - Tag with `// Feature: localstorage-to-db-sync, Property 3`
  - [ ]\* 13.3 Write property test for unauthenticated writes never calling the API (Property 6)
    - **Property 6: Unauthenticated writes never call the API** — for any write when `isAuthenticated` is false, zero outbound API calls are made
    - **Validates: Requirements 11.1, 11.2**
    - Place test in `src/lib/utils/__tests__/dataSync.sync.test.ts`
    - Tag with `// Feature: localstorage-to-db-sync, Property 6`
  - [ ]\* 13.4 Write property test for authenticated session delete dispatching thunk (Property 10)
    - **Property 10: Authenticated session delete dispatches thunk, not localStorage write** — for any session ID in Redux, deleting it when authenticated SHALL dispatch the Redux delete action and SHALL NOT write to `localStorage.setItem("practiceHistory", ...)`
    - **Validates: Requirement 7.1**
    - Place test in `src/lib/utils/__tests__/dataSync.sync.test.ts`
    - Tag with `// Feature: localstorage-to-db-sync, Property 10`

- [ ] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Group A (tasks 1) must complete before Group B (tasks 2–4) since the route hardening imports the new cache instances
- Group C (task 6) must complete before Group D (tasks 7–8) since the UI flag sites depend on `setUiFlag` and `selectUiFlag`
- Tasks 9, 10, and 12 are independent of each other and can proceed in parallel after their own prerequisites
- All property tests (tasks 2.2, 6.3, 7.2, 9.3, 10.2, 12.4, 13.1–13.4) depend on the code they test being implemented first
- fast-check must be installed once before any property test task runs: `npm install --save-dev fast-check`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1", "6.1"] },
    { "id": 2, "tasks": ["2.2", "6.2", "9.1", "10.1", "12.1"] },
    { "id": 3, "tasks": ["6.3", "7.1", "8.1", "9.2", "10.2", "12.2", "12.3"] },
    { "id": 4, "tasks": ["7.2", "9.3", "12.4", "13.1", "13.2", "13.3", "13.4"] }
  ]
}
```
