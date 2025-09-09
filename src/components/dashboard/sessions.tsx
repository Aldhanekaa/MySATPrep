"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getSessionHistory,
  PracticeSession,
  SessionStatus,
} from "@/types/session";
import { getPracticeStatistics } from "@/lib/practiceStatistics";
import { AnsweredQuestion } from "@/types/statistics";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  timeSpent: number;
  selectedAnswer?: string;
}

export function SessionsTab() {
  const [practiceHistory, setPracticeHistory] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set()
  );
  const router = useRouter();

  useEffect(() => {
    const loadSessions = () => {
      try {
        const history = getSessionHistory();
        // Sort sessions by timestamp (most recent first)
        const sortedHistory = history.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setPracticeHistory(sortedHistory);
      } catch (error) {
        console.error("Failed to load practice sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const getQuestionResults = (session: PracticeSession): QuestionResult[] => {
    try {
      const practiceStats = getPracticeStatistics();
      const assessmentStats =
        practiceStats[session.practiceSelections.assessment];

      if (!assessmentStats?.answeredQuestionsDetailed) {
        // Fallback: create results from session data without correctness info
        return session.answeredQuestions.map((questionId) => ({
          questionId,
          isCorrect: false, // Unknown correctness
          timeSpent: session.questionTimes[questionId] || 0,
          selectedAnswer: session.questionAnswers[questionId] || undefined,
        }));
      }

      // Map session questions to detailed results
      return session.answeredQuestions.map((questionId) => {
        const detailedResult = assessmentStats.answeredQuestionsDetailed.find(
          (aq: AnsweredQuestion) => aq.questionId === questionId
        );

        return {
          questionId,
          isCorrect: detailedResult?.isCorrect ?? false,
          timeSpent:
            session.questionTimes[questionId] || detailedResult?.timeSpent || 0,
          selectedAnswer:
            session.questionAnswers[questionId] ||
            detailedResult?.selectedAnswer,
        };
      });
    } catch (error) {
      console.error("Failed to get question results:", error);
      return [];
    }
  };

  const toggleSessionExpansion = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const handleReviewSession = (sessionId: string) => {
    router.push(`/practice?session=${sessionId}`);
  };

  const handleQuestionClick = (questionId: string) => {
    router.push(`/question/${questionId}`);
  };

  const formatDuration = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.COMPLETED:
        return "bg-green-100 text-green-800 border-green-300";
      case SessionStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800 border-blue-300";
      case SessionStatus.PAUSED:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case SessionStatus.ABANDONED:
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatStatusText = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.COMPLETED:
        return "Completed";
      case SessionStatus.IN_PROGRESS:
        return "In Progress";
      case SessionStatus.PAUSED:
        return "Paused";
      case SessionStatus.ABANDONED:
        return "Abandoned";
      case SessionStatus.NOT_STARTED:
        return "Not Started";
      case SessionStatus.EXPIRED:
        return "Expired";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Practice Sessions</h2>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Practice Sessions</h2>
        <div className="text-sm text-muted-foreground">
          {practiceHistory.length} total sessions
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Review your past practice sessions and performance history.
      </p>

      {practiceHistory.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No practice sessions found.
          </p>
          <Link href={"/practice"}>
            <Button variant="outline">Start Your First Practice Session</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {practiceHistory.map((session, index) => {
            const sessionId = session.sessionId || `session-${index}`;
            const isExpanded = expandedSessions.has(sessionId);
            const questionResults = getQuestionResults(session);
            const correctCount = questionResults.filter(
              (q) => q.isCorrect
            ).length;

            return (
              <Card key={sessionId} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">
                        {session.practiceSelections.assessment} -{" "}
                        {session.practiceSelections.subject}
                      </h3>
                      <Badge
                        variant="outline"
                        className={getStatusColor(session.status)}
                      >
                        {formatStatusText(session.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {session.practiceSelections.domains
                        .map((d) => d.text)
                        .join(", ")}
                    </p>
                    {session.practiceSelections.difficulties.length > 0 && (
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">
                          Difficulties:
                        </span>
                        <div className="flex gap-1">
                          {session.practiceSelections.difficulties.map(
                            (difficulty, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs px-1.5 py-0.5"
                              >
                                {difficulty}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {new Date(session.timestamp).toLocaleDateString()} at{" "}
                    {new Date(session.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Questions</div>
                    <div className="font-medium">
                      {session.answeredQuestions.length} /{" "}
                      {session.totalQuestions}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Score</div>
                    <div className="font-medium">
                      {questionResults.length > 0 ? (
                        <>
                          {correctCount} / {session.answeredQuestions.length}{" "}
                          correct
                          <span className="text-muted-foreground text-xs ml-1">
                            (
                            {session.answeredQuestions.length > 0
                              ? Math.round(
                                  (correctCount /
                                    session.answeredQuestions.length) *
                                    100
                                )
                              : 0}
                            %)
                          </span>
                        </>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Time Spent</div>
                    <div className="font-medium">
                      {formatDuration(session.totalTimeSpent || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">XP Gained</div>
                    <div className="font-medium">
                      {session.totalXPReceived
                        ? `+${session.totalXPReceived}`
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {session.practiceSelections.skills.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-muted-foreground mb-1">
                      Skills:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {session.practiceSelections.skills.map((skill, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {skill.text}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-3 pt-3 border-t flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReviewSession(sessionId)}
                    className="flex-1 h-8 text-xs"
                  >
                    Review Session
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSessionExpansion(sessionId)}
                    className="flex items-center gap-1 h-8 text-xs"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Hide
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Details
                      </>
                    )}
                  </Button>
                </div>

                {/* Question Details Dropdown */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t bg-muted/30 -mx-4 px-4 pb-4">
                    <div className="text-sm font-medium mb-3">
                      Question Results ({questionResults.length} questions)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {questionResults.map((result, idx) => (
                        <div
                          key={result.questionId}
                          onClick={() => handleQuestionClick(result.questionId)}
                          className={`p-2 rounded-md border text-center text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                            result.isCorrect
                              ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                              : "bg-red-100 border-red-300 text-red-800 hover:bg-red-200"
                          }`}
                          title={`Click to view Question ${idx + 1}`}
                        >
                          <div className="font-medium">Q{idx + 1}</div>
                          <div className="text-xs opacity-75">
                            {formatDuration(result.timeSpent)}
                          </div>
                          {result.selectedAnswer && (
                            <div className="text-xs opacity-75">
                              {result.selectedAnswer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {questionResults.length > 0 && (
                      <div className="mt-3 text-xs text-muted-foreground text-center">
                        <div className="mb-1">
                          <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></span>
                          Correct
                          <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 rounded mr-2 ml-4"></span>
                          Incorrect
                        </div>
                        <div className="text-xs opacity-75">
                          Click on any question to review it
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
