# Requirements Document

## Introduction

This feature migrates all user-data localStorage writes to database-backed API calls for authenticated users. Currently, the application uses localStorage as the primary persistence layer for several data categories (question notes, practice sessions in-progress, user preferences, and a handful of legacy components that still read directly from localStorage). The goal is to ensure that when a user is authenticated, every write of user data is persisted to the database via the existing API layer, Redux state is updated to reflect the persisted data, and the server-side LRU cache in `src/lib/cache.ts` is invalidated / updated so it never serves stale data.

The scope covers five areas that are partially or fully unsynced today:

1. **Question notes** (`questionNotes` localStorage key) — written via `useLocalStorage` in `question-problem-card.tsx` and `practice-rush-multistep.tsx` with no API counterpart.
2. **In-progress practice sessions** (`currentPracticeSession`) — written directly to localStorage for crash-recovery without routing through `dataSync`.
3. **Legacy direct localStorage reads** in `saved.tsx`, `sessions.tsx`, and `preferences/page.tsx` — these components read raw localStorage instead of Redux state and need to be migrated to the existing Redux / hook layer.
4. **UI/preference flags** — dismissal state for banners, info cards, onboarding checklists, and the "hideSuccessFeedback" toggle that need to be stored per-user in the database for authenticated users.
5. **Cache invalidation correctness** — any write that touches a cached category must invalidate or update the corresponding entry in `cache.ts` so subsequent reads are consistent.

---

## Glossary

- **Sync_Layer**: The `src/lib/utils/dataSync.ts` module that routes writes to either the API (authenticated) or localStorage (unauthenticated).
- **Redux_Store**: The application-wide Redux store whose user-data slice lives in `src/lib/redux/slices/userDataSlice.ts`.
- **Cache**: The server-side LRU caches exported from `src/lib/cache.ts` (`userProfileCache`, `statisticsCache`, `sessionsCache`, `bookmarksCache`, `collectionsCache`, `vocabularyCache`, `preferencesCache`).
- **API_Route**: Any Next.js route handler under `src/app/api/user/`.
- **QuestionNote**: A personal text annotation on a specific question, typed in `src/types/questionNotes.ts`.
- **QuestionNotes**: A map of assessment name → `QuestionNote[]`, stored under the `questionNotes` localStorage key.
- **CurrentPracticeSession**: A single in-progress practice session written to the `currentPracticeSession` localStorage key for crash-recovery purposes.
- **UIFlag**: A boolean preference stored in localStorage that controls the visibility of UI elements (banners, info cards, onboarding checkpoints, feedback toggles).
- **Authenticated_User**: A user whose Redux `auth.isAuthenticated` selector returns `true`.
- **Unauthenticated_User**: A user whose Redux `auth.isAuthenticated` selector returns `false`.
- **Cache_Key**: A string returned by `getCacheKey(type, userId, ...rest)` from `src/lib/cache.ts`.

---

## Requirements

### Requirement 1: Question Notes API Endpoint

**User Story:** As an authenticated user, I want my personal question notes to be saved to the database so that my annotations are available on any device.

#### Acceptance Criteria

