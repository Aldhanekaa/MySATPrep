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
import type { AppDispatch } from "@/lib/redux/store";
import { MigrationPrompt } from "./MigrationPrompt";
import { SyncPrompt } from "./SyncPrompt";
import {
  migrateLocalStorageData,
  syncLocalStorageData,
} from "@/lib/redux/slices/userDataSlice";
import {
  selectIsUserDataLoading,
  selectIsAuthenticated,
  selectSessionChecked,
  selectUser,
} from "@/lib/redux/selectors";
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
  "questionNotes",
  "practicePerformanceData",
  "answerHistory",
] as const;

// ─── Sync-check cache ─────────────────────────────────────────────────────────

/** localStorage key that records when the last sync check was performed. */
const SYNC_CHECK_KEY = "migrationCheckerLastRun";

/** How long (ms) before the sync check is considered stale and re-runs. */
const SYNC_CHECK_TTL_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

/**
 * Returns true if a sync check was performed recently (within the TTL window)
 * for the given userId, meaning we can skip the fetch this time.
 */
function isSyncCheckFresh(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(SYNC_CHECK_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { userId?: string; ts?: number };
    if (parsed.userId !== userId || typeof parsed.ts !== "number") return false;
    return Date.now() - parsed.ts < SYNC_CHECK_TTL_MS;
  } catch {
    return false;
  }
}

/**
 * Saves the current timestamp for the given userId so subsequent logins within
 * the TTL window skip the heavy complete-data fetch.
 */
function stampSyncCheck(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      SYNC_CHECK_KEY,
      JSON.stringify({ userId, ts: Date.now() }),
    );
  } catch {
    // Quota or SSR — ignore
  }
}

/**
 * Clears the sync-check timestamp so the check runs again on the next login
 * (e.g. after logout or after a successful migration/sync).
 */
function clearSyncCheck(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SYNC_CHECK_KEY);
  } catch {
    // ignore
  }
}

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

interface LocalDbDiff {
  differs: boolean;
  details: {
    bookmarks?: { localOnly: string[] };
    sessions?: { localOnly: string[] };
    collections?: { localOnly: string[] };
    profile?: { reason: string };
    statistics?: { assessment: string; localCount: number; dbCount: number }[];
    vocabulary?: { reason: string };
  };
}

