"use client";
import React from "react";
import { useState, useEffect } from "react";

import { AssessmentWorkspace } from "@/app/dashboard/types";
import { ActivityCard } from "../ui/activity-card";
import { getUserProfile } from "@/lib/userProfile";
import { getPracticeStatistics } from "@/lib/practiceStatistics";
import { UserProfileWithHistory } from "@/types/userProfile";
import { PracticeStatistics } from "@/types/statistics";
import { getSessionHistory, PracticeSession } from "@/types/session";
import { Metric } from "../ui/activity-card";
import SummaryCharts from "./summary/charts";

interface HomeTabProps {
  selectedAssessment?: AssessmentWorkspace;
}

export function HomeTab({ selectedAssessment }: HomeTabProps) {
  const [userProfile, setUserProfile] = useState<UserProfileWithHistory | null>(
    null
  );
  const [practiceStats, setPracticeStats] = useState<PracticeStatistics | null>(
    null
  );
  const [practiceHistory, setPracticeHistory] = useState<PracticeSession[]>([]);
  const [activityMetrics, setActivityMetrics] = useState<Metric[]>([]);
  const [streakDays, setStreakDays] = useState<number>(0);

  // Calculate total time spent from practice history
  const calculateTotalTimeSpent = (history: PracticeSession[]): number => {
    return history.reduce((total, session) => {
      return total + (session.totalTimeSpent || 0);
    }, 0);
  };

  // Calculate streak days based on practice sessions within 24 hours
  const calculateStreakDays = (history: PracticeSession[]): number => {
    if (history.length === 0) return 0;

    // Sort sessions by timestamp (most recent first)
    const sortedSessions = [...history].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    let streak = 0;
    const currentDay = new Date(today);

    // Check each day going backwards from today
    for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
      // Check up to a year back
      const dayStart = new Date(currentDay);
      const dayEnd = new Date(currentDay);
      dayEnd.setHours(23, 59, 59, 999); // End of the day

      // Check if there's at least one session on this day
      const hasSessionOnDay = sortedSessions.some((session) => {
        const sessionDate = new Date(session.timestamp);
        return sessionDate >= dayStart && sessionDate <= dayEnd;
      });

      if (hasSessionOnDay) {
        streak++;
        // Move to previous day
        currentDay.setDate(currentDay.getDate() - 1);
      } else {
        // Streak is broken
        break;
      }
    }

    return streak;
  };

  // Load user profile and practice statistics on component mount
  useEffect(() => {
    try {
      const profile = getUserProfile();
      const stats = getPracticeStatistics();
      const history = getSessionHistory();

      setUserProfile(profile);
      setPracticeStats(stats);
      setPracticeHistory(history);

      // Calculate metrics for ActivityCard
      const totalTimeSpentMs = calculateTotalTimeSpent(history);
      const totalTimeSpentMinutes = Math.round(totalTimeSpentMs / (1000 * 60)); // Convert to minutes

      // Calculate streak days based on practice sessions
      const calculatedStreakDays = calculateStreakDays(history);
      setStreakDays(calculatedStreakDays);

      const calculatedMetrics: Metric[] = [
        {
          label: "Total XP",
          value: profile.totalXP.toString(),
          trend: Math.round(Math.min(100, (profile.totalXP / 1000) * 100)), // Round percentage
          unit: "XP",
          color: "#FF2D55",
          // icon: "⭐",
          prefix: "",
        },
        {
          label: "Practice Time",
          value: totalTimeSpentMinutes.toString(),
          trend: Math.round(Math.min(100, (totalTimeSpentMinutes / 60) * 100)), // Round percentage
          unit: "min",
          color: "#2CD758",
          // icon: "⏰",
          prefix: "~",
        },
        {
          label: "Success Rate",
          value:
            profile.questionsAnswered > 0
              ? Math.round(
                  (profile.correctAnswers / profile.questionsAnswered) * 100
                ).toString()
              : "0",
          trend:
            profile.questionsAnswered > 0
              ? Math.round(
                  (profile.correctAnswers / profile.questionsAnswered) * 100
                )
              : 0,
          unit: "%",
          color: "#007AFF",
          // icon: "🎯",
          prefix: "",
        },
      ];

      setActivityMetrics(calculatedMetrics);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, []);
  return (
    <div className="space-y-4 grid grid-cols-7">
      <div className="px-4 col-span-7 md:col-span-4 xl:col-span-5 space-y-4">
        <SummaryCharts selectedAssessment={selectedAssessment} />

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
                          100
                      )}%`
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Practice Statistics */}
        {practiceStats &&
          selectedAssessment &&
          practiceStats[selectedAssessment.name] && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <h3 className="text-md font-medium">
                Assessment Progress - {selectedAssessment.name}
              </h3>
              <div className="text-sm">
                <div>
                  <span className="text-muted-foreground">
                    Questions Answered:
                  </span>
                  <span className="ml-2 font-semibold">
                    {practiceStats[selectedAssessment.name].answeredQuestions
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
          onViewDetails={() => console.log("Viewing details")}
        />
      </div>
    </div>
  );
}
