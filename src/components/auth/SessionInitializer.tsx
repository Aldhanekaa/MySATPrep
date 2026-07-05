"use client";

/**
 * SessionInitializer
 *
 * Runs on app mount to:
 * 1. Dispatch checkSession — the thunk's condition guard ensures it only runs
 *    once (skips if sessionChecked is already true or a check is in-flight).
 * 2. After checkSession resolves, dispatch fetchUserData if authenticated —
 *    the thunk's condition guard ensures it only runs once (skips if
 *    dataInitialized is true or a fetch is in-flight).
 * 3. If the session check fails due to a DB/cloud connection timeout, show a
 *    banner asking the user to try again in a few minutes.
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import {
  checkSession,
  clearConnectionError,
  setSessionChecked,
} from "@/lib/redux/slices/authSlice";
import { fetchUserData } from "@/lib/redux/slices/userDataSlice";
import {
  selectConnectionError,
  selectSessionChecked,
  selectIsAuthenticated,
} from "@/lib/redux/selectors";

function ConnectionErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-x-0 top-0 z-50 flex items-start gap-3 bg-destructive/10 border-b border-destructive/30 px-4 py-3 text-sm text-destructive"
    >
      {/* Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mt-0.5 size-5 shrink-0"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>

      <div className="flex-1">
        <p className="font-medium">Connection timeout</p>
        <p className="text-destructive/80 mt-0.5">
          We couldn&apos;t reach the database right now. Please wait a few
          minutes, then refresh the page or tap &ldquo;Retry&rdquo; below.
        </p>
      </div>

      <button
        onClick={onRetry}
        className="shrink-0 rounded-md bg-destructive/15 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

export function SessionInitializer() {
  const dispatch = useDispatch<AppDispatch>();

  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const sessionChecked = useSelector(selectSessionChecked);
  const connectionError = useSelector(selectConnectionError);

  // Dispatch on mount, and re-dispatch any time sessionChecked is reset to
  // false (e.g. edge cases where state is explicitly cleared). The thunk's
  // condition guard still bails out if a check is already in-flight.
  useEffect(() => {
    if (!sessionChecked) {
      dispatch(checkSession());
    }
  }, [sessionChecked, dispatch]);

  // Once session is confirmed and user is authenticated, fetch their data.
  // The thunk's condition bails out if dataInitialized is true or in-flight.
  useEffect(() => {
    if (!sessionChecked || !isAuthenticated) return;
    dispatch(fetchUserData());
  }, [sessionChecked, isAuthenticated, dispatch]);

  function handleRetry() {
    // Clear the error banner and reset sessionChecked so the thunk's
    // condition guard allows a fresh check to run.
    dispatch(clearConnectionError());
    dispatch(setSessionChecked(false));
    // The useEffect watching sessionChecked will fire and dispatch checkSession.
  }

  if (connectionError) {
    return <ConnectionErrorBanner onRetry={handleRetry} />;
  }

  return null;
}