/**
 * Reads the localStorage data payload (same shape as the migration endpoint)
 * and compares it against the fetched DB data. Returns a diff object with
 * `differs` flag and `details` describing exactly what is out of sync.
 *
 * The check is intentionally shallow/structural — we're not doing a deep-equal
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
}): LocalDbDiff {
  if (typeof window === "undefined") return { differs: false, details: {} };

  const details: LocalDbDiff["details"] = {};

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
        const localOnly = localBookmarks
          .map((b) => b.questionId)
          .filter((id): id is string => !!id && !dbQuestionIds.has(id));
        if (localOnly.length > 0) details.bookmarks = { localOnly };
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
        const localOnly = localSessions
          .map((s) => s.sessionId)
          .filter((id): id is string => !!id && !dbSessionIds.has(id));
        if (localOnly.length > 0) details.sessions = { localOnly };
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
        const localOnly = localCollections
          .map((c) => c.collectionId)
          .filter((id): id is string => !!id && !dbCollectionIds.has(id));
        if (localOnly.length > 0) details.collections = { localOnly };
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
        details.profile = {
          reason: `local has questionsAnswered=${localProfile.questionsAnswered}, totalXP=${localProfile.totalXP} but DB profile is null`,
        };
      }
    }
  } catch {
    // ignore parse errors
  }

  try {
    // ── Statistics ────────────────────────────────────────────────────────────
    // Compare both answeredQuestions count (legacy check) AND
    // answeredQuestionsDetailed count (new check). DB rows may be in either
    // the old format (with plainQuestion) or new format (with primary_class_cd).
    // We compare by count rather than deep content to stay format-agnostic.
    const rawStats = localStorage.getItem("practiceStatistics");
    if (rawStats) {
      const localStats = JSON.parse(rawStats);
      if (typeof localStats === "object" && localStats !== null) {
        const dbStats =
          typeof dbData.statistics === "object" && dbData.statistics !== null
            ? (dbData.statistics as Record<
                string,
                {
                  answeredQuestions?: string[];
                  answeredQuestionsDetailed?: unknown[];
                }
              >)
            : {};

        const statsDetails: NonNullable<LocalDbDiff["details"]["statistics"]> =
          [];

        for (const [assessment, data] of Object.entries(localStats)) {
          const localAnswered: string[] =
            (
              data as {
                answeredQuestions?: string[];
                answeredQuestionsDetailed?: unknown[];
              }
            ).answeredQuestions ?? [];

          const localDetailed: unknown[] =
            (
              data as {
                answeredQuestionsDetailed?: unknown[];
              }
            ).answeredQuestionsDetailed ?? [];

          const dbAnswered: string[] =
            dbStats[assessment]?.answeredQuestions ?? [];

          const dbDetailed: unknown[] =
            dbStats[assessment]?.answeredQuestionsDetailed ?? [];

          // Flag if either the flat ID list OR the detailed list has more
          // entries locally than in the DB. Use the larger of the two counts
          // as the representative local count so the UI message is accurate.
          const localCount = Math.max(
            localAnswered.length,
            localDetailed.length,
          );
          const dbCount = Math.max(dbAnswered.length, dbDetailed.length);

          if (localCount > dbCount) {
            statsDetails.push({
              assessment,
              localCount,
              dbCount,
            });
          }
        }
        if (statsDetails.length > 0) details.statistics = statsDetails;
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
        details.vocabulary = {
          reason: `local has ${Object.keys(localVocab).length} vocab entries but DB vocabulary is null`,
        };
      }
    }
  } catch {
    // ignore parse errors
  }

  return { differs: Object.keys(details).length > 0, details };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MigrationChecker() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const sessionChecked = useSelector(selectSessionChecked);
  const isUserDataLoading = useSelector(selectIsUserDataLoading);

  const [showPrompt, setShowPrompt] = useState(false);
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);

  // Track the last user ID for which we ran the check to avoid re-checking
  // when components re-render without the auth state actually changing.
  const checkedForUserId = useRef<string | null>(null);
  const user = useSelector(selectUser);
  const userId = user?.id ?? null;

  useEffect(() => {
    // Only run after session has been verified and user is authenticated
    if (!sessionChecked || !isAuthenticated || !userId) return;

    // Avoid running the check more than once per user login
    if (checkedForUserId.current === userId) return;
    checkedForUserId.current = userId;

    async function runMigrationCheck() {
      // Skip the expensive DB fetch if the check was performed recently
      if (userId && isSyncCheckFresh(userId)) return;

      try {
        // Requirement 11.1 – fetch user data from backend
        const response = await fetch("/api/user/complete-data", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          // If we can't fetch data (e.g. 401, 503), skip the check silently
          return;
        }

        const json = (await response.json()) as {
          data?: Parameters<typeof isDatabaseEmpty>[0] & {
            sessions?: unknown[];
            bookmarks?: unknown[];
            collections?: unknown[];
          };
        };
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
          if (!localStorageHasData()) {
            // Nothing to do — stamp so we don't re-check for 5 days
            if (userId) stampSyncCheck(userId);
            return;
          }
          // Don't stamp here — we want to re-check after migration completes
          setShowPrompt(true);
          return;
        }

        // DB already has data — check if localStorage has new/different data
        if (!localStorageHasData()) {
          if (userId) stampSyncCheck(userId);
          return;
        }

        const { differs, details } = localStorageDiffersFromDb({
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

        console.debug("[DEBUG] userData complete", userData);

        if (differs) {
          console.debug("[MigrationChecker] localStorage ↔ DB diff:", details);
          // Don't stamp here either — we want to re-check after sync completes
          setShowSyncPrompt(true);
        } else {
          // Data is already in sync — stamp so we don't re-check for 5 days
          if (userId) stampSyncCheck(userId);
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
      clearSyncCheck();
    }
  }, [isAuthenticated]);

  // ── Migration handler ────────────────────────────────────────────────────
  async function handleMigrate(): Promise<MigrationSummary> {
    const result = await dispatch(migrateLocalStorageData());
    if (migrateLocalStorageData.fulfilled.match(result)) {
      toast.success("Your data has been imported successfully!");
      // Stamp and reset so the next login re-checks from a clean slate
      if (userId) stampSyncCheck(userId);
      checkedForUserId.current = null;
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
      // Stamp and reset so the next login re-checks from a clean slate
      if (userId) stampSyncCheck(userId);
      checkedForUserId.current = null;
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
