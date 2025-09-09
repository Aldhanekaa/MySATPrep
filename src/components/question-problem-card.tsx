"use client";
import { QuestionById_Data } from "@/types";
import { SavedQuestions, SavedQuestion } from "@/types/savedQuestions";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import React, { useState, useEffect, useReducer, useRef } from "react";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { playSound } from "@/lib/playSound";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ReferenceSheet from "@/src/sat-math-refrence-sheet.webp";
import { toast, useSonner } from "sonner";
import { Pill, PillIndicator } from "./ui/pill";
import { Separator } from "./ui/separator";

// Reference Popup State Management
interface PopupState {
  position: { x: number; y: number };
  size: { width: number; height: number };
  isDragging: boolean;
  isResizing: boolean;
  resizeDirection: "se" | "ne" | null;
  dragStart: { x: number; y: number };
  resizeStart: {
    x: number;
    y: number;
    width: number;
    height: number;
    startPosition: { x: number; y: number };
  };
}

type PopupAction =
  | { type: "SET_POSITION"; payload: { x: number; y: number } }
  | { type: "SET_SIZE"; payload: { width: number; height: number } }
  | { type: "START_DRAGGING"; payload: { x: number; y: number } }
  | { type: "STOP_DRAGGING" }
  | {
      type: "START_RESIZING";
      payload: {
        direction: "se" | "ne";
        x: number;
        y: number;
        width: number;
        height: number;
        startPosition: { x: number; y: number };
      };
    }
  | { type: "STOP_RESIZING" };

const popupInitialState: PopupState = {
  position: { x: 50, y: 50 },
  size: { width: 600, height: 400 },
  isDragging: false,
  isResizing: false,
  resizeDirection: null,
  dragStart: { x: 0, y: 0 },
  resizeStart: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    startPosition: { x: 0, y: 0 },
  },
};

function popupReducer(state: PopupState, action: PopupAction): PopupState {
  switch (action.type) {
    case "SET_POSITION":
      return { ...state, position: action.payload };
    case "SET_SIZE":
      return { ...state, size: action.payload };
    case "START_DRAGGING":
      return { ...state, isDragging: true, dragStart: action.payload };
    case "STOP_DRAGGING":
      return { ...state, isDragging: false };
    case "START_RESIZING":
      return {
        ...state,
        isResizing: true,
        resizeDirection: action.payload.direction,
        resizeStart: {
          x: action.payload.x,
          y: action.payload.y,
          width: action.payload.width,
          height: action.payload.height,
          startPosition: action.payload.startPosition,
        },
      };
    case "STOP_RESIZING":
      return { ...state, isResizing: false, resizeDirection: null };
    default:
      return state;
  }
}

// Draggable Reference Popup Component
interface DraggableReferencePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

