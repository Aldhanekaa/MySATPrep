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
 *  4. Shows SyncPrompt when DB already has data but localStorage differs.
 *  5. Skips both prompts when localStorage is empty or data is identical.
 *
 * Validates: Requirements 11.1, 11.2, 11.6
 */

import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import type { RootState, AppDispatch } from "@/lib/redux/store";
import { MigrationPrompt } from "./MigrationPrompt";
import { SyncPrompt } from "./SyncPrompt";
import {
  migrateLocalStorageData,
  syncLocalStorageData,
} from "@/lib/redux/slices/userDataSlice";
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

/**
 * Reads the localStorage data payload (same shape as the migration endpoint)
 * and compares it against the fetched DB data. Returns true if localStorage
 * contains data that isn't already reflected in the database.
 *
 * The check is intentional shallow/structural — we're not doing a deep-equal
 * of every field, just detecting whether there's something meaningful in
 * localStorage that the DB doesn't have (e.g. more bookmarks, sessions, etc.).
 */
function localStorageDiffersFromDb(dbData: {
  profile: unknown;
  statistics: unknown;
  sessions: { sessionId?: string }[];
  bookmarks: { questionId?: string }[];
  collections: { collectionId?: string }[];
  vocabulary: unknown;
  preferences: unknown;
}): boolean {
  if (typeof window === "undefined") return false;

  try {
    // ── Bookmarks ─────────────────────────────────────────────────────────────
    const rawBookmarks = localStorage.getItem("savedQuestions");
    if (rawBookmarks) {
      const parsed = JSON.parse(rawBookmarks);
      const localBookmarks: { questionId?: string }[] = Array.isArray(parsed)
        ? parsed
        : (Object.values(parsed).flat() as { questionId?: string }[]);

      if (localBookmarks.length > 0) {
        const dbQuestionIds = new Set(
          dbData.bookmarks.map((b) => b.questionId).filter(Boolean),
        );
        const hasNew = localBookmarks.some(
          (b) => b.questionId && !dbQuestionIds.has(b.questionId),
        );
        if (hasNew) return true;
      }
    }
  } catch {
    // ignore parse errors
  }

  try {
    // ── Sessions ──────────────────────────────────────────────────────────────
    const rawSessions = localStorage.getItem("practiceHistory");
    if (rawSessions) {
      const localSessions: { sessionId?: string }[] = JSON.parse(rawSessions);
      if (Array.isArray(localSessions) && localSessions.length > 0) {
        const dbSessionIds = new Set(
          dbData.sessions.map((s) => s.sessionId).filter(Boolean),
        );
        const hasNew = localSessions.some(
          (s) => s.sessionId && !dbSessionIds.has(s.sessionId),
        );
        if (hasNew) return true;
      }
    }
  } catch {
    // ignore parse errors
  }

  try {
    // ── Collections ───────────────────────────────────────────────────────────
    const rawCollections = localStorage.getItem("savedCollections");
    if (rawCollections) {
      const parsed = JSON.parse(rawCollections);
      const localCollections: { collectionId?: string }[] = Array.isArray(
        parsed,
      )
        ? parsed
        : Object.entries(parsed).map(([id, col]) => ({
            ...(col as object),
            collectionId: id,
          }));

      if (localCollections.length > 0) {
        const dbCollectionIds = new Set(
          dbData.collections.map((c) => c.collectionId).filter(Boolean),
        );
        const hasNew = localCollections.some(
          (c) => c.collectionId && !dbCollectionIds.has(c.collectionId),
        );
        if (hasNew) return true;
      }
    }
  } catch {
    // ignore parse errors
  }

  try {
    // ── Profile (compare questionsAnswered as a quick proxy) ──────────────────
    const rawProfile = localStorage.getItem("userProfile");
    if (rawProfile && dbData.profile === null) {
      const localProfile = JSON.parse(rawProfile);
      if (
        typeof localProfile === "object" &&
        localProfile !== null &&
        (localProfile.questionsAnswered > 0 || localProfile.totalXP > 0)
      ) {
        return true;
      }
    }
  } catch {
    // ignore parse errors
  }

  try {
    // ── Statistics (check if there are answeredQuestions not in DB) ───────────
    const rawStats = localStorage.getItem("practiceStatistics");
    if (rawStats) {
      const localStats = JSON.parse(rawStats);
      if (typeof localStats === "object" && localStats !== null) {
        const dbStats =
          typeof dbData.statistics === "object" && dbData.statistics !== null
            ? (dbData.statistics as Record<
                string,
                { answeredQuestions?: string[] }
              >)
            : {};

        for (const [assessment, data] of Object.entries(localStats)) {
          const localAnswered: string[] =
            (data as { answeredQuestions?: string[] }).answeredQuestions ?? [];
          const dbAnswered: string[] =
            dbStats[assessment]?.answeredQuestions ?? [];

          if (localAnswered.length > dbAnswered.length) return true;
        }
      }
    }
  } catch {
    // ignore parse errors
  }

  try {
    // ── Vocabulary ────────────────────────────────────────────────────────────
    const rawVocab = localStorage.getItem("vocabsData");
    if (rawVocab && dbData.vocabulary === null) {
      const localVocab = JSON.parse(rawVocab);
      if (
        typeof localVocab === "object" &&
        localVocab !== null &&
        Object.keys(localVocab).length > 0
      ) {
        return true;
      }
    }
  } catch {
    // ignore parse errors
  }

  return false;
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
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);

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

        if (dbEmpty) {
          // DB has no data — show the initial import prompt if localStorage has data
          if (!localStorageHasData()) return;
          setShowPrompt(true);
          return;
        }

        // DB already has data — check if localStorage has new/different data
        if (!localStorageHasData()) return;

        const differs = localStorageDiffersFromDb({
          profile: userData.profile,
          statistics: userData.statistics,
          sessions: (userData.sessions ?? []) as { sessionId?: string }[],
          bookmarks: (userData.bookmarks ?? []) as { questionId?: string }[],
          collections: (userData.collections ?? []) as {
            collectionId?: string;
          }[],
          vocabulary: userData.vocabulary,
          preferences: userData.preferences,
        });

        if (differs) {
          setShowSyncPrompt(true);
        }
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
      setShowSyncPrompt(false);
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

  // ── Sync handler (merge local + Redux state, upsert to DB) ─────────────────
  async function handleSync(): Promise<MigrationSummary> {
    const result = await dispatch(syncLocalStorageData());
    if (syncLocalStorageData.fulfilled.match(result)) {
      toast.success("Your data has been synced successfully!");
      return result.payload;
    }
    throw new Error((result.payload as string | undefined) ?? "Sync failed");
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
      <SyncPrompt
        isOpen={showSyncPrompt}
        onClose={() => setShowSyncPrompt(false)}
        onSync={handleSync}
      />
    </>
  );
}
