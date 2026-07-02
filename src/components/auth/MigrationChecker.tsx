"use client";

/**
 * MigrationChecker component
 *
 * Side-effect component rendered inside ReduxProvider. After a user
 * successfully logs in (auth state becomes authenticated and sessionChecked),
 * it:
 *  1. Fetches /api/user/data to check whether the database is empty.
 *  2. Checks localStorage for any existing user data.
 *  3. Shows MigrationPrompt when DB is empty AND localStorage has data.
 *  4. Skips the prompt when DB already has data or localStorage is empty.
 *
 * Validates: Requirements 11.1, 11.2, 11.6
 */

import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import type { RootState, AppDispatch } from "@/lib/redux/store";
import { MigrationPrompt } from "./MigrationPrompt";
import { migrateLocalStorageData } from "@/lib/redux/slices/userDataSlice";
import { selectIsUserDataLoading } from "@/lib/redux/selectors";
import type { MigrationSummary } from "@/lib/types/api";

// ─── localStorage keys that hold user-relevant data ───────────────────────────

const LOCAL_STORAGE_DATA_KEYS = [
  "userProfile",
  "practiceStatistics",
  "practiceHistory",
  "savedQuestions",
  "savedCollections",
  "vocabsData",
  "userPreferences",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if any of the known localStorage keys contain non-empty data.
 */
function localStorageHasData(): boolean {
  if (typeof window === "undefined") return false;

  for (const key of LOCAL_STORAGE_DATA_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);

      // Non-null primitives, non-empty arrays, non-empty objects all count
      if (parsed === null || parsed === undefined) continue;
      if (Array.isArray(parsed) && parsed.length === 0) continue;
      if (
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        Object.keys(parsed).length === 0
      )
        continue;

      return true;
    } catch {
      // Unparseable value still counts as "has data"
      if (localStorage.getItem(key)) return true;
    }
  }

  return false;
}

/**
 * Returns true when all seven user-data categories in the API response are
 * empty / null, meaning the user has no database records yet.
 */
function isDatabaseEmpty(data: {
  profile: unknown;
  statistics: unknown;
  sessions: unknown[];
  bookmarks: unknown[];
  collections: unknown[];
  vocabulary: unknown;
  preferences: unknown;
}): boolean {
  if (data.profile !== null && data.profile !== undefined) return false;
  if (data.vocabulary !== null && data.vocabulary !== undefined) return false;
  if (data.preferences !== null && data.preferences !== undefined) return false;
  if (data.sessions.length > 0) return false;
  if (data.bookmarks.length > 0) return false;
  if (data.collections.length > 0) return false;

  // Statistics is an object — empty means no keys
  if (
    typeof data.statistics === "object" &&
    data.statistics !== null &&
    Object.keys(data.statistics).length > 0
  )
    return false;

  return true;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MigrationChecker() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const sessionChecked = useSelector(
    (state: RootState) => state.auth.sessionChecked,
  );
  const isUserDataLoading = useSelector(selectIsUserDataLoading);

  const [showPrompt, setShowPrompt] = useState(false);

  // Track the last user ID for which we ran the check to avoid re-checking
  // when components re-render without the auth state actually changing.
  const checkedForUserId = useRef<string | null>(null);
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? null);

  useEffect(() => {
    // Only run after session has been verified and user is authenticated
    if (!sessionChecked || !isAuthenticated || !userId) return;

    // Avoid running the check more than once per user login
    if (checkedForUserId.current === userId) return;
    checkedForUserId.current = userId;

    async function runMigrationCheck() {
      try {
        // Requirement 11.1 – fetch user data from backend
        const response = await fetch("/api/user/data", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          // If we can't fetch data (e.g. 401, 503), skip the check silently
          return;
        }

        const json = await response.json();
        const userData = json.data;

        if (!userData) return;

        // Requirement 11.2 – check if DB is empty
        const dbEmpty = isDatabaseEmpty({
          profile: userData.profile,
          statistics: userData.statistics,
          sessions: userData.sessions ?? [],
          bookmarks: userData.bookmarks ?? [],
          collections: userData.collections ?? [],
          vocabulary: userData.vocabulary,
          preferences: userData.preferences,
        });

        if (!dbEmpty) {
          // Requirement 11.6 – DB has data, skip prompt
          return;
        }

        // Requirement 11.2 – check if localStorage has data
        if (!localStorageHasData()) return;

        // Requirement 11.3 – show import prompt
        setShowPrompt(true);
      } catch {
        // Network/parse errors — skip migration check silently
      }
    }

    runMigrationCheck();
  }, [sessionChecked, isAuthenticated, userId]);

  // Reset when user logs out so the check will fire again on next login
  useEffect(() => {
    if (!isAuthenticated) {
      checkedForUserId.current = null;
      setShowPrompt(false);
    }
  }, [isAuthenticated]);

  // ── Migration handler ────────────────────────────────────────────────────
  async function handleMigrate(): Promise<MigrationSummary> {
    const result = await dispatch(migrateLocalStorageData());
    if (migrateLocalStorageData.fulfilled.match(result)) {
      toast.success("Your data has been imported successfully!");
      return result.payload;
    }
    throw new Error(
      (result.payload as string | undefined) ?? "Migration failed",
    );
  }

  return (
    <>
      {/* Global data loading indicator — visible top bar + screen reader announcement */}
      {isUserDataLoading && (
        <>
          {/* Visual: thin progress bar at the top of the viewport */}
          <div
            aria-hidden="true"
            className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-transparent"
          >
            <div className="h-full w-full animate-pulse bg-blue-500 origin-left" />
          </div>
          {/* Screen reader announcement */}
          <p role="status" aria-live="polite" className="sr-only">
            Loading your data…
          </p>
        </>
      )}
      <MigrationPrompt
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        onMigrate={handleMigrate}
      />
    </>
  );
}
