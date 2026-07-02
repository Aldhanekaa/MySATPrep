/**
 * Retry utility with exponential backoff
 *
 * Only retries on network-level failures (fetch errors, ECONNREFUSED, etc.)
 * Errors from 4xx HTTP responses are NOT retried — they indicate a client
 * problem that won't resolve itself.
 *
 * Validates: Requirements 13.10, 18.6
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds before the first retry (default: 1000) */
  initialDelayMs?: number;
  /** Multiplier applied to the delay after each attempt (default: 2) */
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
};

/**
 * Returns `true` if the error is a transient network failure that is worth
 * retrying. 4xx / 5xx HTTP status codes embedded in the error are NOT
 * considered network errors; only low-level connectivity issues are.
 */
function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // Fetch API throws a TypeError for network failures
  if (error instanceof TypeError) return true;

  const msg = error.message.toLowerCase();
  return (
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("etimedout") ||
    msg.includes("network") ||
    msg.includes("fetch failed") ||
    msg.includes("failed to fetch")
  );
}

/**
 * Returns a promise that resolves after `ms` milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps an async function with automatic retry on network errors.
 *
 * @param fn      - The async operation to execute
 * @param options - Optional retry configuration
 * @returns       The resolved value of `fn` on success
 * @throws        The last error after all retries are exhausted
 *
 * Validates: Requirements 13.10, 18.6
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const { maxRetries, initialDelayMs, backoffMultiplier } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let lastError: unknown;
  let delayMs = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Do not retry client-side / HTTP status errors
      if (!isNetworkError(error)) {
        throw error;
      }

      // If we've used all retries, break and throw below
      if (attempt >= maxRetries) {
        break;
      }

      // Wait before next attempt (exponential backoff)
      await delay(delayMs);
      delayMs *= backoffMultiplier;
    }
  }

  // All retries exhausted — propagate the last network error
  throw lastError;
}
