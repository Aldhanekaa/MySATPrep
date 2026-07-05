/**
 * Collection Database Operations
 *
 * CRUD operations for saved collections using parameterized queries.
 *
 * Validates: Requirements 7.7, 8.7, 8.8, 8.9
 */

import { pool } from "@/lib/auth";
import type { SavedCollection, QuestionDetail } from "@/lib/types/userData";

// ─── Strip helper ─────────────────────────────────────────────────────────────

/**
 * Strips plainQuestion from a QuestionDetail entry before writing to the DB.
 *
 * plainQuestion was never reliably populated in question_details (no write
 * path sets it intentionally) and is never read back by any consumer. Stripping
 * it here keeps the question_details JSONB lean and consistent.
 *
 * localStorage is unaffected — this helper only runs at the DB write boundary.
 * Old DB rows that still carry plainQuestion are harmless: collectionsToSavedCollections()
 * in use-resolved-user-data.ts already drops it when mapping to the UI shape.
 */
function stripQuestionDetail(detail: QuestionDetail): {
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

interface DbSavedCollection {
  id: string;
  userId: string;
  collectionId: string;
  name: string;
  description: string | null;
  questionIds: string[];
  questionDetails: QuestionDetail[];
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function rowToSavedCollection(row: DbSavedCollection): SavedCollection {
  return {
    id: row.id,
    userId: row.userId,
    collectionId: row.collectionId,
    name: row.name,
    description: row.description ?? undefined,
    questionIds: row.questionIds ?? [],
    questionDetails: row.questionDetails ?? [],
    color: row.color ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Fetch all collections for a user, ordered newest first.
 * Validates: Requirement 7.7
 */
export async function getSavedCollections(
  userId: string,
): Promise<SavedCollection[]> {
  const result = await pool.query<DbSavedCollection>(
    `SELECT id,
            user_id         AS "userId",
            collection_id   AS "collectionId",
            name,
            description,
            question_ids    AS "questionIds",
            question_details AS "questionDetails",
            color,
            created_at      AS "createdAt",
            updated_at      AS "updatedAt"
     FROM saved_collections
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );

  return result.rows.map(rowToSavedCollection);
}

/**
 * Insert a new collection. Uses the provided collectionId (client-generated).
 * Validates: Requirement 8.7
 */
export async function createCollection(
  userId: string,
  collectionData: Omit<
    SavedCollection,
    "id" | "userId" | "createdAt" | "updatedAt"
  >,
): Promise<SavedCollection> {
  const result = await pool.query<DbSavedCollection>(
    `INSERT INTO saved_collections
       (user_id, collection_id, name, description, question_ids, question_details, color)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING
       id,
       user_id          AS "userId",
       collection_id    AS "collectionId",
       name,
       description,
       question_ids     AS "questionIds",
       question_details AS "questionDetails",
       color,
       created_at       AS "createdAt",
       updated_at       AS "updatedAt"`,
    [
      userId,
      collectionData.collectionId,
      collectionData.name,
      collectionData.description ?? null,
      JSON.stringify(collectionData.questionIds ?? []),
      JSON.stringify(
        (collectionData.questionDetails ?? []).map(stripQuestionDetail),
      ),
      collectionData.color ?? null,
    ],
  );

  return rowToSavedCollection(result.rows[0]);
}

/**
 * Update an existing collection by collection ID, scoped to the owning user.
 * Returns null if the collection does not exist or belongs to a different user.
 * Validates: Requirement 8.8
 */
export async function updateCollection(
  collectionId: string,
  data: Partial<
    Omit<
      SavedCollection,
      "id" | "userId" | "collectionId" | "createdAt" | "updatedAt"
    >
  >,
  userId?: string,
): Promise<SavedCollection | null> {
  const result = await pool.query<DbSavedCollection>(
    `UPDATE saved_collections
     SET name             = COALESCE($2, name),
         description      = COALESCE($3, description),
         question_ids     = COALESCE($4, question_ids),
         question_details = COALESCE($5, question_details),
         color            = COALESCE($6, color),
         updated_at       = CURRENT_TIMESTAMP
     WHERE collection_id = $1
       AND ($7::uuid IS NULL OR user_id = $7)
     RETURNING
       id,
       user_id          AS "userId",
       collection_id    AS "collectionId",
       name,
       description,
       question_ids     AS "questionIds",
       question_details AS "questionDetails",
       color,
       created_at       AS "createdAt",
       updated_at       AS "updatedAt"`,
    [
      collectionId,
      data.name ?? null,
      data.description ?? null,
      data.questionIds != null ? JSON.stringify(data.questionIds) : null,
      data.questionDetails != null
        ? JSON.stringify(data.questionDetails.map(stripQuestionDetail))
        : null,
      data.color ?? null,
      userId ?? null,
    ],
  );

  if (!result.rows[0]) return null;
  return rowToSavedCollection(result.rows[0]);
}

/**
 * Delete a collection by collection ID, scoped to the owning user.
 * Returns true if a row was deleted, false if it did not exist or belongs to a different user.
 * Validates: Requirement 8.9
 */
export async function deleteCollection(
  collectionId: string,
  userId?: string,
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM saved_collections
     WHERE collection_id = $1
       AND ($2::uuid IS NULL OR user_id = $2)`,
    [collectionId, userId ?? null],
  );

  return (result.rowCount ?? 0) > 0;
}
