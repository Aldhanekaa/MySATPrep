# practice_statistics JSONB — Field-by-Field Analysis

> Derived from tracing every consumer of `answered_questions_detailed` and
> `statistics` across the full codebase: `practice-rush-multistep.tsx`,
> `practice-rush-celebration.tsx`, `dashboard/page.tsx`, `review/page.tsx`,
> `answered.tsx`, `sessions.tsx`, `tracker/tracker.tsx`, `summary/charts.tsx`,
> and `practiceStatistics.ts`.

---

## answered_questions_detailed (JSONB array)

Each element is an `AnsweredQuestion` object. Below is every field, what reads
it, and whether it is needed in the DB.

| Field            | Written by                                             | Read by                                                                                                                                                                                | Verdict                                                                                                                                                                                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `questionId`     | `addAnsweredQuestion()`                                | **everywhere** — dedup key in sync SQL, tracker status, answered tab list, review page filter, celebration chart                                                                       | ✅ **essential**                                                                                                                                                                                                                                                                                                                                     |
| `isCorrect`      | `addAnsweredQuestion()`                                | dashboard count, tracker correct/incorrect, answered tab filter, review page `?type=incorrect`, SummaryCharts, celebration chart                                                       | ✅ **essential**                                                                                                                                                                                                                                                                                                                                     |
| `difficulty`     | `addAnsweredQuestion()` via `plainQuestion.difficulty` | `answered.tsx` card badge, `OptimizedQuestionCard` display, `difficultyStats` breakdown in tracker                                                                                     | ✅ **keep** — 1 char, avoids join for breakdown charts                                                                                                                                                                                                                                                                                               |
| `timeSpent`      | `addAnsweredQuestion()`                                | `answered.tsx` card display, `sessions.tsx` result                                                                                                                                     | ✅ **keep** — needed for time-per-question display                                                                                                                                                                                                                                                                                                   |
| `timestamp`      | `new Date().toISOString()`                             | dedup `ORDER BY timestamp DESC` in sync SQL merge, `answered.tsx` sort, `OptimizedQuestionCard` date                                                                                   | ✅ **essential** — dedup merge key                                                                                                                                                                                                                                                                                                                   |
| `selectedAnswer` | `addAnsweredQuestion()` via `state.selectedAnswer`     | `answered.tsx` card, `sessions.tsx` result display                                                                                                                                     | ✅ **keep** — needed to show "you answered X"                                                                                                                                                                                                                                                                                                        |
| `external_id`    | indirectly via `plainQuestion.external_id`             | not read directly from this array by any UI — only `questionId` is used for lookups                                                                                                    | ⚠️ **borderline** — not read from this array today, but you want it here for potential external analytics joins. Keep it.                                                                                                                                                                                                                            |
| `ibn`            | indirectly via `plainQuestion.ibn`                     | same as `external_id` — not read directly from this array                                                                                                                              | ⚠️ **borderline** — same rationale. Keep it.                                                                                                                                                                                                                                                                                                         |
| `plainQuestion`  | `addAnsweredQuestion()` with full `PlainQuestionType`  | `review/page.tsx` reads `.primary_class_cd`, `.skill_cd` to build `domains[]` and `skills[]` for the review session. Also `OptimizedQuestionCard` passes it to fetch question content. | ❌ **redundant in DB** — `review/page.tsx` uses it to derive domain/skill, but those are already derivable from `questionId` via the question bank API. `OptimizedQuestionCard` fetches full question data by `questionId` anyway (it sets `isLoading: true` and fetches). The `plainQuestion` here is only used as a shortcut to skip the API call. |

### PlainQuestionType fields inside plainQuestion — what's actually used

When `plainQuestion` is accessed on an `AnsweredQuestion`, only these fields are touched:

| Field                                                                                                                                                      | Used by                                                                                   | Notes                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------- |
| `primary_class_cd`                                                                                                                                         | `review/page.tsx` — builds `domains[]` for `PracticeSelections`                           | derivable from question bank |
| `skill_cd`                                                                                                                                                 | `review/page.tsx` — builds `skills[]` for `PracticeSelections`                            | derivable from question bank |
| `difficulty`                                                                                                                                               | already a top-level field on `AnsweredQuestion` — no need to re-read from `plainQuestion` | duplicate                    |
| Everything else (`updateDate`, `createDate`, `pPcc`, `uId`, `skill_desc`, `primary_class_cd_desc`, `program`, `score_band_range_cd`, `ibn`, `external_id`) | **not read** from `AnsweredQuestion.plainQuestion` by any consumer                        | pure bloat in this position  |

---

## statistics (JSONB object: `[primaryClassCd][skillCd][questionId]`)

Each leaf is a `QuestionStatistic`. The nesting keys themselves (`primaryClassCd`,
`skillCd`, `questionId`) carry structural meaning and are always present.

| Field           | Written by                                               | Read by                                                                                                                              | Verdict                                                 |
| --------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `isCorrect`     | `addQuestionStatistic()`                                 | `SummaryCharts` — counts correct/incorrect per domain for the radar + bar charts. This is the **primary** reason this column exists. | ✅ **essential**                                        |
| `time`          | `addQuestionStatistic()`                                 | `practiceStatistics.ts` → `getSkillSummary()` → `averageTime`                                                                        | ✅ **keep** — used in skill-level performance summary   |
| `answer`        | `addQuestionStatistic()`                                 | `practiceStatistics.ts` → `getSkillSummary()`                                                                                        | ✅ **keep**                                             |
| `external_id`   | `addQuestionStatistic()` via `plainQuestion.external_id` | not read from this map by UI                                                                                                         | ⚠️ **borderline** — you want it for analytics. Keep it. |
| `ibn`           | `addQuestionStatistic()` via `plainQuestion.ibn`         | not read from this map by UI                                                                                                         | ⚠️ **borderline** — same rationale. Keep it.            |
| `plainQuestion` | `addQuestionStatistic()` with full `PlainQuestionType`   | **not read** from `statistics` leaves by any consumer. `SummaryCharts` only accesses `questions[question].isCorrect`.                | ❌ **pure bloat** — no consumer reads this here         |

