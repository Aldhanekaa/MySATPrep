# Investigation: saved_questions — Field Analysis & Impact

## Structure overview

```
TABLE saved_questions
  id            UUID       PK
  user_id       UUID       FK
  assessment    VARCHAR
  question_id   VARCHAR    UNIQUE (user_id, question_id)
  external_id   VARCHAR    nullable
  ibn           VARCHAR    nullable
  plain_question JSONB     nullable   ← the point of this investigation
  timestamp     TIMESTAMPTZ
```

localStorage key `"savedQuestions"` stores `{ [assessment]: SavedQuestion[] }`.
Each `SavedQuestion` has: `questionId`, `externalId`, `ibn`, `plainQuestion?`, `timestamp`.

---

## This case is fundamentally different from the other three tables

For `practice_statistics`, `practice_sessions`, and `saved_collections`, `plainQuestion` was either never read back from the DB at all, or was already being explicitly stripped every time data was mapped from DB → UI. The conclusion for those was: **drop it at the DB write layer, no consumer is affected**.

For `saved_questions`, **plainQuestion is actively read from the record in three separate consumer paths**. Removing it without any substitute would break the UI.

---

## Field verdict

| Field           | DB column        | Verdict                                                                       |
| --------------- | ---------------- | ----------------------------------------------------------------------------- |
| `questionId`    | `question_id`    | ✅ Essential — PK, dedup key, membership checks                               |
| `assessment`    | `assessment`     | ✅ Essential — bucket key for `bookmarksToSavedQuestions()` mapping           |
| `externalId`    | `external_id`    | ✅ Essential — used as API fetch ID (`question.externalId \|\| question.ibn`) |
| `ibn`           | `ibn`            | ✅ Essential — fallback API fetch ID                                          |
| `timestamp`     | `timestamp`      | ✅ Essential — sort order, display in card                                    |
| `plainQuestion` | `plain_question` | ⚠️ Used, but only 3 of its 14 fields are ever consumed — see below            |

---

## Who reads plainQuestion from a SavedQuestion record

### Consumer 1 — `saved.tsx` and `previousSaved.tsx`: question card rendering

Both components have the same progressive fetch loop:

```ts
const id = question.externalId || question.ibn;
const questionData = await fetchQuestionData(id); // fetches stem, answers from API

if (!question.plainQuestion) {
  dispatch({
    type: "SET_QUESTION_ERROR",
    errorMessage: "Question metadata not available",
  });
  continue;
}

dispatch({
  type: "SET_QUESTION_SUCCESS",
  questionData: {
    problem: questionData, // ← from API
    question: question.plainQuestion, // ← from saved record
  },
});
```

The `QuestionById_Data` type requires both `problem` (API-fetched) and `question` (PlainQuestionType). `OptimizedQuestionCard` uses `question` to display difficulty badge, domain label, skill label.

**Fields of plainQuestion actually accessed by OptimizedQuestionCard / the card rendering chain:**

- `primary_class_cd` — domain label display
- `skill_cd` — skill label display
- `difficulty` — difficulty badge
- `questionId` — already a top-level field
- `external_id` / `ibn` — already top-level fields

**Fields of plainQuestion that are NEVER accessed in the rendering chain:**

- `updateDate`, `createDate`, `pPcc`, `uId`, `skill_desc`, `primary_class_cd_desc`, `program`, `score_band_range_cd`

### Consumer 2 — `saved.tsx`: subject and difficulty filter dropdowns

```ts
function filterQuestions(questions, subject, difficulty) {
  const primaryClassCd = question.plainQuestion?.primary_class_cd;
  // subject filter: checks if primaryClassCd is in mathDomains or rwDomains

  const questionDifficulty = question.plainQuestion?.difficulty;
  // difficulty filter: checks if difficulty === "E" | "M" | "H"
}
```

Only `primary_class_cd` and `difficulty` are accessed. If `plainQuestion` is absent, the question is hidden when any non-"all" filter is active (optional chaining returns undefined → filter excludes it).

