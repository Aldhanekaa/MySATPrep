import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AssessmentWorkspace } from "@/app/dashboard/types";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { SavedQuestions, SavedQuestion } from "@/types/savedQuestions";
import { QuestionById_Data } from "@/types/question";
import QuestionProblemCard from "@/components/question-problem-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card-v2";

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

interface SavedTabProps {
  selectedAssessment?: AssessmentWorkspace;
}

interface QuestionWithData extends SavedQuestion {
  questionData?: QuestionById_Data;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export function SavedTab({ selectedAssessment }: SavedTabProps) {
  // Load saved questions from localStorage
  const [savedQuestions] = useLocalStorage<SavedQuestions>(
    "savedQuestions",
    {}
  );

  // State for managing questions with their fetched data
  const [questionsWithData, setQuestionsWithData] = useState<
    QuestionWithData[]
  >([]);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Initialize questions when assessment or saved questions change
  useEffect(() => {
    const assessmentKey = getAssessmentKey(selectedAssessment);
    const assessmentSavedQuestions = savedQuestions[assessmentKey] || [];

    // Initialize questions with loading state
    const initialQuestions: QuestionWithData[] = assessmentSavedQuestions.map(
      (question) => ({
        ...question,
        isLoading: true,
        hasError: false,
      })
    );

    setQuestionsWithData(initialQuestions);
    setIsInitialized(true);
  }, [selectedAssessment, savedQuestions, getAssessmentKey]);

  // Fetch question data progressively
  useEffect(() => {
    if (!isInitialized || questionsWithData.length === 0) return;

    const fetchQuestionsProgressively = async () => {
      // Process questions one by one to avoid overwhelming the API
      for (let i = 0; i < questionsWithData.length; i++) {
        const question = questionsWithData[i];

        if (!question.isLoading || question.questionData || question.hasError) {
          continue; // Skip if already processed
        }

        try {
          const questionData = await fetchQuestionData(question.questionId);

          // Update the specific question with fetched data
          setQuestionsWithData((prev) =>
            prev.map((q, index) =>
              index === i
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
            prev.map((q, index) =>
              index === i
                ? { ...q, isLoading: false, hasError: true, errorMessage }
                : q
            )
          );
        }
      }
    };

    fetchQuestionsProgressively();
  }, [isInitialized, questionsWithData, fetchQuestionData]);

  const assessmentName = selectedAssessment?.name || "SAT";

  if (!isInitialized) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Saved Questions</h2>
        <p className="text-sm text-muted-foreground">
          Loading saved questions...
        </p>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (questionsWithData.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Saved Questions</h2>
        <p className="text-sm text-muted-foreground">
          No saved questions found for {assessmentName}.
        </p>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <p className="text-lg">📚</p>
              <p className="mt-2">You haven&apos;t saved any questions yet.</p>
              <p className="text-sm text-muted-foreground">
                Questions you bookmark will appear here for easy review.
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
        <h2 className="text-lg font-semibold">Saved Questions</h2>
        <p className="text-sm text-muted-foreground">
          {questionsWithData.length} saved question
          {questionsWithData.length !== 1 ? "s" : ""} for {assessmentName}
        </p>
      </div>

      <div className="space-y-4 max-w-full mx-auto px-6 lg:px-22">
        {questionsWithData.map((question, index) => (
          <div key={`${question.questionId}-${index}`} className=" mb-32">
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
                <div className="mb-6">
                  <div className="mb-2 text-xs text-muted-foreground">
                    Saved on {new Date(question.timestamp).toLocaleDateString()}
                  </div>
                  <QuestionProblemCard
                    question={question.questionData}
                    hideToolsPopup={true}
                  />
                </div>
              )}
          </div>
        ))}
      </div>

      {questionsWithData.some((q) => q.isLoading) && (
        <div className="text-center text-sm text-muted-foreground">
          Loading more questions...
        </div>
      )}
    </div>
  );
}
