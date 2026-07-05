# Impact on MigrationChecker, Sync, and Migration Operations

> Scope of the DB schema change being evaluated:
>
> - Remove `plainQuestion` from every entry in `answered_questions_detailed` and every leaf of `statistics`
> - Promote `external_id`, `ibn`, `primary_class_cd`, `skill_cd` as explicit top-level fields
> - localStorage structure is left completely unchanged

---

## Short answer

**MigrationChecker.tsx itself: no impact, no code change needed.**

The sync and migration _thunks_ also need no logic changes, but they are the
**delivery path** for the strip transformation — the payload they build from
localStorage will still contain `plainQuestion`, so the strip must happen at
the serialisation step inside `userOperations.ts` / `syncOperations.ts`, not
here.

---

## MigrationChecker.tsx — detailed walkthrough

### What it actually compares

The statistics diff check inside `localStorageDiffersFromDb()` compares only
**one field**: `answeredQuestions` (the flat string array):

```ts
// MigrationChecker.tsx ~line 290
const localAnswered: string[] =
  (data as { answeredQuestions?: string[] }).answeredQuestions ?? [];
const dbAnswered: string[] =
  dbStats[assessment]?.answeredQuestions ?? [];

if (localAnswered.length > dbAnswered.length) { ... }
```

It does **not** inspect `answeredQuestionsDetailed` contents, `statistics`
leaves, or `plainQuestion` at any point. The comparison is purely
"does local have more answered question IDs than the DB?"

This means:

- Removing `plainQuestion` from DB records has zero effect on the diff logic.
- The `answeredQuestions` string array (the legacy flat list) is untouched by
  the schema change, so the length comparison stays valid.
- No false positives, no false negatives — the check keeps working exactly as-is.

### What it does after the diff

When the check detects a difference, it dispatches either:

- `migrateLocalStorageData` → calls `/api/user/migrate-data`
- `syncLocalStorageData` → calls `/api/user/sync-data`

Both of those thunks read from localStorage (which still has `plainQuestion`
unchanged) and send the data upstream. The stripping of `plainQuestion` happens
at the DB write layer _after_ the API receives the payload — so
`MigrationChecker` is completely transparent to the change.

---

## migrateLocalStorageData thunk

```ts
// userDataSlice.ts ~line 577
const statistics = JSON.parse(localStorage.getItem("practiceStatistics"));
// ... builds payload ...
body: JSON.stringify(payload); // full localStorage shape, plainQuestion included
```

The thunk reads `practiceStatistics` directly from localStorage and sends it
raw to `/api/user/migrate-data`. The API route receives the full object
(including `plainQuestion`), validates it via `migrationSchema.ts`, then hands
it to `migrationOperations.ts` which calls `JSON.stringify(...)` before writing
to Postgres.

**The strip must happen in `migrationOperations.ts` before `JSON.stringify`.**
The thunk itself needs no change — it just ferries localStorage data to the
API unchanged, which is correct behaviour.

---

## syncLocalStorageData thunk

This thunk is more complex because it merges DB state + localStorage before
sending. The relevant statistics merge is:

```ts
// userDataSlice.ts ~line 949–965
const detailedMap = new Map();
for (const detail of [
  ...(dbData.answeredQuestionsDetailed ?? []), // from DB (no plainQuestion after change)
  ...(lsData.answeredQuestionsDetailed ?? []), // from localStorage (has plainQuestion)
]) {
  const key = detail.questionId;
  if (
    !detailedMap.has(key) ||
    detail.timestamp > detailedMap.get(key).timestamp
  ) {
    detailedMap.set(key, detail);
  }
}
result[assessment] = {
  answeredQuestions: Array.from(answeredQuestionsSet),
  answeredQuestionsDetailed: Array.from(detailedMap.values()), // mixed: some with, some without plainQuestion
  statistics: { ...dbData.statistics, ...lsData.statistics }, // lsData.statistics leaves have plainQuestion
};
```

After the DB change, `dbData.answeredQuestionsDetailed` entries won't have
`plainQuestion`, but `lsData.answeredQuestionsDetailed` entries will. The
merge picks **whichever entry has the newer timestamp per questionId**. If the
localStorage entry is newer, the merged result carries `plainQuestion` through
to the final payload. If the DB entry is newer, it doesn't.

The merged `statistics` object spreads `lsData.statistics` on top of
`dbData.statistics` — leaf nodes from localStorage still carry `plainQuestion`.

The final payload is then sent to `/api/user/sync-data` → `syncOperations.ts`.
Again, **the strip must happen in `syncOperations.ts`** before
`JSON.stringify`. The thunk needs no change.

### One subtle point: merge winner and plainQuestion availability

After the sync, Redux is updated with the merged `mergedStatistics` object
(see the fulfilled case). This merged object may contain `plainQuestion` on
some entries (those that came from localStorage) and not on others (those that
came from DB). This is fine for localStorage-originated consumers (they already
have the data), and `review/page.tsx` will be fixed to use the promoted
`primary_class_cd` / `skill_cd` fields anyway.

---

## The `/api/user/complete-data` response (used for diff check)

`MigrationChecker` fetches this endpoint and passes `userData.statistics` into
`localStorageDiffersFromDb()`. After the DB change, the statistics returned
by this endpoint will have no `plainQuestion` in the JSONB leaves. But since
`localStorageDiffersFromDb()` only reads `answeredQuestions` (the flat ID
array) and ignores everything else inside each assessment entry, the stripped
records make no difference to the comparison result.

---

## Summary

| Component / function                                        | Impact                                                                                                                                    | Change needed? |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `MigrationChecker.tsx` — `localStorageDiffersFromDb()`      | Compares only `answeredQuestions.length`. No field from `plainQuestion` or `answeredQuestionsDetailed` internals is read.                 | ❌ No          |
| `MigrationChecker.tsx` — `isDatabaseEmpty()`                | Checks only whether `statistics` object has any keys. Content is irrelevant.                                                              | ❌ No          |
| `MigrationChecker.tsx` — `handleMigrate()` / `handleSync()` | Just dispatches thunks. The thunks handle the data.                                                                                       | ❌ No          |
| `migrateLocalStorageData` thunk                             | Reads localStorage as-is, sends to `/api/user/migrate-data`. The strip happens downstream in `migrationOperations.ts`.                    | ❌ No          |
| `syncLocalStorageData` thunk — statistics merge             | Merges DB + localStorage entries by timestamp. Mixed `plainQuestion` presence is fine; strip happens downstream in `syncOperations.ts`.   | ❌ No          |
| `syncLocalStorageData` thunk — final payload                | Sends merged object to `/api/user/sync-data`. Strip is applied by `syncOperations.ts` before the INSERT.                                  | ❌ No          |
| `/api/user/migrate-data` → `migrationOperations.ts`         | **Strip transform must be applied here** before `JSON.stringify(stats.answeredQuestionsDetailed)` and `JSON.stringify(stats.statistics)`. | ✅ Yes         |
| `/api/user/sync-data` → `syncOperations.ts`                 | **Strip transform must be applied here** in the same positions.                                                                           | ✅ Yes         |
| `/api/user/statistics` → `userOperations.ts`                | **Strip transform must be applied here** (direct per-session stat writes).                                                                | ✅ Yes         |

---

## Why this layering is correct

The principle is: **localStorage is the source of truth on the client; the DB
write layer is the gate that decides what gets persisted.** The strip transform
belongs at that gate, not scattered across every caller. Any code that reads
from localStorage or passes data around in memory before it hits the DB is
transparent to the change.
