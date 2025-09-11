import { QuestionWithData } from "@/lib/questionbank";
import { OptimizedQuestionCard } from "../dashboard/shared/OptimizedQuestionCard";
import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QB_Single_Render({
  questions,
  visibleCount,
  handleRetry,
  onRequestMoreQuestions,
  answerVisibility,
}: {
  questions: QuestionWithData[];
  visibleCount: number;
  handleRetry: (index: number, questionId: string) => void;
  onRequestMoreQuestions?: () => void;
  answerVisibility: string;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const dotsContainerRef = useRef<HTMLDivElement>(null);

  const totalQuestions = Math.min(questions.length, visibleCount);
  const currentQuestion = questions[currentQuestionIndex];

  // Check if there are any loading questions in the visible range
  const hasLoadingQuestions = useMemo(() => {
    const visibleQuestions = questions.slice(0, visibleCount);
    return visibleQuestions.some((q) => q.isLoading);
  }, [questions, visibleCount]);

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);

      // Request more questions when approaching the end
      const remainingQuestions = totalQuestions - currentQuestionIndex - 1;
      if (remainingQuestions <= 2 && onRequestMoreQuestions) {
        onRequestMoreQuestions();
      }
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);

    // Request more questions when jumping to near the end
    const remainingQuestions = totalQuestions - index - 1;
    if (remainingQuestions <= 2 && onRequestMoreQuestions) {
      onRequestMoreQuestions();
    }
  };

  // Auto-scroll current dot into view
  useEffect(() => {
    if (dotsContainerRef.current) {
      const container = dotsContainerRef.current;
      const dotElements = container.querySelectorAll("button");
      const currentDot = dotElements[currentQuestionIndex];

      if (currentDot) {
        currentDot.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentQuestionIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestionIndex, totalQuestions]);

  if (!currentQuestion) {
    return <div>No questions available</div>;
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Navigation Header */}
      <div className="flex items-center justify-between w-full ">
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          disabled={currentQuestionIndex === 0}
          className="h-12 w-12 rounded-full hover:bg-gray-200 disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        {/* Dots Navigation */}
        <div className="flex-1 flex justify-center px-4">
          <div className="max-w-md overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div
              ref={dotsContainerRef}
              className="flex items-center space-x-1 px-2 py-1"
            >
              {Array.from({ length: totalQuestions }, (_, index) => (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`h-2 w-2 rounded-full transition-all duration-200 flex-shrink-0 ${
                    index === currentQuestionIndex
                      ? "bg-blue-500 scale-125"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to question ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          disabled={currentQuestionIndex === totalQuestions - 1}
          className="h-12 w-12 rounded-full hover:bg-gray-200 disabled:opacity-30"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Question Count and Number */}
      <div className="flex items-center justify-center w-full ">
        <div className="text-lg my-4 font-semibold text-gray-800">
          Question {currentQuestionIndex + 1}
          <div className="text-sm text-gray-600">
            {totalQuestions} questions
          </div>
        </div>
      </div>

      {/* Current Question */}
      <div className="w-full px-4">
        <OptimizedQuestionCard
          key={currentQuestion.questionId}
          withDate
          question={currentQuestion}
          index={currentQuestionIndex}
          onRetry={handleRetry}
          type="standard"
          answerVisibility={answerVisibility}
        />
      </div>

      {/* Loading indicator for additional questions */}
      {hasLoadingQuestions && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>Loading more questions...</span>
          </div>
        </div>
      )}

      {/* End of questions indicator */}
      {currentQuestionIndex === totalQuestions - 1 &&
        visibleCount >= questions.length &&
        !hasLoadingQuestions && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            You've reached the end! All {totalQuestions} questions viewed.
          </div>
        )}
    </div>
  );
}
