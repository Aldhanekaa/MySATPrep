# Impact Analysis: Simplifying practice_statistics JSONB Columns

## The change in one sentence

Strip `plainQuestion` from every record written to the DB
(`answered_questions_detailed` and `statistics`), and promote `external_id`
and `ibn` as explicit top-level fields — while leaving the localStorage
structure completely unchanged.

---

## Critical clarification first: two different "answered question" types

There are **two separate structures** that both carry `plainQuestion`, and
they are easy to confuse:

| Type                     | Lives in                                                             | Used by                         |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------- |
| `AnsweredQuestion`       | `practiceStatistics` localStorage / DB `answered_questions_detailed` | dashboard, tracker, review page |
| `AnsweredQuestionDetail` | `PracticeSession.answeredQuestionDetails`                            | celebration screen bar chart    |

`PracticeRushCelebration` reads `session.answeredQuestionDetails` (the session
type), **not** `practiceStatistics`. That data travels via React props from
`practice.tsx → PracticeRushCelebration` and is never stored in the
`practice_statistics` DB table. It does **not** need to change.

---

## What exactly changes in the DB

### answered_questions_detailed — current vs proposed

```
CURRENT leaf:
{
  questionId, isCorrect, difficulty, timeSpent, timestamp, selectedAnswer,
  external_id?,   ← sourced from plainQuestion.external_id
  ibn?,           ← sourced from plainQuestion.ibn
  plainQuestion?: PlainQuestionType   ← 15 fields, ~300–500 B each
}

PROPOSED leaf:
{
  questionId, isCorrect, difficulty, timeSpent, timestamp, selectedAnswer,
  external_id?,   ← promoted to top-level (already here, no structural change)
  ibn?,           ← promoted to top-level (already here, no structural change)
  primary_class_cd,  ← NEWLY PROMOTED from plainQuestion (needed by review/page)
  skill_cd           ← NEWLY PROMOTED from plainQuestion (needed by review/page)
  // plainQuestion removed
}
```

### statistics — current vs proposed

```
CURRENT leaf at statistics[primaryClassCd][skillCd][questionId]:
{
  time, answer, isCorrect,
  external_id?, ibn?,
  plainQuestion?: PlainQuestionType   ← 15 fields, ~300–500 B each
}

PROPOSED leaf:
{
  time, answer, isCorrect,
  external_id?, ibn?
  // plainQuestion removed
}
```

Note: `primaryClassCd` and `skill_cd` are already the nesting keys in
`statistics`, so they don't need to be promoted there.

---

## Impact map

### 1. `src/lib/practiceStatistics.ts`

**Function:** `addQuestionStatistic()` and `addAnsweredQuestion()`

These are the write functions. They both accept `plainQuestion` and embed it
into the record before writing to localStorage (unchanged) and triggering a
cloud sync.

**What needs to change:**
The cloud-sync path needs to strip `plainQuestion` from the payload before it
hits the DB. The cleanest place is a transform function called just before
`JSON.stringify(...)` in the DB write layer (see items 3 and 4 below) — not
here, so localStorage keeps receiving the full object.

**Direct code change required:** No — if the strip happens at the DB layer.

---

### 2. `src/types/statistics.ts`

**Interfaces:** `QuestionStatistic`, `AnsweredQuestion`, `StatisticEntry`

These types are shared between localStorage and DB. Since we're keeping
localStorage unchanged, **we do not change these types**. The DB-specific
shapes live only in the brainstorming docs and in any new DB-layer transform
functions.

**Direct code change required:** No — shared types stay as-is.

---

### 3. `src/lib/db/userOperations.ts`

**Function:** `updatePracticeStatistics()`

This is called when updating a single assessment's stats via the
`/api/user/statistics` route. It does:

```ts
JSON.stringify(answeredQuestionsDetailed);
JSON.stringify(statistics);
```

**What needs to change:**
Before `JSON.stringify`, strip `plainQuestion` from each entry and ensure
`external_id` / `ibn` / `primary_class_cd` / `skill_cd` are present as
top-level fields on `AnsweredQuestion`, and `external_id` / `ibn` are present
on each `QuestionStatistic` leaf.

Add a strip helper, e.g.:

```ts
function stripPlainQuestion(aqd: AnsweredQuestion[]): DB_AnsweredQuestion[];
function stripPlainQuestionFromStats(
  stats: ClassStatistics,
): DB_ClassStatistics;
```

Call them just before `JSON.stringify(answeredQuestionsDetailed)` and
`JSON.stringify(statistics)`.

**Direct code change required: YES**

---

### 4. `src/lib/db/syncOperations.ts`

**Function:** `syncUserData()` — the `statistics` block

Same issue as #3. The upsert for `answered_questions_detailed` and
`statistics` does:

```ts
JSON.stringify(stats.answeredQuestionsDetailed ?? []);
JSON.stringify(stats.statistics ?? {});
```

**What needs to change:** Apply the same strip helpers before serialising.

**Direct code change required: YES**

---

### 5. `src/lib/db/migrationOperations.ts`

**Function:** initial migration upsert for `practice_statistics`

Same pattern — strips need to happen before `JSON.stringify` on both columns.

**Direct code change required: YES**

---

### 6. `src/app/review/page.tsx`

**Functions:** `loadQuestionsFromStorage()`, `handleOnboardingComplete()`

This page reads `practiceStatistics` via `useResolvedPracticeStatistics()`.
For authenticated users, this resolves to **Redux state loaded from the DB**
— which, after the change, will no longer have `plainQuestion`.

The page reads:

```ts
q.plainQuestion?.primary_class_cd;
q.plainQuestion?.skill_cd;
```

