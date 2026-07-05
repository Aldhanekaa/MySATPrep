# Investigation: saved_collections — Field Analysis & Impact

## Structure overview

The `saved_collections` table has two JSONB columns:

| Column             | Type  | Default | Shape                                                                                               |
| ------------------ | ----- | ------- | --------------------------------------------------------------------------------------------------- |
| `question_ids`     | JSONB | `'[]'`  | `string[]` — flat list of questionId strings                                                        |
| `question_details` | JSONB | `'[]'`  | `QuestionDetail[]` — objects with `questionId`, `externalId`, `ibn`, and optionally `plainQuestion` |

The localStorage key `"savedCollections"` stores `{ [collectionId]: SavedCollection }` with the same two fields.

---

## Two type definitions for the same data

There is an important inconsistency in the codebase:

**`src/types/savedCollections.ts`** (UI type, used by components):

```ts
questionDetails: Array<{
  questionId: string;
  externalId?: string | null;
  ibn?: string | null;
}>;
// No plainQuestion field
```

**`src/lib/types/userData.ts`** (DB/Redux type):

```ts
interface QuestionDetail {
  questionId: string;
  externalId?: string | null;
  ibn?: string | null;
  plainQuestion?: PlainQuestionType; // ← extra field, optional
}
```

The UI type never had `plainQuestion`. The DB type has it as optional. This tells you the field was added to the DB type defensively but never actually flows through any write path.

---

## What fields are actually read from question_details

Tracing every consumer in the codebase:

| Consumer                                                      | Fields accessed from questionDetails                                                             |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `saved.tsx` reducer — `SET_SELECTED_COLLECTION`               | `detail.questionId` only — to filter which bookmarks belong to this collection                   |
| `saved.tsx` reducer — `SET_FILTER_SUBJECT/DIFFICULTY`         | `detail.questionId` only                                                                         |
| `saved.tsx` reducer — `LOAD_MORE`                             | `detail.questionId` only                                                                         |
| `saved.tsx` folder view count badge                           | `.length` only                                                                                   |
| `save-button.tsx` — remove from collection                    | `questionDetails.filter(d => d.questionId !== ...)` — questionId only                            |
| `save-button.tsx` — sync to Redux (`updateCollectionLocal`)   | `.map(d => ({questionId, externalId ?? null, ibn ?? null}))` — explicitly drops any extra fields |
| `save-button.tsx` — toggle in collection (add path)           | Writes `{questionId, externalId, ibn}` — never writes plainQuestion                              |
| `use-resolved-user-data.ts` `collectionsToSavedCollections()` | `.map(d => ({questionId, externalId ?? null, ibn ?? null}))` — explicitly drops plainQuestion    |
| `syncOperations.ts` SQL merge                                 | `DISTINCT ON (entry->>'questionId')` — only the questionId key is used for deduplication         |

**Summary: `plainQuestion` is never read from `questionDetails` by any consumer.** The two places that map DB → UI shape (`collectionsToSavedCollections` and the `updateCollectionLocal` Redux dispatch) both explicitly strip it with `{questionId, externalId ?? null, ibn ?? null}`.

---

## What fields are actually read from question_ids

`question_ids` is a flat `string[]` used for:

- `collection.questionIds.includes(questionId)` — O(1) membership check in `save-button.tsx` and `question-problem-card.tsx`
- `[...collection.questionIds, questionId]` — add to collection
- `col.questionIds.filter(id => id !== questionId)` — remove from collection
- `jsonb_agg(DISTINCT val)` UNION merge in SQL upsert (syncOperations.ts)

It is kept in sync with `questionDetails` at every write point. Both are needed.

---

## Is question_ids redundant given question_details?

Technically `question_ids` can be derived from `questionDetails.map(d => d.questionId)`. However:

- The SQL merge treats them independently with different strategies (string dedup vs object dedup)
- All `.includes()` membership checks rely on the flat array
- Eliminating it would require changing the SQL, all membership checks, and the migration schema

Not worth it. Keep both.

---

## Where plainQuestion could theoretically enter question_details

Checking all write paths:

| Path                                                              | Writes plainQuestion?                                          |
| ----------------------------------------------------------------- | -------------------------------------------------------------- |
| `save-button.tsx handleToggleQuestionInCollection()` — add        | ❌ No — writes `{questionId, externalId, ibn}` only            |
| `save-button.tsx handleToggleQuestionInCollection()` — remove     | Passes through existing entries (filter only)                  |
| `save-button.tsx handleSaveClick()` — remove from all collections | Passes through (filter only)                                   |
| `syncOperations.ts` — migration upsert                            | ❌ Passes through whatever is in the payload from localStorage |
| `migrationOperations.ts` — first-time migration                   | ❌ Same                                                        |
| `collectionOperations.ts createCollection()`                      | Passes through whatever the API body contains                  |
| `collectionOperations.ts updateCollection()`                      | Same                                                           |

**Conclusion: no current code path intentionally writes `plainQuestion` into `questionDetails`.** It could only appear if old localStorage data from before the type stabilised was migrated through one of the `syncOperations.ts` / `migrationOperations.ts` paths. Even then, `collectionsToSavedCollections()` strips it on every read.

---

## Impact of removing plainQuestion from question_details

### Components

