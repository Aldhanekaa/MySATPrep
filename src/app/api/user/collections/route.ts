/**
 * POST /api/user/collections
 *
 * Creates a new collection for the authenticated user.
 * Validates incoming data, persists to the database, invalidates
 * the collections cache, and returns the newly created collection.
 *
 * Validates: Requirements 8.7, 8.12, 8.13, 8.14
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { collectionsCache, getCacheKey } from "@/lib/cache";
import { createCollection } from "@/lib/db/collectionOperations";
import { logError } from "@/lib/utils/errorLogger";
import type { SavedCollection } from "@/lib/types/userData";

interface CollectionPayload {
  collectionId?: unknown;
  name?: unknown;
  description?: unknown;
  questionIds?: unknown;
  questionDetails?: unknown;
  color?: unknown;
}

function validateCollectionPayload(body: unknown):
  | {
      valid: true;
      data: Omit<SavedCollection, "id" | "userId" | "createdAt" | "updatedAt">;
    }
  | { valid: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const payload = body as CollectionPayload;

  if (
    typeof payload.collectionId !== "string" ||
    !payload.collectionId.trim()
  ) {
    return { valid: false, error: "collectionId must be a non-empty string" };
  }

  if (typeof payload.name !== "string" || !payload.name.trim()) {
    return { valid: false, error: "name must be a non-empty string" };
  }

  if (
    payload.description !== undefined &&
    payload.description !== null &&
    typeof payload.description !== "string"
  ) {
    return { valid: false, error: "description must be a string or null" };
  }

  if (
    payload.questionIds !== undefined &&
    !Array.isArray(payload.questionIds)
  ) {
    return { valid: false, error: "questionIds must be an array" };
  }

  if (
    payload.questionDetails !== undefined &&
    !Array.isArray(payload.questionDetails)
  ) {
    return { valid: false, error: "questionDetails must be an array" };
  }

  if (
    payload.color !== undefined &&
    payload.color !== null &&
    typeof payload.color !== "string"
  ) {
    return { valid: false, error: "color must be a string or null" };
  }

  return {
    valid: true,
    data: {
      collectionId: payload.collectionId,
      name: payload.name,
      description: payload.description as string | undefined,
      questionIds: (payload.questionIds as string[]) ?? [],
      questionDetails:
        (payload.questionDetails as SavedCollection["questionDetails"]) ?? [],
      color: payload.color as string | undefined,
    },
  };
}

export async function POST(request: NextRequest) {
  // Requirement 8.14 – return 401 if not authenticated
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  const validation = validateCollectionPayload(body);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 },
    );
  }

  try {
    const collection = await createCollection(userId, validation.data);

    // Requirement 8.12 – invalidate collections cache
    collectionsCache.delete(getCacheKey("collections", userId));

    // Requirement 8.13 – return the created collection
    return NextResponse.json(
      { success: true, data: { collection } },
      { status: 201 },
    );
  } catch (error) {
    logError("[POST /api/user/collections]", error, { userId });

    const isDbError =
      error instanceof Error &&
      (error.message.includes("ECONNREFUSED") ||
        error.message.includes("connection") ||
        error.message.includes("pool"));

    if (isDbError) {
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