in two places (`loadQuestionsFromStorage` and `handleOnboardingComplete`) to
build `domains[]` and `skills[]` for the review `PracticeSelections`.

**After the change:** `plainQuestion` is `undefined` for DB-sourced records.
The page will silently produce empty `domains[]` and `skills[]`, breaking
the review session entirely for authenticated users.

**Fix:** Replace `q.plainQuestion?.primary_class_cd` with `q.primary_class_cd`
and `q.plainQuestion?.skill_cd` with `q.skill_cd` (the newly promoted fields).
Also update the local `QuestionWithData` interface in this file to include
`primary_class_cd` and `skill_cd` directly.

**Direct code change required: YES — this is the highest-risk breaking change**

---

### 7. `src/lib/redux/slices/userDataSlice.ts`

**Merge logic (~line 949):**

```ts
const detailedMap = new Map();
for (const detail of [
  ...(dbData.answeredQuestionsDetailed ?? []),
  ...(lsData.answeredQuestionsDetailed ?? []),
]) { ... }
```

The merge deduplicates by `questionId` and takes the most recent. After the
change, DB records won't have `plainQuestion` but localStorage records will.
The merge currently takes whichever entry is newer — if DB wins, the merged
record loses `plainQuestion`.

**Impact on authenticated users:** After the merge, `answeredQuestionsDetailed`
in Redux may have entries without `plainQuestion`. `review/page.tsx` is the
only consumer that reads `plainQuestion` from this array — handled by fix in
#6. No other consumer of this array reads `plainQuestion`.

**Direct code change required:** No — once #6 is fixed, this is fine. The
merge just combines whatever fields are present.

---

### 8. `src/app/api/user/statistics/route.ts`

**Validation function:** `isAnsweredQuestionsDetailedArray()`

This validates incoming `answeredQuestionsDetailed` payloads. It's permissive
(`z.unknown()` in the migration schema, manual checks in the route). The
removal of `plainQuestion` doesn't break validation since `plainQuestion` is
already optional everywhere.

**Direct code change required:** No

---

### 9. `src/lib/validation/migrationSchema.ts`

```ts
// BookmarkSchema line 73:
plainQuestion: z.unknown().optional().nullable();

// AssessmentStatsSchema line 85:
// answeredQuestionsDetailed: z.array(z.unknown())  ← already unknown[]
```

The bookmark `plainQuestion` is irrelevant here (different table). The
`answeredQuestionsDetailed` is already typed as `z.array(z.unknown())` so
it accepts any shape. No breakage.

**Direct code change required:** No

---

### 10. `src/lib/types/userData.ts`

**Types:** `BookmarkRecord` (line 25) and `AnsweredQuestionDetail` (line 34)

`BookmarkRecord.plainQuestion` is for the `saved_questions` table — unrelated
to this change. The `AnsweredQuestionDetail` type is for
`PracticeSession.answeredQuestionDetails` (the session type, not practice
statistics) — also unrelated.

**Direct code change required:** No

---

### 11. Tests

**Files:** `dataSync.test.ts`, `userDataSlice.test.ts`

Both reference `plainQuestion: null` in fixture data. After the change,
fixtures for `answeredQuestionsDetailed` / `statistics` should omit
`plainQuestion` (or keep it as `undefined`) and include `primary_class_cd` +
`skill_cd` as top-level fields on `AnsweredQuestion` test data.

**Direct code change required:** YES — update test fixtures to match new DB shape

---

## Summary table

| File                                                               | Change needed                                                                                  | Risk                                                  |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `src/lib/db/userOperations.ts`                                     | Add strip transform before JSON.stringify                                                      | Low — internal DB write only                          |
| `src/lib/db/syncOperations.ts`                                     | Same strip transform                                                                           | Low                                                   |
| `src/lib/db/migrationOperations.ts`                                | Same strip transform                                                                           | Low                                                   |
| `src/app/review/page.tsx`                                          | Replace `q.plainQuestion?.primary_class_cd/skill_cd` with `q.primary_class_cd/skill_cd`        | **High — breaking for authenticated users if missed** |
| `src/lib/redux/slices/userDataSlice.ts`                            | No change needed                                                                               | —                                                     |
| `src/types/statistics.ts`                                          | No change (shared with localStorage)                                                           | —                                                     |
| `src/lib/practiceStatistics.ts`                                    | No change (strip at DB layer not here)                                                         | —                                                     |
| `src/app/api/user/statistics/route.ts`                             | No change                                                                                      | —                                                     |
| `src/lib/validation/migrationSchema.ts`                            | No change                                                                                      | —                                                     |
| `src/lib/types/userData.ts`                                        | No change                                                                                      | —                                                     |
| `src/components/celebrating-section/practice-rush-celebration.tsx` | **No change** — reads from `PracticeSession.answeredQuestionDetails`, not `practiceStatistics` | —                                                     |
| `src/lib/utils/__tests__/dataSync.test.ts`                         | Update fixtures                                                                                | Low                                                   |
| `src/lib/redux/slices/__tests__/userDataSlice.test.ts`             | Update fixtures                                                                                | Low                                                   |

---

## Recommended implementation order

1. Write the strip helper functions in a shared utility (e.g.
   `src/lib/db/statsTransforms.ts`)
2. Apply them in `userOperations.ts`, `syncOperations.ts`,
   `migrationOperations.ts`
3. Fix `review/page.tsx` — use promoted `primary_class_cd` / `skill_cd` fields
4. Update test fixtures
5. Write migration `008_...sql` with a one-time `UPDATE` to backfill
   `primary_class_cd` and `skill_cd` into existing rows and strip `plainQuestion`
   from existing JSONB data (a single UPDATE with `jsonb_set` / `#-` operators)
