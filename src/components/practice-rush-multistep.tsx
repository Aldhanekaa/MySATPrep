"use client";

import React, {
  useRef,
  useEffect,
  useCallback,
  useReducer,
  useMemo,
} from "react";
import OnboardCard from "@/components/ui/onboard-card";
import {
  API_Response_Question,
  API_Response_Question_List,
  QuestionState,
} from "@/types/question";
import {
  PracticeSelections,
  PracticeSession,
  QuestionAnswers,
  QuestionTimes,
  SessionStatus,
} from "@/types/session";
import { AssessmentType } from "@/types/statistics";
import { addQuestionStatistic } from "@/lib/practiceRushStatistics";

import { MathJax } from "better-react-mathjax";
import { Pill, PillIndicator } from "@/components/ui/pill";
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle,
  Clock,
  GripHorizontal,
  PyramidIcon,
  Strikethrough,
  X,
} from "lucide-react";
import Image from "next/image";

import ReferenceSheet from "@/src/sat-math-refrence-sheet.webp";
import { Confetti, ConfettiRef } from "./ui/confetti";
import { playSound } from "@/lib/playSound";

// Duolingo-styled Loading Spinner Component
interface DuolingoLoadingSpinnerProps {
  progress?: number;
  total?: number;
}

function DuolingoLoadingSpinner({
  progress,
  total,
}: DuolingoLoadingSpinnerProps) {
  const showProgress = progress !== undefined && total !== undefined;

  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s] [animation-duration:0.6s]"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s] [animation-duration:0.6s]"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-duration:0.6s]"></div>
      </div>
      <span className="text-white font-bold text-lg">
        {showProgress
          ? `Loading batch... (${progress}/${total})`
          : "Loading next batch..."}
      </span>
    </div>
  );
}

// Congratulatory messages array (outside component to avoid dependency issues)
const CONGRATULATORY_MESSAGES = [
  "Nicely done!",
  "Excellent work!",
  "Outstanding!",
  "Great job!",
  "Well done!",
  "Fantastic!",
  "Awesome!",
  "Perfect!",
  "Brilliant!",
  "Amazing work!",
  "You nailed it!",
  "Superb!",
  "Impressive!",
  "You're on fire!",
  "Keep it up!",
];

// Duolingo-styled Timer Component
interface DuolingoTimerProps {
  startTime: number;
  isActive: boolean;
  isVisible: boolean;
  onToggleVisibility: () => void;
  fixedTime?: number; // For showing completed question times in review mode
  savedElapsedTime?: number; // For continuing in-progress questions
}

function DuolingoTimer({
  startTime,
  isActive,
  isVisible,
  onToggleVisibility,
  fixedTime,
  savedElapsedTime = 0,
}: DuolingoTimerProps) {
  const [elapsedTime, setElapsedTime] = React.useState(0);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime + savedElapsedTime);
      }, 100); // Update every 100ms for smooth animation
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, startTime, savedElapsedTime]);

  // Use fixedTime if provided (for review mode), otherwise use elapsedTime
  const displayTime = fixedTime !== undefined ? fixedTime : elapsedTime;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getTimerColor = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    if (totalSeconds < 30) return "text-green-600";
    if (totalSeconds < 60) return "text-yellow-600";
    if (totalSeconds < 120) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${
          isVisible ? "block" : "hidden"
        } flex items-center gap-2 bg-white border-2 border-gray-300 rounded-2xl px-4 py-2 shadow-sm`}
      >
        <Clock className={`h-5 w-5 ${getTimerColor(displayTime)}`} />
        <span className={`font-bold text-lg ${getTimerColor(displayTime)}`}>
          {formatTime(displayTime)}
        </span>
        {fixedTime !== undefined && (
          <span className="text-xs text-gray-500 ml-1">(completed)</span>
        )}
      </div>

      <button
        onClick={onToggleVisibility}
        className="px-8 text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer transition-colors duration-200"
      >
        {isVisible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

// Success Feedback Component
interface SuccessFeedbackProps {
  isVisible: boolean;
  onContinue: () => void;
}

function SuccessFeedback({ isVisible, onContinue }: SuccessFeedbackProps) {
  const [dontShowAgain, setDontShowAgain] = React.useState(false);
  const [hideSuccessFeedback, setHideSuccessFeedback] = React.useState(false);

  // Load localStorage preference on component mount
  React.useEffect(() => {
    try {
      const savedPreference = localStorage.getItem("hideSuccessFeedback");
      setHideSuccessFeedback(savedPreference === "true");
    } catch (error) {
      console.error("Failed to load preference:", error);
    }
  }, []);

  // Auto-continue if user has opted out
  // React.useEffect(() => {
  //   if (isVisible && hideSuccessFeedback) {
  //     const timeoutId = setTimeout(() => onContinue(), 1000);
  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [isVisible, hideSuccessFeedback, onContinue]);

  const randomMessage = useMemo(() => {
    return CONGRATULATORY_MESSAGES[
      Math.floor(Math.random() * CONGRATULATORY_MESSAGES.length)
    ];
  }, []);

  const handleContinue = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem("hideSuccessFeedback", "true");
        setHideSuccessFeedback(true);
      } catch (error) {
        console.error("Failed to save preference:", error);
      }
    }
    onContinue();
  };

  if (!isVisible || hideSuccessFeedback) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
      <div className="bg-green-100 border-4 border-green-200 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <h2 className="text-3xl font-bold text-green-800">
              {randomMessage}
            </h2>
          </div>

          {/* Checkbox for "Don't show again" */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain}
              onCheckedChange={(checked: boolean) => {
                const isChecked = checked === true;
                setDontShowAgain(isChecked);
                // Play appropriate checkbox sound
                if (isChecked) {
                  playSound("tap-checkbox-checked.wav");
                } else {
                  playSound("tap-checkbox-unchecked.wav");
                }
              }}
              className="border-green-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
            />
            <label
              htmlFor="dontShowAgain"
              className="text-sm text-green-700 cursor-pointer select-none"
            >
              Don&apos;t show this again
            </label>
          </div>

          <button
            onClick={handleContinue}
            className="cursor-pointer w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-4 px-8 rounded-2xl border-b-4 border-green-800 hover:border-green-900 shadow-lg hover:shadow-xl transform transition-all duration-200 active:translate-y-0.5 active:border-b-2"
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
}

// Exit Confirmation Component
interface ExitConfirmationProps {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ExitConfirmation({
  isVisible,
  onConfirm,
  onCancel,
}: ExitConfirmationProps) {
  // Play sound when popup opens
  React.useEffect(() => {
    if (isVisible) {
      playSound("popup-confirm-up.wav");
    }
  }, [isVisible]);

  // Enhanced handlers that play sound on close
  const handleCancel = () => {
    playSound("popup-confirm-down.wav");
    onCancel();
  };

  const handleConfirm = () => {
    playSound("popup-confirm-down.wav");
    onConfirm();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
      <div className="bg-red-50 border-4 border-red-200 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <X className="h-8 w-8 text-red-600" />
            <h2 className="text-3xl font-bold text-red-800">Exit Practice?</h2>
          </div>
          <p className="text-lg text-red-700 mb-8">
            Your progress will be saved, but you&apos;ll lose your current
            streak. Are you sure you want to exit?
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              className="cursor-pointer flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg py-4 px-6 rounded-2xl border-b-4 border-blue-600 hover:border-blue-700 shadow-lg hover:shadow-xl transform transition-all duration-200 active:translate-y-0.5 active:border-b-2"
            >
              STAY
            </button>
            <button
              onClick={handleConfirm}
              className="cursor-pointer flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-4 px-6 rounded-2xl border-b-4 border-red-800 hover:border-red-900 shadow-lg hover:shadow-xl transform transition-all duration-200 active:translate-y-0.5 active:border-b-2"
            >
              EXIT
            </button>
          </div>
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

// Optimized Duolingo-styled Input Component
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

// Answer Options Component
interface AnswerOptionsProps {
  answerOptions: { [key: string]: string };
  questionId: string;
  selectedAnswer: string | null;
  disabledOptions: { [key: string]: boolean };
  onAnswerSelect: (key: string) => void;
  onToggleDisabled: (key: string) => void;
  showStrikethrough: boolean;
  correctAnswers?: string[];
  isAnswerChecked?: boolean;
  isReviewMode?: boolean;
}

// Optimized Answer Options Component
const AnswerOptions = React.memo(function AnswerOptions({
  answerOptions,
  questionId,
  selectedAnswer,
  disabledOptions,
  onAnswerSelect,
  onToggleDisabled,
  showStrikethrough,
  correctAnswers = [],
  isAnswerChecked = false,
  isReviewMode = false,
}: AnswerOptionsProps) {
  const optionEntries = useMemo(
    () => Object.entries(answerOptions),
    [answerOptions]
  );

  // Note: isReviewMode indicates when displaying a previously answered question
  // This can be used for additional review-specific logic if needed
  React.useEffect(() => {
    if (isReviewMode) {
      // Additional review-specific setup can be added here
    }
  }, [isReviewMode]);

  return (
    <RadioGroup className="flex flex-col gap-3" defaultValue="1">
      {optionEntries.map(([key, value], index) => {
        const trimmedKey = key.trim();
        const isCorrectAnswer =
          isAnswerChecked && correctAnswers.includes(trimmedKey);
        const isSelectedWrongAnswer =
          isAnswerChecked &&
          selectedAnswer?.trim() === trimmedKey &&
          !correctAnswers.includes(trimmedKey);
        const isSelected = selectedAnswer?.trim() === trimmedKey;

        return (
          <div
            key={`${key}-${questionId}`}
            className="flex z-20 items-center gap-2 answer-option"
          >
            <label
              onClick={() => {
                if (
                  selectedAnswer?.trim() !== trimmedKey &&
                  !disabledOptions[key] &&
                  !isAnswerChecked
                ) {
                  playSound("button-pressed.wav");
                  onAnswerSelect(key);
                }
              }}
              className={`relative ${
                disabledOptions[key]
                  ? " cursor-not-allowed after:absolute after:inset-0 after:h-0.5 after:w-[102.5%] after:bg-black after:-translate-x-1/2 after:left-1/2 after:top-1/2 after:-translate-y-1/2"
                  : isAnswerChecked
                  ? "cursor-default"
                  : "cursor-pointer"
              } w-full transition duration-500 ${
                isAnswerChecked &&
                (isCorrectAnswer || correctAnswers.includes(key))
                  ? "border-2 border-green-500 bg-green-500/10"
                  : isSelectedWrongAnswer
                  ? "border-2 border-red-500 bg-red-500/10"
                  : isSelected
                  ? "border-2 border-blue-500 bg-blue-500/10"
                  : "border-2 border-input"
              } has-[[data-disabled]]:opacity-50  has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70 flex flex-col items-start gap-4 rounded-lg p-3 shadow-sm shadow-black/5`}
            >
              <div className={`grid grid-cols-9 items-center gap-3 `}>
                <div className="col-span-1 flex items-center justify-center">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                      isAnswerChecked && isCorrectAnswer
                        ? "border-green-500 bg-green-500 text-white"
                        : isSelectedWrongAnswer
                        ? "border-red-500 bg-red-500 text-white"
                        : isSelected
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-gray-300 bg-gray-50 text-gray-600"
                    }`}
                  >
                    {isCorrectAnswer ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : isSelectedWrongAnswer ? (
                      <X className="h-4 w-4" />
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </div>
                </div>
                <Label className="col-span-8" htmlFor={`${key}-${questionId}`}>
                  <MathJax
                    className={`inline-block ${
                      !isReviewMode && "cursor-pointer"
                    }`}
                  >
                    <span
                      className="text-xl inline-block"
                      dangerouslySetInnerHTML={{
                        __html: value.replaceAll(
                          /\s*style\s*=\s*"[^"]*"/gi,
                          ""
                        ),
                      }}
                    ></span>
                  </MathJax>
                </Label>
              </div>
            </label>
            {showStrikethrough && (
              <Button
                variant={"ghost"}
                className="h-full w-14 cursor-pointer"
                onClick={() => {
                  if (selectedAnswer?.trim() !== trimmedKey) {
                    playSound("button-pressed.wav");
                    onToggleDisabled(key);
                  }
                }}
              >
                {disabledOptions[key] ? (
                  <p className=" underline">Undo</p>
                ) : (
                  <Strikethrough className="h-6 w-6" />
                )}
              </Button>
            )}
          </div>
        );
      })}
    </RadioGroup>
  );
});

