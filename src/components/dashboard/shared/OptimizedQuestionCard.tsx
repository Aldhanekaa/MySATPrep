import React, { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card-v2";
import { Separator } from "../../ui/separator";
import { Badge } from "../../ui/badge";
import QuestionProblemCard from "@/components/question-problem-card";
import { QuestionById_Data } from "@/types/question";

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

// Base interface for question with data
interface BaseQuestionWithData {
  questionId: string;
  timestamp: string;
  questionData?: QuestionById_Data;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

// Extended interface for answered questions with additional stats
interface AnsweredQuestionWithData extends BaseQuestionWithData {
  difficulty: string;
  isCorrect: boolean;
  timeSpent: number;
  selectedAnswer?: string;
}

// Props for the optimized question card
interface OptimizedQuestionCardProps {
  question: BaseQuestionWithData | AnsweredQuestionWithData;
  index: number;
  onRetry: (index: number, questionId: string) => void;
  type: "saved" | "answered";
}

// Type guard to check if question is answered type
const isAnsweredQuestion = (
  question: BaseQuestionWithData | AnsweredQuestionWithData
): question is AnsweredQuestionWithData => {
  return (
    "isCorrect" in question &&
    "difficulty" in question &&
    "timeSpent" in question
  );
};

// Memoized OptimizedQuestionCard component with lazy loading optimization
export const OptimizedQuestionCard = memo(
  ({ question, index, onRetry, type }: OptimizedQuestionCardProps) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect(); // Stop observing once visible
          }
        },
        {
          rootMargin: "100px", // Load when 100px before entering viewport
          threshold: 0.1,
        }
      );

      if (cardRef.current) {
        observer.observe(cardRef.current);
      }

      return () => observer.disconnect();
    }, []);

    // Memoize the formatted timestamp to avoid recalculating on every render
    const formattedTimestamp = useMemo(() => {
      return new Date(question.timestamp).toLocaleDateString();
    }, [question.timestamp]);

    // Memoize answered question stats to avoid recalculation
    const answeredQuestionStats = useMemo(() => {
      if (type === "answered" && isAnsweredQuestion(question)) {
        return {
          isCorrect: question.isCorrect,
          timeSpentSeconds: (question.timeSpent / 1000).toFixed(1),
          difficulty: question.difficulty,
        };
      }
      return null;
    }, [type, question]);

    // Don't render heavy components until visible
    if (!isVisible) {
      return (
        <div
          ref={cardRef}
          className="min-h-[200px] flex items-center justify-center"
        >
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      );
    }

    // Loading state
    if (question.isLoading) {
      return (
        <div ref={cardRef}>
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
        </div>
      );
    }

    // Error state
    if (question.hasError) {
      return (
        <div ref={cardRef}>
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
                  onClick={() => onRetry(index, question.questionId)}
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Success state with question data
    if (question.questionData && !question.isLoading && !question.hasError) {
      return (
        <div ref={cardRef}>
          <React.Fragment>
            <div className="">
              {/* Render different metadata based on type */}
              {type === "saved" && (
                <div className="mb-2 text-xs text-muted-foreground">
                  Saved on {formattedTimestamp}
                </div>
              )}

              {type === "answered" && answeredQuestionStats && (
                <div className="mb-2 flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                  <span>Answered on {formattedTimestamp}</span>
                  <span>•</span>
                  <Badge
                    variant={
                      answeredQuestionStats.isCorrect
                        ? "default"
                        : "destructive"
                    }
                    className={
                      answeredQuestionStats.isCorrect ? "bg-green-500" : ""
                    }
                  >
                    {answeredQuestionStats.isCorrect ? "Correct" : "Incorrect"}
                  </Badge>
                  <span>•</span>
                  <Badge variant="outline">
                    {answeredQuestionStats.timeSpentSeconds}s
                  </Badge>
                  <span>•</span>
                  <Badge variant="outline">
                    Difficulty: {answeredQuestionStats.difficulty}
                  </Badge>
                </div>
              )}

              <QuestionProblemCard
                question={question.questionData}
                hideToolsPopup={true}
                hideViewQuestionButton={false}
                hideSubjectHeaders
              />
            </div>
            <Separator className="my-6" />
          </React.Fragment>
        </div>
      );
    }

    return <div ref={cardRef} />;
  }
);

OptimizedQuestionCard.displayName = "OptimizedQuestionCard";

// Export the types for use in other components
export type { BaseQuestionWithData, AnsweredQuestionWithData };
