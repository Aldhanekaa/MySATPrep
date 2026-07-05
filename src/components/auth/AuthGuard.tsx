"use client";

/**
 * AuthGuard component
 *
 * Higher-Order Component (HOC) / wrapper that protects routes requiring
 * authentication. While the session is being verified, a loading spinner
 * is shown. Once the session check is complete, unauthenticated users are
 * redirected to the home page (which hosts the sign-in flow) and authenticated
 * users see the wrapped children normally.
 *
 * Validates: Requirement 16.4
 */

import { memo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectAuthLoading,
  selectSessionChecked,
} from "@/lib/redux/selectors";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AuthGuardProps {
  /** The protected content to render when the user is authenticated. */
  children: React.ReactNode;
  /**
   * Path to redirect unauthenticated users to.
   * Defaults to "/" (home page, which hosts the sign-in flow).
   */
  redirectTo?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AuthGuard wraps protected page content and ensures only authenticated users
 * can view it.
 *
 * Behaviour:
 * - Renders a full-page loading spinner while `sessionChecked` is false.
 * - Redirects to `redirectTo` (default: "/") when the session has been checked
 *   and the user is not authenticated.
 * - Renders `children` when the user is authenticated.
 *
 * @example
 * // In a Next.js App Router page:
 * export default function DashboardPage() {
 *   return (
 *     <AuthGuard>
 *       <Dashboard />
 *     </AuthGuard>
 *   );
 * }
 */
export const AuthGuard = memo(function AuthGuard({
  children,
  redirectTo = "/",
}: AuthGuardProps) {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const sessionChecked = useSelector(selectSessionChecked);

  // Redirect unauthenticated users once the session check has completed.
  useEffect(() => {
    if (sessionChecked && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [sessionChecked, isAuthenticated, redirectTo, router]);

  // ── Loading state ──────────────────────────────────────────────────────────
  // Show a spinner while the session is being verified (or while an auth
  // operation is in-flight after the initial check).
  if (!sessionChecked || (sessionChecked && !isAuthenticated) || loading) {
    const isRedirecting = sessionChecked && !isAuthenticated && !loading;

    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={
          isRedirecting
            ? "Redirecting to sign in…"
            : "Verifying authentication…"
        }
        className={[
          "flex min-h-screen flex-col items-center justify-center gap-3",
          "bg-white dark:bg-gray-950",
        ].join(" ")}
      >
        {/* Accessible spinner */}
        <svg
          className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          focusable="false"
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

        {isRedirecting && (
          <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
            Redirecting to sign in…
          </p>
        )}

        <span className="sr-only">
          {isRedirecting
            ? "Redirecting to sign in…"
            : "Verifying authentication…"}
        </span>
      </div>
    );
  }

  // ── Authenticated ──────────────────────────────────────────────────────────
  return <>{children}</>;
});
