"use client";
import { QuestionById_Data } from "@/types";
import { SavedQuestions, SavedQuestion } from "@/types/savedQuestions";
import { QuestionNotes, QuestionNote } from "@/types/questionNotes";
import { PracticeStatistics } from "@/types/statistics";
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
} from "./ui/card-v2";
import { RadioGroup } from "@/components/ui/radio-group";
import {
  BookmarkIcon,
  SendIcon,
  Copy,
  Check,
  CheckCircle,
  X,
  PyramidIcon,
  GripHorizontal,
  Calculator,
  Maximize2Icon,
  NotebookPen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MathJax } from "better-react-mathjax";
import React, { useState, useEffect } from "react";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { playSound } from "@/lib/playSound";
import { useRouter } from "next/navigation";
import { toast, useSonner } from "sonner";
import { Pill, PillIndicator } from "./ui/pill";
import { Separator } from "./ui/separator";
import { DraggableReferencePopup } from "./popups/reference-popup";
import { DraggableDesmosPopup } from "./popups/desmos-popup";
import { DraggableNotesPopup } from "./popups/notes-popup";

// Duolingo-styled Input Component
interface DuolingoInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onSubmit?: () => void;
}

const DuolingoInput = React.memo(function DuolingoInput({
  value,
  onChange,
  placeholder = "Type your answer here...",
  disabled = false,
  onSubmit,
}: DuolingoInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled && onSubmit && value?.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="text"
          value={value || ""}
          onChange={(e) => !disabled && onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => !disabled && playSound("button-pressed.wav")}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-4 text-lg font-medium border-2 border-b-4 rounded-2xl focus:outline-none transition-all duration-200 shadow-sm ${
            disabled
              ? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
              : "border-gray-300 focus:border-blue-500 focus:border-b-blue-500 focus:ring-0 bg-white hover:shadow-md focus:shadow-lg"
          }`}
        />
      </div>
    </div>
  );
});

export default function QuestionProblemCard({
  question,
  hideToolsPopup = false,
  hideViewQuestionButton = false,
  hideSubjectHeaders = false,
}: {
  question: QuestionById_Data;
  hideToolsPopup?: boolean;
  hideViewQuestionButton?: boolean;
  hideSubjectHeaders?: boolean;
}) {
  const sonner = useSonner();
  const router = useRouter();

  // Load saved questions from localStorage
  const [savedQuestions, setSavedQuestions] = useLocalStorage<SavedQuestions>(
    "savedQuestions",
    {}
  );

  // Load practice statistics from localStorage with setter
  const [practiceStatistics, setPracticeStatistics] =
    useLocalStorage<PracticeStatistics>("practiceStatistics", {});

  // Load question notes from localStorage
  const [questionNotes, setQuestionNotes] = useLocalStorage<QuestionNotes>(
    "questionNotes",
    {}
  );

  // State for tracking if this question is saved and answered before
  const [isQuestionSaved, setIsQuestionSaved] = useState<boolean>(false);
  const [isQuestionAnswered, setIsQuestionAnswered] = useState<boolean>(false);
  const [questionStats, setQuestionStats] = useState<{
    isCorrect?: boolean;
    timeSpent?: number;
    timestamp?: string;
    selectedAnswer?: string; // Add selected answer to track user's choice
  } | null>(null);

  // State for question notes
  const [currentNote, setCurrentNote] = useState<string>("");
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(false);
  const [hasNote, setHasNote] = useState<boolean>(false);

  // State for answer selection
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [questionStartTime] = useState<number>(Date.now());

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Reference popup state
  const [isReferencePopupOpen, setIsReferencePopupOpen] =
    useState<boolean>(false);

  // Desmos popup state
  const [isDesmosPopupOpen, setIsDesmosPopupOpen] = useState<boolean>(false);

  // Get assessment from question.question.program
  const assessment = question.question.program;

  // Check if current question is saved and if it has been answered before
  useEffect(() => {
    if (question && question.question && assessment) {
      const questionId = question.question.questionId;

      // Check if question is saved
      const assessmentSavedQuestions = savedQuestions[assessment] || [];
      const isSaved = assessmentSavedQuestions.some(
        (q: SavedQuestion) => q.questionId === questionId
      );
      setIsQuestionSaved(isSaved);

      // Check if question has a note
      const assessmentNotes = questionNotes[assessment] || [];
      const existingNote = assessmentNotes.find(
        (note: QuestionNote) => note.questionId === questionId
      );
      if (existingNote) {
        setCurrentNote(existingNote.note);
        setHasNote(true);
      } else {
        setCurrentNote("");
        setHasNote(false);
      }

      // Check if question has been answered before in practice statistics
      const assessmentStats = practiceStatistics[assessment];
      if (assessmentStats) {
        // Check in legacy answered questions list
        const isAnsweredLegacy =
          assessmentStats.answeredQuestions?.includes(questionId) || false;

        // Check in detailed answered questions for more info
        const detailedAnswer = assessmentStats.answeredQuestionsDetailed?.find(
          (q) => q.questionId === questionId
        );

        setIsQuestionAnswered(isAnsweredLegacy || !!detailedAnswer);

        if (detailedAnswer) {
          setQuestionStats({
            isCorrect: detailedAnswer.isCorrect,
            timeSpent: detailedAnswer.timeSpent,
            timestamp: detailedAnswer.timestamp,
            selectedAnswer: detailedAnswer.selectedAnswer, // Get the stored selected answer
          });
        }
      }
    }
  }, [question, savedQuestions, questionNotes, practiceStatistics, assessment]);

  // Set share URL when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      const questionUrl = `${baseUrl}/question/${question.question.questionId}`;
      setShareUrl(questionUrl);
    }
  }, [question.question.questionId]);

  // Play sound when share modal opens
  useEffect(() => {
    if (isShareModalOpen) {
      playSound("popup-confirm-up.wav");
    }
  }, [isShareModalOpen]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      playSound("button-pressed.wav");
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Handle saving note
  const handleSaveNote = (noteText: string) => {
    try {
      const questionId = question.question.questionId;
      const updatedNotes = { ...questionNotes };

      // If note is empty, delete it
      if (!noteText.trim()) {
        if (updatedNotes[assessment]) {
          updatedNotes[assessment] = updatedNotes[assessment].filter(
            (note: QuestionNote) => note.questionId !== questionId
          );
        }
        setQuestionNotes(updatedNotes);
        setCurrentNote("");
        setHasNote(false);
        console.log("Note deleted successfully!");
        return;
      }

      // Initialize array if it doesn't exist
      if (!updatedNotes[assessment]) {
        updatedNotes[assessment] = [];
      }

      // Check if note already exists
      const noteIndex = updatedNotes[assessment].findIndex(
        (note: QuestionNote) => note.questionId === questionId
      );

      const now = new Date().toISOString();

      if (noteIndex === -1) {
        // Create new note
        const newNote: QuestionNote = {
          questionId,
          note: noteText,
          timestamp: now,
          createdAt: now,
        };
        updatedNotes[assessment].push(newNote);
      } else {
        // Update existing note
        updatedNotes[assessment][noteIndex] = {
          ...updatedNotes[assessment][noteIndex],
          note: noteText,
          timestamp: now,
        };
      }

      setQuestionNotes(updatedNotes);
      setCurrentNote(noteText);
      setHasNote(true);
      console.log("Note saved successfully!");
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  // Check if answer is correct without submitting
  const checkAnswerCorrectness = (answer: string) => {
    if (!answer) return null;

    return question.problem.answerOptions
      ? question.problem.correct_answer?.includes(answer) || false
      : question.problem.correct_answer?.some(
          (correctAnswer) =>
            correctAnswer.trim().toLowerCase() === answer.trim().toLowerCase()
        ) || false;
  };

  // Handle answer selection (for both multiple choice and text input)
  const handleAnswerSelect = (optionKey: string) => {
    if (isAnswerChecked || isQuestionAnswered) return;

    setSelectedAnswer(optionKey);
    setIsQuestionAnswered(true);

    // For multiple choice, immediately validate and submit
    if (question.problem.answerOptions) {
      setIsAnswerChecked(true);
      submitAnswer(optionKey);
    }
  };

  // Handle text input change with immediate validation
  const handleTextInputChange = (value: string) => {
    if (isAnswerChecked || isQuestionAnswered) return;
    setSelectedAnswer(value);
  };

  // Submit answer and save statistics
  const submitAnswer = (answer: string) => {
    const questionId = question.question.questionId;

    // For multiple choice questions
    const isCorrect = question.problem.answerOptions
      ? question.problem.correct_answer?.includes(answer) || false
      : // For text input questions, compare with correct answers (case insensitive, trimmed)
        question.problem.correct_answer?.some(
          (correctAnswer) =>
            correctAnswer.trim().toLowerCase() === answer.trim().toLowerCase()
        ) || false;

    const timeElapsed = Date.now() - questionStartTime;

    // Play sound effect
    if (isCorrect) {
      playSound("correct-answer.wav");
    } else {
      playSound("incorrect-answer.wav");
    }

    // Update practice statistics
    const updatedStats = { ...practiceStatistics };

    // Initialize assessment stats if they don't exist
    if (!updatedStats[assessment]) {
      updatedStats[assessment] = {
        answeredQuestions: [],
        answeredQuestionsDetailed: [],
        statistics: {},
      };
    }

    const assessmentStats = updatedStats[assessment];

    // Add to answered questions if not already there
    if (!assessmentStats.answeredQuestions?.includes(questionId)) {
      assessmentStats.answeredQuestions =
        assessmentStats.answeredQuestions || [];
      assessmentStats.answeredQuestions.push(questionId);
    }

    // Add detailed answer information
    assessmentStats.answeredQuestionsDetailed =
      assessmentStats.answeredQuestionsDetailed || [];

    // Remove existing entry if it exists (for re-answering)
    assessmentStats.answeredQuestionsDetailed =
      assessmentStats.answeredQuestionsDetailed.filter(
        (q) => q.questionId !== questionId
      );

    // Add new entry
    assessmentStats.answeredQuestionsDetailed.push({
      questionId,
      difficulty: question.question.difficulty || "M", // Default to Medium if not specified
      isCorrect,
      timeSpent: timeElapsed,
      timestamp: new Date().toISOString(),
      selectedAnswer: answer, // Store user's selected answer
      plainQuestion: question.question,
    });

    // Save to localStorage
    setPracticeStatistics(updatedStats);

    // Debug logging
    console.log("Question answered and saved to practiceStatistics:", {
      questionId,
      selectedAnswer: answer,
      isCorrect,
      assessment,
      questionType: question.problem.answerOptions
        ? "multiple-choice"
        : "text-input",
      updatedStats: updatedStats[assessment]?.answeredQuestionsDetailed,
    });

    // Update local state
    setIsQuestionAnswered(true);
    setQuestionStats({
      isCorrect,
      timeSpent: timeElapsed,
      timestamp: new Date().toISOString(),
      selectedAnswer: answer, // Store the user's selected answer
    });
  };

  // Handle text input submission
  const handleTextInputSubmit = () => {
    if (selectedAnswer && selectedAnswer.trim()) {
      setIsAnswerChecked(true);
      setIsQuestionAnswered(true);
      submitAnswer(selectedAnswer.trim());
    }
  };

  return (
    <React.Fragment>
      {/* Subject and Skill Headers */}
      {!hideSubjectHeaders && (
        <div className="mb-4 space-y-2">
          <h3 className="text-lg font-bold text-gray-800">
            {question.question.primary_class_cd_desc}
          </h3>
          <h3 className="text-base font-semibold text-gray-600">
            {question.question.skill_desc}
          </h3>
        </div>
      )}

      <Card
        variant="accent"
        className={cn("w-full", "transition-all duration-300")}
      >
        <CardHeader>
          <CardHeading className="w-full">
            <CardTitle>
              <div className="grid grid-cols-12 w-full items-center gap-1 py-4 md:py-1 justify-between">
                <div className="col-span-12 md:col-span-5 flex text-xl items-center gap-1">
                  <Pill className="text-md font-semibold">
                    {question.question.difficulty == "E" ? (
                      <React.Fragment>
                        <PillIndicator variant="success" pulse />
                        Easy
                      </React.Fragment>
                    ) : question.question.difficulty == "M" ? (
                      <React.Fragment>
                        <PillIndicator variant="warning" pulse />
                        Medium
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <PillIndicator variant="error" pulse />
                        Hard
                      </React.Fragment>
                    )}
                  </Pill>
                  <div className="h-5 mr-2">
                    <Separator
                      orientation="vertical"
                      className=" border-black h-full"
                    />
                  </div>
                  <span className=" font-bold">Question</span>{" "}
                  {question.question.questionId}
                </div>
                <div className="col-span-12 md:col-span-7 flex flex-wrap items-center justify-center md:justify-end gap-2">
                  {!hideToolsPopup && (
                    <>
                      <Button
                        variant="default"
                        className="flex group cursor-pointer items-center gap-1 md:gap-2 font-bold py-2 md:py-3 px-3 md:px-6 rounded-xl md:rounded-2xl border-b-4 shadow-md hover:shadow-lg transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400 text-xs md:text-sm"
                        onClick={() => {
                          playSound("button-pressed.wav");
                          setIsReferencePopupOpen(
                            (isReferencePopupOpen) => !isReferencePopupOpen
                          );
                        }}
                      >
                        <PyramidIcon className="w-3 h-3 md:w-4 md:h-4 group-hover:rotate-12 duration-300" />
                        <span className="font-medium hidden sm:inline">
                          Reference
                        </span>
                      </Button>
                      <Button
                        variant="default"
                        className="flex group cursor-pointer items-center gap-1 md:gap-2 font-bold py-2 md:py-3 px-3 md:px-6 rounded-xl md:rounded-2xl border-b-4 shadow-md hover:shadow-lg transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 bg-blue-500 hover:bg-blue-600 text-white border-blue-700 hover:border-blue-800 text-xs md:text-sm"
                        onClick={() => {
                          playSound("button-pressed.wav");
                          setIsDesmosPopupOpen(
                            (isDesmosPopupOpen) => !isDesmosPopupOpen
                          );
                        }}
                      >
                        <Calculator className="w-3 h-3 md:w-4 md:h-4 group-hover:rotate-12 duration-300" />
                        <span className="font-medium hidden sm:inline">
                          Calculator
                        </span>
                      </Button>
                    </>
                  )}
                  <Button
                    variant="default"
                    className={`flex cursor-pointer items-center gap-1 md:gap-2 font-bold py-2 md:py-3 px-3 md:px-6 rounded-xl md:rounded-2xl border-b-4 shadow-md hover:shadow-lg transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 text-xs md:text-sm ${
                      hasNote
                        ? "bg-gray-600 hover:bg-gray-700 text-white border-gray-800 hover:border-gray-900"
                        : "bg-gray-600 hover:bg-gray-700 text-white border-gray-800 hover:border-gray-900"
                    }`}
                    onClick={() => {
                      playSound("button-pressed.wav");
                      setIsNotesModalOpen((isPopupOpen) => !isPopupOpen);
                    }}
                  >
                    <NotebookPen
                      className={`w-3 h-3 md:w-4 md:h-4 duration-300 group-hover:rotate-12`}
                    />
                    <span className="font-medium hidden sm:inline">
                      {hasNote ? "Edit Note" : "Add Note"}
                    </span>
                  </Button>
                  <Button
                    variant="default"
                    className={`flex cursor-pointer items-center gap-1 md:gap-2 font-bold py-2 md:py-3 px-3 md:px-6 rounded-xl md:rounded-2xl border-b-4 shadow-md hover:shadow-lg transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 text-xs md:text-sm ${
                      isQuestionSaved
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-700 hover:border-yellow-800"
                        : "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-700 hover:border-yellow-800"
                    }`}
                    onClick={() => {
                      try {
                        const questionId = question.question.questionId;
                        const updatedSavedQuestions = { ...savedQuestions };

                        // Initialize array if it doesn't exist
                        if (!updatedSavedQuestions[assessment]) {
                          updatedSavedQuestions[assessment] = [];
                        }

                        // Check if question is already saved
                        const questionIndex = updatedSavedQuestions[
                          assessment
                        ].findIndex(
                          (q: SavedQuestion) => q.questionId === questionId
                        );

                        if (questionIndex === -1) {
                          // Question not saved, so save it
                          playSound("tap-checkbox-checked.wav");
                          const newSavedQuestion: SavedQuestion = {
                            questionId: questionId,
                            externalId: question.question.external_id || null,
                            ibn: question.question.ibn || null,
                            plainQuestion: question.question, // Include full question data
                            timestamp: new Date().toISOString(),
                          };
                          updatedSavedQuestions[assessment].push(
                            newSavedQuestion
                          );
                          console.log("Question saved successfully!");
                        } else {
                          // Question already saved, so remove it
                          playSound("tap-checkbox-unchecked.wav");
                          updatedSavedQuestions[assessment].splice(
                            questionIndex,
                            1
                          );
                          console.log("Question removed from saved!");
                        }

                        // Update the localStorage through the hook
                        setSavedQuestions(updatedSavedQuestions);
                      } catch (error) {
                        console.error("Failed to save/remove question:", error);
                      }
                    }}
                  >
                    <BookmarkIcon
                      className={`w-3 h-3 md:w-4 md:h-4 duration-300 group-hover:rotate-12 ${
                        isQuestionSaved ? "fill-current" : ""
                      }`}
                    />
                    <span className="font-medium hidden sm:inline">
                      {isQuestionSaved ? "Saved" : "Save"}
                    </span>
                  </Button>
                  <Button
                    variant="default"
                    className="flex cursor-pointer items-center gap-1 md:gap-2 font-bold py-2 md:py-3 px-3 md:px-6 rounded-xl md:rounded-2xl border-b-4 shadow-md hover:shadow-lg transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 bg-neutral-500 hover:bg-neutral-600 text-white border-neutral-700 hover:border-neutral-800 text-xs md:text-sm"
                    onClick={() => {
                      playSound("button-pressed.wav");
                      setIsShareModalOpen(true);
                    }}
                  >
                    <SendIcon className="w-3 h-3 md:w-4 md:h-4 duration-300 group-hover:rotate-12" />
                  </Button>

                  {!hideViewQuestionButton && (
                    <Button
                      variant="default"
                      className="flex cursor-pointer items-center gap-1 md:gap-2 font-bold py-2 md:py-3 px-3 md:px-6 rounded-xl md:rounded-2xl border-b-4 shadow-md hover:shadow-lg transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 bg-blue-500 hover:bg-blue-600 text-white border-blue-700 hover:border-blue-800 text-xs md:text-sm"
                      onClick={() => {
                        playSound("button-pressed.wav");
                        const toastId = toast.loading(
                          "Redirecting to question page",
                          {
                            position: "top-center",
                          }
                        );

                        router.push(
                          `/question/${question.question.questionId}`
                        );

                        // Dismiss the toast after 2 seconds
                        setTimeout(() => {
                          toast.dismiss(toastId);
                        }, 2000);
                      }}
                    >
                      <Maximize2Icon className="w-3 h-3 md:w-4 md:h-4 duration-300 group-hover:rotate-12" />
                    </Button>
                  )}
                </div>
              </div>
            </CardTitle>
          </CardHeading>
        </CardHeader>

        <CardContent className="p-6">
          {question.problem.stimulus && (
            <MathJax
              inline
              dynamic
              id="question_explanation"
              className="text-lg text-justify"
            >
              <span
                id="question_explanation"
                className="text-lg text-justify"
                dangerouslySetInnerHTML={{
                  __html: question.problem.stimulus
                    ? question.problem.stimulus
                    : "",
                }}
              ></span>
            </MathJax>
          )}
          {question.problem.stem && (
            <MathJax inline dynamic>
              <span
                id="question_explanation"
                className="text-lg text-justify"
                dangerouslySetInnerHTML={{
                  __html: question.problem.stem ? question.problem.stem : "",
                }}
              ></span>
            </MathJax>
          )}

          {/* Answer Section - Multiple Choice or Text Input */}
          {question.problem.answerOptions ? (
            // Multiple Choice Questions
            <div className="space-y-3 mt-6">
              <RadioGroup className="flex flex-col gap-3" disabled>
                {Object.entries(question.problem.answerOptions).map(
                  ([optionKey, optionText], index) => {
                    const isCorrect =
                      question.problem.correct_answer?.includes(optionKey) ||
                      false;

                    // For current session answers
                    const isSelected = selectedAnswer === optionKey;
                    const isSelectedWrongAnswer =
                      isAnswerChecked && isSelected && !isCorrect;

                    // For previously answered questions - check if this was the user's choice
                    const isPreviousUserAnswer =
                      isQuestionAnswered &&
                      !isAnswerChecked &&
                      questionStats?.selectedAnswer === optionKey;

                    // Show correct answers when question is answered (either current session or previous)
                    const showCorrectAnswer =
                      (isAnswerChecked || isQuestionAnswered) && isCorrect;

                    // Show user's wrong answer from previous session
                    const isPreviousWrongAnswer =
                      isQuestionAnswered &&
                      !isAnswerChecked &&
                      isPreviousUserAnswer &&
                      !isCorrect;

                    return (
                      <div
                        key={optionKey}
                        onMouseEnter={() => {
                          if (!isAnswerChecked && !isQuestionAnswered) {
                            playSound("on-hover.wav");
                          }
                        }}
                        className="flex z-20 items-center gap-2 answer-option"
                      >
                        <label
                          onClick={() => {
                            if (!isAnswerChecked && !isQuestionAnswered) {
                              handleAnswerSelect(optionKey);
                            }
                          }}
                          className={`relative ${
                            !isAnswerChecked && !isQuestionAnswered
                              ? "cursor-pointer"
                              : "cursor-default"
                          } w-full transition duration-500 ${
                            showCorrectAnswer
                              ? "border-2 border-green-500 bg-green-500/10"
                              : isSelectedWrongAnswer || isPreviousWrongAnswer
                              ? "border-2 border-red-500 bg-red-500/10"
                              : isSelected || isPreviousUserAnswer
                              ? "border-2 border-blue-500 bg-blue-500/10"
                              : "border-2 border-input"
                          } has-[[data-disabled]]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70 flex flex-col items-start gap-4 rounded-lg p-3 shadow-sm shadow-black/5`}
                        >
                          <div className="grid grid-cols-9 items-center gap-3">
                            <div className="col-span-1 flex items-center justify-center">
                              <div
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                                  showCorrectAnswer
                                    ? "border-green-500 bg-green-500 text-white"
                                    : isSelectedWrongAnswer ||
                                      isPreviousWrongAnswer
                                    ? "border-red-500 bg-red-500 text-white"
                                    : isSelected || isPreviousUserAnswer
                                    ? "border-blue-500 bg-blue-500 text-white"
                                    : "border-gray-300 bg-gray-50 text-gray-600"
                                }`}
                              >
                                {showCorrectAnswer ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : isSelectedWrongAnswer ||
                                  isPreviousWrongAnswer ? (
                                  <X className="h-4 w-4" />
                                ) : (
                                  String.fromCharCode(65 + index)
                                )}
                              </div>
                            </div>
                            <Label className="col-span-8">
                              <MathJax
                                inline
                                dynamic
                                id="question_explanation"
                                className="inline-block"
                              >
                                <span
                                  id="question_explanation"
                                  className="text-xl inline-block"
                                  dangerouslySetInnerHTML={{
                                    __html: optionText,
                                  }}
                                ></span>
                              </MathJax>
                            </Label>
                          </div>
                        </label>
                      </div>
                    );
                  }
                )}
              </RadioGroup>

              {/* Show immediate feedback for current session multiple choice answers */}
              {isAnswerChecked &&
                questionStats &&
                question.problem.answerOptions && (
                  <div
                    className={`mt-4 p-3 rounded-lg border-2 ${
                      questionStats.isCorrect
                        ? "border-green-500 bg-green-500/10"
                        : "border-red-500 bg-red-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          questionStats.isCorrect
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        <span className="text-white text-sm font-semibold">
                          {questionStats.isCorrect ? "✓" : "✗"}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          questionStats.isCorrect
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        Your answer is{" "}
                        {questionStats.isCorrect ? "correct!" : "incorrect."}
                      </span>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            // Text Input Questions (like fill-in-the-blank, numerical answers, etc.)
            <div className="space-y-4 mt-6">
              <DuolingoInput
                value={
                  // If question was previously answered, show the previous answer
                  isQuestionAnswered &&
                  !isAnswerChecked &&
                  questionStats?.selectedAnswer
                    ? questionStats.selectedAnswer
                    : selectedAnswer || ""
                }
                onChange={handleTextInputChange}
                onSubmit={handleTextInputSubmit}
                disabled={isAnswerChecked || isQuestionAnswered}
                placeholder="Type your answer here..."
              />

              {/* Show real-time validation for text input */}
              {selectedAnswer &&
                selectedAnswer.trim() &&
                !isAnswerChecked &&
                !isQuestionAnswered && (
                  <div className="mt-2">
                    {checkAnswerCorrectness(selectedAnswer) && (
                      <div className="p-2 rounded-lg border-2 border-green-500 bg-green-500/10">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            Looks correct! Press Enter to submit.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* Show status indicator for previously answered text input questions */}
              {isQuestionAnswered &&
                !isAnswerChecked &&
                questionStats?.selectedAnswer && (
                  <div
                    className={`mt-2 p-3 rounded-lg border-2 ${
                      questionStats.isCorrect
                        ? "border-green-500 bg-green-500/10"
                        : "border-red-500 bg-red-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          questionStats.isCorrect
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        <span className="text-white text-sm font-semibold">
                          {questionStats.isCorrect ? "✓" : "✗"}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          questionStats.isCorrect
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        Your previous answer was{" "}
                        {questionStats.isCorrect ? "correct" : "incorrect"}
                      </span>
                    </div>
                  </div>
                )}

              {/* Show immediate feedback for current session answers */}
              {isAnswerChecked &&
                !isQuestionAnswered &&
                selectedAnswer &&
                questionStats && (
                  <div
                    className={`mt-2 p-3 rounded-lg border-2 ${
                      questionStats.isCorrect
                        ? "border-green-500 bg-green-500/10"
                        : "border-red-500 bg-red-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          questionStats.isCorrect
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        <span className="text-white text-sm font-semibold">
                          {questionStats.isCorrect ? "✓" : "✗"}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          questionStats.isCorrect
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        Your answer is{" "}
                        {questionStats.isCorrect ? "correct!" : "incorrect."}
                      </span>
                    </div>
                  </div>
                )}

              {/* Show correct answers for text input after answering */}
              {(isAnswerChecked || isQuestionAnswered) &&
                question.problem.correct_answer && (
                  <div className="mt-2 p-3 rounded-lg border-2 border-green-500 bg-green-500/10">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Correct answer
                        {question.problem.correct_answer.length > 1
                          ? "s"
                          : ""}:{" "}
                        <strong>
                          {question.problem.correct_answer.join(", ")}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>
      {isQuestionAnswered && (
        <div className="mt-4 w-full mx-auto xl:w-5xl px-4">
          <Label className="text-lg font-semibold mb-2 block">
            Explanation:
          </Label>
          <MathJax
            inline
            dynamic
            id="question_explanation"
            className=" text-justify"
          >
            <span
              className="text-sm md:text-lg lg:text-xl"
              dangerouslySetInnerHTML={{
                __html: question.problem.rationale,
              }}
            ></span>
          </MathJax>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
          <div className="bg-white rounded-2xl border-2 border-b-4 border-gray-300 shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                📤 Share Question
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  playSound("popup-confirm-down.wav");
                  setIsShareModalOpen(false);
                  setIsCopied(false);
                }}
                className="rounded-xl"
              >
                ✕
              </Button>
            </div>

            <p className="text-gray-600 mb-4">
              Share this question with others by copying the link below:
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border-2 rounded-xl bg-gray-50 text-sm"
              />
              <Button
                variant="default"
                onClick={handleCopy}
                className={`px-4 py-2 rounded-xl border-2 border-b-4 font-bold transition-all duration-200 ${
                  isCopied
                    ? "bg-green-500 border-green-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 border-blue-700 text-white"
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {!hideViewQuestionButton && (
              <div className="mb-4">
                <Button
                  variant="default"
                  onClick={() => {
                    playSound("button-pressed.wav");
                    router.push(`/question/${question.question.questionId}`);
                  }}
                  className="w-full px-4 py-2 rounded-xl border-2 border-b-4 font-bold transition-all duration-200 bg-gray-500 hover:bg-gray-600 border-gray-700 text-white"
                >
                  🔗 View Question Page
                </Button>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Anyone with this link can view this specific question.
            </div>
          </div>
        </div>
      )}

      {/* Notes Popup */}
      <DraggableNotesPopup
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        questionId={question.question.questionId}
        assessment={assessment}
        questionNotes={questionNotes}
        onSaveNote={handleSaveNote}
        currentNote={currentNote}
      />

      {/* Reference Popup */}
      {!hideToolsPopup && (
        <DraggableReferencePopup
          isOpen={isReferencePopupOpen}
          onClose={() => setIsReferencePopupOpen(false)}
        />
      )}

      {/* Desmos Popup */}
      {!hideToolsPopup && (
        <DraggableDesmosPopup
          isOpen={isDesmosPopupOpen}
          onClose={() => setIsDesmosPopupOpen(false)}
        />
      )}
    </React.Fragment>
  );
}
