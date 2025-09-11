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
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  CopyIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { playSound } from "@/lib/playSound";

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] =
    useState<PracticeSession | null>(null);
  const [isCurrentSession, setIsCurrentSession] = useState(false);
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

  const handleDeleteSession = (session: PracticeSession) => {
    // Check if this is the current practice session
    try {
      const currentSession = localStorage.getItem("currentPracticeSession");
      const isCurrentActiveSession = !!(
        currentSession &&
        JSON.parse(currentSession).sessionId === session.sessionId
      );
      playSound("popup-confirm-up.wav");

      setSessionToDelete(session);
      setIsCurrentSession(isCurrentActiveSession);
      setDeleteModalOpen(true);
    } catch (error) {
      console.error("Failed to check current session:", error);
      setSessionToDelete(session);
      setIsCurrentSession(false);
      setDeleteModalOpen(true);
    }
  };

  const confirmDeleteSession = () => {
    if (!sessionToDelete) return;

    try {
      // Remove from practice history
      const history = getSessionHistory();
      const updatedHistory = history.filter(
        (session) => session.sessionId !== sessionToDelete.sessionId
      );
      localStorage.setItem("practiceHistory", JSON.stringify(updatedHistory));

      // If this is the current session, also remove it from currentPracticeSession
      if (isCurrentSession) {
        localStorage.removeItem("currentPracticeSession");
        toast.success("Session Deleted Successfully", {
          description:
            "Your current practice session has been removed. You can start a new practice session anytime.",
          duration: 5000,
        });
      } else {
        toast.success("Session Deleted Successfully", {
          description:
            "The practice session has been removed from your history.",
          duration: 3000,
        });
      }

      // Update the local state
      setPracticeHistory(updatedHistory);

      // Close modal and reset state
      setDeleteModalOpen(false);
      setSessionToDelete(null);
      setIsCurrentSession(false);
    } catch (error) {
      console.error("Failed to delete session:", error);
      toast.error("Failed to Delete Session", {
        description:
          "An error occurred while deleting the session. Please try again.",
        duration: 4000,
      });
    }
  };

  const cancelDeleteSession = () => {
    playSound("popup-confirm-down.wav");

    setDeleteModalOpen(false);
    setSessionToDelete(null);
    setIsCurrentSession(false);
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
      <div className="w-full space-y-4">
        <h2 className="text-lg font-semibold">Practice Sessions</h2>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 px-4">
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
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push("/practice?duplicate=" + sessionId)
                    }
                    className="flex items-center gap-1 h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <CopyIcon className="w-3 h-3" />
                    Duplicate
                  </Button> */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSession(session)}
                    className="flex items-center gap-1 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
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

      {/* Duolingo-styled Delete Confirmation Modal */}
      {deleteModalOpen && sessionToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
          <div className="bg-red-50 border-4 border-red-200 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-900 mb-2">
                  Delete Practice Session?
                </h3>
                <div className="text-red-700 text-sm space-y-2">
                  <p>
                    Are you sure you want to delete this practice session from{" "}
                    <strong>
                      {sessionToDelete.practiceSelections.assessment}
                    </strong>
                    ?
                  </p>
                  <p className="text-xs">
                    Session from{" "}
                    {new Date(sessionToDelete.timestamp).toLocaleDateString()}{" "}
                    at{" "}
                    {new Date(sessionToDelete.timestamp).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                  {isCurrentSession && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-2xl">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium">Warning!</span>
                      </div>
                      <p className="text-xs text-red-700 mt-1">
                        This is your current active practice session. Deleting
                        it will also remove your current progress.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={cancelDeleteSession}
                  variant="outline"
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm py-3 px-4 rounded-2xl border-2 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md transform transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteSession}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold text-sm py-3 px-4 rounded-2xl border-b-4 border-red-600 hover:border-red-700 shadow-lg hover:shadow-xl transform transition-all duration-200 active:translate-y-0.5 active:border-b-2"
                >
                  Delete Session
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