1. THE API_Route SHALL expose a `PUT /api/user/notes` endpoint that accepts a `QuestionNotes` payload and upserts the notes for the authenticated user.
2. WHEN a `PUT /api/user/notes` request is received, THE API_Route SHALL verify the session via `auth.api.getSession` before processing the payload.
3. IF the session is absent or invalid, THEN THE API_Route SHALL return HTTP 401 with `{ success: false, error: "Unauthorized" }`.
4. WHEN the upsert succeeds, THE API_Route SHALL invalidate the `notes` Cache entry for that user by calling `notesCache.delete(getCacheKey("notes", userId))`.
5. WHEN the upsert succeeds, THE API_Route SHALL return HTTP 200 with `{ success: true, data: <persisted QuestionNotes> }` where the response body includes all fields from `QuestionNote` (`questionId`, `note`, `timestamp`, `createdAt`, `difficulty`, `primaryClassCd`, `skillCd`, `subject`, `createdDate`, `updatedDate`).
6. IF a database error occurs, THEN THE API_Route SHALL return HTTP 503 with `{ success: false, error: "Service temporarily unavailable" }`.
7. THE API_Route SHALL expose a `GET /api/user/notes` endpoint that returns the authenticated user's `QuestionNotes`, reading from the Cache before the database.
8. WHEN a `GET /api/user/notes` request is received and the session is absent or invalid, THE API_Route SHALL return HTTP 401 with `{ success: false, error: "Unauthorized" }`.
9. WHEN a `GET /api/user/notes` request is received and the authenticated user has no stored notes, THE API_Route SHALL return HTTP 200 with `{ success: true, data: {} }`.
10. THE `notesCache` SHALL be a named LRU cache instance exported from `src/lib/cache.ts`, following the same pattern as `bookmarksCache` and `preferencesCache`.

---

### Requirement 2: Question Notes Redux Integration

**User Story:** As a developer, I want question note writes to flow through Redux and the Sync_Layer so the in-memory state and the database are always consistent.

#### Acceptance Criteria

1. THE Redux_Store SHALL include a `updateNotesThunk` async thunk that calls `PUT /api/user/notes` and returns the persisted `QuestionNotes` on success.
2. WHEN `updateNotesThunk` is fulfilled, THE Redux_Store SHALL replace the `notes` slice state with the returned `QuestionNotes`.
3. IF the user is Authenticated, THE Sync_Layer SHALL dispatch `updateNotesThunk` via `withRetry` (up to 3 retries). IF the user is Unauthenticated, THE Sync_Layer SHALL write the `QuestionNotes` to localStorage under the `questionNotes` key.
4. IF `updateNotesThunk` rejects after 3 retries for an Authenticated_User, THE Sync_Layer SHALL call `showNetworkError` with the message "Failed to save your notes. Please check your connection."
5. THE Sync_Layer SHALL expose a `debouncedUpdateQuestionNotes` function that debounces calls to `updateQuestionNotes` by 500 ms to coalesce rapid per-keystroke updates.
6. WHEN `updateNotesThunk` is rejected, THE Redux_Store SHALL leave the `notes` slice state unchanged so the in-memory notes are not lost.

---

### Requirement 3: Migrate Question Notes Write Sites

**User Story:** As an authenticated user, I want note saves in the question bank and practice session views to persist to the database, not just my local device.

#### Acceptance Criteria

1. WHEN `handleSaveNote` is called in `question-problem-card.tsx` and the user is Authenticated (checked via `useAppSelector(selectIsAuthenticated)`), THE question-problem-card.tsx SHALL update the local `useLocalStorage` state immediately and then call `debouncedUpdateQuestionNotes` with the full updated `QuestionNotes` map from the Sync_Layer in the background.
2. WHEN `handleSaveNote` is called in `question-problem-card.tsx` and the user is Unauthenticated, THE question-problem-card.tsx SHALL continue to write via `setQuestionNotes` (useLocalStorage) only.
3. WHEN the `handleSaveNote` callback is called in `practice-rush-multistep.tsx` and the user is Authenticated, THE practice-rush-multistep.tsx SHALL update local `useLocalStorage` state immediately and then call `debouncedUpdateQuestionNotes` with the full updated `QuestionNotes` map from the Sync_Layer in the background.
4. WHEN a note is saved in `practice-rush-multistep.tsx` and the user is Unauthenticated, THE practice-rush-multistep.tsx SHALL continue to write via `useLocalStorage` only.
5. THE `useLocalStorage<QuestionNotes>` hook call in both components SHALL remain as the optimistic local mirror for both Authenticated_Users and Unauthenticated_Users.

---

### Requirement 4: Question Notes Hook

**User Story:** As a developer, I want a consistent hook for reading question notes that resolves to Redux state for authenticated users and localStorage for unauthenticated users.

#### Acceptance Criteria

