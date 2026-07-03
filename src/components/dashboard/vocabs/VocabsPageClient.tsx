"use client";

import { useEffect, useRef } from "react";
import VocabsMainPage from "@/components/dashboard/vocabs/vocabs";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchVocabulary } from "@/lib/redux";
import {
  selectIsAuthenticated,
  selectUserDataLoading,
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

export default function VocabsPageClient() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectUserDataLoading);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (fetchedRef.current) return;
    if (loading.vocabulary) return;

    fetchedRef.current = true;
    dispatch(fetchVocabulary());
  }, [isAuthenticated, loading.vocabulary, dispatch]);

  const isLoading = isAuthenticated && loading.vocabulary;

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] gap-4"
        role="status"
        aria-live="polite"
        aria-label="Loading vocabulary"
      >
        <Spinner />
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading your vocabulary…
        </p>
      </div>
    );
  }

  return <VocabsMainPage />;
}