### Consumer 3 — `review/page.tsx`: bookmark-based review session

```ts
// loadQuestionsFromStorage() when reviewType === "bookmarked":
questions = savedQuestionsForAssessment.map((question) => ({
  questionId: question.questionId,
  timestamp: question.timestamp,
  isLoading: true,
  plainQuestion: question.plainQuestion, // ← passed through
}));

// Then subject filtering:
questions = questions.filter(
  (e) =>
    getSubjectByPrimaryClassCd(e.plainQuestion?.primary_class_cd || "") ==
    subject,
);

// Then skills[] and domains[] extraction:
const skillCd = q.plainQuestion?.skill_cd;
const primaryClassCd = q.plainQuestion?.primary_class_cd;
// builds PracticeSelections.domains[] and PracticeSelections.skills[]
```

Fields accessed: `primary_class_cd`, `skill_cd`.

**If plainQuestion is absent:** subject filtering produces `""` → `getSubjectByPrimaryClassCd("")` returns undefined → all questions filtered out → empty review session.

---

## The 14-field problem and the 3-field solution

`PlainQuestionType` has 14 fields. Across all three consumer paths, only **3** are actually read back from the stored record:

| Field              | Read by                                                      |
| ------------------ | ------------------------------------------------------------ |
| `primary_class_cd` | saved.tsx filter, review/page.tsx subject filter + domains[] |
| `skill_cd`         | review/page.tsx skills[]                                     |
| `difficulty`       | saved.tsx filter + card badge display                        |

The other 11 fields (`updateDate`, `createDate`, `pPcc`, `uId`, `skill_desc`, `primary_class_cd_desc`, `program`, `score_band_range_cd`, `questionId` (redundant), `external_id` / `ibn` (top-level already)) are stored but never read back from a saved question record.

---

## Proposed change: slim `plain_question` JSONB

Instead of removing `plain_question` entirely (which would break 3 consumers), replace the full 14-field object with a 3-field slim object. The column name stays `plain_question` — no DDL migration required.

**DB write (new):**

```ts
// In bookmarkOperations.ts, syncOperations.ts, migrationOperations.ts
const slimMeta = questionData.plainQuestion
  ? {
      primary_class_cd: questionData.plainQuestion.primary_class_cd,
      skill_cd: questionData.plainQuestion.skill_cd,
      difficulty: questionData.plainQuestion.difficulty,
    }
  : null;

JSON.stringify(slimMeta); // stored in plain_question column
```

**DB read (updated mapping in bookmarksToSavedQuestions):**

```ts
// In use-resolved-user-data.ts
function bookmarksToSavedQuestions(
  bookmarks: ReduxSavedQuestion[],
): SavedQuestions {
  return bookmarks.reduce<SavedQuestions>((acc, bookmark) => {
    const key = bookmark.assessment;
    if (!acc[key]) acc[key] = [];

    // Reconstruct a partial PlainQuestionType from the slim meta stored in DB.
    // All three consumers only read primary_class_cd, skill_cd, difficulty.
    // The unused fields (pPcc, uId, etc.) are set to safe defaults.
    const plainQuestion: PlainQuestionType | undefined = bookmark.plainQuestion
      ? {
          questionId: bookmark.questionId,
          primary_class_cd: bookmark.plainQuestion.primary_class_cd,
          primary_class_cd_desc: "", // never read by any consumer
          skill_cd: bookmark.plainQuestion.skill_cd,
          skill_desc: "", // never read by any consumer
          difficulty: bookmark.plainQuestion.difficulty,
          external_id: bookmark.externalId ?? null,
          ibn: bookmark.ibn ?? null,
          program: "", // never read by any consumer
          pPcc: "", // never read by any consumer
          uId: "", // never read by any consumer
          score_band_range_cd: 0, // never read by any consumer
          createDate: 0, // never read by any consumer
          updateDate: 0, // never read by any consumer
        }
      : undefined;

    acc[key].push({ ...bookmark, plainQuestion } as SavedQuestion);
    return acc;
  }, {});
}
```

