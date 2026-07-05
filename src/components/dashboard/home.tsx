"use client";
import React from "react";
import { useState, useEffect, useMemo } from "react";

import { AssessmentWorkspace } from "@/app/dashboard/types";
import { ActivityCard } from "../ui/activity-card";
import { getUserProfile } from "@/lib/userProfile";
import { getPracticeStatistics } from "@/lib/practiceStatistics";
import { UserProfileWithHistory } from "@/types/userProfile";
import { PracticeStatistics } from "@/types/statistics";
import { getSessionHistory, PracticeSession } from "@/types/session";
import { Metric } from "../ui/activity-card";
import SummaryCharts from "./summary/charts";
import { useAppSelector } from "@/lib/redux/hooks";
import {
  selectUserProfile,
  selectUserStatistics,
  selectUserPreferences,
  selectUserSessions,
  selectIsAuthenticated,
} from "@/lib/redux/selectors";

// ── Pure helpers (outside component for stable references) ──────────────────

function calculateTotalTimeSpent(history: PracticeSession[]): number {
  return history.reduce((total, s) => total + (s.totalTimeSpent || 0), 0);
}

function calculateStreakDays(history: PracticeSession[]): number {
  if (history.length === 0) return 0;

  const sorted = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const current = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dayStart = new Date(current);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);

    const hasSession = sorted.some((s) => {
      const d = new Date(s.timestamp);
      return d >= dayStart && d <= dayEnd;
    });

    if (hasSession) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

interface HomeTabProps {
  selectedAssessment?: AssessmentWorkspace;
}