1. THE `use-resolved-user-data.ts` module SHALL export a `useResolvedQuestionNotes` hook that returns `[QuestionNotes | null, (notes: QuestionNotes) => void]`.
2. WHEN the user is Authenticated, THE `useResolvedQuestionNotes` hook SHALL return notes from the Redux_Store `notes` slice, falling back to the `questionNotes` localStorage key if `selectUserNotes(state)` returns `null`.
3. WHEN the user is Unauthenticated, THE `useResolvedQuestionNotes` hook SHALL return notes from the `questionNotes` localStorage key via `useLocalStorage`.
4. WHEN `setQuestionNotes` is called and the user is Authenticated, THE `useResolvedQuestionNotes` hook SHALL dispatch `setNotesAction(newNotes)` (a synchronous Redux action) to update the Redux_Store immediately, update local `useLocalStorage` state immediately, and call `debouncedUpdateQuestionNotes` in the background.
5. WHEN `setQuestionNotes` is called and the user is Unauthenticated, THE `useResolvedQuestionNotes` hook SHALL write to localStorage only.

---

### Requirement 5: In-Progress Session Sync

**User Story:** As an authenticated user, I want my current in-progress practice session to be recoverable from the database, not just from a single device's localStorage.

#### Acceptance Criteria

1. WHEN `currentPracticeSession` is written in `src/types/session.ts` (the `saveSession` helper) and the user is Authenticated, THE Sync_Layer SHALL write to localStorage first, then call `createSession` (when no matching `sessionId` exists in the Redux store) or `updateSession` (when a matching `sessionId` exists in the Redux store) from the existing `userDataSlice.ts` thunks.
2. WHILE an Authenticated_User's practice session is in progress, THE Sync_Layer SHALL debounce session writes by 1000 ms to avoid excessive API calls during rapid state changes.
3. WHEN a session write API call succeeds, THE sessionsCache SHALL have its entry invalidated by calling `sessionsCache.delete(getCacheKey("sessions", userId))`.
4. WHEN `currentPracticeSession` is removed because the session is abandoned (user navigates away without completing), THE Sync_Layer SHALL dispatch only `removeSession` for Authenticated_Users (no prior `updateSession` call) so the Redux_Store stays consistent.
5. WHEN `currentPracticeSession` is removed because the session is completed (final answer submitted), THE Sync_Layer SHALL first call `updateSession` with the final session state, then dispatch `removeSession` to clear the in-progress entry.
6. IF the session write API call fails after 3 retries via `withRetry` and no success signal is present, THEN THE Sync_Layer SHALL retain the localStorage copy and call `showNetworkError` with a message indicating that the practice session could not be saved so the user is informed.

---

### Requirement 6: Legacy Component Migration — `saved.tsx`

**User Story:** As an authenticated user, I want the saved-questions dashboard component to read from Redux state rather than polling localStorage directly.

#### Acceptance Criteria

1. WHEN the user is Authenticated, THE `saved.tsx` component SHALL read `savedQuestions` and `savedCollections` exclusively from Redux state via the existing `useResolvedBookmarks` and `useResolvedCollections` hooks, where the `isAuthenticated` guard SHALL be evaluated using `useAppSelector(selectIsAuthenticated)`.
2. WHEN the user is Authenticated, THE `saved.tsx` component SHALL immediately stop the `setInterval` polling loop that reads directly from `window.localStorage`, with no overlap period where both mechanisms run simultaneously. The `useEffect` cleanup SHALL clear the interval ID before returning to prevent memory leaks.
3. WHILE the user is Unauthenticated, THE `saved.tsx` component SHALL retain the existing polling and `StorageEvent` listener behavior without mixing Redux data access.
4. THE `saved.tsx` component SHALL not call `window.localStorage.getItem` for `savedCollections` or `savedQuestions` when the user is Authenticated.

---

### Requirement 7: Legacy Component Migration — `sessions.tsx`

**User Story:** As an authenticated user, I want the sessions dashboard component to persist session deletions to the database rather than writing directly to localStorage.