---

## answered_questions (JSONB array of strings — legacy)

| Field                      | Used by                                                                                                                                               | Verdict                                                                                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plain `questionId` strings | `tracker.tsx` — `answeredQuestionIds.has(questionId)` for task status. `difficultyStats` in tracker. Sync SQL dedup uses `jsonb_array_elements_text`. | ✅ **keep for now** — used for O(1) membership checks. Could be derived from `answeredQuestionsDetailed[*].questionId` at read time but would require a SQL transform or client-side rebuild. |

---

## Summary: What to keep in the DB vs drop

### answered_questions_detailed — optimized shape

```
KEEP:   questionId, isCorrect, difficulty, timeSpent, timestamp, selectedAnswer
KEEP:   external_id, ibn  (top-level, not nested inside plainQuestion)
DROP:   plainQuestion  (entire object — ~300–500 bytes per entry)
```

### statistics leaves — optimized shape

```
KEEP:   isCorrect, time, answer
KEEP:   external_id, ibn  (top-level)
DROP:   plainQuestion  (entire object — not read by any consumer of this column)
```

### answered_questions — no change needed

```
KEEP as-is: string[] of questionIds
```

---

## The plainQuestion problem in review/page.tsx

This is the one real dependency on `plainQuestion` inside `answeredQuestionsDetailed`.

`review/page.tsx` reads `q.plainQuestion?.primary_class_cd` and
`q.plainQuestion?.skill_cd` to build the `domains[]` and `skills[]` arrays
for the `PracticeSelections` object passed to `PracticeRushMultistep`.

**Options:**

1. **Strip plainQuestion at DB-write time, keep it in localStorage.**  
   Review mode only runs on the client. localStorage still has the full
   `plainQuestion`. For authenticated users, the review page would need to
   derive `primary_class_cd` / `skill_cd` from the question bank API using
   `questionId` — which `PracticeRushMultistep` does anyway when loading each
   question. This is the cleanest approach but requires a small refactor of
   `review/page.tsx`.

2. **Promote only `primary_class_cd` and `skill_cd` to top-level fields.**  
   Instead of embedding the full 15-field `PlainQuestionType`, just add two
   fields that `review/page.tsx` actually needs. Still a DB change but saves
   ~480 bytes per entry compared to the current full object.

3. **Keep plainQuestion in localStorage, strip before DB write.**  
   No change to `review/page.tsx`. The DB just gets lean records. When an
   authenticated user loads the review page, the data comes from
   `useResolvedPracticeStatistics()` which falls back to localStorage for
   unauthenticated users anyway — but for authenticated users it reads from
   Redux/DB, which would be missing `plainQuestion`.  
   **This is a breaking path for authenticated users on review/page.tsx.**

**Recommended: Option 2** — promote `primary_class_cd` and `skill_cd` as
top-level fields on `AnsweredQuestion` in the DB shape. These two fields cost
~30 bytes combined vs ~480 bytes for the full `plainQuestion`, and they unblock
`review/page.tsx` without an API round-trip.

---

## Proposed DB-side AnsweredQuestion shape

```typescript
interface DB_AnsweredQuestion {
  questionId: string; // essential — dedup key, lookup key
  isCorrect: boolean; // essential — all correctness logic
  difficulty: "E" | "M" | "H"; // keep — breakdown charts, card badge
  timeSpent: number; // keep — time display, skill summary
  timestamp: string; // essential — sync dedup ordering
  selectedAnswer?: string; // keep — "you answered X" display
  external_id?: string; // keep — external analytics, question lookup
  ibn?: string; // keep — internal lookup, question lookup
  primary_class_cd: string; // PROMOTED from plainQuestion — needed by review/page
  skill_cd: string; // PROMOTED from plainQuestion — needed by review/page
  // plainQuestion REMOVED — saves ~300–500 bytes × every answered question
}
```

## Proposed DB-side QuestionStatistic shape (statistics leaf)

```typescript
interface DB_QuestionStatistic {
  isCorrect: boolean; // essential — SummaryCharts correctness counting
  time: number; // keep — skill-level average time
  answer: string; // keep — skill summary, stored answer
  external_id?: string; // keep — external analytics
  ibn?: string; // keep — internal lookup
  // plainQuestion REMOVED — no consumer reads it from this column
}
```

---

## Storage savings estimate

With the proposed change, for a user who has answered 500 questions:

| Column                            | Current size               | Optimized size            | Saved                        |
| --------------------------------- | -------------------------- | ------------------------- | ---------------------------- |
| `answered_questions_detailed`     | ~500 × 500 B = **~250 KB** | ~500 × 120 B = **~60 KB** | **~190 KB**                  |
| `statistics` leaves               | ~500 × 500 B = **~250 KB** | ~500 × 60 B = **~30 KB**  | **~220 KB**                  |
| **Total per user per assessment** | **~500 KB**                | **~90 KB**                | **~410 KB (~82% reduction)** |