---

## Impact map

### Components and pages

| File                                         | Change needed | Detail                                                                                           |
| -------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `src/components/dashboard/saved.tsx`         | ❌ No         | Reads `plainQuestion.primary_class_cd`, `.difficulty` — both present in slim meta reconstruction |
| `src/components/dashboard/previousSaved.tsx` | ❌ No         | Same read pattern, same reconstruction covers it                                                 |
| `src/app/review/page.tsx`                    | ❌ No         | Reads `plainQuestion.primary_class_cd`, `.skill_cd` — both in reconstruction                     |
| `src/components/ui/save-button.tsx`          | ❌ No         | Writes plainQuestion at bookmark creation (localStorage → API). Strip happens at DB layer        |
| `src/components/question-problem-card.tsx`   | ❌ No         | Only reads `collection.questionIds`, not bookmark plainQuestion                                  |

### DB / API write layer

| File                                                      | Change needed | Detail                                                                               |
| --------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ |
| `src/lib/db/bookmarkOperations.ts` — `addSavedQuestion()` | ✅ Yes        | Replace `JSON.stringify(questionData.plainQuestion)` with `JSON.stringify(slimMeta)` |
| `src/lib/db/syncOperations.ts` — bookmarks upsert         | ✅ Yes        | Same slim write before `JSON.stringify(bookmark.plainQuestion)`                      |
| `src/lib/db/migrationOperations.ts` — bookmarks insert    | ✅ Yes        | Same                                                                                 |
| `src/app/api/user/bookmarks/route.ts` — `POST` handler    | ❌ No         | Passes through to `addSavedQuestion()`. Strip happens there.                         |

### DB / API read layer

| File                                                                  | Change needed | Detail                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/db/bookmarkOperations.ts` — `rowToSavedQuestion()`           | ❌ No         | Returns `row.plainQuestion` as-is (now it's the slim object). The slim object is a valid subset of PlainQuestionType from TypeScript's perspective since all fields are optional except in strict usage |
| `src/hooks/use-resolved-user-data.ts` — `bookmarksToSavedQuestions()` | ✅ Yes        | **Must be updated** to reconstruct a full PlainQuestionType-compatible object from the slim stored fields, so consumers don't need to change                                                            |

### Type system

| File                                                            | Change needed | Detail                                                                                                                                                    |
| --------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/savedQuestions.ts` — `SavedQuestion`                 | ❌ No         | `plainQuestion?: PlainQuestionType` stays as-is. localStorage still stores full object.                                                                   |
| `src/lib/types/userData.ts` — `SavedQuestion`                   | ❌ No         | `plainQuestion?: PlainQuestionType \| null` stays as-is. The slim object stored in DB is still structurally compatible (all consumed fields are present). |
| `src/lib/validation/migrationSchema.ts` — `SavedQuestionSchema` | ❌ No         | `plainQuestion: z.unknown().optional().nullable()` — already accepts any shape.                                                                           |

### MigrationChecker and sync/migration thunks

