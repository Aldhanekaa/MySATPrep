"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from "@/components/ui/card-v2";
import TrackerCard from "@/components/ui/tracker-card";
import { useAssessment } from "@/contexts/assessment-context";
import { cn } from "@/lib/utils";
import { mathDomains, rwDomains } from "@/static-data/validation";
import {
  primaryClassCdObjectData,
  skillCdsObjectData,
} from "@/static-data/domains";
import { API_Response_Question_List, PlainQuestionType } from "@/types";
import { Activity, DatabaseIcon } from "lucide-react";
import React, { useEffect, useReducer, useMemo } from "react";
import { getPracticeStatistics } from "@/lib/practiceStatistics";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { QuestionDifficulty } from "@/types/question";
import { Separator } from "@/components/ui/separator";
import { AssessmentsId } from "@/static-data/assessment";

// Import Task type from tracker-card
type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  level: number;
  dependencies: string[];
  subtasks: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    tools?: string[];
    href?: string; // Optional link to skill/subtask page
    questions?: {
      id: string;
      title: string;
      description: string;
      difficulty: string;
      status: string;
      href?: string; // Optional link to question page
    }[];
  }[];
};

// Types for reducer
interface QuestionsState {
  allQuestions: PlainQuestionType[];
  loading: boolean;
  error: string | null;
}

type QuestionsAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: PlainQuestionType[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "RESET" };

// Reducer function
function questionsReducer(
  state: QuestionsState,
  action: QuestionsAction
): QuestionsState {
  switch (action.type) {
    case "FETCH_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        allQuestions: action.payload,
        error: null,
      };
    case "FETCH_ERROR":
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case "RESET":
      return {
        allQuestions: [],
        loading: false,
        error: null,
      };
    default:
      return state;
  }
}

