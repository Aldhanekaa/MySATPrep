import React, { useCallback, useEffect, useReducer } from "react";
import { Button } from "@/components/ui/button";
import { AssessmentWorkspace } from "@/app/dashboard/types";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { PracticeStatistics } from "@/types/statistics";
import { QuestionById_Data } from "@/types/question";
import { Card, CardContent } from "@/components/ui/card-v2";
import { Badge } from "../ui/badge";
import {
  OptimizedQuestionCard,
  AnsweredQuestionWithData,
} from "./shared/OptimizedQuestionCard";

// Simple skeleton component
const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`animate-pulse rounded-md bg-gray-200 ${className || ""}`}
    {...props}
  />
);

interface AnsweredTabProps {
  selectedAssessment?: AssessmentWorkspace;
}

// State management
interface State {
  questionsWithData: AnsweredQuestionWithData[];
  allAnsweredQuestions: AnsweredQuestionWithData[];
  displayedQuestionsCount: number;
  isLoadingMore: boolean;
  isInitialized: boolean;
  fetchedQuestionIds: Set<string>;
}

type Action =
  | { type: "INITIALIZE"; payload: AnsweredQuestionWithData[] }
  | {
      type: "UPDATE_QUESTION";
      payload: { index: number; question: Partial<AnsweredQuestionWithData> };
    }
  | { type: "LOAD_MORE" }
  | { type: "SET_LOADING_MORE"; payload: boolean }
  | { type: "MARK_AS_FETCHED"; payload: string }
  | { type: "RETRY_QUESTION"; payload: number };

const initialState: State = {
  questionsWithData: [],
  allAnsweredQuestions: [],
  displayedQuestionsCount: 15,
  isLoadingMore: false,
  isInitialized: false,
  fetchedQuestionIds: new Set(),
};

function questionsReducer(state: State, action: Action): State {
  switch (action.type) {
    case "INITIALIZE":
      const sortedQuestions = [...action.payload].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const initialQuestions = sortedQuestions.slice(0, 15).map((q) => ({
        ...q,
        isLoading: true,
        hasError: false,
      }));

      return {
        ...state,
        allAnsweredQuestions: sortedQuestions,
        questionsWithData: initialQuestions,
        displayedQuestionsCount: 15,
        isInitialized: true,
        fetchedQuestionIds: new Set(),
      };

    case "UPDATE_QUESTION":
      return {
        ...state,
        questionsWithData: state.questionsWithData.map((q, i) =>
          i === action.payload.index ? { ...q, ...action.payload.question } : q
        ),
      };

    case "LOAD_MORE":
      const nextCount = Math.min(
        state.displayedQuestionsCount + 15,
        state.allAnsweredQuestions.length
      );
      const newQuestions = state.allAnsweredQuestions
        .slice(state.displayedQuestionsCount, nextCount)
        .map((q) => ({
          ...q,
          isLoading: true,
          hasError: false,
        }));

      return {
        ...state,
        questionsWithData: [...state.questionsWithData, ...newQuestions],
        displayedQuestionsCount: nextCount,
        isLoadingMore: false,
      };

    case "SET_LOADING_MORE":
      return {
        ...state,
        isLoadingMore: action.payload,
      };

    case "MARK_AS_FETCHED":
      return {
        ...state,
        fetchedQuestionIds: new Set([
          ...state.fetchedQuestionIds,
          action.payload,
        ]),
      };

    case "RETRY_QUESTION":
      const newFetchedIds = new Set(state.fetchedQuestionIds);
      const questionToRetry = state.questionsWithData[action.payload];
      if (questionToRetry) {
        newFetchedIds.delete(questionToRetry.questionId);
      }

      return {
        ...state,
        fetchedQuestionIds: newFetchedIds,
        questionsWithData: state.questionsWithData.map((q, i) =>
          i === action.payload
            ? {
                ...q,
                isLoading: true,
                hasError: false,
                errorMessage: undefined,
              }
            : q
        ),
      };

    default:
      return state;
  }
}