| File                                       | Change needed | Detail                                                                                                                           |
| ------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/auth/MigrationChecker.tsx` | ❌ No         | Bookmarks diff only checks `questionId` membership. Never reads `plainQuestion`.                                                 |
| `syncLocalStorageData` thunk               | ❌ No         | Merges bookmarks by `questionId` (first-seen wins). Payload carries full localStorage bookmark. Strip happens at DB write layer. |
| `migrateLocalStorageData` thunk            | ❌ No         | Same — sends full localStorage payload. Strip at DB layer.                                                                       |

### Tests

| File                                                   | Change needed                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `src/lib/utils/__tests__/dataSync.test.ts`             | ✅ Yes — update fixtures to reflect slim plain_question shape in DB-bound assertions |
| `src/lib/redux/slices/__tests__/userDataSlice.test.ts` | ✅ Yes — same                                                                        |

---

## Summary table

| File                                                                  | Change needed                                        | Risk                                              |
| --------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `src/lib/db/bookmarkOperations.ts`                                    | Slim `plain_question` write                          | Low                                               |
| `src/lib/db/syncOperations.ts`                                        | Same slim write                                      | Low                                               |
| `src/lib/db/migrationOperations.ts`                                   | Same slim write                                      | Low                                               |
| `src/hooks/use-resolved-user-data.ts` — `bookmarksToSavedQuestions()` | Reconstruct partial PlainQuestionType from slim meta | **Medium** — all bookmark display depends on this |
| Test fixtures                                                         | Update to slim shape                                 | Low                                               |
| All other files                                                       | **No change**                                        | —                                                 |

---

## The one real risk: bookmarksToSavedQuestions reconstruction

The partial PlainQuestionType reconstruction in `bookmarksToSavedQuestions()` is the highest-risk change. It must cover every field that any consumer reads, and the unused fields must be set to safe defaults that don't cause runtime errors.

A safe way to validate this is to check which fields of `plainQuestion` are accessed anywhere a `SavedQuestion` is the source (not a `QuestionState` or session object):

| Field                   | Accessed on SavedQuestion.plainQuestion?                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------- | -------------------- |
| `primary_class_cd`      | ✅ Yes — set in reconstruction                                                              |
| `skill_cd`              | ✅ Yes — set in reconstruction                                                              |
| `difficulty`            | ✅ Yes — set in reconstruction                                                              |
| `external_id`           | Accessible via `bookmark.externalId` directly — also set in reconstruction for completeness |
| `ibn`                   | Same — accessible directly, also set                                                        |
| `questionId`            | Accessible via `bookmark.questionId` directly                                               |
| `primary_class_cd_desc` | ❌ Never accessed on SavedQuestion — safe to default `""`                                   |
| `skill_desc`            | ❌ Never accessed                                                                           | safe to default `""` |
| `program`               | ❌ Never accessed                                                                           | safe to default `""` |
| `pPcc`                  | ❌ Never accessed                                                                           | safe to default `""` |
| `uId`                   | ❌ Never accessed                                                                           | safe to default `""` |
| `score_band_range_cd`   | ❌ Never accessed                                                                           | safe to default `0`  |
| `createDate`            | ❌ Never accessed                                                                           | safe to default `0`  |
| `updateDate`            | ❌ Never accessed                                                                           | safe to default `0`  |

All unconsumed fields default to `""` or `0` — no nulls, no runtime errors.

---

## Storage savings

| Scenario                         | plain_question size | Per bookmark |
| -------------------------------- | ------------------- | ------------ |
| Current (full PlainQuestionType) | ~400 B              | baseline     |
| Proposed (3-field slim object)   | ~65 B               | saves ~335 B |

For a user with 200 bookmarks: **~67 KB saved from plain_question alone**, plus reduced wire transfer on every `POST /api/user/bookmarks` and every migration/sync payload.

---

## Implementation order

1. Write slim helper in `src/lib/db/bookmarkTransforms.ts`:
   ```ts
   export function slimPlainQuestion(pq: PlainQuestionType | null | undefined) {
     if (!pq) return null;
     return {
       primary_class_cd: pq.primary_class_cd,
       skill_cd: pq.skill_cd,
       difficulty: pq.difficulty,
     };
   }
   ```
2. Apply in `bookmarkOperations.ts` `addSavedQuestion()`
3. Apply in `syncOperations.ts` and `migrationOperations.ts`
4. Update `bookmarksToSavedQuestions()` in `use-resolved-user-data.ts`
5. Write backfill migration `008_slim_bookmark_plain_question.sql`:
   ```sql
   UPDATE saved_questions
   SET plain_question = jsonb_build_object(
     'primary_class_cd', plain_question->>'primary_class_cd',
     'skill_cd',         plain_question->>'skill_cd',
     'difficulty',       plain_question->>'difficulty'
   )
   WHERE plain_question IS NOT NULL
     AND plain_question != 'null'::jsonb;
   ```
6. Update test fixtures
