/**
 * BRAINSTORMING: saved_collections — Current & Proposed Schemas
 *
 * Covers both the localStorage shape and the PostgreSQL DB shape.
 *
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │  TABLE: saved_collections  (migrations/001_initial_schema.sql)            │
 * │                                                                           │
 * │  id              UUID         PK  DEFAULT gen_random_uuid()               │
 * │  user_id         UUID         FK → "user"(id) ON DELETE CASCADE           │
 * │  collection_id   VARCHAR(255) NOT NULL  (client-generated, unique per user)│
 * │  name            VARCHAR(255) NOT NULL                                     │
 * │  description     TEXT                                                      │
 * │  question_ids    JSONB        DEFAULT '[]'  ← string[] of questionIds     │
 * │  question_details JSONB       DEFAULT '[]'  ← QuestionDetail[]            │
 * │  color           VARCHAR(50)                                               │
 * │  created_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP                   │
 * │  updated_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP (trigger)         │
 * │  UNIQUE (user_id, collection_id)                                           │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * localStorage key: "savedCollections"
 * Shape: SavedCollections = { [collectionId: string]: SavedCollection }
 *
 * Two type systems exist for SavedCollection:
 *   - src/types/savedCollections.ts  → used by UI components (SavedTab, SavedButton)
 *   - src/lib/types/userData.ts      → used by Redux / DB layer (has QuestionDetail with plainQuestion)
 *
 * The critical difference: userData.ts QuestionDetail has plainQuestion?: PlainQuestionType
 * savedCollections.ts QuestionDetail does NOT have plainQuestion.
 */

// ─── Supporting types ─────────────────────────────────────────────────────────

type PlainQuestionType = {
  questionId: string;
  primary_class_cd: string;
  skill_cd: string;
  difficulty: "E" | "M" | "H";
  ibn: null | string;
  external_id: null | string;
  // ... 9 more fields (see src/types/question.ts)
};

// =============================================================================
// CURRENT SCHEMAS
// =============================================================================

/**
 * CURRENT: QuestionDetail in userData.ts (DB layer type)
 *
 * This is the shape stored in question_details JSONB column and used in
 * Redux state. It has an OPTIONAL plainQuestion field that can carry the
 * full metadata blob.
 *
 * Problem:
 *   plainQuestion is NOT populated by the UI when adding a question to a
 *   collection. Looking at save-button.tsx handleToggleQuestionInCollection():
 *     { questionId, externalId: question.question.external_id, ibn: question.question.ibn }
 *   No plainQuestion here.
 *
 *   However, it IS set when the collection is first created during a
 *   "save bookmark" flow, but only on the savedQuestions side —
 *   not on questionDetails in the collection.
 *
 *   In practice, plainQuestion in QuestionDetail is almost always undefined
 *   in real data, but the type allows it and some legacy migration paths
 *   may have populated it.
 */
interface Current_QuestionDetail_DB {
  questionId: string;
  externalId?: string | null;
  ibn?: string | null;
  plainQuestion?: PlainQuestionType; // ← rarely populated, but in the type
}

/**
 * CURRENT: QuestionDetail in savedCollections.ts (UI type)
 *
 * This is the type used by UI components. It does NOT have plainQuestion,
 * which confirms that the UI never reads plainQuestion from collection details.
 */
interface Current_QuestionDetail_UI {
  questionId: string;
  externalId?: string | null;
  ibn?: string | null;
  // No plainQuestion here — UI never needs it from a collection entry
}

/**
 * CURRENT: SavedCollection localStorage shape (src/types/savedCollections.ts)
 *
 * Stored as: { [collectionId]: SavedCollection } in localStorage["savedCollections"]
 */
interface Current_SavedCollection_LocalStorage {
  id: string; // same as collectionId — client-generated
  name: string;
  description?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  questionIds: string[]; // flat list of questionId strings
  questionDetails: Current_QuestionDetail_UI[]; // NO plainQuestion in UI type
  color?: string;
}

/**
 * CURRENT: SavedCollection DB/Redux shape (src/lib/types/userData.ts)
 *
 * Maps to one row in saved_collections. The two JSONB columns are:
 *   question_ids     → questionIds: string[]
 *   question_details → questionDetails: QuestionDetail[]  (may have plainQuestion)
 */
