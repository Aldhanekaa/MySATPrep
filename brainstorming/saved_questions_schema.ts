/**
 * BRAINSTORMING: saved_questions — Current & Proposed Schemas
 *
 * Covers both the localStorage shape and the PostgreSQL DB shape.
 *
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │  TABLE: saved_questions  (migrations/001_initial_schema.sql)              │
 * │                                                                           │
 * │  id            UUID         PK  DEFAULT gen_random_uuid()                 │
 * │  user_id       UUID         FK → "user"(id) ON DELETE CASCADE             │
 * │  assessment    VARCHAR(50)  NOT NULL   'SAT' | 'PSAT/NMSQT' | 'PSAT'     │
 * │  question_id   VARCHAR(255) NOT NULL                                       │
 * │  external_id   VARCHAR(255) nullable                                       │
 * │  ibn           VARCHAR(255) nullable                                       │
 * │  plain_question JSONB       nullable   ← the entire PlainQuestionType     │
 * │  timestamp     TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP                     │
 * │  UNIQUE (user_id, question_id)                                             │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * localStorage key:  "savedQuestions"
 * localStorage shape: SavedQuestions = { [assessment: string]: SavedQuestion[] }
 */

// ─── PlainQuestionType (src/types/question.ts) ────────────────────────────────
type QuestionDifficulty = "E" | "M" | "H";
type DomainItems = string;
type SkillCd_Variants = string;

interface PlainQuestionType {
  questionId: string;
  primary_class_cd: DomainItems;
  primary_class_cd_desc: string;
  skill_cd: SkillCd_Variants;
  skill_desc: string;
  difficulty: QuestionDifficulty;
  ibn: null | string; // exactly one of ibn / external_id is non-null
  external_id: null | string; // exactly one of ibn / external_id is non-null
  program: string;
  pPcc: string;
  uId: string;
  score_band_range_cd: number;
  createDate: number;
  updateDate: number;
}

// =============================================================================
// CURRENT SCHEMAS
// =============================================================================

/**
 * CURRENT: SavedQuestion — localStorage shape (src/types/savedQuestions.ts)
 *
 * Stored as: { [assessment]: SavedQuestion[] } in localStorage["savedQuestions"]
 * Also the shape used by UI components (saved.tsx, previousSaved.tsx,
 * save-button.tsx) via useResolvedBookmarks().
 */
interface Current_SavedQuestion_LocalStorage {
  questionId: string;
  externalId?: string | null;
  ibn?: string | null;
  plainQuestion?: PlainQuestionType; // Full question metadata — ~300–500 B
  timestamp: string; // ISO 8601
}

/**
 * CURRENT: SavedQuestion — DB/Redux shape (src/lib/types/userData.ts)
 *
 * Maps to one row in saved_questions table.
 * Fetched via GET /api/user/bookmarks → getSavedQuestions() → bookmarkOperations.ts
 * Stored in Redux state.userData.bookmarks as SavedQuestion[]
 */
interface Current_SavedQuestion_DB {
  id?: string; // DB-generated UUID
  userId?: string; // from user_id column
  assessment: string; // separate column, not in localStorage shape
  questionId: string; // question_id column
  externalId?: string | null; // external_id column
  ibn?: string | null; // ibn column
  plainQuestion?: PlainQuestionType | null; // plain_question JSONB column
  timestamp: string; // timestamp column
}

// =============================================================================
// FIELD-BY-FIELD ANALYSIS
// =============================================================================

