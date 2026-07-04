"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/redux/hooks";
import {
  selectIsAuthenticated,
  selectSessionChecked,
} from "@/lib/redux/selectors";
import { SessionStatus } from "@/types/session";
import type { PracticeSession } from "@/types/session";

/**
 * Shows a "Continue Where You Left Off" button when an in-progress session exists.
 *
 * Source of truth:
 * - Authenticated users → GET /api/user/sessions/current
 *   No localStorage involved at all.
 * - Unauthenticated users → localStorage["currentPracticeSession"]
 *
 * Default: renders nothing until resolution is complete (prevents flash).
 */
export default function ContinuePracticeRushButton() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const sessionChecked = useAppSelector(selectSessionChecked);

  // null  = still resolving → render nothing
  // false = no active session → render nothing
  // true  = active session confirmed → render button
  const [hasActiveSession, setHasActiveSession] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    // Wait for the auth session check so we never flash on first paint
    if (!sessionChecked) return;

    if (isAuthenticated) {
      // ── Authenticated: ask the dedicated API endpoint ─────────────────────
      fetch("/api/user/sessions/current", {
        method: "GET",
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) {
            setHasActiveSession(false);
            return null;
          }
          return res.json() as Promise<{
            data?: { session?: PracticeSession };
          }>;
        })
        .then((json) => {
          if (!json) return;
          const session: PracticeSession | null = json.data?.session ?? null;
          setHasActiveSession(
            session !== null && session.status === SessionStatus.IN_PROGRESS,
          );
        })
        .catch(() => setHasActiveSession(false));
    } else {
      // ── Unauthenticated: use localStorage ────────────────────────────────
      try {
        const raw = localStorage.getItem("currentPracticeSession");
        if (!raw || raw.trim() === "") {
          setHasActiveSession(false);
          return;
        }
        const session: PracticeSession = JSON.parse(raw);
        setHasActiveSession(
          session.status === SessionStatus.IN_PROGRESS &&
            !!session.practiceSelections &&
            !!session.sessionId,
        );
      } catch {
        setHasActiveSession(false);
      }
    }
  }, [sessionChecked, isAuthenticated]);

  // Render nothing until resolved, and nothing when there is no active session
  if (!hasActiveSession) return null;

  return (
    <Link
      href="/practice?session=continue"
      className="mb-10 hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
    >
      <span className="text-foreground text-sm">
        Continue Where You Left Off
      </span>
      <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700" />

      <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
        <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
          <span className="flex size-6">
            <ArrowRight className="m-auto size-3" />
          </span>
          <span className="flex size-6">
            <ArrowRight className="m-auto size-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
