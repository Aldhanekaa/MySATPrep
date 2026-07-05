"use client";

/**
 * SignInModal component
 *
 * Renders a modal dialog for signing in via Google OAuth or email/password.
 * Includes a link to switch to the SignUpModal.
 *
 * Validates: Requirements 16.1, 16.5, 16.6, 19.2
 */

import { memo, useEffect, useId, useRef } from "react";
import { useSelector } from "react-redux";
import { selectAuthLoading, selectAuthError } from "@/lib/redux/selectors";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { EmailPasswordForm } from "./EmailPasswordForm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns all focusable elements inside a container, in DOM order. */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled"));
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SignInModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Called when the user clicks "Sign up" to switch to the registration modal */
  onSwitchToSignUp: () => void;
  /** URL to redirect to after successful Google OAuth (defaults to "/") */
  callbackURL?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SignInModal = memo(function SignInModal({
  isOpen,
  onClose,
  onSwitchToSignUp,
  callbackURL = "/",
}: SignInModalProps) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const errorBannerId = `${uid}-error`;
  const dialogRef = useRef<HTMLDivElement>(null);

  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  // ── Focus management ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      // Move focus into the modal when it opens
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  // ── Keyboard handling (Escape + focus trap) ──────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
      return;
    }

    if (e.key === "Tab" && dialogRef.current) {
      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if focus is on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if focus is on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] "
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
    >
      <div className="relative w-full h-full z-[200] flex items-center justify-center p-4">
        {/* Scrim */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div
          ref={dialogRef}
          tabIndex={-1}
          aria-describedby={error ? errorBannerId : undefined}
          className={[
            "relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl outline-none",
            "dark:bg-gray-900 dark:shadow-black/60",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <h2
              id={titleId}
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              Sign in to MySATPrep
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sign in dialog"
              className={[
                "rounded-md p-1.5 text-gray-400 transition-colors",
                "hover:bg-gray-100 hover:text-gray-600",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                "dark:hover:bg-gray-800 dark:hover:text-gray-300",
              ].join(" ")}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Loading overlay announcement (for screen readers) */}
            {loading && (
              <p role="status" aria-live="polite" className="sr-only">
                Signing in, please wait…
              </p>
            )}

            {/* Redux error banner (catches errors not shown inline by the form) */}
            {error && (
              <div
                id={errorBannerId}
                role="alert"
                aria-live="assertive"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
              >
                {error}
              </div>
            )}

            {/* Google OAuth */}
            <GoogleSignInButton callbackURL={callbackURL} />

            {/* Divider */}
            <div className="flex items-center gap-3" aria-hidden="true">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 dark:text-gray-500">
                or
              </span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Email / password form */}
            <EmailPasswordForm mode="signin" onSuccess={onClose} />

            {/* Switch to sign up */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className={[
                  "font-medium text-blue-600 underline-offset-2",
                  "hover:underline focus-visible:outline-2 focus-visible:outline-offset-2",
                  "focus-visible:outline-blue-500 dark:text-blue-400",
                ].join(" ")}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