/**
 * Columns that are unambiguously essential:
 *
 * question_id   → PK for UNIQUE (user_id, question_id). Used everywhere
 *                 for membership checks, dedup, deletion.
 *                 VERDICT: ✅ ESSENTIAL
 *
 * assessment    → Determines which assessment bucket the bookmark belongs to.
 *                 Used by bookmarksToSavedQuestions() to reconstruct the
 *                 { [assessment]: SavedQuestion[] } localStorage shape.
 *                 VERDICT: ✅ ESSENTIAL
 *
 * external_id   → Used in saved.tsx and previousSaved.tsx fetch loop as:
 *                   const id = question.externalId || question.ibn;
 *                   const questionData = await fetchQuestionData(id);
 *                 This API call fetches the full question content (stem,
 *                 answer options, rationale) for rendering.
 *                 Also used in review/page.tsx bookmark path (passed as
 *                 plainQuestion.external_id when building review sessions).
 *                 VERDICT: ✅ ESSENTIAL — needed to fetch question content
 *
 * ibn           → Fallback identifier for the same API fetch.
 *                   const id = question.externalId || question.ibn;
 *                 One of the two (external_id or ibn) is always non-null
 *                 on any real question.
 *                 VERDICT: ✅ ESSENTIAL — needed as the alternative lookup key
 *
 * timestamp     → Used for ORDER BY timestamp DESC in getSavedQuestions().
 *                 Displayed in OptimizedQuestionCard as the "saved on" date.
 *                 VERDICT: ✅ ESSENTIAL
 *
 * plain_question JSONB → See detailed analysis below.
 */

/**
 * plain_question JSONB — THE KEY QUESTION
 *
 * This is the column that is potentially optimisable. It stores the full
 * 14-field PlainQuestionType object (~300–500 bytes serialised).
 *
 * Who reads plainQuestion from a SavedQuestion?
 *
 * 1. saved.tsx — fetchQuestionsProgressively():
 *    ```ts
 *    if (!question.plainQuestion) {
 *      dispatch({ type: "SET_QUESTION_ERROR", payload: {
 *        errorMessage: "Question metadata not available"
 *      }});
 *      continue;
 *    }
 *    dispatch({ type: "SET_QUESTION_SUCCESS", payload: {
 *      questionData: { problem: questionData, question: question.plainQuestion }
 *    }});
 *    ```
 *    plainQuestion is used as the `question` field of QuestionById_Data
 *    passed to OptimizedQuestionCard. OptimizedQuestionCard uses it to:
 *      - Display difficulty badge
 *      - Display domain/skill labels
 *      - Supply PlainQuestionType to the question rendering component
 *    VERDICT: ⚠️ ACTIVELY USED — but read pattern is "if missing → error state"
 *             meaning existing bookmarks without plainQuestion show an error card.
 *
 * 2. saved.tsx — filterQuestions():
 *    ```ts
 *    const primaryClassCd = question.plainQuestion?.primary_class_cd;
 *    // subject filter
 *    const questionDifficulty = question.plainQuestion?.difficulty;
 *    // difficulty filter
 *    ```
 *    Used for the subject and difficulty filter dropdowns on the saved tab.
 *    If plainQuestion is absent, the question is excluded from filtered views
 *    (optional chaining → undefined → filter returns false for non-"all" filters).
 *    VERDICT: ⚠️ ACTIVELY USED for filtering — but only for non-"all" filter states.
 *
 * 3. previousSaved.tsx — same fetch loop pattern as saved.tsx:
 *    ```ts
 *    if (!question.plainQuestion) {
 *      dispatch({ type: "SET_QUESTION_ERROR", ... "Question metadata not available" });
 *      continue;
 *    }
 *    // use plainQuestion as QuestionById_Data.question
 *    ```
 *    VERDICT: ⚠️ Same as saved.tsx — missing = error state
 *
 * 4. review/page.tsx — bookmark review flow:
 *    ```ts
 *    questions = savedQuestionsForAssessment.map((question) => ({
 *      questionId: question.questionId,
 *      timestamp: question.timestamp,
 *      isLoading: true,
 *      plainQuestion: question.plainQuestion,  // ← passed through
 *    }));
 *    // Then:
 *    questions = questions.filter(e =>
 *      getSubjectByPrimaryClassCd(e.plainQuestion?.primary_class_cd || "") == subject
 *    );
 *    // And uses plainQuestion?.skill_cd, plainQuestion?.primary_class_cd
 *    // to build domains[] and skills[] for PracticeSelections
 *    ```
 *    VERDICT: ⚠️ CRITICAL for review mode — without plainQuestion on bookmarks,
 *             the review session cannot determine which domain/skill a question
 *             belongs to, and subject filtering breaks entirely.
 *
 * 5. save-button.tsx — when adding a bookmark:
 *    ```ts
 *    const newSavedQuestion: SavedQuestion = {
 *      questionId, externalId, ibn,
 *      plainQuestion: question.question,  // ← writes full PlainQuestionType
 *      timestamp: new Date().toISOString(),
 *    };
 *    ```
 *    Writes plainQuestion at bookmark creation time.
 *    VERDICT: Write path, not a read consumer.
 *
 * 6. bookmarksToSavedQuestions() in use-resolved-user-data.ts:
 *    ```ts
 *    acc[key].push(bookmark as SavedQuestion);
 *    ```
 *    Direct cast — passes plainQuestion through from Redux to UI shape.
 *    No stripping happens here (unlike collectionsToSavedCollections which DID strip).
 *    VERDICT: Pass-through — plainQuestion flows from DB to UI unchanged.
 */