// Optimized Draggable Reference Popup Component
interface DraggableReferencePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

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
      return {
        ...state,
        isDragging: true,
        dragStart: action.payload,
      };
    case "STOP_DRAGGING":
      return {
        ...state,
        isDragging: false,
        isResizing: false,
        resizeDirection: null,
      };
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
      return {
        ...state,
        isDragging: false,
        isResizing: false,
        resizeDirection: null,
      };
    default:
      return state;
  }
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
      if (popupState.isDragging && !popupState.isResizing) {
        const newX = e.clientX - popupState.dragStart.x;
        const newY = e.clientY - popupState.dragStart.y;

        // Get window dimensions
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Calculate boundaries (ensure popup stays within window)
        const minX = 0;
        const maxX = windowWidth - popupState.size.width;
        const minY = 0;
        const maxY = windowHeight - popupState.size.height;

        // Constrain position within boundaries
        const constrainedX = Math.max(minX, Math.min(maxX, newX));
        const constrainedY = Math.max(minY, Math.min(maxY, newY));

        dispatchPopup({
          type: "SET_POSITION",
          payload: { x: constrainedX, y: constrainedY },
        });
      } else if (popupState.isResizing) {
        if (popupState.resizeDirection === "se") {
          // Bottom-right resize (existing behavior)
          const newWidth = Math.max(
            400,
            popupState.resizeStart.width +
              (e.clientX - popupState.resizeStart.x)
          );
          const newHeight = Math.max(
            300,
            popupState.resizeStart.height +
              (e.clientY - popupState.resizeStart.y)
          );

          // Get window dimensions for resize constraints
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;

          // Ensure resized popup doesn't exceed window bounds
          const maxWidth = windowWidth - popupState.position.x;
          const maxHeight = windowHeight - popupState.position.y;

          const constrainedWidth = Math.min(newWidth, maxWidth);
          const constrainedHeight = Math.min(newHeight, maxHeight);

          dispatchPopup({
            type: "SET_SIZE",
            payload: { width: constrainedWidth, height: constrainedHeight },
          });
        } else if (popupState.resizeDirection === "ne") {
          // Top-right resize
          const newWidth = Math.max(
            400,
            popupState.resizeStart.width +
              (e.clientX - popupState.resizeStart.x)
          );
          const newHeight = Math.max(
            300,
            popupState.resizeStart.height -
              (e.clientY - popupState.resizeStart.y)
          );

          // Get window dimensions for resize constraints
          const windowWidth = window.innerWidth;

          // Calculate new position for top resize
          const newY =
            popupState.resizeStart.startPosition.y +
            (e.clientY - popupState.resizeStart.y);

          // Ensure resized popup doesn't exceed window bounds
          const maxWidth = windowWidth - popupState.position.x;
          const minY = 0;
          const maxY =
            popupState.resizeStart.startPosition.y +
            popupState.resizeStart.height -
            300; // Minimum height constraint

          const constrainedWidth = Math.min(newWidth, maxWidth);
          const constrainedHeight = Math.min(
            newHeight,
            popupState.resizeStart.startPosition.y +
              popupState.resizeStart.height
          );
          const constrainedY = Math.max(minY, Math.min(maxY, newY));

          dispatchPopup({
            type: "SET_SIZE",
            payload: { width: constrainedWidth, height: constrainedHeight },
          });

          dispatchPopup({
            type: "SET_POSITION",
            payload: { x: popupState.position.x, y: constrainedY },
          });
        }
      }
    };

    const handleMouseUp = () => {
      dispatchPopup({ type: "STOP_DRAGGING" });
    };

    if (popupState.isDragging || popupState.isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
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

        <div
          onMouseDown={(e) => handleResizeMouseDown(e, "se")}
          className="absolute bottom-0 right-0 h-6 w-6 cursor-se-resize"
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

// State management with useReducer for better performance
interface AppState {
  questionsData: API_Response_Question_List | null;
  questions: QuestionState[] | null;
  currentQuestionStep: number;
  questionAnswers: QuestionAnswers;
  questionTimes: QuestionTimes;
  inProgressQuestionTimes: { [questionId: string]: number }; // Track elapsed time for questions in progress
  disabledOptions: { [key: string]: boolean };
  selectedAnswer: string | null;
  isReferencePopupOpen: boolean;
  isAnswerChecked: boolean;
  isAnswerCorrect: boolean;
  currentStep: number;
  isExitConfirmationOpen: boolean;
  questionStartTime: number;
  currentQuestionElapsedTime: number; // Track elapsed time for current question
  isTimerActive: boolean;
  isTimerVisible: boolean;
  isLoadingNextBatch: boolean;
  currentBatch: number;
  questionsProcessedCount: number;
  sessionId: string;
  sessionStartTime: number;
  isSavingSession: boolean;
}

type AppAction =
  | { type: "SET_QUESTIONS_DATA"; payload: API_Response_Question_List }
  | { type: "SET_QUESTIONS"; payload: QuestionState[] }
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "SET_CURRENT_QUESTION_STEP"; payload: number }
  | { type: "SET_SELECTED_ANSWER"; payload: string | null }
  | { type: "SET_DISABLED_OPTION"; payload: { key: string; value: boolean } }
  | { type: "RESET_QUESTION_STATE" }
  | { type: "SAVE_CURRENT_ELAPSED_TIME"; payload: number }
  | {
      type: "SET_ANSWER_CHECKED";
      payload: {
        checked: boolean;
        correct: boolean;
        questionId: string;
        answer: string;
        timeElapsed: number;
      };
    }
  | { type: "TOGGLE_REFERENCE_POPUP" }
  | { type: "TOGGLE_EXIT_CONFIRMATION" }
  | { type: "START_TIMER" }
  | { type: "STOP_TIMER" }
  | { type: "TOGGLE_TIMER_VISIBILITY" }
  | { type: "START_LOADING_NEXT_BATCH" }
  | { type: "FINISH_LOADING_NEXT_BATCH"; payload: QuestionState[] }
  | { type: "SET_QUESTIONS_PROCESSED_COUNT"; payload: number }
  | {
      type: "INITIALIZE_SESSION";
      payload: {
        practiceSelections: PracticeSelections;
        totalQuestions: number;
      };
    }
  | { type: "SET_SAVING_SESSION"; payload: boolean };