interface Current_SavedCollection_DB {
  id?: string; // DB-generated UUID
  userId?: string; // from user_id column
  collectionId: string; // from collection_id column
  name: string;
  description?: string;
  questionIds: string[]; // question_ids JSONB
  questionDetails: Current_QuestionDetail_DB[]; // question_details JSONB
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// FIELD-BY-FIELD ANALYSIS
// =============================================================================

/**
 * question_ids JSONB column  →  string[]
 *
 * Every consumer:
 *   - save-button.tsx: collection.questionIds.includes(questionId)  → membership check
 *   - save-button.tsx: [...collection.questionIds, questionId]      → add to collection
 *   - save-button.tsx: col.questionIds.filter(id => id !== questionId) → remove from collection
 *   - question-problem-card.tsx: collection.questionIds.includes(questionId) → "in collection" indicator
 *   - saved.tsx reducer (SET_SELECTED_COLLECTION): question_ids used to filter displayed questions
 *   - syncOperations.ts SQL: jsonb_agg(DISTINCT val) union merge on conflict
 *   - MigrationChecker.tsx: NOT read (collections diff only checks collectionId)
 *
 * Verdict: ✅ ESSENTIAL — core data, no redundancy, all consumers need it.
 *
 *
 * question_details JSONB column  →  QuestionDetail[]
 *
 * Every consumer:
 *   - saved.tsx reducer: questionDetails.map(d => d.questionId) → filter saved questions
 *     by collection membership. Only questionId is accessed.
 *   - saved.tsx folder view: (collection.questionDetails || []).length → question count badge
 *   - save-button.tsx: questionDetails.filter(d => d.questionId !== questionId) → remove entry
 *   - save-button.tsx: questionDetails.map(d => ({questionId, externalId, ibn})) → when syncing
 *     to Redux, explicitly strips any extra fields
 *   - use-resolved-user-data.ts collectionsToSavedCollections(): maps each detail to
 *     {questionId, externalId ?? null, ibn ?? null} — explicitly DROPS plainQuestion
 *   - syncOperations.ts SQL: DISTINCT ON (entry->>'questionId') merge → only questionId key used
 *
 * Fields from question_details actually used:
 *   questionId  → collection membership filtering, count, dedup key in SQL merge
 *   externalId  → preserved for question bank API lookups (question fetch in saved.tsx uses it)
 *   ibn         → same as externalId (alternative identifier)
 *   plainQuestion → NEVER READ from collection details by any consumer.
 *                   The UI type (savedCollections.ts) doesn't even have this field.
 *                   collectionsToSavedCollections() explicitly drops it.
 *                   save-button.tsx maps details stripping it when syncing to Redux.
 *
 * Verdict for question_details:
 *   questionId  → ✅ ESSENTIAL
 *   externalId  → ✅ KEEP — used by saved.tsx to fetch question content from API
 *   ibn         → ✅ KEEP — alternative to externalId for API fetch
 *   plainQuestion → ❌ NOT NEEDED IN DB — never read back, explicitly stripped in every
 *                   place that maps from DB shape to UI shape
 *
 *
 * question_ids vs question_details — is question_ids redundant?
 *
 *   question_ids is a flat string[] used for O(1) membership checks
 *   (.includes()) without needing to iterate questionDetails.
 *   question_details contains the same questionIds but as objects.
 *   They are maintained in sync by all write paths.
 *
 *   question_ids could theoretically be derived from questionDetails.map(d => d.questionId)
 *   but the SQL merge strategy treats them independently:
 *     question_ids  → jsonb_agg(DISTINCT val) — simple string set union
 *     question_details → DISTINCT ON (entry->>'questionId') — object dedup
 *   Dropping question_ids would require changing the SQL merge and all .includes() checks.
 *   Not worth the complexity — keep both.
 */

// =============================================================================
// PROPOSED DB SCHEMA (question_details only change)
// =============================================================================

/**
 * PROPOSED: QuestionDetail for question_details JSONB
 *
 * Change: remove plainQuestion from the type entirely.
 * It was never reliably populated and never read back from the DB.
 */
interface Proposed_QuestionDetail_DB {
  questionId: string;
  externalId: string | null; // promoted to non-optional, explicit null
  ibn: string | null; // promoted to non-optional, explicit null
  // plainQuestion REMOVED
}

/**
 * PROPOSED: SavedCollection DB shape
 *
 * Only question_details changes. All other fields are identical.
 */
interface Proposed_SavedCollection_DB {
  id?: string;
  userId?: string;
  collectionId: string;
  name: string;
  description?: string;
  questionIds: string[]; // UNCHANGED
  questionDetails: Proposed_QuestionDetail_DB[]; // stripped of plainQuestion
  color?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * localStorage shape: UNCHANGED
 * The UI type (savedCollections.ts) never had plainQuestion on QuestionDetail,
 * so localStorage is unaffected.
 */

// =============================================================================
// WHERE plainQuestion IS (rarely) WRITTEN INTO question_details
// =============================================================================

/**
 * Looking at all write paths for questionDetails in the codebase:
 *
 * 1. save-button.tsx handleToggleQuestionInCollection() — adds to collection:
 *    { questionId, externalId: question.question.external_id, ibn: question.question.ibn }
 *    → NO plainQuestion written
 *
 * 2. save-button.tsx handleToggleQuestionInCollection() — removes from collection:
 *    questionDetails.filter(d => d.questionId !== questionId)
 *    → plainQuestion passes through if it was there
 *
 * 3. save-button.tsx handleSaveClick() — remove from all collections:
 *    questionDetails.filter(detail => detail.questionId !== questionId)
 *    → plainQuestion passes through if it was there
 *
 * 4. syncOperations.ts — migration/sync upsert:
 *    JSON.stringify(collection.questionDetails ?? [])
 *    → passes through whatever is in the payload (from localStorage)
 *
 * 5. migrationOperations.ts — first-time migration:
 *    Same as above
 *
 * 6. collectionOperations.ts createCollection() / updateCollection():
 *    JSON.stringify(collectionData.questionDetails ?? [])
 *    → passes through whatever the API received
 *
 * Conclusion: plainQuestion is NEVER intentionally written into questionDetails
 * by any current code path. It can only appear if old localStorage data carried
 * it through a migration. It is ALWAYS stripped when mapped from DB → UI
 * in collectionsToSavedCollections().
 *
 * This makes the fix entirely safe: strip at DB write time, no behavior change.
 */

// =============================================================================
// STORAGE SAVINGS ESTIMATE
// =============================================================================

/**
 * Since plainQuestion is almost never in questionDetails in practice
 * (the write paths never set it), the storage savings are minimal for
 * new data going forward.
 *
 * The value of the change is:
 *   1. Type safety: removes an impossible-to-trigger code path
 *   2. Schema correctness: the DB type matches what the UI actually stores
 *   3. Defense: prevents any future code accidentally populating it
 *   4. Consistency with the practice_statistics and practice_sessions changes
 *
 * For any user who has plainQuestion in question_details from old migration data:
 *   ~15 fields × ~30 B average = ~450 B per question entry
 *   A collection with 20 questions = ~9 KB saved if plainQuestion was present
 */