function DraggableReferencePopup({
  isOpen,
  onClose,
}: DraggableReferencePopupProps) {
  const [popupState, dispatchPopup] = useReducer(
    popupReducer,
    popupInitialState
  );
  const popupRef = useRef<HTMLDivElement>(null);

  // Ensure initial position is within window bounds
  useEffect(() => {
    if (isOpen) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Responsive default sizes for Reference popup
      let defaultWidth = 600;
      let defaultHeight = 400;

      if (windowWidth < 640) {
        // Mobile (sm breakpoint)
        defaultWidth = Math.min(windowWidth - 40, 350);
        defaultHeight = Math.min(windowHeight - 100, 300);
      } else if (windowWidth < 1024) {
        // Tablet (lg breakpoint)
        defaultWidth = Math.min(windowWidth - 80, 500);
        defaultHeight = Math.min(windowHeight - 120, 350);
      }

      // Update size if it's the initial default size
      if (popupState.size.width === 600 && popupState.size.height === 400) {
        dispatchPopup({
          type: "SET_SIZE",
          payload: { width: defaultWidth, height: defaultHeight },
        });
      }

      const maxX = windowWidth - popupState.size.width;
      const maxY = windowHeight - popupState.size.height;

      const newPosition = {
        x: Math.max(0, Math.min(maxX, popupState.position.x)),
        y: Math.max(0, Math.min(maxY, popupState.position.y)),
      };

      if (
        newPosition.x !== popupState.position.x ||
        newPosition.y !== popupState.position.y
      ) {
        dispatchPopup({ type: "SET_POSITION", payload: newPosition });
      }
    }
  }, [
    isOpen,
    popupState.size.width,
    popupState.size.height,
    popupState.position,
  ]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (popupState.isDragging) {
        const newPosition = {
          x: e.clientX - popupState.dragStart.x,
          y: e.clientY - popupState.dragStart.y,
        };
        dispatchPopup({ type: "SET_POSITION", payload: newPosition });
      }

      if (popupState.isResizing) {
        const deltaX = e.clientX - popupState.resizeStart.x;
        const deltaY = e.clientY - popupState.resizeStart.y;

        let newWidth = popupState.resizeStart.width;
        let newHeight = popupState.resizeStart.height;
        const newX = popupState.resizeStart.startPosition.x;
        let newY = popupState.resizeStart.startPosition.y;

        if (popupState.resizeDirection === "se") {
          newWidth = Math.max(300, popupState.resizeStart.width + deltaX);
          newHeight = Math.max(200, popupState.resizeStart.height + deltaY);
        } else if (popupState.resizeDirection === "ne") {
          newWidth = Math.max(300, popupState.resizeStart.width + deltaX);
          newHeight = Math.max(200, popupState.resizeStart.height - deltaY);
          newY = popupState.resizeStart.startPosition.y + deltaY;
        }

        dispatchPopup({
          type: "SET_SIZE",
          payload: { width: newWidth, height: newHeight },
        });
        if (popupState.resizeDirection === "ne") {
          dispatchPopup({
            type: "SET_POSITION",
            payload: { x: newX, y: newY },
          });
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (popupState.isDragging && e.touches.length === 1) {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        const newPosition = {
          x: touch.clientX - popupState.dragStart.x,
          y: touch.clientY - popupState.dragStart.y,
        };
        dispatchPopup({ type: "SET_POSITION", payload: newPosition });
      }
    };

    const handleMouseUp = () => {
      dispatchPopup({ type: "STOP_DRAGGING" });
      dispatchPopup({ type: "STOP_RESIZING" });
    };

    const handleTouchEnd = () => {
      dispatchPopup({ type: "STOP_DRAGGING" });
      dispatchPopup({ type: "STOP_RESIZING" });
    };

    if (popupState.isDragging || popupState.isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [popupState]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dispatchPopup({
      type: "START_DRAGGING",
      payload: {
        x: e.clientX - popupState.position.x,
        y: e.clientY - popupState.position.y,
      },
    });
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    direction: "se" | "ne"
  ) => {
    e.stopPropagation();
    dispatchPopup({
      type: "START_RESIZING",
      payload: {
        direction,
        x: e.clientX,
        y: e.clientY,
        width: popupState.size.width,
        height: popupState.size.height,
        startPosition: { x: popupState.position.x, y: popupState.position.y },
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="fixed flex flex-col bg-white rounded-lg shadow-2xl border-black border-4 overflow-hidden z-50"
      style={{
        left: `${popupState.position.x}px`,
        top: `${popupState.position.y}px`,
        width: `${popupState.size.width}px`,
        height: `${popupState.size.height}px`,
      }}
    >
      {/* Header */}
      <div
        className="bg-black border-b border-black text-white cursor-move flex justify-between items-center"
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            const touch = e.touches[0];
            dispatchPopup({
              type: "START_DRAGGING",
              payload: {
                x: touch.clientX - popupState.position.x,
                y: touch.clientY - popupState.position.y,
              },
            });
          }
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className=" h-8 w-8 p-0 hover:bg-neutral-800 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className=" h-8 w-8 p-0 cursor-move hover:bg-neutral-900 hover:text-white "
        >
          <GripHorizontal className="h-4 w-4 text-white b" />
        </Button>
        <div></div>
      </div>

      {/* Content */}
      <div className="relative h-full">
        <div className="p-4 h-full overflow-auto">
          <div className="w-full h-full flex items-center justify-center">
            <Image
              src={ReferenceSheet}
              alt="SAT Reference Sheet"
              width={popupState.size.width - 50}
              height={popupState.size.height - 100}
              className="max-w-full max-h-full object-contain"
              style={{
                width: "auto",
                height: "auto",
                maxWidth: `${popupState.size.width - 50}px`,
                maxHeight: `${popupState.size.height - 100}px`,
              }}
            />
          </div>
        </div>

        {/* Resize handles */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4  cursor-se-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, "se")}
        >
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 256 256"
            className="absolute bottom-1 right-1 text-black/50 dark:text-white/50"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M216.49,136.49l-80,80a12,12,0,1,1-17-17l80-80a12,12,0,1,1,17,17Zm-16-105a12,12,0,0,0-17,0l-152,152a12,12,0,0,0,17,17l152-152A12,12,0,0,0,200.49,31.51Z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}

// Draggable Desmos Popup Component
interface DraggableDesmosPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

function DraggableDesmosPopup({ isOpen, onClose }: DraggableDesmosPopupProps) {
  const [popupState, dispatchPopup] = useReducer(popupReducer, {
    ...popupInitialState,
    size: { width: 800, height: 600 }, // Larger default size for Desmos
  });
  const popupRef = useRef<HTMLDivElement>(null);

  // Ensure initial position is within window bounds
  useEffect(() => {
    if (isOpen) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Responsive default sizes for Desmos popup
      let defaultWidth = 800;
      let defaultHeight = 600;

      if (windowWidth < 640) {
        // Mobile (sm breakpoint)
        defaultWidth = Math.min(windowWidth - 20, 380);
        defaultHeight = Math.min(windowHeight - 80, 400);
      } else if (windowWidth < 1024) {
        // Tablet (lg breakpoint)
        defaultWidth = Math.min(windowWidth - 60, 600);
        defaultHeight = Math.min(windowHeight - 100, 500);
      }

      // Update size if it's the initial default size
      if (popupState.size.width === 800 && popupState.size.height === 600) {
        dispatchPopup({
          type: "SET_SIZE",
          payload: { width: defaultWidth, height: defaultHeight },
        });
      }

      const maxX = windowWidth - popupState.size.width;
      const maxY = windowHeight - popupState.size.height;

      const newPosition = {
        x: Math.max(0, Math.min(maxX, popupState.position.x)),
        y: Math.max(0, Math.min(maxY, popupState.position.y)),
      };

      if (
        newPosition.x !== popupState.position.x ||
        newPosition.y !== popupState.position.y
      ) {
        dispatchPopup({ type: "SET_POSITION", payload: newPosition });
      }
    }
  }, [
    isOpen,
    popupState.size.width,
    popupState.size.height,
    popupState.position,
  ]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (popupState.isDragging) {
        const newPosition = {
          x: e.clientX - popupState.dragStart.x,
          y: e.clientY - popupState.dragStart.y,
        };
        dispatchPopup({ type: "SET_POSITION", payload: newPosition });
      }

      if (popupState.isResizing) {
        const deltaX = e.clientX - popupState.resizeStart.x;
        const deltaY = e.clientY - popupState.resizeStart.y;

        let newWidth = popupState.resizeStart.width;
        let newHeight = popupState.resizeStart.height;
        const newX = popupState.resizeStart.startPosition.x;
        let newY = popupState.resizeStart.startPosition.y;

        if (popupState.resizeDirection === "se") {
          newWidth = Math.max(400, popupState.resizeStart.width + deltaX);
          newHeight = Math.max(300, popupState.resizeStart.height + deltaY);
        } else if (popupState.resizeDirection === "ne") {
          newWidth = Math.max(400, popupState.resizeStart.width + deltaX);
          newHeight = Math.max(300, popupState.resizeStart.height - deltaY);
          newY = popupState.resizeStart.startPosition.y + deltaY;
        }

        dispatchPopup({
          type: "SET_SIZE",
          payload: { width: newWidth, height: newHeight },
        });
        if (popupState.resizeDirection === "ne") {
          dispatchPopup({
            type: "SET_POSITION",
            payload: { x: newX, y: newY },
          });
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (popupState.isDragging && e.touches.length === 1) {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        const newPosition = {
          x: touch.clientX - popupState.dragStart.x,
          y: touch.clientY - popupState.dragStart.y,
        };
        dispatchPopup({ type: "SET_POSITION", payload: newPosition });
      }
    };

    const handleMouseUp = () => {
      dispatchPopup({ type: "STOP_DRAGGING" });
      dispatchPopup({ type: "STOP_RESIZING" });
    };

    const handleTouchEnd = () => {
      dispatchPopup({ type: "STOP_DRAGGING" });
      dispatchPopup({ type: "STOP_RESIZING" });
    };

    if (popupState.isDragging || popupState.isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [popupState]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dispatchPopup({
      type: "START_DRAGGING",
      payload: {
        x: e.clientX - popupState.position.x,
        y: e.clientY - popupState.position.y,
      },
    });
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    direction: "se" | "ne"
  ) => {
    e.stopPropagation();
    dispatchPopup({
      type: "START_RESIZING",
      payload: {
        direction,
        x: e.clientX,
        y: e.clientY,
        width: popupState.size.width,
        height: popupState.size.height,
        startPosition: { x: popupState.position.x, y: popupState.position.y },
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="fixed flex flex-col bg-white rounded-lg shadow-2xl border-black border-4 overflow-hidden z-50"
      style={{
        left: `${popupState.position.x}px`,
        top: `${popupState.position.y}px`,
        width: `${popupState.size.width}px`,
        height: `${popupState.size.height}px`,
      }}
    >
      {/* Header */}
      <div
        className="bg-black border-b border-black text-white cursor-move flex justify-between items-center"
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            const touch = e.touches[0];
            dispatchPopup({
              type: "START_DRAGGING",
              payload: {
                x: touch.clientX - popupState.position.x,
                y: touch.clientY - popupState.position.y,
              },
            });
          }
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className=" h-8 w-8 p-0 hover:bg-neutral-800 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className=" h-8 w-8 p-0 cursor-move hover:bg-neutral-900 hover:text-white "
        >
          <GripHorizontal className="h-4 w-4 text-white b" />
        </Button>
        <div></div>
      </div>

      {/* Content */}
      <div className="relative h-full">
        <div className="p-0 h-full overflow-hidden">
          <div className="w-full h-full">
            <iframe
              src="https://www.desmos.com/testing/cb-sat-ap/graphing"
              width="100%"
              height="100%"
              className="border-0"
              title="Desmos Graphing Calculator"
            />
          </div>
        </div>

        {/* Resize handles */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4  cursor-se-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, "se")}
        >
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 256 256"
            className="absolute bottom-1 right-1 text-black/50 dark:text-white/50"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M216.49,136.49l-80,80a12,12,0,1,1-17-17l80-80a12,12,0,1,1,17,17Zm-16-105a12,12,0,0,0-17,0l-152,152a12,12,0,0,0,17,17l152-152A12,12,0,0,0,200.49,31.51Z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}

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

  // State for tracking if this question is saved and answered before
  const [isQuestionSaved, setIsQuestionSaved] = useState<boolean>(false);
  const [isQuestionAnswered, setIsQuestionAnswered] = useState<boolean>(false);
  const [questionStats, setQuestionStats] = useState<{
    isCorrect?: boolean;
    timeSpent?: number;
    timestamp?: string;
    selectedAnswer?: string; // Add selected answer to track user's choice
  } | null>(null);

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
  }, [question, savedQuestions, practiceStatistics, assessment]);

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
            <MathJaxContext>
              <MathJax className=" text-justify">
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
            </MathJaxContext>
          )}
          {question.problem.stem && (
            <MathJaxContext>
              <MathJax>
                <span
                  id="question_explanation"
                  className="text-lg text-justify"
                  dangerouslySetInnerHTML={{
                    __html: question.problem.stem ? question.problem.stem : "",
                  }}
                ></span>
              </MathJax>
            </MathJaxContext>
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
                              <MathJax className="inline-block">
                                <span
                                  className="text-xl inline-block"
                                  dangerouslySetInnerHTML={{
                                    __html: optionText.replaceAll(
                                      /\s*style\s*=\s*"[^"]*"/gi,
                                      ""
                                    ),
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
        <div className="mt-4 w-full md:w-3xl lg:w-5xl px-4">
          <Label className="text-lg font-semibold mb-2 block">
            Explanation:
          </Label>
          <MathJaxContext>
            <MathJax id="question_explanation" className=" text-justify">
              <span
                className="text-xl"
                dangerouslySetInnerHTML={{
                  __html: question.problem.rationale,
                }}
              ></span>
            </MathJax>
          </MathJaxContext>
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
