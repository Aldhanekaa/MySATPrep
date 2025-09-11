import { QuestionWithData } from "@/lib/questionbank";
import { OptimizedQuestionCard } from "../dashboard/shared/OptimizedQuestionCard";
import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { SavedQuestions } from "@/types/savedQuestions";

export default function QB_Compact_Render({
  questions,
  visibleCount,
  handleRetry,
  onRequestMoreQuestions,
  answerVisibility,
  fetchSpecificQuestion,
  assessmentName,
}: {
  questions: QuestionWithData[];
  visibleCount: number;
  handleRetry: (index: number, questionId: string) => void;
  onRequestMoreQuestions?: () => void;
  fetchSpecificQuestion: (questionId: string) => void;
  answerVisibility: string;
  assessmentName: string;
}) {
  // Load saved questions from localStorage
  const [savedQuestions, setSavedQuestions] = useLocalStorage<SavedQuestions>(
    "savedQuestions",
    {}
  );

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
      goToQuestion(currentQuestionIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);

    // Check if the question needs to be fetched
    const question = questions[index];
    if (
      question &&
      question.isLoading &&
      !question.questionData &&
      !question.hasError
    ) {
      // Call fetchSpecificQuestion to ask parent to fetch this specific question
      fetchSpecificQuestion(question.questionId);
    }

    // // Request more questions when jumping to near the end
    // const remainingQuestions = totalQuestions - index - 1;
    // if (remainingQuestions <= 2 && onRequestMoreQuestions) {
    //   onRequestMoreQuestions();
    // }
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

  // Helper function to get difficulty color classes
  const getDifficultyColorClasses = (
    difficulty: string | undefined,
    isActive: boolean
  ) => {
    if (isActive) {
      return "ring-2 ring-blue-500 scale-125 shadow-lg";
    }

    switch (difficulty) {
      case "E":
        return "bg-green-500 hover:bg-green-600 shadow-sm";
      case "M":
        return "bg-yellow-500 hover:bg-yellow-600 shadow-sm";
      case "H":
        return "bg-red-500 hover:bg-red-600 shadow-sm";
      default:
        return "bg-gray-400 hover:bg-gray-500";
    }
  };

  // Helper function to get difficulty label
  const getDifficultyLabel = (difficulty: string | undefined) => {
    switch (difficulty) {
      case "E":
        return "Easy";
      case "M":
        return "Medium";
      case "H":
        return "Hard";
      default:
        return "Unknown";
    }
  };

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

        {/* Question Count and Number */}
        <div className="flex items-center justify-center ">
          <div className="text-lg my-4 font-semibold text-gray-800 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span>Question {currentQuestionIndex + 1}</span>
              {currentQuestion.difficulty && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentQuestion.difficulty === "E"
                      ? "bg-green-100 text-green-800"
                      : currentQuestion.difficulty === "M"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {getDifficultyLabel(currentQuestion.difficulty)}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {totalQuestions} questions
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

      {/* Current Question */}
      <div className="w-full px-4">
        <OptimizedQuestionCard
          withDate
          question={currentQuestion}
          index={currentQuestionIndex}
          onRetry={handleRetry}
          type="standard"
          answerVisibility={answerVisibility}
        />
      </div>
      {/* Navigation Grid */}

      <div className="w-full">
        {/* Difficulty Legend */}
        <div className="flex items-center justify-center gap-6 text-xs text-gray-600 mb-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded border border-gray-200 border-b-4 border-b-green-500 bg-white"></div>
            <span>Easy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded border border-gray-200 border-b-4 border-b-yellow-500 bg-white"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded border border-gray-200 border-b-4 border-b-red-500 bg-white"></div>
            <span>Hard</span>
          </div>
        </div>

        <div className="flex-1 flex justify-center px-4">
          <div
            ref={dotsContainerRef}
            className="grid grid-cols-12 gap-2 px-2 py-1 max-w-fit mx-auto"
          >
            {Array.from({ length: questions.length }, (_, index) => {
              const question = questions[index];
              const difficulty = question?.difficulty;
              const isActive = index === currentQuestionIndex;

              // Get difficulty border color
              const getDifficultyBorderColor = (
                difficulty: string | undefined
              ) => {
                switch (difficulty) {
                  case "E":
                    return "border-b-green-500";
                  case "M":
                    return "border-b-yellow-500";
                  case "H":
                    return "border-b-red-500";
                  default:
                    return "border-b-gray-400";
                }
              };

              return (
                <button
                  key={index}
                  onClick={() => {
                    // Check if question needs fetching before navigation
                    if (
                      question &&
                      question.isLoading &&
                      !question.questionData &&
                      !question.hasError
                    ) {
                      fetchSpecificQuestion(question.questionId);
                    }
                    goToQuestion(index);
                  }}
                  className={`relative p-3 rounded-lg border border-gray-200 border-b-4 bg-white text-sm font-medium transition-all duration-200 flex-shrink-0 w-16 h-16 hover:shadow-md ${getDifficultyBorderColor(
                    difficulty
                  )} ${
                    isActive ? "ring-2 ring-blue-500 scale-105 shadow-lg" : ""
                  }`}
                  title={`Question ${index + 1} - ${getDifficultyLabel(
                    difficulty
                  )}`}
                  aria-label={`Go to question ${
                    index + 1
                  } - ${getDifficultyLabel(difficulty)}`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="font-bold text-sm text-gray-800">
                      {index + 1}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
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