// =============================================================================
// THE FUNDAMENTAL DIFFERENCE FROM OTHER TABLES
// =============================================================================

/**
 * Unlike practice_statistics, practice_sessions, and saved_collections,
 * plainQuestion in saved_questions is ACTIVELY READ from the DB record
 * in three distinct consumer paths:
 *
 * Path A — Rendering bookmarked questions (saved.tsx, previousSaved.tsx):
 *   Uses plainQuestion as the PlainQuestionType half of QuestionById_Data.
 *   Without it → "Question metadata not available" error card shown.
 *
 * Path B — Subject/difficulty filtering (saved.tsx filterQuestions()):
 *   Uses plainQuestion.primary_class_cd and plainQuestion.difficulty.
 *   Without it → question excluded from any non-"all" filtered view.
 *
 * Path C — Review mode session building (review/page.tsx):
 *   Uses plainQuestion.primary_class_cd, plainQuestion.skill_cd for
 *   domain/skill extraction. Without it → subject filter breaks, review
 *   session cannot be built from bookmarks.
 *
 * This means plain_question cannot be simply dropped from the DB without
 * either:
 *   (a) refactoring consumers to do a question bank API fetch per bookmark, or
 *   (b) promoting specific fields from PlainQuestionType to top-level columns
 *       or a leaner embedded object.
 *
 * CONTRAST with saved_collections:
 *   - savedCollections.plainQuestion was never read by any consumer
 *   - savedQuestions.plainQuestion IS read by 3 active consumer paths
 */

// =============================================================================
// PROPOSED OPTIONS
// =============================================================================

/**
 * OPTION A: Keep plain_question as-is (current state)
 *
 * No change. Accept the ~300–500 B per bookmark as a necessary cost
 * because the data is genuinely used.
 *
 * Pro: Zero breaking changes.
 * Con: Bookmark list of 200 questions → ~60–100 KB of JSONB per user.
 */

/**
 * OPTION B: Slim down plain_question — promote only the fields actually read
 *
 * The three consumer paths only read these fields from plainQuestion:
 *   primary_class_cd   → subject filter, review session domains[]
 *   skill_cd           → review session skills[]
 *   difficulty         → difficulty filter display
 *   external_id        → also at top-level, so already redundant here
 *   ibn                → same
 *
 * Fields that are in plain_question but NEVER read in any consumer:
 *   updateDate, createDate, pPcc, uId, skill_desc,
 *   primary_class_cd_desc, program, score_band_range_cd
 *
 * Proposed: replace the full 14-field JSONB with a 3-field "metadata" object
 * containing only what is actually consumed.
 */
interface Proposed_SlimMetadata {
  primary_class_cd: DomainItems;
  skill_cd: SkillCd_Variants;
  difficulty: QuestionDifficulty;
  // external_id and ibn are already top-level columns — no need to repeat here
}

/**
 * OPTION B proposed DB row shape:
 */
interface Proposed_SavedQuestion_DB {
  id?: string;
  userId?: string;
  assessment: string;
  questionId: string;
  externalId: string | null; // promoted to non-optional
  ibn: string | null; // promoted to non-optional
  timestamp: string;
  // Replaces plain_question JSONB with a slim 3-field object:
  questionMeta: Proposed_SlimMetadata | null;
  // plain_question REMOVED (14 fields → 3 fields)
}

