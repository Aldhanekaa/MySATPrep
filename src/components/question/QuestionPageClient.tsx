"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchBookmarksAndCollections } from "@/lib/redux";
import {
  selectIsAuthenticated,
  selectDataInitialized,
  selectUserBookmarks,
  selectUserCollections,
  selectSessionChecked,
} from "@/lib/redux/selectors";
import { OptimizedQuestionCard } from "@/components/dashboard/shared/OptimizedQuestionCard";
import { QuestionById_Data } from "@/types/question";

interface QuestionPageClientProps {
  questionData: QuestionById_Data;
}

export default function QuestionPageClient({
  questionData,
}: QuestionPageClientProps) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const sessionChecked = useAppSelector(selectSessionChecked);
  const dataInitialized = useAppSelector(selectDataInitialized);
  const bookmarks = useAppSelector(selectUserBookmarks);
  const collections = useAppSelector(selectUserCollections);

  // Guard: only fire the fetch once per mount
  const prefetchedRef = useRef(false);
  // Whether the prefetch is done — gates rendering the main content
  const [prefetchComplete, setPrefetchComplete] = useState(false);

  useEffect(() => {
    // Wait for the session check to complete before deciding whether to fetch.
    if (!sessionChecked) return;

    // Unauthenticated — nothing to fetch, skip the loading screen entirely
    if (!isAuthenticated) {
      setPrefetchComplete(true);
      return;
    }

    // Wait for fetchUserData/fulfilled — bookmarks must come after user data
    // is initialized so the server can identify the user.
    if (!dataInitialized) return;

    // If bookmarks and collections are already in Redux (loaded elsewhere),
    // skip refetching and unblock immediately
    if (bookmarks.length > 0 || collections.length > 0) {
      setPrefetchComplete(true);
      return;
    }

    // Guard: only run once per component mount
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;

    async function prefetch() {
      try {
        await dispatch(fetchBookmarksAndCollections());
      } catch {
        // Errors are captured inside the thunk; we still unblock the UI
      } finally {
        setPrefetchComplete(true);
      }
    }

    prefetch();
  }, [
    sessionChecked,
    dataInitialized,
    isAuthenticated,
    bookmarks.length,
    collections.length,
    dispatch,
  ]);

  // Reset only when the user actively logs out (isAuthenticated transitions
  // true → false) so a subsequent login re-fetches.
  const wasAuthenticatedRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticatedRef.current = true;
    } else if (wasAuthenticatedRef.current) {
      wasAuthenticatedRef.current = false;
      prefetchedRef.current = false;
      setPrefetchComplete(false);
    }
  }, [isAuthenticated]);

  const questionForCard = {
    questionId: questionData.question.questionId,
    timestamp: new Date().toISOString(),
    questionData: questionData,
    isLoading: false,
    hasError: false,
  };

  // Show loading screen only for authenticated users while fetching
  if (!prefetchComplete) {
    return (
      <main className="w-full flex items-center flex-col min-h-[85vh] py-16 lg:py-32 px-3 md:px-10">
        <div
          className="flex flex-col items-center justify-center gap-4 flex-1 min-h-[60vh]"
          role="status"
          aria-live="polite"
          aria-label={
            !sessionChecked
              ? "Checking your session…"
              : "Loading question data…"
          }
        >
          <div className="flex space-x-1.5">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s] [animation-duration:0.6s]" />
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s] [animation-duration:0.6s]" />
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.6s]" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            {!sessionChecked ? "Checking your session…" : "Loading question…"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full flex items-center flex-col min-h-[85vh] py-16 lg:py-32 px-3 md:px-10">
      <section className="space-y-4 w-full max-w-screen md:max-w-5xl mt-8">
        <OptimizedQuestionCard
          question={questionForCard}
          index={0}
          type="standard"
        />
      </section>
    </main>
  );
}
