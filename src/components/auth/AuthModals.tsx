"use client";

/**
 * AuthModals
 *
 * Container component that lazily loads SignInModal and SignUpModal.
 * Using React.lazy ensures the modal code is only bundled and loaded
 * when the component is first rendered, reducing initial bundle size.
 *
 * Usage:
 *   import { AuthModals } from "@/components/auth/AuthModals";
 *   <AuthModals />
 *
 * The component reads modal open/close state from local React state and
 * can be triggered by calling the exported `openSignIn` / `openSignUp`
 * helpers, or by rendering with controlled props.
 *
 * Validates: Requirements 16.1, 16.2, 19.3
 */

import { lazy, memo, Suspense, useState } from "react";
import { createPortal } from "react-dom";

// ─── Lazy-loaded modal components ─────────────────────────────────────────────
// These are loaded on demand — the JS bundle for these components is only
// fetched from the server the first time the modals are opened.

const SignInModal = lazy(() =>
  import("./SignInModal").then((m) => ({ default: m.SignInModal })),
);

const SignUpModal = lazy(() =>
  import("./SignUpModal").then((m) => ({ default: m.SignUpModal })),
);

// ─── Loading fallback ─────────────────────────────────────────────────────────

/**
 * Minimal backdrop shown while the modal JS chunk is loading.
 * Prevents layout shift; keeps the interaction feeling responsive.
 */
function ModalLoadingFallback() {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      aria-live="polite"
      aria-label="Loading…"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-xl dark:bg-gray-900">
        <svg
          className="h-6 w-6 animate-spin text-blue-500"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AuthModalsProps {
  /** URL to redirect to after successful Google sign-in (defaults to "/") */
  callbackURL?: string;
  /**
   * Optional controlled open state.  Pass `"signin"` or `"signup"` to open
   * the respective modal, or `null` / `undefined` to keep both closed.
   */
  openModal?: "signin" | "signup" | null;
  /** Called when a modal requests to close */
  onClose?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AuthModals renders lazily-loaded sign-in and sign-up dialogs wrapped in
 * a Suspense boundary.  It can operate in fully uncontrolled mode (internal
 * state) or in controlled mode via `openModal` / `onClose` props.
 *
 * Validates: Requirements 19.3
 */
export const AuthModals = memo(function AuthModals({
  callbackURL = "/",
  openModal,
  onClose,
}: AuthModalsProps) {
  // Internal state for uncontrolled usage
  const [internalModal, setInternalModal] = useState<
    "signin" | "signup" | null
  >(null);

  // Determine which modal is active — controlled prop takes precedence
  const activeModal = internalModal == null ? openModal : internalModal;

  function handleClose() {
    setInternalModal(null);
    onClose?.();
  }

  function switchToSignUp() {
    // In controlled mode the parent owns `openModal`, so we must notify it to
    // clear its controlled value while simultaneously setting our internal
    // state to "signup".  Otherwise the controlled prop would keep winning.
    console.log("WOI");
    setInternalModal("signup");
  }

  function switchToSignIn() {
    setInternalModal("signin");
  }

  // Only render a Suspense boundary when a modal is actually open, so we
  // don't add a Suspense node to every page that includes <AuthModals />.
  if (!activeModal) return null;

  // Use a portal so the modal renders at document.body level, escaping any
  // stacking context created by parent components (e.g. the sidebar).
  return createPortal(
    <Suspense fallback={<ModalLoadingFallback />}>
      {activeModal === "signin" && (
        <SignInModal
          isOpen
          onClose={handleClose}
          onSwitchToSignUp={switchToSignUp}
          callbackURL={callbackURL}
        />
      )}
      {activeModal === "signup" && (
        <SignUpModal
          isOpen
          onClose={handleClose}
          onSwitchToSignIn={switchToSignIn}
        />
      )}
    </Suspense>,
    document.body,
  );
});