/**
 * localStorage shape under OPTION B:
 *
 * If we adopt OPTION B for the DB but want to keep the same localStorage
 * structure for unauthenticated users, the SavedQuestion type would
 * keep plainQuestion?: PlainQuestionType but the DB would only store
 * questionMeta. The difference between the two shapes is handled at
 * the DB write boundary.
 *
 * HOWEVER — this creates a new problem at read time:
 *   bookmarksToSavedQuestions() currently does a direct cast (bookmark as SavedQuestion).
 *   After OPTION B, the DB record has questionMeta not plainQuestion.
 *   The mapping function must reconstruct a partial PlainQuestionType from
 *   questionMeta to satisfy the consumers.
 *
 * Reconstructed PlainQuestionType from DB (missing non-consumed fields):
 *   {
 *     questionId,
 *     primary_class_cd: questionMeta.primary_class_cd,
 *     skill_cd: questionMeta.skill_cd,
 *     difficulty: questionMeta.difficulty,
 *     external_id: externalId,
 *     ibn: ibn,
 *     // All other fields (updateDate, pPcc, etc.) set to defaults/empty
 *   }
 *
 * This partial reconstruction is safe because:
 *   - saved.tsx only reads primary_class_cd, skill_cd, difficulty from plainQuestion
 *   - review/page.tsx only reads primary_class_cd, skill_cd from plainQuestion
 *   - Neither consumer accesses updateDate, pPcc, uId, etc.
 */

/**
 * OPTION C: Promote fields to dedicated columns instead of JSONB
 *
 * Add primary_class_cd, skill_cd, difficulty as proper VARCHAR columns.
 * Drop plain_question JSONB entirely.
 * Requires a migration ALTER TABLE.
 *
 * Pro: Queryable, indexable, typed at DB level.
 * Con: Schema migration needed, breaks existing JSONB read path until migrated.
 */
interface Proposed_SavedQuestion_DB_OptionC {
  id?: string;
  userId?: string;
  assessment: string;
  questionId: string;
  externalId: string | null;
  ibn: string | null;
  primaryClassCd: string; // new VARCHAR column (was in plain_question)
  skillCd: string; // new VARCHAR column (was in plain_question)
  difficulty: "E" | "M" | "H"; // new VARCHAR column (was in plain_question)
  timestamp: string;
  // plain_question JSONB column REMOVED entirely
}

// =============================================================================
// STORAGE SAVINGS ESTIMATE
// =============================================================================

/**
 * Current full PlainQuestionType serialised: ~400 B per bookmark
 *
 * Under OPTION B (slim 3-field JSONB):
 *   { "primary_class_cd": "H-RTE", "skill_cd": "CAS", "difficulty": "M" }
 *   ≈ 65 B per bookmark  → saves ~335 B per bookmark
 *
 * Under OPTION C (dedicated columns):
 *   ~35 B per bookmark  → saves ~365 B per bookmark
 *
 * For a user with 200 bookmarks:
 *   OPTION B: 200 × 335 B = ~67 KB saved
 *   OPTION C: 200 × 365 B = ~73 KB saved
 *
 * Additionally:
 *   plain_question column has its own Postgres TOAST overhead for large values.
 *   Moving to slim JSONB or dedicated columns improves row packing.
 */

// =============================================================================
// RECOMMENDATION
// =============================================================================

/**
 * RECOMMENDATION: OPTION B (slim questionMeta JSONB)
 *
 * Reason:
 *   - Avoids a DDL migration (no ALTER TABLE ... ADD COLUMN / DROP COLUMN)
 *   - The write path change is contained to the DB layer (strip before write)
 *   - bookmarksToSavedQuestions() needs a small update to reconstruct a
 *     partial PlainQuestionType from {primary_class_cd, skill_cd, difficulty}
 *   - All three consumer paths (saved.tsx, previousSaved.tsx, review/page.tsx)
 *     continue to work without any changes
 *
 * What changes:
 *   - bookmarkOperations.ts: write questionMeta only, not full plain_question
 *   - syncOperations.ts / migrationOperations.ts: same
 *   - use-resolved-user-data.ts: bookmarksToSavedQuestions() reconstructs
 *     partial PlainQuestionType from questionMeta fields
 *   - Column rename: plain_question → question_meta (or keep plain_question
 *     but store only the slim object — simpler, no migration needed)
 *
 * localStorage: UNCHANGED
 * localStorage still stores full PlainQuestionType for offline capability.
 */
