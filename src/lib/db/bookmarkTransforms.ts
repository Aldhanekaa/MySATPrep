/**
 * Bookmark DB Transform Utilities
 *
 * Converts the full PlainQuestionType stored in localStorage into the slim
 * 3-field object written to the `plain_question` JSONB column in
 * `saved_questions`.
 *
 * WHY:
 *   The full PlainQuestionType has 14 fields (~400 B serialised). Consumers
 *   that read `plain_question` back from the DB only ever access three of them:
 *     primary_class_cd  — subject filter, review session domain extraction
 *     skill_cd          — review session skill extraction
 *     difficulty        — difficulty filter, card badge display
 *
 *   The other 11 fields (updateDate, createDate, pPcc, uId, skill_desc,
 *   primary_class_cd_desc, program, score_band_range_cd, questionId,
 *   external_id, ibn) are either already present as dedicated DB columns
 *   or are never read back from a saved question record by any UI code.
 *
 * BACKWARD COMPATIBILITY:
 *   Existing DB rows may still carry the full PlainQuestionType object.
 *   bookmarksToSavedQuestions() in use-resolved-user-data.ts handles both
 *   old rows (full object) and new rows (slim object) transparently.
 *
 * LOCALSTORAGE:
 *   Unchanged. localStorage still stores the full PlainQuestionType so
 *   unauthenticated users continue to work exactly as before.
 */

import type { PlainQuestionType } from "@/types/question";

/** The slim shape written to plain_question JSONB in the DB */
export interface SlimPlainQuestion {
  primary_class_cd: string;
  skill_cd: string;
  difficulty: "E" | "M" | "H";
}

/**
 * Converts a full PlainQuestionType into the slim 3-field object for DB storage.
 * Returns null when the input is null/undefined (bookmark was saved without metadata).
 */
export function slimPlainQuestion(
  pq: PlainQuestionType | null | undefined,
): SlimPlainQuestion | null {
  if (!pq) return null;
  return {
    primary_class_cd: pq.primary_class_cd,
    skill_cd: pq.skill_cd,
    difficulty: pq.difficulty,
  };
}

/**
 * Reconstructs a full PlainQuestionType-compatible object from the slim
 * DB record so that UI consumers (saved.tsx, previousSaved.tsx, review/page.tsx)
 * can keep reading `plainQuestion.primary_class_cd` / `.skill_cd` / `.difficulty`
 * without any changes.
 *
 * Fields that no UI consumer ever reads from a SavedQuestion.plainQuestion are
 * set to safe empty defaults ("" or 0). This is safe because:
 *   - saved.tsx filterQuestions() only reads primary_class_cd + difficulty
 *   - saved.tsx / previousSaved.tsx fetch loop reads primary_class_cd, skill_cd,
 *     difficulty for card display; external_id/ibn for the API fetch identifier
 *   - review/page.tsx only reads primary_class_cd + skill_cd
 *   - No consumer of SavedQuestion.plainQuestion reads updateDate, createDate,
 *     pPcc, uId, skill_desc, primary_class_cd_desc, program, score_band_range_cd
 *
 * Handles both:
 *   A) New rows — plainQuestion has { primary_class_cd, skill_cd, difficulty }
 *   B) Old rows — plainQuestion has the full 14-field PlainQuestionType
 *      (the full object is returned as-is so old data works without any migration)
 */
export function reconstructPlainQuestion(params: {
  questionId: string;
  externalId: string | null | undefined;
  ibn: string | null | undefined;
  storedMeta: SlimPlainQuestion | PlainQuestionType | null | undefined;
}): PlainQuestionType | undefined {
  const { questionId, externalId, ibn, storedMeta } = params;
  if (!storedMeta) return undefined;

  // Old row: already has the full shape — return it directly so nothing changes
  // for existing users. We detect this by checking for a field only the full
  // PlainQuestionType has (e.g. pPcc or uId).
  const full = storedMeta as PlainQuestionType;
  if (full.uId !== undefined || full.pPcc !== undefined) {
    return full;
  }

  // New row: reconstruct a full-compatible object from the slim fields
  const slim = storedMeta as SlimPlainQuestion;
  return {
    questionId,
    primary_class_cd:
      slim.primary_class_cd as PlainQuestionType["primary_class_cd"],
    primary_class_cd_desc: "",
    skill_cd: slim.skill_cd as PlainQuestionType["skill_cd"],
    skill_desc: "",
    difficulty: slim.difficulty,
    external_id: externalId ?? null,
    ibn: ibn ?? null,
    program: "",
    pPcc: "",
    uId: "",
    score_band_range_cd: 0,
    createDate: 0,
    updateDate: 0,
  };
}
