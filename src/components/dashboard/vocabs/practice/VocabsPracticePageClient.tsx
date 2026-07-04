"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchVocabPracticePerformance, fetchVocabulary } from "@/lib/redux";
import {
  selectIsAuthenticated,
  selectUserDataLoading,
} from "@/lib/redux/selectors";
import VocabsPracticePage_Main from "./practice";

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

/**
 * Client wrapper for the vocab practice page.
 *
 * Lazily fetches vocabulary progress and practice performance data from the
 * server for authenticated users on first render. Falls back gracefully for
 * unauthenticated users (localStorage is used by the hooks directly).
 */
export default function VocabsPracticePageClient() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectUserDataLoading);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (fetchedRef.current) return;

    fetchedRef.current = true;
    // Fetch both vocabulary (learntVocabs) and practice performance in parallel
    dispatch(fetchVocabulary());
    dispatch(fetchVocabPracticePerformance());
  }, [isAuthenticated, dispatch]);

  const isLoading =
    isAuthenticated && (loading.vocabulary || loading.vocabPracticePerformance);

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] gap-4"
        role="status"
        aria-live="polite"
        aria-label="Loading vocabulary practice"
      >
        <Spinner />
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading your practice data…
        </p>
      </div>
    );
  }

  return <VocabsPracticePage_Main />;
}
