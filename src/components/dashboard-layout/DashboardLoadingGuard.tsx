"use client";

/**
 * DashboardLoadingGuard
 *
 * Renders a full-screen loading overlay while either:
 *  - auth.loading is true (session check / login in progress), OR
 *  - userData.loading.profile is true (fetchUserData pending)
 *
 * Once both resolve, children are rendered normally.
 *
 * Also kicks off a one-time lazy fetch of answerHistory for the entire
 * dashboard session, so individual pages (tracker, answered) don't each
 * need to dispatch it independently.
 */

import React, { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchAnswerHistory } from "@/lib/redux";
import {
  selectAuthLoading,
  selectSessionChecked,
  selectUserDataLoading,
  selectIsAuthenticated,
} from "@/lib/redux/selectors";

function Spinner() {
  return (
    <svg
      className="size-8 animate-spin text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

interface DashboardLoadingGuardProps {
  children: React.ReactNode;
}

export function DashboardLoadingGuard({
  children,
}: DashboardLoadingGuardProps) {
  const dispatch = useAppDispatch();
  const authLoading = useAppSelector(selectAuthLoading);
  const sessionChecked = useAppSelector(selectSessionChecked);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const userDataLoading = useAppSelector(selectUserDataLoading);

  // Fetch answer history exactly once per dashboard session.
  // useRef ensures this never fires more than once regardless of re-renders.
  const answerHistoryFetched = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !answerHistoryFetched.current) {
      answerHistoryFetched.current = true;
      dispatch(fetchAnswerHistory());
    }
  }, [isAuthenticated, dispatch]);

  // Show loader ONLY when authenticated AND data is loading:
  //  1. Session hasn't been checked yet (initial auth check in progress)
  //  2. Auth is actively loading while authenticated
  //  3. User is authenticated but profile data is still being fetched
  //
  // For unauthenticated users:
  //  - Once sessionChecked is true and isAuthenticated is false,
  //    we skip the loading screen entirely and render immediately
  const isLoading =
    !sessionChecked ||
    (isAuthenticated && authLoading) ||
    (isAuthenticated && userDataLoading.profile);

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4"
        role="status"
        aria-live="polite"
        aria-label="Loading dashboard"
      >
        <Spinner />
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading your dashboard…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