#### Acceptance Criteria

1. WHEN a practice session is deleted in `sessions.tsx` and the user is Authenticated, THE sessions.tsx SHALL dispatch `deleteSessionThunk` rather than writing to `localStorage.setItem("practiceHistory", ...)`, where local UI deletion uses optimistic state removal via the `removeSessionFromState` synchronous action. IF the Redux thunk fails, THEN THE sessions.tsx SHALL allow the deletion to proceed in the local UI without persistence.
2. WHEN a session deletion succeeds for an Authenticated_User, THE sessionsCache SHALL have its entry invalidated by calling `sessionsCache.delete(getCacheKey("sessions", userId))`.
3. WHILE the user is Unauthenticated, THE sessions.tsx SHALL retain the existing `localStorage.setItem("practiceHistory", ...)` write behavior, filtering out the deleted session from the `practiceHistory` array before writing. IF the Redux thunk fails for an Authenticated_User, THEN THE sessions.tsx SHALL fall back to the same localStorage write.

---

### Requirement 8: Legacy Component Migration — `preferences/page.tsx`

**User Story:** As an authenticated user, I want changes to my preferences page to be saved to the database and loaded from Redux state.

#### Acceptance Criteria

1. WHEN `preferences/page.tsx` mounts and the user is Authenticated, THE preferences/page.tsx SHALL initialize its form state from `useAppSelector(selectUserPreferences)` instead of calling `localStorage.getItem("userPreferences")`.
2. WHEN the user is Unauthenticated, THE preferences/page.tsx SHALL continue reading from `localStorage.getItem("userPreferences")`.
3. WHEN preferences are saved in `preferences/page.tsx` and the user is Authenticated, THE preferences/page.tsx SHALL call the existing `savePreferences` function from `dataSync.ts` with the full `UserPreferences` object (not a partial patch).

---

### Requirement 9: UI Flag Persistence

**User Story:** As an authenticated user, I want UI dismissal and onboarding state to persist across devices so I do not see the same banners and tours repeatedly after logging in elsewhere.

#### Acceptance Criteria

1. THE Redux_Store SHALL extend the `preferences` data structure to include a `uiFlags` map of type `Record<string, boolean>` for storing per-key UI state, defaulting to `{}` when absent to avoid undefined access.
2. WHEN a UIFlag is set (e.g., banner dismissed, onboarding completed) for an Authenticated_User, THE Sync_Layer SHALL call `debouncedSavePreferences` with the updated `uiFlags` so the flag is persisted to the database.
3. WHILE the user is Unauthenticated, THE UIFlag write SHALL remain a direct `localStorage.setItem("uiFlag_<flagKey>", "true")` call as today.
4. THE `hideSuccessFeedback` toggle written in `practice-rush-multistep.tsx` SHALL be treated as a UIFlag and follow the same authenticated write path.
5. THE `questionbank-onboarding` completion flag written in `question-results.tsx` SHALL be treated as a UIFlag and follow the same authenticated write path.
6. WHEN an Authenticated_User loads the application, THE UI components SHALL read UIFlags from `preferences.uiFlags` in Redux state before falling back to localStorage, so the UI respects previously saved dismissal state even when `preferences.uiFlags[flagKey]` is undefined in Redux state.

---

### Requirement 10: Cache Invalidation Correctness

**User Story:** As a developer, I want every authenticated write to user data to invalidate or update the corresponding Cache entry so the server never serves stale data.

#### Acceptance Criteria

1. WHEN notes are persisted via `PUT /api/user/notes`, a subsequent `GET /api/user/notes` for the same user SHALL NOT return the previously cached stale data.
2. WHEN a practice session is created or updated via the sessions API, a subsequent read of the sessions list for the same user SHALL NOT return the previously cached stale data.
3. WHEN user preferences are updated via the preferences API, a subsequent read of preferences for the same user SHALL NOT return the previously cached stale data.
4. WHEN `invalidateUserCache` is called for a user, a subsequent read of the notes data for that user SHALL NOT return the previously cached stale data.
5. FOR ALL write operations that target a specific Cache (notes, sessions, preferences, bookmarks, collections, vocabulary, profile, statistics), THE corresponding Cache.delete call SHALL occur within the same API route handler as the database write, before the HTTP response is returned.

