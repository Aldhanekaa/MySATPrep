"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { QB_MainHero } from "@/components/questionbank/main-hero";
import { SiteHeader } from "@/app/navbar";
import FooterSection from "@/components/footer";
import { LoadingFallback } from "@/components/ui/loading";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchBookmarksAndCollections } from "@/lib/redux";
import {
  selectIsAuthenticated,
  selectDataInitialized,
  selectUserBookmarks,
  selectUserCollections,
} from "@/lib/redux/selectors";

export default function QuestionBankPageComponent() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const dataInitialized = useAppSelector(selectDataInitialized);
  const bookmarks = useAppSelector(selectUserBookmarks);
  const collections = useAppSelector(selectUserCollections);

  // Guard: only fire the fetch once per mount
  const prefetchedRef = useRef(false);
  // Whether the prefetch is done — gates rendering the main content
  const [prefetchComplete, setPrefetchComplete] = useState(false);

  useEffect(() => {
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
    dataInitialized,
    isAuthenticated,
    bookmarks.length,
    collections.length,
    dispatch,
  ]);

  // Reset when the user logs out so a subsequent login re-fetches
  useEffect(() => {
    if (!isAuthenticated) {
      prefetchedRef.current = false;
      setPrefetchComplete(false);
    }
  }, [isAuthenticated]);

  return (
    <React.Fragment>
      <SiteHeader />

      {/* Data prefetch loading screen — shown only while fetching bookmarks +
          collections for authenticated users. Skipped entirely for
          unauthenticated users so there is zero flash/delay. */}
      {!prefetchComplete ? (
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-4"
          role="status"
          aria-live="polite"
          aria-label="Loading your question bank data"
        >
          <div className="flex space-x-1.5">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s] [animation-duration:0.6s]" />
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s] [animation-duration:0.6s]" />
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.6s]" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading your question bank…
          </p>
        </div>
      ) : (
        <Suspense fallback={<LoadingFallback />}>
          <QB_MainHero />
        </Suspense>
      )}

      <FooterSection />
    </React.Fragment>
  );
}