export function AnsweredTab({ selectedAssessment }: AnsweredTabProps) {
  // Load practice statistics from localStorage
  const [practiceStatistics] = useLocalStorage<PracticeStatistics>(
    "practiceStatistics",
    {}
  );

  const [state, dispatch] = useReducer(questionsReducer, initialState);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  // Get the assessment key from selectedAssessment
  const getAssessmentKey = useCallback(
    (assessment?: AssessmentWorkspace): string => {
      if (!assessment) return "SAT"; // Default to SAT

      // Map assessment names to keys used in localStorage
      const assessmentMap: Record<string, string> = {
        SAT: "SAT",
        "PSAT/NMSQT": "P10",
        "PSAT 8/9": "P89",
      };

      return assessmentMap[assessment.name] || "SAT";
    },
    []
  );

  // Fetch question data from API
  const fetchQuestionData = useCallback(
    async (questionId: string): Promise<QuestionById_Data | null> => {
      try {
        const response = await fetch(`/api/question-by-id/${questionId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch question: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          return result.data;
        } else {
          throw new Error(result.message || "Failed to fetch question data");
        }
      } catch (error) {
        console.error(`Error fetching question ${questionId}:`, error);
        throw error;
      }
    },
    []
  );

  // Retry function for failed questions
  const handleRetry = useCallback((index: number) => {
    dispatch({ type: "RETRY_QUESTION", payload: index });
  }, []);

  // Initialize questions when assessment or practice statistics change
  useEffect(() => {
    const assessmentKey = getAssessmentKey(selectedAssessment);
    const assessmentStats = practiceStatistics[assessmentKey];
    const answeredQuestionsDetailed =
      assessmentStats?.answeredQuestionsDetailed || [];

    const questionsWithDefaults = answeredQuestionsDetailed.map((q) => ({
      ...q,
      isLoading: false,
      hasError: false,
    }));

    dispatch({ type: "INITIALIZE", payload: questionsWithDefaults });
  }, [selectedAssessment, practiceStatistics, getAssessmentKey]);

  // Fetch question data progressively
  useEffect(() => {
    if (!state.isInitialized || state.questionsWithData.length === 0) return;

    const fetchQuestionsProgressively = async () => {
      // Find questions that need to be fetched
      const questionsToFetch = state.questionsWithData
        .map((question, index) => ({ question, index }))
        .filter(
          ({ question }) =>
            question.isLoading &&
            !question.questionData &&
            !question.hasError &&
            !state.fetchedQuestionIds.has(question.questionId)
        );

      if (questionsToFetch.length === 0) return;

      // Mark these questions as being fetched
      questionsToFetch.forEach(({ question }) => {
        dispatch({ type: "MARK_AS_FETCHED", payload: question.questionId });
      });

      // Process questions with small delays
      for (const { question, index } of questionsToFetch) {
        try {
          const questionData = await fetchQuestionData(question.questionId);

          dispatch({
            type: "UPDATE_QUESTION",
            payload: {
              index,
              question: {
                questionData: questionData || undefined,
                isLoading: false,
                hasError: false,
              },
            },
          });

          // Small delay between requests
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          dispatch({
            type: "UPDATE_QUESTION",
            payload: {
              index,
              question: {
                isLoading: false,
                hasError: true,
                errorMessage,
              },
            },
          });
        }
      }
    };

    fetchQuestionsProgressively();
  }, [
    state.isInitialized,
    state.questionsWithData,
    state.fetchedQuestionIds,
    fetchQuestionData,
  ]);

  // Function to load more questions
  const loadMoreQuestions = useCallback(() => {
    if (
      state.isLoadingMore ||
      state.allAnsweredQuestions.length <= state.displayedQuestionsCount
    ) {
      return;
    }

    dispatch({ type: "SET_LOADING_MORE", payload: true });
    setTimeout(() => {
      dispatch({ type: "LOAD_MORE" });
    }, 100);
  }, [
    state.isLoadingMore,
    state.allAnsweredQuestions.length,
    state.displayedQuestionsCount,
  ]);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const currentLoadMoreRef = loadMoreRef.current;
    if (
      !currentLoadMoreRef ||
      state.allAnsweredQuestions.length <= state.displayedQuestionsCount
    )
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !state.isLoadingMore) {
          loadMoreQuestions();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentLoadMoreRef);

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [
    state.allAnsweredQuestions.length,
    state.displayedQuestionsCount,
    state.isLoadingMore,
    loadMoreQuestions,
  ]);

  const assessmentName = selectedAssessment?.name || "SAT";

  // Calculate statistics from all answered questions, not just displayed ones
  const totalQuestions = state.allAnsweredQuestions.length;
  const correctQuestions = state.allAnsweredQuestions.filter(
    (q) => q.isCorrect
  ).length;
  const accuracy =
    totalQuestions > 0
      ? ((correctQuestions / totalQuestions) * 100).toFixed(1)
      : "0";

  if (!state.isInitialized) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Answered Questions</h2>
        <p className="text-sm text-muted-foreground">
          Loading answered questions...
        </p>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (state.questionsWithData.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Answered Questions</h2>
        <p className="text-sm text-muted-foreground">
          No answered questions found for {assessmentName}.
        </p>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <p className="text-lg">📝</p>
              <p className="mt-2">
                You haven&apos;t answered any questions yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Questions you complete will appear here for review.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2">
      <div className="px-8 lg:px-28">
        <h2 className="text-lg font-semibold">Answered Questions</h2>
        <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
          <span>
            {totalQuestions} answered question{totalQuestions !== 1 ? "s" : ""}{" "}
            for {assessmentName}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            Accuracy:{" "}
            <Badge
              variant={parseFloat(accuracy) >= 70 ? "default" : "destructive"}
            >
              {accuracy}%
            </Badge>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            Correct:{" "}
            <Badge variant="default" className="bg-green-500">
              {correctQuestions}
            </Badge>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            Incorrect:{" "}
            <Badge variant="destructive">
              {totalQuestions - correctQuestions}
            </Badge>
          </span>
        </div>
      </div>

      <div className="space-y-4 max-w-full mx-auto px-6 lg:px-22">
        {state.questionsWithData.map((question, index) => (
          <div key={`${question.questionId}-${index}`} className="mb-32">
            <OptimizedQuestionCard
              question={question}
              index={index}
              onRetry={handleRetry}
              type="answered"
            />
          </div>
        ))}
      </div>

      {/* Load more trigger - invisible element for intersection observer */}
      {state.allAnsweredQuestions.length > state.displayedQuestionsCount && (
        <div className="space-y-4">
          <div
            ref={loadMoreRef}
            className="h-10 flex items-center justify-center"
          >
            {state.isLoadingMore && (
              <div className="text-center text-sm text-muted-foreground">
                Loading more questions...
              </div>
            )}
          </div>

          {/* Manual load more button as fallback */}
          {!state.isLoadingMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={loadMoreQuestions}
                disabled={state.isLoadingMore}
                className="px-6 py-2"
              >
                Load More Questions (
                {state.allAnsweredQuestions.length -
                  state.displayedQuestionsCount}{" "}
                remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {state.questionsWithData.some((q) => q.isLoading) &&
        !state.isLoadingMore && (
          <div className="text-center text-sm text-muted-foreground">
            Loading questions...
          </div>
        )}
    </div>
  );
}
