"use client";

import React from "react";
import Link from "next/link";
import { Clock, BookOpen, Target, BarChart3 } from "lucide-react";
import { PracticeSession, SessionStatus } from "@/types/session";
import { useHasActivePracticeSession } from "./practice-session-restorer";

interface SessionInfoDisplayProps {
  showDetailedInfo?: boolean;
}

/**
 * Component that displays information about the current practice session
 * and provides a link to continue it
 */
export function SessionInfoDisplay({
  showDetailedInfo = true,
}: SessionInfoDisplayProps) {
  const [sessionInfo, setSessionInfo] = React.useState<PracticeSession | null>(
    null
  );
  const hasActiveSession = useHasActivePracticeSession();

  React.useEffect(() => {
    if (!hasActiveSession) {
      setSessionInfo(null);
      return;
    }

    try {
      const currentSessionData = localStorage.getItem("currentPracticeSession");
      if (currentSessionData) {
        const session: PracticeSession = JSON.parse(currentSessionData);

        // Handle backward compatibility - add missing fields if they don't exist
        if (!session.answeredQuestionDetails) {
          session.answeredQuestionDetails = [];
        }

        // Only show if it's an in-progress session
        if (session.status === SessionStatus.IN_PROGRESS) {
          setSessionInfo(session);
        } else {
          setSessionInfo(null);
        }
      }
    } catch (error) {
      console.error("Error loading session info:", error);
      setSessionInfo(null);
    }
  }, [hasActiveSession]);

  if (!hasActiveSession || !sessionInfo) {
    return null;
  }

  const answeredCount = Object.keys(sessionInfo.questionAnswers || {}).length;
  const currentQuestionNumber = (sessionInfo.currentQuestionStep || 0) + 1;
  const totalQuestions = sessionInfo.totalQuestions || 0;
  const progressPercentage =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Calculate time since session started
  const timeSinceStart = sessionInfo.timestamp
    ? Date.now() - new Date(sessionInfo.timestamp).getTime()
    : 0;
  const hoursAgo = Math.floor(timeSinceStart / (1000 * 60 * 60));
  const minutesAgo = Math.floor(
    (timeSinceStart % (1000 * 60 * 60)) / (1000 * 60)
  );

  const timeAgoText =
    hoursAgo > 0
      ? `${hoursAgo}h ${minutesAgo}m ago`
      : minutesAgo > 0
      ? `${minutesAgo}m ago`
      : "Just now";

  if (!showDetailedInfo) {
    // Simple version - just the continue button
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Active Practice Session
              </h3>
              <p className="text-sm text-gray-600">
                Question {currentQuestionNumber} of {totalQuestions} •{" "}
                {answeredCount} answered
              </p>
            </div>
          </div>
          <Link
            href="/practice?session=continue"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Continue
          </Link>
        </div>
      </div>
    );
  }

  // Detailed version with stats
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Resume Your Practice
            </h3>
            <p className="text-sm text-gray-600">
              {sessionInfo.practiceSelections?.subject === "math"
                ? "Math"
                : "Reading & Writing"}{" "}
              •{sessionInfo.practiceSelections?.assessment} • Started{" "}
              {timeAgoText}
            </p>
          </div>
        </div>
        <Link
          href="/practice?session=continue"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
        >
          Continue Practice
          <BookOpen className="w-4 h-4" />
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mx-auto mb-2">
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {currentQuestionNumber}
          </div>
          <div className="text-xs text-gray-600">Current Question</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mx-auto mb-2">
            <BarChart3 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {answeredCount}
          </div>
          <div className="text-xs text-gray-600">Answered</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mx-auto mb-2">
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {sessionInfo.totalTimeSpent
              ? Math.round(sessionInfo.totalTimeSpent / 1000 / 60)
              : 0}
          </div>
          <div className="text-xs text-gray-600">Minutes</div>
        </div>
      </div>

      {/* Additional session details */}
      {sessionInfo.practiceSelections?.domains && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="text-sm text-gray-600">
            <strong>Domains:</strong>{" "}
            {sessionInfo.practiceSelections.domains
              .map((d) => d.text)
              .join(", ")}
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionInfoDisplay;