| File                                       | Change needed | Reason                                                                                             |
| ------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------- |
| `src/components/dashboard/saved.tsx`       | ❌ No         | Never reads `plainQuestion` from `questionDetails`. Uses `questionId` only for filtering.          |
| `src/components/ui/save-button.tsx`        | ❌ No         | Already strips `plainQuestion` in every Redux dispatch path. Write paths don't set it.             |
| `src/components/question-problem-card.tsx` | ❌ No         | Only reads `collection.questionIds`, not `questionDetails`.                                        |
| `src/app/review/page.tsx`                  | ❌ No         | Reads `plainQuestion` from `answeredQuestionsDetailed` (practiceStatistics), not from collections. |

### DB / API layer

| File                                         | Change needed | Reason                                                                                                                                                            |
| -------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/db/collectionOperations.ts`         | ✅ Yes        | `QuestionDetail` type used in `DbSavedCollection` should remove `plainQuestion`. `JSON.stringify(collectionData.questionDetails)` should strip it before writing. |
| `src/lib/db/syncOperations.ts`               | ✅ Yes        | `JSON.stringify(collection.questionDetails ?? [])` should strip `plainQuestion` before writing.                                                                   |
| `src/lib/db/migrationOperations.ts`          | ✅ Yes        | Same — strip before `JSON.stringify`.                                                                                                                             |
| `src/app/api/user/collections/route.ts`      | ❌ No         | Passes `questionDetails` through to `createCollection()`. Strip happens in `collectionOperations.ts`.                                                             |
| `src/app/api/user/collections/[id]/route.ts` | ❌ No         | Same — strip happens downstream.                                                                                                                                  |

### Types

| File                                                             | Change needed | Reason                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/types/userData.ts` — `QuestionDetail`                   | ✅ Yes        | Remove `plainQuestion?: PlainQuestionType`. The field is never used and causes the type mismatch with the UI type.                                                                                                                                                                                  |
| `src/types/savedCollections.ts`                                  | ❌ No         | Already correct — never had `plainQuestion`.                                                                                                                                                                                                                                                        |
| `src/lib/validation/migrationSchema.ts` — `QuestionDetailSchema` | ✅ Yes        | Currently has `plainQuestion: z.unknown().optional()`. Remove this field. Incoming migration data with `plainQuestion` should just pass through Zod (unknown fields are ignored by default in object schemas with `.strip()` mode, which is the Zod default) and be stripped at the DB write layer. |

### Hooks

| File                                                                      | Change needed | Reason                                                                     |
| ------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------- |
| `src/hooks/use-resolved-user-data.ts` — `collectionsToSavedCollections()` | ❌ No         | Already strips correctly: `{questionId, externalId ?? null, ibn ?? null}`. |

### Redux slice

| File                                    | Change needed | Reason                                                                                                                                                                                                                                       |
| --------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/redux/slices/userDataSlice.ts` | ❌ No         | Collection merge in `syncLocalStorageData` deduplicates by `collectionId` and merges `questionIds` / `questionDetails`. The merged objects carry whatever is in the payload — stripping happens at the DB layer when the payload is written. |

### MigrationChecker

| File                                       | Change needed | Reason                                                                                            |
| ------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------- |
| `src/components/auth/MigrationChecker.tsx` | ❌ No         | Collections diff checks only `collectionId` membership — never reads `questionDetails` internals. |

### Tests

| File                                                   | Change needed | Reason                                                                     |
| ------------------------------------------------------ | ------------- | -------------------------------------------------------------------------- |
| `src/lib/utils/__tests__/dataSync.test.ts`             | ✅ Yes        | Update any fixture `questionDetails` entries that include `plainQuestion`. |
| `src/lib/redux/slices/__tests__/userDataSlice.test.ts` | ✅ Yes        | Same.                                                                      |

---

## Summary table

| File                                           | Change needed                                                             | Risk |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ---- |
| `src/lib/types/userData.ts` — `QuestionDetail` | Remove `plainQuestion` field                                              | Low  |
| `src/lib/db/collectionOperations.ts`           | Strip `plainQuestion` before `JSON.stringify(questionDetails)`            | Low  |
| `src/lib/db/syncOperations.ts`                 | Strip `plainQuestion` before `JSON.stringify(collection.questionDetails)` | Low  |
| `src/lib/db/migrationOperations.ts`            | Same strip                                                                | Low  |
| `src/lib/validation/migrationSchema.ts`        | Remove `plainQuestion` from `QuestionDetailSchema`                        | Low  |
| Test fixtures                                  | Update to remove `plainQuestion` from collection detail fixtures          | Low  |
| All other files                                | **No change needed**                                                      | —    |

---

## Contrast with practice_statistics and practice_sessions changes

Unlike those two tables, `saved_collections` has a much smaller blast radius:

- `plainQuestion` was **never reliably populated** in `questionDetails` — no current write path sets it
- Every read path that maps DB → UI already explicitly strips it
- The UI type never included it, making the DB type the only place it exists

This is the lowest-risk of the three schema changes. It's primarily a **type correctness fix** rather than a storage optimisation. The actual saved bytes depend on whether any user has legacy migration data with `plainQuestion` in their collection entries.

---

## Implementation

A single strip helper is enough for all three DB write files:

```ts
// src/lib/db/collectionTransforms.ts
export function stripQuestionDetail(detail: QuestionDetail): {
  questionId: string;
  externalId: string | null;
  ibn: string | null;
} {
  return {
    questionId: detail.questionId,
    externalId: detail.externalId ?? null,
    ibn: detail.ibn ?? null,
  };
}
```

Applied as:

```ts
JSON.stringify((collectionData.questionDetails ?? []).map(stripQuestionDetail));
```

in `collectionOperations.ts`, `syncOperations.ts`, and `migrationOperations.ts`.
