/**
 * Error Logger Utility
 *
 * Provides a unified error logging interface.
 * - Development: logs to console with full context
 * - Production: stubs for external error tracking service integration (e.g. Sentry)
 *
 * Validates: Requirements 18.1, 18.2
 */

/**
 * Extracts a serialisable representation of an unknown error value.
 */
function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === "object" && error !== null) {
    return { raw: JSON.stringify(error) };
  }
  return { raw: String(error) };
}

/**
 * Logs an error with context.
 *
 * @param context - Human-readable label for where the error occurred (e.g. "[POST /api/user/data]")
 * @param error   - The caught error (type `unknown` to handle all throw values)
 * @param metadata - Optional additional key/value pairs to include in the log
 *
 * Validates: Requirements 18.1, 18.2
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>,
): void {
  const serialized = serializeError(error);

  if (process.env.NODE_ENV === "development") {
    // In development, output the full error to the console for easy debugging
    console.error(`[ERROR] ${context}`, {
      error: serialized,
      ...(metadata ? { metadata } : {}),
    });
    return;
  }

  // ── Production error tracking stub ───────────────────────────────────────
  // Replace the block below with a real integration when ready.
  //
  // Example – Sentry:
  //   import * as Sentry from "@sentry/nextjs";
  //   Sentry.captureException(error, {
  //     tags: { context },
  //     extra: { ...serialized, ...metadata },
  //   });
  //
  // Example – Datadog:
  //   datadogLogs.logger.error(context, { ...serialized, ...metadata });
  //
  // For now, suppress noisy stack traces in production while still logging
  // a structured, condensed record.
  console.error(`[ERROR] ${context}`, {
    message: serialized.message ?? serialized.raw,
    ...(metadata ? { metadata } : {}),
  });
}