export default function Tracker() {
  const { state, setActiveAssessmentByWorkspace, getAssessmentKey } =
    useAssessment();

  // Initialize reducer
  const [questionsState, dispatch] = useReducer(questionsReducer, {
    allQuestions: [],
    loading: false,
    error: null,
  });

  async function fetchInitialData() {
    try {
      dispatch({ type: "FETCH_START" });

      // console.log("state", state);
      const activeAssessmentId = state.activeAssessmentId || "99";
      const assessmentTextId =
        AssessmentsId[activeAssessmentId as keyof typeof AssessmentsId]?.textId;

      if (!assessmentTextId) {
        throw new Error("Invalid assessment ID");
      }

      // console.log(
      //   "activeAssessmentId",
      //   activeAssessmentId,
      //   "assessmentTextId",
      //   assessmentTextId
      // );
      const fetchResponse = await fetch(
        `/api/get-questions?assessment=${assessmentTextId}&domains=${[
          ...mathDomains,
          ...rwDomains,
        ].join(",")}`
      );
      const fetchData = await fetchResponse.json();

      if ("data" in fetchData) {
        const allQuestions: PlainQuestionType[] = fetchData.data;
        dispatch({ type: "FETCH_SUCCESS", payload: allQuestions });
      } else {
        dispatch({ type: "FETCH_ERROR", payload: "Invalid response format" });
      }

      console.log(fetchData);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      dispatch({
        type: "FETCH_ERROR",
        payload: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  useEffect(() => {
    // Only fetch if we have an active assessment
    if (state.activeAssessmentId) {
      fetchInitialData();
    } else {
      // Reset state if no assessment is selected
      dispatch({ type: "RESET" });
    }
  }, [state.activeAssessmentId]);

  // Transform questions data to tasks format for TrackerCard, separated by subject
  const transformQuestionsToTasksBySubject = useMemo(() => {
    return (questions: PlainQuestionType[]) => {
      // First, separate questions by subject (Math vs R&W)
      const mathQuestions = questions.filter((q) => {
        const primaryClassInfo = primaryClassCdObjectData[q.primary_class_cd];
        return primaryClassInfo?.subject === "Math";
      });

      const rwQuestions = questions.filter((q) => {
        const primaryClassInfo = primaryClassCdObjectData[q.primary_class_cd];
        return primaryClassInfo?.subject === "R&W";
      });

      // Helper function to transform questions for a specific subject
      const transformSubjectQuestions = (
        subjectQuestions: PlainQuestionType[]
      ): Task[] => {
        // Get practice statistics for answered questions
        const practiceStats = getPracticeStatistics();
        const activeAssessmentId = state.activeAssessmentId || "99";
        const assessmentTextId =
          AssessmentsId[activeAssessmentId as keyof typeof AssessmentsId]
            ?.textId || "";
        const assessmentStats = practiceStats[assessmentTextId];
        const answeredQuestionIds = new Set(
          assessmentStats?.answeredQuestions || []
        );

        // Get detailed answered questions for correct/incorrect status
        const answeredQuestionsDetailed =
          assessmentStats?.answeredQuestionsDetailed || [];
        const answeredQuestionsMap = new Map(
          answeredQuestionsDetailed.map((q) => [q.questionId, q])
        );

        // Group questions by primaryClassCd first
        const groupedByPrimaryClass = subjectQuestions.reduce(
          (acc, question) => {
            const primaryClassCd = question.primary_class_cd;
            if (!acc[primaryClassCd]) {
              acc[primaryClassCd] = [];
            }
            acc[primaryClassCd].push(question);
            return acc;
          },
          {} as Record<string, PlainQuestionType[]>
        );

        // Convert to tasks format: primaryClassCd → skillCd → questionId
        return Object.entries(groupedByPrimaryClass).map(
          ([primaryClassCd, primaryClassQuestions], primaryIndex) => {
            // Get domain info from the lookup data
            const primaryClassInfo = primaryClassCdObjectData[primaryClassCd];
            const domainTitle = primaryClassInfo
              ? primaryClassInfo.text
              : primaryClassCd;

            // Group questions within this primary class by skill
            const groupedBySkill = primaryClassQuestions.reduce(
              (acc, question) => {
                const skillCd = question.skill_cd;
                if (!acc[skillCd]) {
                  acc[skillCd] = [];
                }
                acc[skillCd].push(question);
                return acc;
              },
              {} as Record<string, PlainQuestionType[]>
            );

            // Create subtasks for each skill within this primary class
            const skillSubtasks = Object.entries(groupedBySkill).map(
              ([skillCd, skillQuestions], skillIndex) => {
                // Get skill info from the lookup data
                const skillInfo = skillCdsObjectData[skillCd];
                const skillTitle = skillInfo ? skillInfo.text : skillCd;

                // Calculate answered questions for this skill
                const answeredInSkill = skillQuestions.filter((q) =>
                  answeredQuestionIds.has(q.questionId)
                ).length;
                const correctInSkill = skillQuestions.filter((q) => {
                  const detail = answeredQuestionsMap.get(q.questionId);
                  return detail && detail.isCorrect;
                }).length;
                const totalInSkill = skillQuestions.length;
                const skillProgress = `${answeredInSkill}/${totalInSkill}`;

                // Create description with more detail
                const descriptionParts = [
                  `${totalInSkill} questions in ${skillTitle}`,
                ];
                if (answeredInSkill > 0) {
                  if (correctInSkill !== answeredInSkill) {
                    descriptionParts.push(
                      `(${correctInSkill} correct, ${
                        answeredInSkill - correctInSkill
                      } incorrect)`
                    );
                  } else {
                    descriptionParts.push(`(${answeredInSkill} answered)`);
                  }
                }

                return {
                  id: `${primaryClassCd}-${skillCd}`,
                  title: skillTitle,
                  description: descriptionParts.join(" "),
                  status:
                    answeredInSkill === totalInSkill
                      ? "completed"
                      : answeredInSkill > 0
                      ? "in-progress"
                      : "pending",
                  priority: "medium",
                  href: `/questionbank?assessment=${assessmentTextId}&subject=${
                    primaryClassInfo?.subject || ""
                  }&primaryClassCd=${primaryClassCd}&skillCd=${skillCd}`,
                  dependencies: [skillProgress],
                  // Add individual questions as nested data (can be expanded later if needed)
                  questions: skillQuestions.map((question) => {
                    const questionDetail = answeredQuestionsMap.get(
                      question.questionId
                    );
                    let status = "pending";

                    if (questionDetail) {
                      status = questionDetail.isCorrect
                        ? "completed"
                        : "incorrect";
                    } else if (answeredQuestionIds.has(question.questionId)) {
                      status = "completed"; // Fallback for basic answered status
                    }

                    return {
                      id: question.questionId,
                      title: `Question ${question.questionId}`,
                      description: question.skill_desc,
                      difficulty: question.difficulty,
                      status: status,
                      href: `/question/${question.questionId}`, // Link to individual question page
                    };
                  }),
                };
              }
            );

            // Calculate overall progress for this primary class
            const totalQuestionsInDomain = primaryClassQuestions.length;
            const answeredQuestionsInDomain = primaryClassQuestions.filter(
              (q) => answeredQuestionIds.has(q.questionId)
            ).length;
            const domainProgress = `${answeredQuestionsInDomain}/${totalQuestionsInDomain}`;

            return {
              id: `primary-${primaryClassCd}`,
              title: domainTitle,
              description: `${Object.keys(groupedBySkill).length} subtopics, ${
                primaryClassQuestions.length
              } questions`,
              status:
                answeredQuestionsInDomain === totalQuestionsInDomain
                  ? "completed"
                  : answeredQuestionsInDomain > 0
                  ? "in-progress"
                  : "pending",
              priority: "high",
              level: 0,
              dependencies: [domainProgress],
              subtasks: skillSubtasks,
            };
          }
        );
      };

      return {
        mathTasks:
          mathQuestions.length > 0
            ? transformSubjectQuestions(mathQuestions)
            : undefined,
        rwTasks:
          rwQuestions.length > 0
            ? transformSubjectQuestions(rwQuestions)
            : undefined,
      };
    };
  }, [state.activeAssessmentId]);

  const { mathTasks, rwTasks } = useMemo(() => {
    return questionsState.allQuestions.length > 0
      ? transformQuestionsToTasksBySubject(questionsState.allQuestions)
      : { mathTasks: undefined, rwTasks: undefined };
  }, [questionsState.allQuestions, transformQuestionsToTasksBySubject]);

  // Debug log
  console.log("Transformed tasks:", { mathTasks, rwTasks });

  // Calculate difficulty statistics
  const difficultyStats = useMemo(() => {
    if (!questionsState.allQuestions.length || !state.activeAssessmentId) {
      return null;
    }

    const practiceStats = getPracticeStatistics();
    const activeAssessmentId = state.activeAssessmentId || "99";
    const assessmentTextId =
      AssessmentsId[activeAssessmentId as keyof typeof AssessmentsId]?.textId ||
      "";
    const assessmentStats = practiceStats[assessmentTextId];
    const answeredQuestionIds = new Set(
      assessmentStats?.answeredQuestions || []
    );

    // Get detailed answered questions for correct/incorrect stats
    const answeredQuestionsDetailed =
      assessmentStats?.answeredQuestionsDetailed || [];
    const correctAnswers = answeredQuestionsDetailed.filter(
      (q) => q.isCorrect
    ).length;
    const incorrectAnswers = answeredQuestionsDetailed.filter(
      (q) => !q.isCorrect
    ).length;

    // Count total questions by difficulty
    const totalByDifficulty = questionsState.allQuestions.reduce(
      (acc, question) => {
        const difficulty = question.difficulty;
        acc[difficulty] = (acc[difficulty] || 0) + 1;
        return acc;
      },
      {} as Record<QuestionDifficulty, number>
    );

    // Count answered questions by difficulty
    const answeredByDifficulty = questionsState.allQuestions.reduce(
      (acc, question) => {
        if (answeredQuestionIds.has(question.questionId)) {
          const difficulty = question.difficulty;
          acc[difficulty] = (acc[difficulty] || 0) + 1;
        }
        return acc;
      },
      {} as Record<QuestionDifficulty, number>
    );

    // Calculate statistics for each difficulty
    const difficultyLabels = {
      E: "Easy",
      M: "Medium",
      H: "Hard",
    };

    const stats = Object.entries(difficultyLabels).map(([key, label]) => {
      const difficulty = key as QuestionDifficulty;
      const total = totalByDifficulty[difficulty] || 0;
      const answered = answeredByDifficulty[difficulty] || 0;
      const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

      return {
        difficulty,
        label,
        total,
        answered,
        percentage,
        remaining: total - answered,
      };
    });

    return {
      stats,
      totalQuestions: questionsState.allQuestions.length,
      totalAnswered: answeredQuestionIds.size,
      correctAnswers,
      incorrectAnswers,
      overallPercentage:
        questionsState.allQuestions.length > 0
          ? Math.round(
              (answeredQuestionIds.size / questionsState.allQuestions.length) *
                100
            )
          : 0,
    };
  }, [questionsState.allQuestions, state.activeAssessmentId]);
  // Show loading state for the entire component
  if (questionsState.loading) {
    return (
      <React.Fragment>
        <h3 className="text-3xl font-bold Tracker flex items-center mb-6 gap-2">
          <DatabaseIcon className="text-2xl text-blue-500" /> Collegeboard{"'"}s
          Question Bank Tracker
        </h3>
        <div className="w-full grid grid-cols-9 gap-6">
          <div className="col-span-12 xl:col-span-3">
            <Card
              variant="accent"
              className={cn(
                "rounded-3xl sticky top-16",
                "transition-all duration-300"
              )}
            >
              <CardHeader>
                <CardHeading>
                  <CardTitle>
                    <div className="flex items-center gap-2">Your Progress</div>
                  </CardTitle>
                </CardHeading>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Loading your progress...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fetching questions from the question bank
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 xl:col-span-6">
            <div className="space-y-8">
              {/* Loading skeleton for Mathematics */}
              <div>
                <h2 className="pl-5 text-lg mb-4">Mathematics</h2>
                <Card className="rounded-3xl">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Loading skeleton for Reading & Writing */}
              <div>
                <h2 className="pl-5 text-lg mb-4">Reading & Writing</h2>
                <Card className="rounded-3xl">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <h3 className="text-3xl font-bold Tracker flex  items-center mb-6 gap-2">
        <DatabaseIcon className="text-2xl text-blue-500" /> Collegeboard{"'"}s
        Question Bank Tracker
      </h3>
      <div className="w-full grid grid-cols-9 gap-6">
        <div className="col-span-12 xl:col-span-3">
          <Card
            variant="accent"
            className={cn(
              "rounded-3xl sticky top-16",
              "transition-all duration-300"
            )}
          >
            <CardHeader>
              <CardHeading>
                <CardTitle>
                  <div className="flex items-center gap-2">Your Progress</div>
                </CardTitle>
              </CardHeading>
            </CardHeader>

            <CardContent className="p-6">
              {questionsState.error && (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-4">
                    <svg
                      className="h-8 w-8 mx-auto mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.988-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-red-600 mb-2">
                    Failed to load questions
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {questionsState.error}
                  </p>
                  <button
                    onClick={fetchInitialData}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!questionsState.error && difficultyStats && (
                <div className="space-y-6">
                  {/* Overall Progress - New Design */}
                  <div className="space-y-4">
                    {/* Large Percentage Display */}
                    <div className="flex flex-row items-center justify-between">
                      <h3 className="text-lg font-medium text-center">
                        Overall completion
                      </h3>

                      <div className="text-lg font-bold text-foreground mb-2">
                        {difficultyStats.overallPercentage}%
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-muted rounded-full h-2 mb-4">
                      <div
                        className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                        style={{
                          width: `${difficultyStats.overallPercentage}%`,
                        }}
                      />
                    </div>

                    {/* Correct/Incorrect Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="p-4 text-center border-neutral-300 bg-white">
                        <div className="text-sm text-muted-foreground mb-1">
                          Correct
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {difficultyStats.correctAnswers}
                        </div>
                      </Card>

                      <Card className="p-4 text-center border-neutral-300 bg-white">
                        <div className="text-sm text-muted-foreground mb-1">
                          Incorrect
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          {difficultyStats.incorrectAnswers}
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Difficulty Breakdown */}
                  <div className="space-y-4 border-t border-border pt-4">
                    <h3 className="text-lg font-semibold">
                      Difficulty Breakdown
                    </h3>
                    {difficultyStats.stats.map(
                      ({ difficulty, label, total, answered, percentage }) => (
                        <div key={difficulty} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-xs ${
                                  difficulty === "E"
                                    ? " text-green-700"
                                    : difficulty === "M"
                                    ? " text-yellow-600"
                                    : "text-red-500"
                                }`}
                              >
                                {label}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {answered}/{total}
                              </span>
                            </div>
                            <span className="text-xs font-medium">
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className=" rounded-full h-2 transition-all duration-300 bg-blue-600"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {difficultyStats.totalAnswered}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Answered
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {difficultyStats.totalQuestions -
                          difficultyStats.totalAnswered}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Remaining
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!questionsState.error && !difficultyStats && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-4">
                    <svg
                      className="h-8 w-8 mx-auto mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    No assessment selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please select an assessment to view your progress
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-6">
          <div className="space-y-8">
            {/* Error state */}
            {questionsState.error && (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <svg
                    className="h-12 w-12 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.988-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <p className="text-lg text-muted-foreground mb-2">
                  Unable to load tracker data
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Please try refreshing the page
                </p>
                <button
                  onClick={fetchInitialData}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Success state - show tracker cards */}
            {!questionsState.error && (
              <>
                {/* Mathematics Section */}
                {mathTasks && (
                  <div>
                    <h2 className="pl-5 text-lg">Mathematics</h2>
                    <TrackerCard tasks={mathTasks} />
                  </div>
                )}

                {/* Reading & Writing Section */}
                {rwTasks && (
                  <div>
                    <h2 className="pl-5 text-lg">Reading & Writing</h2>
                    <TrackerCard tasks={rwTasks} />
                  </div>
                )}

                {/* No data message */}
                {!mathTasks && !rwTasks && (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground mb-4">
                      <svg
                        className="h-12 w-12 mx-auto mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-lg text-muted-foreground mb-2">
                      No questions available
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please select an assessment or check your connection
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
