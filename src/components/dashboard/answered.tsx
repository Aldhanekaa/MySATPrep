import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AssessmentWorkspace } from "@/app/dashboard/types";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { PracticeStatistics } from "@/types/statistics";
import { QuestionById_Data } from "@/types/question";
import QuestionProblemCard from "@/components/question-problem-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card-v2";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";

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

interface AnsweredQuestionWithData {
  questionId: string;
  difficulty: string;
  isCorrect: boolean;
  timeSpent: number;
  timestamp: string;
  selectedAnswer?: string;
  plainQuestion?: unknown;
  questionData?: QuestionById_Data;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export function AnsweredTab({ selectedAssessment }: AnsweredTabProps) {
  // Load practice statistics from localStorage
  const [practiceStatistics] = useLocalStorage<PracticeStatistics>(
    "practiceStatistics",
    {}
  );

  // State for managing questions with their fetched data
  const [questionsWithData, setQuestionsWithData] = useState<
    AnsweredQuestionWithData[]
  >([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Track which questions have been fetched to prevent duplicate requests
  const [fetchedQuestionIds, setFetchedQuestionIds] = useState<Set<string>>(
    new Set()
  );

  // Infinite scrolling states
  const [allAnsweredQuestions, setAllAnsweredQuestions] = useState<
    AnsweredQuestionWithData[]
  >([]);
  const [displayedQuestionsCount, setDisplayedQuestionsCount] = useState(15);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Intersection observer ref for infinite scrolling
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

  // Initialize questions when assessment or practice statistics change
  useEffect(() => {
    const assessmentKey = getAssessmentKey(selectedAssessment);
    const assessmentStats = practiceStatistics[assessmentKey];
    const answeredQuestionsDetailed =
      assessmentStats?.answeredQuestionsDetailed || [];

    // Sort all questions by timestamp (most recent first)
    const sortedQuestions: AnsweredQuestionWithData[] =
      answeredQuestionsDetailed
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .map((question) => ({
          ...question,
          isLoading: false,
          hasError: false,
        }));

    // Store all questions and reset display count
    setAllAnsweredQuestions(sortedQuestions);
    setDisplayedQuestionsCount(15);

    // Initialize with first 15 questions (or all if less than 15)
    const initialQuestions = sortedQuestions.slice(0, 15).map((question) => ({
      ...question,
      isLoading: true,
      hasError: false,
    }));

    setQuestionsWithData(initialQuestions);
    setFetchedQuestionIds(new Set()); // Reset fetched questions when assessment changes
    setIsInitialized(true);
  }, [selectedAssessment, practiceStatistics, getAssessmentKey]);

  // Fetch question data progressively
  useEffect(() => {
    if (!isInitialized || questionsWithData.length === 0) return;

    const fetchQuestionsProgressively = async () => {
      // Find questions that need to be fetched (not yet fetched and currently loading)
      const questionsToFetch = questionsWithData
        .map((question, index) => ({ question, index }))
        .filter(
          ({ question }) =>
            question.isLoading &&
            !question.questionData &&
            !question.hasError &&
            !fetchedQuestionIds.has(question.questionId)
        );

      if (questionsToFetch.length === 0) return;

      // Mark these questions as being fetched
      const newFetchedIds = new Set(fetchedQuestionIds);
      questionsToFetch.forEach(({ question }) => {
        newFetchedIds.add(question.questionId);
      });
      setFetchedQuestionIds(newFetchedIds);

      // Process questions one by one to avoid overwhelming the API
      for (const { question, index } of questionsToFetch) {
        try {
          const questionData = await fetchQuestionData(question.questionId);

          // Update the specific question with fetched data
          setQuestionsWithData((prev) =>
            prev.map((q, i) =>
              i === index
                ? {
                    ...q,
                    questionData: questionData || undefined,
                    isLoading: false,
                    hasError: false,
                  }
                : q
            )
          );

          // Add a small delay between requests to be respectful to the API
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          // Update the specific question with error state
          setQuestionsWithData((prev) =>
            prev.map((q, i) =>
              i === index
                ? { ...q, isLoading: false, hasError: true, errorMessage }
                : q
            )
          );
        }
      }
    };

    fetchQuestionsProgressively();
  }, [isInitialized, questionsWithData, fetchQuestionData, fetchedQuestionIds]);

  // Function to load more questions
  const loadMoreQuestions = useCallback(() => {
    if (isLoadingMore || allAnsweredQuestions.length <= displayedQuestionsCount)
      return;

    setIsLoadingMore(true);

    // Calculate next batch
    const nextCount = Math.min(
      displayedQuestionsCount + 15,
      allAnsweredQuestions.length
    );
    const newQuestions = allAnsweredQuestions.slice(
      displayedQuestionsCount,
      nextCount
    );

    // Add new questions with loading state
    const questionsToAdd = newQuestions.map((question) => ({
      ...question,
      isLoading: true,
      hasError: false,
    }));

    setQuestionsWithData((prev) => [...prev, ...questionsToAdd]);
    setDisplayedQuestionsCount(nextCount);
    setIsLoadingMore(false);
  }, [allAnsweredQuestions, displayedQuestionsCount, isLoadingMore]);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const currentLoadMoreRef = loadMoreRef.current;
    if (
      !currentLoadMoreRef ||
      allAnsweredQuestions.length <= displayedQuestionsCount
    )
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
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
    allAnsweredQuestions.length,
    displayedQuestionsCount,
    isLoadingMore,
    loadMoreQuestions,
  ]);

  const assessmentName = selectedAssessment?.name || "SAT";

  // Calculate statistics from all answered questions, not just displayed ones
  const totalQuestions = allAnsweredQuestions.length;
  const correctQuestions = allAnsweredQuestions.filter(
    (q) => q.isCorrect
  ).length;
  const accuracy =
    totalQuestions > 0
      ? ((correctQuestions / totalQuestions) * 100).toFixed(1)
      : "0";

  if (!isInitialized) {
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

  if (questionsWithData.length === 0) {
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
        {questionsWithData.map((question, index) => (
          <div key={`${question.questionId}-${index}`} className="mb-6">
            {question.isLoading && (
              <Card>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            )}

            {question.hasError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-center text-red-600">
                    <p className="font-medium">Failed to load question</p>
                    <p className="text-sm text-red-500 mt-1">
                      ID: {question.questionId}
                    </p>
                    {question.errorMessage && (
                      <p className="text-xs text-red-400 mt-1">
                        {question.errorMessage}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        // Remove from fetched set to allow retry
                        setFetchedQuestionIds((prev) => {
                          const newSet = new Set(prev);
                          newSet.delete(question.questionId);
                          return newSet;
                        });

                        // Retry loading this question
                        setQuestionsWithData((prev) =>
                          prev.map((q, i) =>
                            i === index
                              ? {
                                  ...q,
                                  isLoading: true,
                                  hasError: false,
                                  errorMessage: undefined,
                                }
                              : q
                          )
                        );
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {question.questionData &&
              !question.isLoading &&
              !question.hasError && (
                <React.Fragment>
                  <div className="">
                    <div className="mb-2 flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                      <span>
                        Answered on{" "}
                        {new Date(question.timestamp).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <Badge
                        variant={question.isCorrect ? "default" : "destructive"}
                        className={question.isCorrect ? "bg-green-500" : ""}
                      >
                        {question.isCorrect ? "Correct" : "Incorrect"}
                      </Badge>
                      <span>•</span>
                      <Badge variant="outline">
                        {(question.timeSpent / 1000).toFixed(1)}s
                      </Badge>
                      <span>•</span>
                      <Badge variant="outline">
                        Difficulty: {question.difficulty}
                      </Badge>
                    </div>
                    <QuestionProblemCard
                      question={question.questionData}
                      hideToolsPopup={true}
                      hideViewQuestionButton={false}
                      hideSubjectHeaders
                    />
                  </div>
                  <Separator className="my-6" />
                </React.Fragment>
              )}
          </div>
        ))}
      </div>

      {/* Load more trigger - invisible element for intersection observer */}
      {allAnsweredQuestions.length > displayedQuestionsCount && (
        <div className="space-y-4">
          <div
            ref={loadMoreRef}
            className="h-10 flex items-center justify-center"
          >
            {isLoadingMore && (
              <div className="text-center text-sm text-muted-foreground">
                Loading more questions...
              </div>
            )}
          </div>

          {/* Manual load more button as fallback */}
          {!isLoadingMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={loadMoreQuestions}
                disabled={isLoadingMore}
                className="px-6 py-2"
              >
                Load More Questions (
                {allAnsweredQuestions.length - displayedQuestionsCount}{" "}
                remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {questionsWithData.some((q) => q.isLoading) && !isLoadingMore && (
        <div className="text-center text-sm text-muted-foreground">
          Loading questions...
        </div>
      )}
    </div>
  );
}
