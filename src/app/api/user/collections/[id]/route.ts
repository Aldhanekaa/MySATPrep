/**
 * PUT /api/user/collections/[id]
 * DELETE /api/user/collections/[id]
 *
 * Updates or deletes a collection by collection ID for the authenticated user.
 * Verifies authentication, performs the operation, invalidates the collections
 * cache, and returns updated data or a deletion confirmation.
 *
 * Validates: Requirements 8.8, 8.9, 8.12, 8.13, 8.14
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { collectionsCache, getCacheKey } from "@/lib/cache";
import {
  updateCollection,
  deleteCollection,
} from "@/lib/db/collectionOperations";
import { logError } from "@/lib/utils/errorLogger";
import type { SavedCollection } from "@/lib/types/userData";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface UpdatePayload {
  name?: unknown;
  description?: unknown;
  questionIds?: unknown;
  questionDetails?: unknown;
  color?: unknown;
}

function validateUpdatePayload(body: unknown):
  | {
      valid: true;
      data: Partial<
        Omit<
          SavedCollection,
          "id" | "userId" | "collectionId" | "createdAt" | "updatedAt"
        >
      >;
    }
  | { valid: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const payload = body as UpdatePayload;

  if (
    payload.name !== undefined &&
    (typeof payload.name !== "string" || !payload.name.trim())
  ) {
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
      ...(payload.name !== undefined && { name: payload.name as string }),
      ...(payload.description !== undefined && {
        description: payload.description as string | undefined,
      }),
      ...(payload.questionIds !== undefined && {
        questionIds: payload.questionIds as string[],
      }),
      ...(payload.questionDetails !== undefined && {
        questionDetails:
          payload.questionDetails as SavedCollection["questionDetails"],
      }),
      ...(payload.color !== undefined && {
        color: payload.color as string | undefined,
      }),
    },
  };
}

// Requirement 8.8 – update an existing collection
export async function PUT(request: NextRequest, context: RouteContext) {
  // Requirement 8.14 – return 401 if not authenticated
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const { id: collectionId } = await context.params;

  if (!collectionId) {
    return NextResponse.json(
      { success: false, error: "Collection ID is required" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  const validation = validateUpdatePayload(body);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 },
    );
  }

  try {
    const collection = await updateCollection(
      collectionId,
      validation.data,
      userId,
    );

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 },
      );
    }

    // Requirement 8.12 – invalidate collections cache
    collectionsCache.delete(getCacheKey("collections", userId));

    // Requirement 8.13 – return updated collection
    return NextResponse.json({ success: true, data: { collection } });
  } catch (error) {
    logError(`[PUT /api/user/collections/${collectionId}]`, error, {
      userId,
      collectionId,
    });

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

// Requirement 8.9 – delete a collection
export async function DELETE(request: NextRequest, context: RouteContext) {
  // Requirement 8.14 – return 401 if not authenticated
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const { id: collectionId } = await context.params;

  if (!collectionId) {
    return NextResponse.json(
      { success: false, error: "Collection ID is required" },
      { status: 400 },
    );
  }

  try {
    const deleted = await deleteCollection(collectionId, userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 },
      );
    }

    // Requirement 8.12 – invalidate collections cache
    collectionsCache.delete(getCacheKey("collections", userId));

    // Requirement 8.13 – return deletion confirmation
    return NextResponse.json({
      success: true,
      data: { deletedCollectionId: collectionId },
    });
  } catch (error) {
    logError(`[DELETE /api/user/collections/${collectionId}]`, error, {
      userId,
      collectionId,
    });

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
