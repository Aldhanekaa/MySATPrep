"use client";

/**
 * SyncPrompt component
 *
 * Modal dialog shown when the user logs in and their localStorage data
 * differs from what is already stored in the database. Offers to merge
 * (sync) the localStorage data into the account so it's available across
 * all devices.
 *
 * States: idle → loading → success | error
 */

import { useState, useId, useRef, useEffect } from "react";
import type { MigrationSummary } from "@/lib/types/api";

// ─── Internal state type ──────────────────────────────────────────────────────

type PromptState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "success"; summary: MigrationSummary }
  | { phase: "error"; message: string };

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SyncPromptProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Called when the user confirms the merge; resolves to migration summary */
  onSync: () => Promise<MigrationSummary>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SyncPrompt({ isOpen, onClose, onSync }: SyncPromptProps) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const dialogRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<PromptState>({ phase: "idle" });

  // Reset state when re-opened
  useEffect(() => {
    if (isOpen) setState({ phase: "idle" });
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [isOpen]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && state.phase !== "loading") handleClose();
  }

  function handleClose() {
    setState({ phase: "idle" });
    onClose();
  }

  async function handleSync() {
    setState({ phase: "loading" });
    try {
      const summary = await onSync();
      setState({ phase: "success", summary });
    } catch (err) {
      setState({
        phase: "error",
        message:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.",
      });
    }
  }

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={state.phase !== "loading" ? handleClose : undefined}
      />

      {/* Modal panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={[
          "relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl outline-none",
          "dark:bg-gray-900 dark:shadow-black/60",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h2
            id={titleId}
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            {state.phase === "success" ? "Sync Complete" : "Sync Your Data"}
          </h2>

          {state.phase !== "loading" && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close sync dialog"
              className={[
                "rounded-md p-1.5 text-gray-400 transition-colors",
                "hover:bg-gray-100 hover:text-gray-600",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                "dark:hover:bg-gray-800 dark:hover:text-gray-300",
              ].join(" ")}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* ── Idle state ── */}
          {state.phase === "idle" && (
            <>
              {/* Recommended badge */}
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
                    "dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
                  ].join(" ")}
                >
                  <svg
                    className="h-3.5 w-3.5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Recommended
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                We detected practice data in your browser that is different from
                what&apos;s stored in your account. Syncing is recommended to
                keep your progress available across all your devices.
              </p>

              <ul className="flex flex-col gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                {[
                  "Merges local bookmarks and collections into your account",
                  "Adds any new practice sessions not yet saved",
                  "Combines vocabulary and statistics progress",
                  "Existing account data is never overwritten",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 shrink-0 text-blue-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className={[
                    "rounded-md px-4 py-2 text-sm font-medium",
                    "text-gray-700 dark:text-gray-300",
                    "border border-gray-300 dark:border-gray-600",
                    "hover:bg-gray-50 dark:hover:bg-gray-800",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                    "transition-colors",
                  ].join(" ")}
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={handleSync}
                  className={[
                    "rounded-md px-4 py-2 text-sm font-medium text-white",
                    "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                    "transition-colors dark:bg-blue-500 dark:hover:bg-blue-600",
                  ].join(" ")}
                >
                  Sync Data
                </button>
              </div>
            </>
          )}

          {/* ── Loading state ── */}
          {state.phase === "loading" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <svg
                className="h-10 w-10 animate-spin text-blue-500"
                viewBox="0 0 24 24"
                fill="none"
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
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <p
                role="status"
                aria-live="polite"
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Syncing your data, please wait…
              </p>
            </div>
          )}

          {/* ── Success state ── */}
          {state.phase === "success" && (
            <>
              <div
                role="status"
                aria-live="polite"
                className="flex flex-col gap-3"
              >
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <svg
                    className="h-5 w-5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p className="text-sm font-medium">
                    Your data has been synced successfully.
                  </p>
                </div>
                <SyncSummaryDisplay summary={state.summary} />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className={[
                    "rounded-md px-4 py-2 text-sm font-medium text-white",
                    "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                    "transition-colors dark:bg-blue-500 dark:hover:bg-blue-600",
                  ].join(" ")}
                >
                  Done
                </button>
              </div>
            </>
          )}

          {/* ── Error state ── */}
          {state.phase === "error" && (
            <>
              <div
                role="alert"
                aria-live="assertive"
                className={[
                  "rounded-md border border-red-200 bg-red-50 px-3 py-2",
                  "text-sm text-red-700",
                  "dark:border-red-800 dark:bg-red-950 dark:text-red-300",
                ].join(" ")}
              >
                {state.message}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className={[
                    "rounded-md px-4 py-2 text-sm font-medium",
                    "text-gray-700 dark:text-gray-300",
                    "border border-gray-300 dark:border-gray-600",
                    "hover:bg-gray-50 dark:hover:bg-gray-800",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                    "transition-colors",
                  ].join(" ")}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleSync}
                  className={[
                    "rounded-md px-4 py-2 text-sm font-medium text-white",
                    "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                    "transition-colors dark:bg-blue-500 dark:hover:bg-blue-600",
                  ].join(" ")}
                >
                  Retry
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sync summary sub-component ───────────────────────────────────────────────

function SyncSummaryDisplay({ summary }: { summary: MigrationSummary }) {
  const rows: { label: string; value: string }[] = [
    {
      label: "Profile",
      value: summary.profileMigrated ? "Synced" : "Skipped",
    },
    {
      label: "Statistics",
      value: summary.statisticsMigrated ? "Synced" : "Skipped",
    },
    {
      label: "Practice sessions",
      value:
        summary.sessionsMigrated > 0
          ? `${summary.sessionsMigrated} synced`
          : "None found",
    },
    {
      label: "Bookmarks",
      value:
        summary.bookmarksMigrated > 0
          ? `${summary.bookmarksMigrated} synced`
          : "None found",
    },
    {
      label: "Collections",
      value:
        summary.collectionsMigrated > 0
          ? `${summary.collectionsMigrated} synced`
          : "None found",
    },
    {
      label: "Vocabulary",
      value: summary.vocabularyMigrated ? "Synced" : "Skipped",
    },
    {
      label: "Preferences",
      value: summary.preferencesMigrated ? "Synced" : "Skipped",
    },
    {
      label: "Question notes",
      value: summary.notesMigrated ? "Synced" : "Skipped",
    },
    {
      label: "Answer history",
      value: summary.answerHistoryMigrated ? "Synced" : "Skipped",
    },
    {
      label: "Vocab performance",
      value: summary.practicePerformanceMigrated ? "Synced" : "Skipped",
    },
  ];

  return (
    <dl className="divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
      {rows.map(({ label, value }) => (
        <div
          key={label}
          className="flex items-center justify-between px-3 py-1.5 text-sm"
        >
          <dt className="text-gray-600 dark:text-gray-400">{label}</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