const initialState: AppState = {
  questionsData: null,
  questions: null,
  currentQuestionStep: 0,
  questionAnswers: {},
  questionTimes: {},
  inProgressQuestionTimes: {},
  disabledOptions: {},
  selectedAnswer: null,
  isReferencePopupOpen: false,
  isAnswerChecked: false,
  isAnswerCorrect: false,
  currentStep: 1,
  isExitConfirmationOpen: false,
  questionStartTime: Date.now(),
  currentQuestionElapsedTime: 0,
  isTimerActive: false,
  isTimerVisible: true,
  isLoadingNextBatch: false,
  currentBatch: 1,
  questionsProcessedCount: 0,
  sessionId: `practice-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`,
  sessionStartTime: Date.now(),
  isSavingSession: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_QUESTIONS_DATA":
      return { ...state, questionsData: action.payload };
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload };
    case "SET_CURRENT_STEP":
      return { ...state, currentStep: action.payload };
    case "SET_CURRENT_QUESTION_STEP":
      const newStep = action.payload;
      const newQuestionId =
        state.questions?.[newStep]?.plainQuestion.questionId || "";
      const currentQuestionId =
        state.questions?.[state.currentQuestionStep]?.plainQuestion
          .questionId || "";
      const previousAnswer = state.questionAnswers[newQuestionId];
      const isReturningToPreviousQuestion = Boolean(previousAnswer);

      // Save current elapsed time if we're navigating away from an active question
      const currentElapsed =
        state.isTimerActive &&
        currentQuestionId &&
        currentQuestionId !== newQuestionId
          ? Date.now() -
            state.questionStartTime +
            state.currentQuestionElapsedTime
          : 0;

      const updatedInProgressTimes =
        currentElapsed > 0
          ? {
              ...state.inProgressQuestionTimes,
              [currentQuestionId]: currentElapsed,
            }
          : state.inProgressQuestionTimes;

      // Check if we're returning to a question in progress
      const isReturningToInProgress =
        !isReturningToPreviousQuestion && updatedInProgressTimes[newQuestionId];
      const savedElapsedTime = updatedInProgressTimes[newQuestionId] || 0;

      return {
        ...state,
        currentQuestionStep: newStep,
        selectedAnswer: isReturningToPreviousQuestion ? previousAnswer : null,
        disabledOptions: {},
        isAnswerChecked: isReturningToPreviousQuestion,
        isAnswerCorrect: isReturningToPreviousQuestion
          ? state.questions?.[newStep]?.correct_answer
              .map((answer) => answer.trim())
              .includes(previousAnswer?.trim() || "") || false
          : false,
        questionStartTime: Date.now(), // Always start from current time
        currentQuestionElapsedTime: isReturningToInProgress
          ? savedElapsedTime
          : 0, // Store saved elapsed time
        isTimerActive: !isReturningToPreviousQuestion,
        inProgressQuestionTimes: updatedInProgressTimes,
      };
    case "SET_SELECTED_ANSWER":
      return { ...state, selectedAnswer: action.payload };
    case "SET_DISABLED_OPTION":
      return {
        ...state,
        disabledOptions: {
          ...state.disabledOptions,
          [action.payload.key]: action.payload.value,
        },
      };
    case "RESET_QUESTION_STATE":
      return {
        ...state,
        selectedAnswer: null,
        disabledOptions: {},
        isAnswerChecked: false,
        isAnswerCorrect: false,
        questionStartTime: Date.now(),
        currentQuestionElapsedTime: 0,
        isTimerActive: true,
      };
    case "SAVE_CURRENT_ELAPSED_TIME":
      return {
        ...state,
        currentQuestionElapsedTime: action.payload,
      };
    case "SET_ANSWER_CHECKED":
      const questionId = action.payload.questionId;
      const updatedInProgress = { ...state.inProgressQuestionTimes };
      delete updatedInProgress[questionId]; // Remove from in-progress tracking

      return {
        ...state,
        isAnswerChecked: action.payload.checked,
        isAnswerCorrect: action.payload.correct,
        questionAnswers: {
          ...state.questionAnswers,
          [questionId]: action.payload.answer,
        },
        questionTimes: {
          ...state.questionTimes,
          [questionId]: action.payload.timeElapsed,
        },
        inProgressQuestionTimes: updatedInProgress,
      };
    case "TOGGLE_REFERENCE_POPUP":
      return { ...state, isReferencePopupOpen: !state.isReferencePopupOpen };
    case "TOGGLE_EXIT_CONFIRMATION":
      return {
        ...state,
        isExitConfirmationOpen: !state.isExitConfirmationOpen,
      };
    case "START_TIMER":
      return {
        ...state,
        questionStartTime: Date.now(),
        currentQuestionElapsedTime: 0,
        isTimerActive: true,
      };
    case "STOP_TIMER":
      return {
        ...state,
        isTimerActive: false,
      };
    case "TOGGLE_TIMER_VISIBILITY":
      return {
        ...state,
        isTimerVisible: !state.isTimerVisible,
      };
    case "START_LOADING_NEXT_BATCH":
      return {
        ...state,
        isLoadingNextBatch: true,
        currentStep: 3, // Show loading screen
      };
    case "FINISH_LOADING_NEXT_BATCH":
      return {
        ...state,
        isLoadingNextBatch: false,
        questions: action.payload,
        currentQuestionStep: 0,
        currentBatch: state.currentBatch + 1,
        currentStep: 5, // Return to practice
        selectedAnswer: null,
        disabledOptions: {},
        isAnswerChecked: false,
        isAnswerCorrect: false,
        questionStartTime: Date.now(),
        currentQuestionElapsedTime: 0,
        isTimerActive: true,
      };
    case "SET_QUESTIONS_PROCESSED_COUNT":
      return {
        ...state,
        questionsProcessedCount: action.payload,
      };
    case "INITIALIZE_SESSION":
      return {
        ...state,
        sessionId: `practice-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        sessionStartTime: Date.now(),
      };
    case "SET_SAVING_SESSION":
      return {
        ...state,
        isSavingSession: action.payload,
      };
    default:
      return state;
  }
}

interface PracticeRushMultistepProps {
  practiceSelections: PracticeSelections;
}

export default function PracticeRushMultistep({
  practiceSelections,
}: PracticeRushMultistepProps) {
  const confettiRef = useRef<ConfettiRef>(null);

  const [state, dispatch] = useReducer(appReducer, initialState);

  // Track saving status with ref to avoid re-renders
  const isSavingRef = useRef(false);

  // Auto-save session data to localStorage
  const saveCurrentSession = useCallback(() => {
    if (!state.questions || state.questions.length === 0 || isSavingRef.current)
      return;

    isSavingRef.current = true;
    dispatch({ type: "SET_SAVING_SESSION", payload: true });

    const currentSession: PracticeSession = {
      sessionId: state.sessionId,
      timestamp: new Date(state.sessionStartTime).toISOString(),
      status:
        state.currentQuestionStep === 0
          ? SessionStatus.IN_PROGRESS
          : SessionStatus.IN_PROGRESS,
      practiceSelections,
      currentQuestionStep: state.currentQuestionStep,
      questionAnswers: state.questionAnswers,
      questionTimes: state.questionTimes,
      totalQuestions: state.questions.length,
      answeredQuestions: Object.keys(state.questionAnswers).filter(
        (id) => state.questionAnswers[id] !== null
      ),
      averageTimePerQuestion:
        Object.keys(state.questionTimes).length > 0
          ? Object.values(state.questionTimes).reduce(
              (sum, time) => sum + time,
              0
            ) / Object.keys(state.questionTimes).length
          : 0,
      totalTimeSpent: Object.values(state.questionTimes).reduce(
        (sum, time) => sum + time,
        0
      ),
    };

    try {
      // Save current session
      localStorage.setItem(
        "currentPracticeSession",
        JSON.stringify(currentSession)
      );

      // Update practice sessions history
      const existingSessions = localStorage.getItem("practiceHistory");
      const sessions: PracticeSession[] = existingSessions
        ? JSON.parse(existingSessions)
        : [];

      // Find if this session already exists in history
      const existingIndex = sessions.findIndex(
        (session) => session.sessionId === state.sessionId
      );

      if (existingIndex !== -1) {
        // Update existing session
        sessions[existingIndex] = currentSession;
      } else {
        // Add new session
        sessions.push(currentSession);
      }

      // Keep only last 20 sessions
      const recentSessions = sessions.slice(-20);
      localStorage.setItem("practiceHistory", JSON.stringify(recentSessions));

      // Show saving indicator briefly
      setTimeout(() => {
        isSavingRef.current = false;
        dispatch({ type: "SET_SAVING_SESSION", payload: false });
      }, 500);
    } catch (error) {
      console.error("Failed to save session:", error);
      isSavingRef.current = false;
      dispatch({ type: "SET_SAVING_SESSION", payload: false });
    }
  }, [
    state.questions,
    state.sessionId,
    state.sessionStartTime,
    state.currentQuestionStep,
    state.questionAnswers,
    state.questionTimes,
    practiceSelections,
  ]);

  const currentQuestion = useMemo(
    () => (state.questions ? state.questions[state.currentQuestionStep] : null),
    [state.questions, state.currentQuestionStep]
  );

  const steps = useMemo(
    () => [
      {
        id: "preparing",
        title: "Prepare",
        content: "Preparing Practice",
      },
      {
        id: "querying",
        title: "Querying",
        content: "Querying Questions 🔍",
      },
      {
        id: "fetching-questions",
        title: "Fetching Each Question",
        content: state.isLoadingNextBatch
          ? `Loading Next Batch... (${state.questionsProcessedCount}/22)`
          : "Fetching Each Question 🔍",
      },
      {
        id: "verifying",
        title: "Verifying",
        content: "Verifying Questions...",
      },
      {
        id: "launching",
        title: "Launching Practice",
        content: "Launching Practice... 🚀",
      },
    ],
    [state.isLoadingNextBatch, state.questionsProcessedCount]
  );

  // Initialize session when practice starts
  useEffect(() => {
    if (practiceSelections) {
      // Try to restore existing session for this practice type
      try {
        const existingSession = localStorage.getItem("currentPracticeSession");
        if (existingSession) {
          const session = JSON.parse(existingSession);
          // Check if it's the same practice configuration
          if (
            JSON.stringify(session.practiceSelections) ===
            JSON.stringify(practiceSelections)
          ) {
            console.log("Restored existing session:", session.sessionId);
            // We could restore the session state here if needed
            // For now, we'll start fresh but keep the same session ID
            return;
          }
        }
      } catch (error) {
        console.error("Error restoring session:", error);
      }

      dispatch({
        type: "INITIALIZE_SESSION",
        payload: { practiceSelections, totalQuestions: 0 },
      });
    }
  }, [practiceSelections]);

  // Auto-save session every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSavingRef.current) {
        saveCurrentSession();
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [saveCurrentSession]);

  // Save session when question is answered (debounced)
  const questionAnswersCount = Object.keys(state.questionAnswers).length;
  useEffect(() => {
    if (questionAnswersCount > 0 && !isSavingRef.current) {
      // Debounce to avoid too frequent saves
      const timeoutId = setTimeout(() => {
        saveCurrentSession();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [questionAnswersCount, saveCurrentSession]);

  // Save session when user progresses to next question (debounced)
  useEffect(() => {
    if (state.currentQuestionStep > 0 && !isSavingRef.current) {
      // Debounce to avoid too frequent saves
      const timeoutId = setTimeout(() => {
        saveCurrentSession();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [state.currentQuestionStep, saveCurrentSession]);

  // Save session before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isSavingRef.current) {
        // Use a synchronous save for page unload
        if (state.questions && state.questions.length > 0) {
          const currentSession: PracticeSession = {
            sessionId: state.sessionId,
            timestamp: new Date(state.sessionStartTime).toISOString(),
            status: SessionStatus.IN_PROGRESS,
            practiceSelections,
            currentQuestionStep: state.currentQuestionStep,
            questionAnswers: state.questionAnswers,
            questionTimes: state.questionTimes,
            totalQuestions: state.questions.length,
            answeredQuestions: Object.keys(state.questionAnswers).filter(
              (id) => state.questionAnswers[id] !== null
            ),
            averageTimePerQuestion:
              Object.keys(state.questionTimes).length > 0
                ? Object.values(state.questionTimes).reduce(
                    (sum, time) => sum + time,
                    0
                  ) / Object.keys(state.questionTimes).length
                : 0,
            totalTimeSpent: Object.values(state.questionTimes).reduce(
              (sum, time) => sum + time,
              0
            ),
          };

          try {
            localStorage.setItem(
              "currentPracticeSession",
              JSON.stringify(currentSession)
            );
          } catch (error) {
            console.error("Failed to save session on unload:", error);
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [
    state.questions,
    state.sessionId,
    state.sessionStartTime,
    state.currentQuestionStep,
    state.questionAnswers,
    state.questionTimes,
    practiceSelections,
  ]);

  // Function to handle session completion
  const completeSession = useCallback(() => {
    const completedSession: PracticeSession = {
      sessionId: state.sessionId,
      timestamp: new Date(state.sessionStartTime).toISOString(),
      status: SessionStatus.COMPLETED,
      practiceSelections,
      currentQuestionStep: state.currentQuestionStep,
      questionAnswers: state.questionAnswers,
      questionTimes: state.questionTimes,
      totalQuestions: state.questions?.length || 0,
      answeredQuestions: Object.keys(state.questionAnswers).filter(
        (id) => state.questionAnswers[id] !== null
      ),
      averageTimePerQuestion:
        Object.keys(state.questionTimes).length > 0
          ? Object.values(state.questionTimes).reduce(
              (sum, time) => sum + time,
              0
            ) / Object.keys(state.questionTimes).length
          : 0,
      totalTimeSpent: Object.values(state.questionTimes).reduce(
        (sum, time) => sum + time,
        0
      ),
    };

    try {
      // Save completed session to history
      const existingSessions = localStorage.getItem("practiceHistory");
      const sessions: PracticeSession[] = existingSessions
        ? JSON.parse(existingSessions)
        : [];

      // Update or add the completed session
      const existingIndex = sessions.findIndex(
        (session) => session.sessionId === state.sessionId
      );
      if (existingIndex !== -1) {
        sessions[existingIndex] = completedSession;
      } else {
        sessions.push(completedSession);
      }

      localStorage.setItem("practiceHistory", JSON.stringify(sessions));

      // Clear current session since it's completed
      localStorage.removeItem("currentPracticeSession");

      console.log("Practice session completed and saved!", completedSession);
      console.log("Session ID:", completedSession.sessionId);
      console.log(
        "Total questions answered:",
        completedSession.answeredQuestions.length
      );
      console.log(
        "Total time spent:",
        Math.round(completedSession.totalTimeSpent / 1000),
        "seconds"
      );
    } catch (error) {
      console.error("Failed to save completed session:", error);
    }
  }, [
    state.sessionId,
    state.sessionStartTime,
    state.currentQuestionStep,
    state.questionAnswers,
    state.questionTimes,
    state.questions,
    practiceSelections,
  ]);

  // Scroll to top when question step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Don't reset question state - let SET_CURRENT_QUESTION_STEP handle the state properly
    // dispatch({ type: "RESET_QUESTION_STATE" });
  }, [state.currentQuestionStep]);

  const FetchQuestions = useCallback(async (selections: PracticeSelections) => {
    const questionsResponse = await fetch(
      `/api/get-questions?assessment=${
        selections.assessment
      }&domains=${selections.domains
        .map((d) => d.primaryClassCd)
        .join(",")}&difficulties=${selections.difficulties.join(
        ","
      )}&skills=${selections.skills.map((s) => s.skill_cd).join(",")}`
    )
      .then((res) => res.json())
      .catch((error) => {
        console.error("Error fetching questions:", error);
        return [];
      });

    if ("data" in questionsResponse) {
      dispatch({ type: "SET_CURRENT_STEP", payload: 3 });
      const questionsData: API_Response_Question_List = questionsResponse.data;

      dispatch({ type: "SET_QUESTIONS_DATA", payload: questionsData });

      const questionsToFetch = questionsData.splice(0, 22); // Fetch first 22 questions for demo
      const questions: API_Response_Question[] = [];
      const correctQuestions: QuestionState[] = [];

      for (const question of questionsToFetch) {
        // console.log("Fetching question:", question);
        const questionsData: API_Response_Question =
          await fetchQuestionsbyIBN_ExternalId(
            question.external_id
              ? question.external_id
              : question.ibn
              ? question.ibn
              : ""
          );

        if (questionsData) questions.push(questionsData);
      }
      dispatch({ type: "SET_CURRENT_STEP", payload: 4 });

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];

        if (
          question.correct_answer &&
          Array.isArray(question.correct_answer) &&
          question.correct_answer.length > 0
        ) {
          correctQuestions.push({
            ...question,
            correct_answer: question.correct_answer, // explicitly assign the non-null array
            plainQuestion: questionsData[i],
          });
        }
        // Process each question as needed
      }

      dispatch({ type: "SET_CURRENT_STEP", payload: 5 });

      setTimeout(() => {
        // if (correctQuestions && !state.questions)
        //   playSound("start-session.wav");

        dispatch({ type: "SET_QUESTIONS", payload: correctQuestions });

        dispatch({ type: "SET_CURRENT_STEP", payload: 5 });

        dispatch({ type: "START_TIMER" }); // Start timer when questions are loaded
      }, 1500);
    }
  }, []);

  useEffect(() => {
    if (practiceSelections) {
      dispatch({ type: "SET_CURRENT_STEP", payload: 2 });
      FetchQuestions(practiceSelections);
    }
  }, [practiceSelections, FetchQuestions]);

  async function fetchQuestionsbyIBN_ExternalId(id: string) {
    const questionResponse: { data: API_Response_Question } = await fetch(
      `/api/question/${id}`
    )
      .then((res) => res.json())
      .catch((error) => {
        console.error("Error fetching question:", error);
        return null;
      });

    return questionResponse.data;
  }

  const loadNextBatch = useCallback(async () => {
    if (!state.questionsData || state.isLoadingNextBatch) {
      console.log("No more questions available or already loading");
      return;
    }

    // Check if there are more questions available
    const startIndex = state.currentBatch * 22;
    if (startIndex >= state.questionsData.length) {
      console.log("No more questions available in the dataset");
      return;
    }

    dispatch({ type: "START_LOADING_NEXT_BATCH" });

    try {
      // Get the next 22 questions from questionsData
      const questionsToFetch = state.questionsData.slice(
        startIndex,
        startIndex + 22
      );
      const questions: API_Response_Question[] = [];
      const correctQuestions: QuestionState[] = [];

      // Fetch individual question details
      for (let i = 0; i < questionsToFetch.length; i++) {
        const question = questionsToFetch[i];

        // Update progress
        dispatch({
          type: "SET_QUESTIONS_PROCESSED_COUNT",
          payload: i + 1,
        });

        const questionData: API_Response_Question =
          await fetchQuestionsbyIBN_ExternalId(
            question.ibn
              ? question.ibn
              : question.external_id
              ? question.external_id
              : ""
          );

        if (questionData) questions.push(questionData);
      }

      // Process questions to ensure they have correct answers
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];

        if (
          question.correct_answer &&
          Array.isArray(question.correct_answer) &&
          question.correct_answer.length > 0
        ) {
          correctQuestions.push({
            ...question,
            correct_answer: question.correct_answer,
            plainQuestion: questionsToFetch[i],
          });
        }
      }

      // Dispatch the new questions
      dispatch({
        type: "FINISH_LOADING_NEXT_BATCH",
        payload: correctQuestions,
      });
    } catch (error) {
      console.error("Error loading next batch:", error);
      // Reset loading state on error
      dispatch({ type: "SET_CURRENT_STEP", payload: 5 });
    }
  }, [state.questionsData, state.isLoadingNextBatch, state.currentBatch]);

  const handleAnsweringQuestion = useCallback(
    (questionId: string) => {
      return () => {
        if (!state.selectedAnswer || !currentQuestion) return;

        // Check if this is a previously answered question being reviewed
        const isPreviouslyAnswered = Boolean(state.questionAnswers[questionId]);

        if (!state.isAnswerChecked && !isPreviouslyAnswered) {
          // First time answering this question
          const correctAnswers = currentQuestion.correct_answer.map((e) =>
            e.trim()
          );
          const correct = correctAnswers.includes(state.selectedAnswer.trim());

          // Play sound based on answer correctness
          if (correct) {
            playSound("correct-answer.wav");
            confettiRef.current?.fire({});
          } else {
            playSound("incorrect-answer.wav");
          }

          // Calculate time elapsed for this question
          const currentSessionTime = Date.now() - state.questionStartTime;
          const previousElapsedTime =
            state.inProgressQuestionTimes[questionId] ||
            state.currentQuestionElapsedTime;
          const timeElapsed = currentSessionTime + previousElapsedTime;

          dispatch({
            type: "SET_ANSWER_CHECKED",
            payload: {
              checked: true,
              correct,
              questionId,
              answer: state.selectedAnswer,
              timeElapsed,
            },
          });

          // Save statistics to localStorage
          try {
            const assessmentType =
              practiceSelections.assessment as AssessmentType;
            addQuestionStatistic({
              assessment: assessmentType,
              primaryClassCd: currentQuestion.plainQuestion.primary_class_cd,
              skillCd: currentQuestion.plainQuestion.skill_cd,
              questionId: currentQuestion.plainQuestion.questionId,
              external_id:
                currentQuestion.plainQuestion.external_id || undefined,
              ibn: currentQuestion.plainQuestion.ibn || undefined,
              statistic: {
                time: timeElapsed,
                answer: state.selectedAnswer,
                isCorrect: correct,
                external_id:
                  currentQuestion.plainQuestion.external_id || undefined,
                ibn: currentQuestion.plainQuestion.ibn || undefined,
              },
            });
          } catch (error) {
            console.error("Error saving question statistic:", error);
          }

          // Stop the timer when answer is checked
          dispatch({ type: "STOP_TIMER" });

          // Note: The feedback overlay will handle the continue action
          // Don't advance to next question here - let overlay handle it
        } else {
          // Either this is a review of a previously answered question or continuing after checking
          playSound("button-pressed.wav");

          // Move to next question if available
          if (
            state.questions &&
            state.currentQuestionStep < state.questions.length - 1
          ) {
            dispatch({
              type: "SET_CURRENT_QUESTION_STEP",
              payload: state.currentQuestionStep + 1,
            });
          } else {
            // This was the last question - check if we can load next batch
            if (
              state.questionsData &&
              state.currentBatch * 22 < state.questionsData.length
            ) {
              loadNextBatch();
            } else {
              console.log("Practice session completed!");
              completeSession();
            }
          }
        }
      };
    },
    [
      state.selectedAnswer,
      currentQuestion,
      state.isAnswerChecked,
      state.questions,
      state.currentQuestionStep,
      state.questionStartTime,
      state.currentQuestionElapsedTime,
      state.questionsData,
      state.currentBatch,
      state.questionAnswers,
      state.inProgressQuestionTimes,
      loadNextBatch,
      completeSession,
      practiceSelections,
    ]
  );

  function handleExit() {
    // Show exit confirmation popup instead of directly exiting
    dispatch({ type: "TOGGLE_EXIT_CONFIRMATION" });
  }

  function confirmExit() {
    // Save user's progress to local storage with ABANDONED status
    const abandonedSession: PracticeSession = {
      sessionId: state.sessionId,
      timestamp: new Date(state.sessionStartTime).toISOString(),
      status: SessionStatus.ABANDONED,
      practiceSelections,
      currentQuestionStep: state.currentQuestionStep,
      questionAnswers: state.questionAnswers,
      questionTimes: state.questionTimes,
      totalQuestions: state.questions?.length || 0,
      answeredQuestions: Object.keys(state.questionAnswers).filter(
        (id) => state.questionAnswers[id] !== null
      ),
      averageTimePerQuestion:
        Object.keys(state.questionTimes).length > 0
          ? Object.values(state.questionTimes).reduce(
              (sum, time) => sum + time,
              0
            ) / Object.values(state.questionTimes).length
          : 0,
      totalTimeSpent: Object.values(state.questionTimes).reduce(
        (sum, time) => sum + time,
        0
      ),
    };

    try {
      // Save session using localStorage directly
      const existingSessions = localStorage.getItem("practiceHistory");
      const sessions: PracticeSession[] = existingSessions
        ? JSON.parse(existingSessions)
        : [];

      // Update or add the abandoned session
      const existingIndex = sessions.findIndex(
        (session) => session.sessionId === state.sessionId
      );
      if (existingIndex !== -1) {
        sessions[existingIndex] = abandonedSession;
      } else {
        sessions.push(abandonedSession);
      }

      localStorage.setItem("practiceHistory", JSON.stringify(sessions));

      // Clear current session since user is exiting
      localStorage.removeItem("currentPracticeSession");

      console.log("Practice session saved successfully as abandoned");
      console.log(
        "Question Times (in seconds):",
        Object.fromEntries(
          Object.entries(state.questionTimes).map(([id, time]) => [
            id,
            Math.round(time / 1000),
          ])
        )
      );
    } catch (error) {
      console.error("Failed to save practice session:", error);
    }

    // Navigate back to practice selection or home page
    // You might want to use router.push() here depending on your routing setup
    if (typeof window !== "undefined") {
      window.location.href = "/practice"; // Adjust this path as needed
    }
  }

  console.log(currentQuestion);
  return (
    <React.Fragment>
      <div className="max-w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
        {!currentQuestion ? (
          <div className="h-screen flex flex-col items-center justify-center gap-8">
            {/* OnboardCard Component */}
            <OnboardCard
              steps={steps}
              currentStep={state.currentStep}
              onStepChange={() => {
                // Step change handler
              }}
            />
          </div>
        ) : (
          <React.Fragment>
            <div className="min-h-screen items-center justify-center pt-32 pb-10">
              <div className="flex flex-row justify-between mb-10">
                <div>
                  <div className="flex gap-4 items-center">
                    <DuolingoTimer
                      startTime={state.questionStartTime}
                      isActive={state.isTimerActive}
                      isVisible={state.isTimerVisible}
                      onToggleVisibility={() => {
                        dispatch({ type: "TOGGLE_TIMER_VISIBILITY" });
                        playSound("button-pressed.wav");
                      }}
                      fixedTime={
                        state.questionAnswers[
                          currentQuestion.plainQuestion.questionId
                        ]
                          ? state.questionTimes[
                              currentQuestion.plainQuestion.questionId
                            ]
                          : undefined
                      }
                      savedElapsedTime={state.currentQuestionElapsedTime}
                    />
                    <div className="h-full flex gap-2 justify-center items-center">
                      <div>
                        <h5 className="font-black text-2xl">
                          Question ID {currentQuestion.plainQuestion.questionId}
                        </h5>
                        <h6 className="text-xl">
                          {currentQuestion.plainQuestion.primary_class_cd_desc}{" "}
                          - {currentQuestion.plainQuestion.skill_desc}
                        </h6>
                        {state.questionsData && (
                          <p className="text-sm text-gray-600 mt-1">
                            Batch {state.currentBatch} • Question{" "}
                            {state.currentQuestionStep + 1} of{" "}
                            {state.questions?.length || 0} •{" "}
                            {Math.max(
                              0,
                              state.questionsData.length -
                                state.currentBatch * 22
                            )}{" "}
                            questions remaining
                            {state.isSavingSession && (
                              <span className="ml-2 text-blue-600 text-xs">
                                • Saving...
                              </span>
                            )}
                            {state.questionAnswers[
                              currentQuestion.plainQuestion.questionId
                            ] && (
                              <span className="ml-2 text-orange-600 text-xs font-semibold">
                                • REVIEWING
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      <Pill className="text-md font-semibold">
                        {currentQuestion.plainQuestion.difficulty == "E" ? (
                          <React.Fragment>
                            <PillIndicator variant="success" pulse />
                            Easy
                          </React.Fragment>
                        ) : currentQuestion.plainQuestion.difficulty == "M" ? (
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
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={"outline"}
                    disabled={state.currentQuestionStep === 0}
                    className={`group font-bold py-3 px-3 rounded-xl border-2 border-b-4 shadow-lg transform transition-all duration-200 ${
                      state.currentQuestionStep === 0
                        ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
                        : "cursor-pointer bg-blue-500 hover:bg-blue-600 text-white border-blue-700 hover:border-blue-800 hover:shadow-xl active:translate-y-0.5 active:border-b-2"
                    }`}
                    onClick={() => {
                      if (state.currentQuestionStep > 0) {
                        playSound("button-pressed.wav");
                        dispatch({
                          type: "SET_CURRENT_QUESTION_STEP",
                          payload: state.currentQuestionStep - 1,
                        });
                      }
                    }}
                  >
                    <ArrowLeftIcon
                      className={`duration-300 ${
                        state.currentQuestionStep === 0
                          ? ""
                          : "group-hover:rotate-12"
                      }`}
                    />
                  </Button>
                  <Button
                    variant={"outline"}
                    disabled={
                      !state.questions ||
                      state.currentQuestionStep >= state.questions.length - 1 ||
                      !state.questionAnswers[
                        currentQuestion?.plainQuestion.questionId || ""
                      ]
                    }
                    className={`group font-bold py-3 px-3 rounded-xl border-2 border-b-4 shadow-lg transform transition-all duration-200 ${
                      !state.questions ||
                      state.currentQuestionStep >= state.questions.length - 1 ||
                      !state.questionAnswers[
                        currentQuestion?.plainQuestion.questionId || ""
                      ]
                        ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
                        : "cursor-pointer bg-blue-500 hover:bg-blue-600 text-white border-blue-700 hover:border-blue-800 hover:shadow-xl active:translate-y-0.5 active:border-b-2"
                    }`}
                    onClick={() => {
                      if (
                        state.questions &&
                        state.currentQuestionStep <
                          state.questions.length - 1 &&
                        state.questionAnswers[
                          currentQuestion?.plainQuestion.questionId || ""
                        ]
                      ) {
                        playSound("button-pressed.wav");
                        dispatch({
                          type: "SET_CURRENT_QUESTION_STEP",
                          payload: state.currentQuestionStep + 1,
                        });
                      }
                    }}
                  >
                    <ArrowRightIcon
                      className={`duration-300 ${
                        !state.questions ||
                        state.currentQuestionStep >=
                          state.questions.length - 1 ||
                        !state.questionAnswers[
                          currentQuestion?.plainQuestion.questionId || ""
                        ]
                          ? ""
                          : "group-hover:-rotate-12"
                      }`}
                    />
                  </Button>

                  <Button
                    variant={"outline"}
                    className="cursor-pointer group bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-2xl border-2 border-b-4 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transform transition-all duration-200 active:translate-y-0.5 active:border-b-2"
                    onClick={() => {
                      dispatch({ type: "TOGGLE_REFERENCE_POPUP" });
                      playSound("button-pressed.wav");
                    }}
                  >
                    <PyramidIcon className="group-hover:rotate-12 duration-300 mr-2" />
                    Reference
                  </Button>
                  <Button
                    variant="destructive"
                    className="cursor-pointer bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-2xl border-b-4 border-red-700 hover:border-red-800 shadow-md hover:shadow-lg transform transition-all duration-200 active:translate-y-0.5 active:border-b-2"
                    onClick={handleExit}
                  >
                    Exit
                  </Button>
                </div>
              </div>

              <div className="w-full grid grid-cols-4 lg:grid-cols-8 items-center justify-center gap-8 h-full">
                <div
                  className={`col-span-4 lg:col-span-3 flex flex-col gap-6 h-full relative`}
                >
                  <React.Fragment>
                    {currentQuestion.stimulus && (
                      <div
                        id="stimulus"
                        className="text-xl text-justify"
                        dangerouslySetInnerHTML={{
                          __html: currentQuestion.stimulus
                            ? currentQuestion.stimulus
                            : "",
                        }}
                      ></div>
                    )}

                    {currentQuestion.stem && (
                      <MathJax>
                        <div
                          id="question_stem"
                          className="text-xl"
                          dangerouslySetInnerHTML={{
                            __html: currentQuestion.stem,
                          }}
                        ></div>
                      </MathJax>
                    )}

                    {currentQuestion.answerOptions ? (
                      <AnswerOptions
                        answerOptions={currentQuestion.answerOptions}
                        questionId={currentQuestion.plainQuestion.questionId}
                        selectedAnswer={state.selectedAnswer}
                        disabledOptions={state.disabledOptions}
                        onAnswerSelect={(key) =>
                          dispatch({
                            type: "SET_SELECTED_ANSWER",
                            payload: key,
                          })
                        }
                        onToggleDisabled={(key) => {
                          dispatch({
                            type: "SET_DISABLED_OPTION",
                            payload: {
                              key,
                              value: !state.disabledOptions[key],
                            },
                          });
                        }}
                        showStrikethrough={
                          practiceSelections?.subject !== "reading-writing"
                        }
                        correctAnswers={currentQuestion.correct_answer.map(
                          (answer) => answer.trim()
                        )}
                        isAnswerChecked={state.isAnswerChecked}
                        isReviewMode={Boolean(
                          state.questionAnswers[
                            currentQuestion.plainQuestion.questionId
                          ]
                        )}
                      />
                    ) : (
                      <DuolingoInput
                        value={state.selectedAnswer || ""}
                        onChange={(value) =>
                          dispatch({
                            type: "SET_SELECTED_ANSWER",
                            payload: value,
                          })
                        }
                        onSubmit={handleAnsweringQuestion(
                          currentQuestion.plainQuestion.questionId
                        )}
                        disabled={state.isAnswerChecked}
                      />
                    )}
                    <div className="pt-1 pb-2 relative overflow-visible">
                      <Button
                        variant={"default"}
                        className={`mt-5 w-full relative font-bold text-lg py-6 border-b-4 rounded-2xl text-white shadow-lg transform transition-all duration-200 ${
                          state.isLoadingNextBatch
                            ? "bg-yellow-500 hover:bg-yellow-600 border-yellow-700 hover:border-yellow-800 cursor-wait animate-pulse"
                            : state.isAnswerChecked && state.isAnswerCorrect
                            ? "bg-green-500 hover:bg-green-600 border-green-700 hover:border-green-800 cursor-pointer hover:shadow-xl active:translate-y-0.5 active:border-b-2"
                            : state.isAnswerChecked && !state.isAnswerCorrect
                            ? "bg-red-500 hover:bg-red-600 border-red-700 hover:border-red-800 cursor-pointer hover:shadow-xl active:translate-y-0.5 active:border-b-2"
                            : "bg-blue-500 hover:bg-blue-600 border-blue-700 hover:border-blue-800 cursor-pointer hover:shadow-xl active:translate-y-0.5 active:border-b-2"
                        }`}
                        disabled={
                          state.selectedAnswer == null ||
                          state.isLoadingNextBatch
                        }
                        onClick={handleAnsweringQuestion(
                          currentQuestion.plainQuestion.questionId
                        )}
                      >
                        {state.isLoadingNextBatch ? (
                          <DuolingoLoadingSpinner
                            progress={state.questionsProcessedCount}
                            total={22}
                          />
                        ) : state.questionAnswers[
                            currentQuestion.plainQuestion.questionId
                          ] ? (
                          "NEXT"
                        ) : !state.isAnswerChecked ? (
                          "CHECK"
                        ) : (
                          "CONTINUE"
                        )}
                      </Button>
                      <Confetti
                        ref={confettiRef}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full h-full pointer-events-none"
                      />
                    </div>
                    {/* <Button
                      variant={"ghost"}
                      className="text-md cursor-pointer"
                      disabled={!state.isAnswerChecked}
                    >
                      EXPLAIN
                    </Button> */}

                    {state.isAnswerChecked && state.selectedAnswer && (
                      <React.Fragment>
                        {/* Show review indicator when viewing previous question */}
                        {state.questionAnswers[
                          currentQuestion.plainQuestion.questionId
                        ] && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                              <span className="text-orange-700 font-semibold">
                                Question Review
                              </span>
                            </div>
                            <p className="text-orange-600 text-sm">
                              You are reviewing a previously answered question.
                              Your original answer and the explanation are shown
                              below.
                            </p>
                          </div>
                        )}

                        <Label className="text-lg font-semibold">
                          Your Answer:{" "}
                          <span
                            className={`${
                              state.isAnswerCorrect
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {state.selectedAnswer}
                          </span>
                          {state.isAnswerCorrect ? (
                            <span className="ml-2 text-green-600 text-sm">
                              ✓ Correct
                            </span>
                          ) : (
                            <span className="ml-2 text-red-600 text-sm">
                              ✗ Incorrect
                            </span>
                          )}
                        </Label>
                        <Label className="text-lg font-semibold">
                          Correct Answer:{" "}
                          <span className={"text-green-600"}>
                            {currentQuestion.correct_answer.join(", ")}
                          </span>
                        </Label>

                        <div className="mt-4">
                          <Label className="text-lg font-semibold mb-2 block">
                            Explanation:
                          </Label>
                          <MathJax
                            id="question_explanation"
                            className=" text-justify"
                          >
                            <span
                              className="text-xl"
                              dangerouslySetInnerHTML={{
                                __html: currentQuestion.rationale.replaceAll(
                                  /\s*style\s*=\s*"[^"]*"/gi,
                                  ""
                                ),
                              }}
                            ></span>
                          </MathJax>
                        </div>
                      </React.Fragment>
                    )}
                  </React.Fragment>
                </div>

                <div className="col-span-4 lg:col-span-5 h-full ">
                  {practiceSelections?.subject !== "reading-writing" ? (
                    <div className="border-2 border-gray-200 shadow-lg overflow-hidden rounded-lg">
                      <iframe
                        src="https://www.desmos.com/testing/cb-sat-ap/graphing"
                        width={"100%"}
                        className="h-[800px]"
                      ></iframe>
                    </div>
                  ) : (
                    <React.Fragment>
                      <MathJax>
                        <span
                          className="text-xl"
                          dangerouslySetInnerHTML={{
                            __html: currentQuestion.stem,
                          }}
                        ></span>
                      </MathJax>
                      <Separator className="my-4" />
                      {currentQuestion.answerOptions ? (
                        <AnswerOptions
                          answerOptions={currentQuestion.answerOptions}
                          questionId={currentQuestion.plainQuestion.questionId}
                          selectedAnswer={state.selectedAnswer}
                          disabledOptions={state.disabledOptions}
                          onAnswerSelect={(key) =>
                            dispatch({
                              type: "SET_SELECTED_ANSWER",
                              payload: key,
                            })
                          }
                          onToggleDisabled={(key) => {
                            dispatch({
                              type: "SET_DISABLED_OPTION",
                              payload: {
                                key,
                                value: !state.disabledOptions[key],
                              },
                            });
                          }}
                          showStrikethrough={
                            practiceSelections?.subject !== "reading-writing"
                          }
                          correctAnswers={currentQuestion.correct_answer.map(
                            (answer) => answer.trim()
                          )}
                          isAnswerChecked={state.isAnswerChecked}
                          isReviewMode={Boolean(
                            state.questionAnswers[
                              currentQuestion.plainQuestion.questionId
                            ]
                          )}
                        />
                      ) : (
                        <DuolingoInput
                          value={state.selectedAnswer || ""}
                          onChange={(value) =>
                            dispatch({
                              type: "SET_SELECTED_ANSWER",
                              payload: value,
                            })
                          }
                          onSubmit={handleAnsweringQuestion(
                            currentQuestion.plainQuestion.questionId
                          )}
                          disabled={state.isAnswerChecked}
                        />
                      )}
                      <div className="py-1 relative overflow-visible">
                        <Button
                          variant={"default"}
                          className={`mt-5 w-full font-bold text-lg py-6 border-b-4 rounded-2xl text-white shadow-lg transform transition-all duration-200 ${
                            state.isLoadingNextBatch
                              ? "bg-yellow-500 hover:bg-yellow-600 border-yellow-700 hover:border-yellow-800 cursor-wait animate-pulse"
                              : state.isAnswerChecked && state.isAnswerCorrect
                              ? "bg-green-500 hover:bg-green-600 border-green-700 hover:border-green-800 cursor-pointer hover:shadow-xl active:translate-y-0.5 active:border-b-2"
                              : state.isAnswerChecked && !state.isAnswerCorrect
                              ? "bg-red-500 hover:bg-red-600 border-red-700 hover:border-red-800 cursor-pointer hover:shadow-xl active:translate-y-0.5 active:border-b-2"
                              : "bg-blue-500 hover:bg-blue-600 border-blue-700 hover:border-blue-800 cursor-pointer hover:shadow-xl active:translate-y-0.5 active:border-b-2"
                          }`}
                          disabled={
                            state.selectedAnswer == null ||
                            state.isLoadingNextBatch
                          }
                          onClick={handleAnsweringQuestion(
                            currentQuestion.plainQuestion.questionId
                          )}
                        >
                          {state.isLoadingNextBatch ? (
                            <DuolingoLoadingSpinner
                              progress={state.questionsProcessedCount}
                              total={22}
                            />
                          ) : state.questionAnswers[
                              currentQuestion.plainQuestion.questionId
                            ] ? (
                            "NEXT"
                          ) : !state.isAnswerChecked ? (
                            "CHECK"
                          ) : (
                            "CONTINUE"
                          )}
                        </Button>
                        <Confetti
                          ref={confettiRef}
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full h-full pointer-events-none"
                        />
                      </div>

                      {/* <Button
                        variant={"ghost"}
                        className="text-md cursor-pointer"
                        disabled={!state.isAnswerChecked}
                      >
                        Explain
                      </Button> */}
                    </React.Fragment>
                  )}
                </div>
              </div>
            </div>
          </React.Fragment>
        )}
      </div>

      {/* Reference Popup */}
      <DraggableReferencePopup
        isOpen={state.isReferencePopupOpen}
        onClose={() => dispatch({ type: "TOGGLE_REFERENCE_POPUP" })}
      />

      {/* Success Feedback - only show for newly answered questions, not when reviewing */}
      <SuccessFeedback
        isVisible={
          state.isAnswerChecked &&
          state.isAnswerCorrect &&
          state.isTimerActive === false // Timer is stopped only when answering, not when reviewing
        }
        onContinue={() => {
          if (
            state.questions &&
            state.currentQuestionStep < state.questions.length - 1
          ) {
            dispatch({
              type: "SET_CURRENT_QUESTION_STEP",
              payload: state.currentQuestionStep + 1,
            });
          } else {
            // This was the last question - check if we can load next batch
            if (
              state.questionsData &&
              state.currentBatch * 22 < state.questionsData.length
            ) {
              loadNextBatch();
            } else {
              console.log("Practice session completed!");
              completeSession();
            }
          }
        }}
      />

      {/* Exit Confirmation */}
      <ExitConfirmation
        isVisible={state.isExitConfirmationOpen}
        onConfirm={confirmExit}
        onCancel={() => dispatch({ type: "TOGGLE_EXIT_CONFIRMATION" })}
      />
    </React.Fragment>
  );
}
