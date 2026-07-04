/**
 * User-facing notification utilities
 *
 * Wraps the `sonner` toast library to provide consistent, user-friendly
 * notifications. Internal error details are never exposed — all messages
 * must be safe for end-user display.
 *
 * Validates: Requirements 18.3, 18.4, 18.5
 */

import { toast } from "sonner";

// ── Auth ────────────────────────────────────────────────────────────────────

/**
 * Displays a notification for authentication failures.
 * Validates: Requirement 18.3
 */
export function showAuthError(message: string): void {
  toast.error(message, {
    description: "Please try signing in again.",
    duration: 5000,
  });
}

// ── Network ─────────────────────────────────────────────────────────────────

/**
 * Displays a notification for network / connectivity errors.
 * Validates: Requirement 18.4
 */
export function showNetworkError(message: string): void {
  toast.error(message, {
    description: "Check your connection and try again.",
    duration: 5000,
  });
}

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Displays a notification for input / validation errors.
 * Validates: Requirement 18.5
 */
export function showValidationError(message: string): void {
  toast.error(message, {
    duration: 4000,
  });
}

// ── Success ──────────────────────────────────────────────────────────────────

/**
 * Displays a success notification.
 */
export function showSuccess(message: string): void {
  toast.success(message, {
    duration: 3000,
  });
}

// ── Generic error ────────────────────────────────────────────────────────────

/**
 * Generic error notification for unexpected failures.
 * Validates: Requirements 18.3, 18.4, 18.5
 */
export function showError(message: string): void {
  toast.error(message, {
    duration: 5000,
  });
}