---

### Requirement 11: Authenticated vs. Unauthenticated Parity

**User Story:** As an unauthenticated user, I want the application to continue working exactly as before so that the migration does not break the guest experience.

#### Acceptance Criteria

1. WHEN the user is Unauthenticated, THE Sync_Layer SHALL write all user data exclusively to localStorage using the existing localStorage keys (`questionNotes`, `practiceHistory`, `savedQuestions`, `savedCollections`, `userPreferences`, `vocabsData`, `userProfile`, `practiceStatistics`).
2. WHEN the user is Unauthenticated, THE Sync_Layer SHALL not make any API calls for user data persistence.
3. WHEN an Unauthenticated_User becomes Authenticated (sign-in), THE existing `migrateLocalStorageData` thunk in `userDataSlice.ts` SHALL run as it does today to move localStorage data to the database.
4. THE `migrateLocalStorageData` thunk SHALL be extended to include `questionNotes` from localStorage in the migration payload only when a `questionNotes` entry exists in localStorage.
5. THE `migrateUserData` function in `migrationOperations.ts` SHALL be extended to handle the `notes` field in the migration payload, where the function SHALL insert or update the user's notes in the database using upsert semantics and a missing or malformed `notes` entry in the payload is silently skipped.

---

### Requirement 12: Error Handling and Resilience

**User Story:** As an authenticated user, I want failed API writes to be retried automatically and to receive a visible notification if persistence ultimately fails, so I am never silently losing data.

#### Acceptance Criteria

1. WHEN an authenticated write via the Sync_Layer fails, THE Sync_Layer SHALL retry the write up to 3 times using the existing `withRetry` utility before reporting failure.
2. WHEN all retries are exhausted, THE Sync_Layer SHALL call `showNetworkError` with a message that identifies which data category failed to save.
3. IF an authenticated notes write ultimately fails, THEN THE `useLocalStorage` value for `questionNotes` SHALL remain unchanged in the browser so the user's edits are not lost.
4. THE API_Route for notes SHALL validate the incoming payload shape and return HTTP 400 with a structured `details` array if validation fails and the database is reachable.
5. IF a database connection error is detected in any API_Route, THEN THE API_Route SHALL return HTTP 503 with `{ success: false, error: "Service temporarily unavailable" }` regardless of whether a validation error also occurred.

---

### Requirement 13: Data Consistency — Round-Trip Integrity

**User Story:** As a developer, I want to verify that data written to the database can be read back in the same shape so that no data is silently corrupted during the sync migration.

#### Acceptance Criteria

1. FOR ALL valid `QuestionNotes` objects written via `PUT /api/user/notes`, reading back via `GET /api/user/notes` SHALL return an equivalent `QuestionNotes` object (round-trip property), where equivalence is defined as all fields in each `QuestionNote` having equal values (not reference equality).
2. FOR ALL valid `UserPreferences` objects written via the preferences API, reading back via `GET /api/user/data` SHALL return an equivalent `UserPreferences` object.
3. FOR ALL valid `PracticeSession` objects written via the sessions API, reading back via `GET /api/user/data` SHALL return a session with a matching `sessionId` and `status`, and the session's `startTime`, `endTime`, `score`, and `answers` fields are also preserved.
4. THE `QuestionNotes` serialization SHALL preserve all fields of each `QuestionNote` including `questionId`, `note`, `timestamp`, `createdAt`, `difficulty`, `primaryClassCd`, `skillCd`, `subject`, `createdDate`, and `updatedDate`.
5. FOR ALL valid `UIFlag` writes via the preferences API, reading back `preferences.uiFlags[flagKey]` via `GET /api/user/data` SHALL return the same boolean value that was written.