export function HomeTab({ selectedAssessment }: HomeTabProps) {
  // ── Redux state ────────────────────────────────────────────────────────────
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxProfile = useAppSelector(selectUserProfile);
  const reduxStatistics = useAppSelector(selectUserStatistics);
  const reduxPreferences = useAppSelector(selectUserPreferences);
  const reduxSessions = useAppSelector(selectUserSessions);

  // ── Local-storage fallback state (used when not authenticated) ─────────────
  const [localProfile, setLocalProfile] =
    useState<UserProfileWithHistory | null>(null);
  const [localStats, setLocalStats] = useState<PracticeStatistics | null>(null);
  const [localHistory, setLocalHistory] = useState<PracticeSession[]>([]);

  // ── Server-derived total time (authenticated only) ─────────────────────────
  const [serverTotalTimeMs, setServerTotalTimeMs] = useState<number | null>(
    null,
  );

  // ── Server-derived success rate (authenticated only) ──────────────────────
  const [serverSuccessRate, setServerSuccessRate] = useState<number | null>(
    null,
  );

  // ── Loading flags for server fetches ──────────────────────────────────────
  const [isLoadingTime, setIsLoadingTime] = useState(false);
  const [isLoadingSuccessRate, setIsLoadingSuccessRate] = useState(false);

  // ── Resolved data: Redux when authenticated, localStorage otherwise ─────────
  const userProfile = isAuthenticated ? reduxProfile : localProfile;
  const practiceStats = isAuthenticated
    ? (reduxStatistics as PracticeStatistics)
    : localStats;
  const practiceHistory: PracticeSession[] = isAuthenticated
    ? (reduxSessions as unknown as PracticeSession[])
    : localHistory;

  // The assessment key to show stats for:
  //   1. Use the user's saved preference if available
  //   2. Fall back to the workspace selected in the UI
  //   3. Final fallback: "SAT"
  const resolvedAssessmentKey: string = useMemo(() => {
    if (reduxPreferences?.assessment) return reduxPreferences.assessment;
    if (selectedAssessment?.name) return selectedAssessment.name;
    return "SAT";
  }, [reduxPreferences?.assessment, selectedAssessment?.name]);

  // ── Load localStorage data only for unauthenticated users ───────────────────
  useEffect(() => {
    if (isAuthenticated) return;
    try {
      setLocalProfile(getUserProfile());
      setLocalStats(getPracticeStatistics());
      setLocalHistory(getSessionHistory());
    } catch {
      // ignore localStorage read errors
    }
  }, [isAuthenticated]);

  // ── Fetch server-side total time for authenticated users ───────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoadingTime(true);
    fetch("/api/user/sessions/time-spent")
      .then(
        (res) =>
          res.json() as Promise<{
            success?: boolean;
            data?: { totalTimeSpentMs?: number };
          }>,
      )
      .then((json) => {
        if (json?.success && typeof json.data?.totalTimeSpentMs === "number") {
          setServerTotalTimeMs(json.data.totalTimeSpentMs);
        }
      })
      .catch(() => {
        // silently fall back to Redux-derived value
      })
      .finally(() => setIsLoadingTime(false));
  }, [isAuthenticated]);

  // ── Fetch server-side success rate for authenticated users ─────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoadingSuccessRate(true);
    fetch("/api/user/profile/success-rate")
      .then(
        (res) =>
          res.json() as Promise<{
            success?: boolean;
            data?: { successRate?: number };
          }>,
      )
      .then((json) => {
        if (json?.success && typeof json.data?.successRate === "number") {
          setServerSuccessRate(json.data.successRate);
        }
      })
      .catch(() => {
        // silently fall back to Redux-derived value
      })
      .finally(() => setIsLoadingSuccessRate(false));
  }, [isAuthenticated]);

  // ── Derived metrics — useMemo instead of useState+useEffect to avoid an
  //    extra render cycle every time userProfile or practiceHistory change ──────
  const streakDays = useMemo(
    () => calculateStreakDays(practiceHistory),
    [practiceHistory],
  );

  const activityMetrics = useMemo<Metric[]>(() => {
    if (!userProfile) return [];
    // Authenticated: prefer server-aggregated value; fall back to Redux sessions
    // while the fetch is still in-flight (serverTotalTimeMs === null).
    // Unauthenticated: sum from localStorage history.
    const totalTimeMs = isAuthenticated
      ? (serverTotalTimeMs ?? calculateTotalTimeSpent(practiceHistory))
      : calculateTotalTimeSpent(practiceHistory);
    const totalTimeMin = Math.round(totalTimeMs / (1000 * 60));
    const successRate = isAuthenticated
      ? (serverSuccessRate ??
        ((userProfile.questionsAnswered ?? 0) > 0
          ? Math.round(
              ((userProfile.correctAnswers ?? 0) /
                userProfile.questionsAnswered) *
                100,
            )
          : 0))
      : (userProfile.questionsAnswered ?? 0) > 0
        ? Math.round(
            ((userProfile.correctAnswers ?? 0) /
              userProfile.questionsAnswered) *
              100,
          )
        : 0;
    return [
      // {
      //   label: "Total XP",
      //   value: (userProfile.totalXP ?? 0).toString(),
      //   trend: Math.round(
      //     Math.min(100, ((userProfile.totalXP ?? 0) / 1000) * 100),
      //   ),
      //   unit: "XP",
      //   color: "#FF2D55",
      //   prefix: "",
      // },
      {
        label: "Practice Time",
        value: totalTimeMin.toString(),
        trend: Math.round(Math.min(100, (totalTimeMin / 60) * 100)),
        unit: "min",
        color: "#2CD758",
        prefix: "~",
      },
      {
        label: "Success Rate",
        value: successRate.toString(),
        trend: successRate,
        unit: "%",
        color: "#007AFF",
        prefix: "",
      },
    ];
  }, [
    userProfile,
    practiceHistory,
    isAuthenticated,
    serverTotalTimeMs,
    serverSuccessRate,
  ]);
  return (
    <div className="space-y-4 grid grid-cols-7">
      <div className="px-4 col-span-7 md:col-span-4 xl:col-span-5 space-y-4">
        <SummaryCharts
          selectedAssessment={selectedAssessment}
          statistics={
            isAuthenticated
              ? (reduxStatistics as PracticeStatistics)
              : undefined
          }
        />

        {/* User Profile Information */}
        {userProfile && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <h3 className="text-md font-medium">Your Progress</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Level:</span>
                <span className="ml-2 font-semibold">{userProfile.level}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total XP:</span>
                <span className="ml-2 font-semibold">
                  {userProfile.totalXP}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Questions Answered:
                </span>
                <span className="ml-2 font-semibold">
                  {userProfile.questionsAnswered}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Accuracy:</span>
                <span className="ml-2 font-semibold">
                  {userProfile.questionsAnswered > 0
                    ? `${Math.round(
                        (userProfile.correctAnswers /
                          userProfile.questionsAnswered) *
                          100,
                      )}%`
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Practice Statistics for the resolved assessment */}
        {practiceStats && practiceStats[resolvedAssessmentKey] && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <h3 className="text-md font-medium">
              Assessment Progress — {resolvedAssessmentKey}
            </h3>
            <div className="text-sm">
              <div>
                <span className="text-muted-foreground">
                  Questions Answered:
                </span>
                <span className="ml-2 font-semibold">
                  {practiceStats[resolvedAssessmentKey].answeredQuestions
                    ?.length || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Practice History */}
        {practiceHistory.length > 0 && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <h3 className="text-md font-medium">Recent Practice Sessions</h3>
            <div className="space-y-2">
              {practiceHistory
                .slice(-3)
                .reverse()
                .map((session, index) => (
                  <div
                    key={session.sessionId || index}
                    className="flex justify-between items-center p-2 rounded border border-muted"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {session.practiceSelections.subject} -{" "}
                        {session.practiceSelections.domains
                          .map((d) => d.text)
                          .join(", ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(session.timestamp).toLocaleDateString()} •{" "}
                        {session.answeredQuestions.length} questions •{" "}
                        {session.status === "completed"
                          ? "Completed"
                          : "In Progress"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {session.answeredQuestions.length} questions
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.status === "completed" ? "Done" : "Active"}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            {practiceHistory.length > 3 && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                Showing 3 of {practiceHistory.length} recent sessions
              </div>
            )}
          </div>
        )}
      </div>
      <div className="col-span-7 md:col-span-3 xl:col-span-2">
        <ActivityCard
          externalMetrics={activityMetrics}
          externalStreakDays={streakDays}
          onViewDetails={() => {}}
          isLoadingMetrics={
            isAuthenticated && (isLoadingTime || isLoadingSuccessRate)
          }
        />
      </div>
    </div>
  );
}
