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

import { MathJax, MathJaxContext } from "better-react-mathjax";
import { Pill, PillIndicator } from "@/components/ui/pill";
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  GripHorizontalIcon,
  PyramidIcon,
  Strikethrough,
  X,
} from "lucide-react";
import Image from "next/image";

import ReferenceSheet from "@/src/sat-math-refrence-sheet.webp";

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

// Success Feedback Component
interface SuccessFeedbackProps {
  isVisible: boolean;
  onContinue: () => void;
}

function SuccessFeedback({ isVisible, onContinue }: SuccessFeedbackProps) {
  const randomMessage = useMemo(() => {
    return CONGRATULATORY_MESSAGES[
      Math.floor(Math.random() * CONGRATULATORY_MESSAGES.length)
    ];
  }, []);

  if (!isVisible) return null;

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
          <button
            onClick={onContinue}
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
              onClick={onCancel}
              className="cursor-pointer flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg py-4 px-6 rounded-2xl border-b-4 border-blue-600 hover:border-blue-700 shadow-lg hover:shadow-xl transform transition-all duration-200 active:translate-y-0.5 active:border-b-2"
            >
              STAY
            </button>
            <button
              onClick={onConfirm}
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
}

// Optimized Duolingo-styled Input Component
const DuolingoInput = React.memo(function DuolingoInput({
  value,
  onChange,
  placeholder = "Type your answer here...",
}: DuolingoInputProps) {
  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-4 text-lg font-medium border-2 border-b-4 border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 focus:border-b-blue-500 focus:ring-0 transition-all duration-200 bg-white shadow-sm hover:shadow-md focus:shadow-lg"
        />
        {value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )}
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
}: AnswerOptionsProps) {
  const optionEntries = useMemo(
    () => Object.entries(answerOptions),
    [answerOptions]
  );

  return (
    <RadioGroup className="flex flex-col gap-3" defaultValue="1">
      {optionEntries.map(([key, value], index) => {
        const isCorrectAnswer = isAnswerChecked && correctAnswers.includes(key);
        const isSelectedWrongAnswer =
          isAnswerChecked &&
          selectedAnswer === key &&
          !correctAnswers.includes(key);
        const isSelected = selectedAnswer === key;

        return (
          <div key={`${key}-${questionId}`} className="flex items-center gap-2">
            <label
              onClick={() => {
                if (
                  selectedAnswer !== key &&
                  !disabledOptions[key] &&
                  !isAnswerChecked
                ) {
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
                  <MathJax className="inline-block">
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
                  if (selectedAnswer !== key) {
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
        <div className="h-8 w-8 p-0 flex items-center justify-center">
          <GripHorizontalIcon className="h-4 w-4" />
        </div>
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

const config = {
  /* in theory, the MathML input processor should be activated if we add
  an "mml" block to the config OR if "input/mml" (NOT "input/mathml" as stated 
  in the docs) is in the load array. However, this is not necessary as MathML is 
  ALWAYS enabled in MathJax */
  loader: { load: ["input/mml", "output/chtml"] },
  mml: {},
};

// State management with useReducer for better performance
interface AppState {
  questionsData: API_Response_Question_List | null;
  questions: QuestionState[] | null;
  currentQuestionStep: number;
  questionAnswers: { [questionId: string]: string | null };
  disabledOptions: { [key: string]: boolean };
  selectedAnswer: string | null;
  isReferencePopupOpen: boolean;
  isAnswerChecked: boolean;
  isAnswerCorrect: boolean;
  currentStep: number;
  isExitConfirmationOpen: boolean;
}

type AppAction =
  | { type: "SET_QUESTIONS_DATA"; payload: API_Response_Question_List }
  | { type: "SET_QUESTIONS"; payload: QuestionState[] }
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "SET_CURRENT_QUESTION_STEP"; payload: number }
  | { type: "SET_SELECTED_ANSWER"; payload: string | null }
  | { type: "SET_DISABLED_OPTION"; payload: { key: string; value: boolean } }
  | { type: "RESET_QUESTION_STATE" }
  | {
      type: "SET_ANSWER_CHECKED";
      payload: {
        checked: boolean;
        correct: boolean;
        questionId: string;
        answer: string;
      };
    }
  | { type: "TOGGLE_REFERENCE_POPUP" }
  | { type: "TOGGLE_EXIT_CONFIRMATION" };

const initialState: AppState = {
  questionsData: null,
  questions: null,
  currentQuestionStep: 0,
  questionAnswers: {},
  disabledOptions: {},
  selectedAnswer: null,
  isReferencePopupOpen: false,
  isAnswerChecked: false,
  isAnswerCorrect: false,
  currentStep: 1,
  isExitConfirmationOpen: false,
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
      return {
        ...state,
        currentQuestionStep: action.payload,
        selectedAnswer: null,
        disabledOptions: {},
        isAnswerChecked: false,
        isAnswerCorrect: false,
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
      };
    case "SET_ANSWER_CHECKED":
      return {
        ...state,
        isAnswerChecked: action.payload.checked,
        isAnswerCorrect: action.payload.correct,
        questionAnswers: {
          ...state.questionAnswers,
          [action.payload.questionId]: action.payload.answer,
        },
      };
    case "TOGGLE_REFERENCE_POPUP":
      return { ...state, isReferencePopupOpen: !state.isReferencePopupOpen };
    case "TOGGLE_EXIT_CONFIRMATION":
      return {
        ...state,
        isExitConfirmationOpen: !state.isExitConfirmationOpen,
      };
    default:
      return state;
  }
}

interface PracticeRushMultistepProps {
  practiceSelections: {
    practiceType: string;
    assessment: string;
    subject: string;
    domains: Array<{
      id: string;
      text: string;
      primaryClassCd: string;
    }>;
    skills: Array<{
      id: string;
      text: string;
      skill_cd: string;
    }>;
    difficulties: string[];
  };
}

export default function PracticeRushMultistep({
  practiceSelections,
}: PracticeRushMultistepProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

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
        content: "Fetching Each Question 🔍",
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
    []
  );

  useEffect(() => {
    if (practiceSelections) {
      dispatch({ type: "SET_CURRENT_STEP", payload: 2 });
      FetchQuestions(practiceSelections);
    }
  }, [practiceSelections]);

  // Scroll to top when question step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    dispatch({ type: "RESET_QUESTION_STATE" });
  }, [state.currentQuestionStep]);

  async function FetchQuestions(selections: {
    practiceType: string;
    assessment: string;
    subject: string;
    domains: Array<{
      id: string;
      text: string;
      primaryClassCd: string;
    }>;
    skills: Array<{
      id: string;
      text: string;
      skill_cd: string;
    }>;
    difficulties: string[];
  }) {
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

      const questionsToFetch = questionsData.splice(0, 22); // Fetch first 20 questions for demo
      const questions: API_Response_Question[] = [];
      const correctQuestions: QuestionState[] = [];

      for (const question of questionsToFetch) {
        const questionResponse: { data: API_Response_Question } = await fetch(
          `/api/question/${question.ibn || question.external_id}`
        )
          .then((res) => res.json())
          .catch((error) => {
            console.error("Error fetching question:", error);
            return null;
          });

        if ("data" in questionResponse) questions.push(questionResponse.data);
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
        dispatch({ type: "SET_QUESTIONS", payload: correctQuestions });
      }, 1500);
    }
  }

  const handleAnsweringQuestion = useCallback(
    (questionId: string) => {
      return () => {
        if (!state.selectedAnswer || !currentQuestion) return;

        if (!state.isAnswerChecked) {
          // First click: Check the answer
          const correct = currentQuestion.correct_answer.includes(
            state.selectedAnswer
          );

          dispatch({
            type: "SET_ANSWER_CHECKED",
            payload: {
              checked: true,
              correct,
              questionId,
              answer: state.selectedAnswer,
            },
          });

          // Note: The feedback overlay will handle the continue action
          // Don't advance to next question here - let overlay handle it
        } else {
          // Second click: Continue to next question (backup if overlay isn't used)
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
            // This was the last question - practice session completed!
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
    ]
  );

  function handleExit() {
    // Show exit confirmation popup instead of directly exiting
    dispatch({ type: "TOGGLE_EXIT_CONFIRMATION" });
  }

  function confirmExit() {
    // Save user's progress to local storage
    const practiceSession = {
      practiceSelections,
      currentQuestionStep: state.currentQuestionStep,
      questionAnswers: state.questionAnswers,
      totalQuestions: state.questions?.length || 0,
      answeredQuestions: Object.keys(state.questionAnswers),
      timestamp: new Date().toISOString(),
      sessionId: `practice-${Date.now()}`, // Unique session ID
    };

    try {
      // Save current session
      localStorage.setItem(
        "currentPracticeSession",
        JSON.stringify(practiceSession)
      );

      // Also save to practice history for later review
      const existingHistory = localStorage.getItem("practiceHistory");
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.push(practiceSession);

      // Keep only last 10 sessions to avoid localStorage bloat
      const recentHistory = history.slice(-10);
      localStorage.setItem("practiceHistory", JSON.stringify(recentHistory));

      console.log("Practice session saved successfully");
    } catch (error) {
      console.error("Failed to save practice session:", error);
    }

    // Navigate back to practice selection or home page
    // You might want to use router.push() here depending on your routing setup
    if (typeof window !== "undefined") {
      window.location.href = "/practice"; // Adjust this path as needed
    }
  }

  return (
    <MathJaxContext version={3} config={config}>
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
                  <div className="flex gap-2 items-center">
                    <h5 className="font-black text-2xl">
                      Question ID {currentQuestion.plainQuestion.questionId}
                    </h5>

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
                  <h6 className="text-xl">
                    {currentQuestion.plainQuestion.primary_class_cd_desc} -{" "}
                    {currentQuestion.plainQuestion.skill_desc}
                  </h6>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={"outline"}
                    className="cursor-pointer active:translate-y-1"
                    onClick={() => dispatch({ type: "TOGGLE_REFERENCE_POPUP" })}
                  >
                    <PyramidIcon />
                    Reference
                  </Button>
                  <Button
                    variant="destructive"
                    className="cursor-pointer active:translate-y-1"
                    onClick={handleExit}
                  >
                    Exit
                  </Button>
                </div>
              </div>

              <div className="w-full grid grid-cols-4 lg:grid-cols-8 items-center justify-center gap-8 h-full">
                <div
                  className={`col-span-4 lg:col-span-3 flex flex-col gap-6 h-full`}
                >
                  <React.Fragment>
                    {currentQuestion.stimulus && (
                      <div
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
                        <span
                          className="text-xl"
                          dangerouslySetInnerHTML={{
                            __html: currentQuestion.stem.replaceAll(
                              /\s*style\s*=\s*"[^"]*"/gi,
                              ""
                            ),
                          }}
                        ></span>
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
                        correctAnswers={currentQuestion.correct_answer}
                        isAnswerChecked={state.isAnswerChecked}
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
                      />
                    )}

                    <div className="py-1">
                      <Button
                        variant={"default"}
                        className={`mt-5 w-full relative font-bold cursor-pointer text-lg py-6 border-b-4 rounded-2xl text-white shadow-lg hover:shadow-xl transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 ${
                          state.isAnswerChecked && state.isAnswerCorrect
                            ? "bg-green-500 hover:bg-green-600 border-green-700 hover:border-green-800"
                            : state.isAnswerChecked && !state.isAnswerCorrect
                            ? "bg-red-500 hover:bg-red-600 border-red-700 hover:border-red-800"
                            : "bg-blue-500 hover:bg-blue-600 border-blue-700 hover:border-blue-800"
                        }`}
                        disabled={state.selectedAnswer == null}
                        onClick={handleAnsweringQuestion(
                          currentQuestion.plainQuestion.questionId
                        )}
                      >
                        {!state.isAnswerChecked ? "CHECK" : "CONTINUE"}
                      </Button>
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
                        <div>
                          <MathJax>
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
                            __html: currentQuestion.stem.replaceAll(
                              /\s*style\s*=\s*"[^"]*"/gi,
                              ""
                            ),
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
                          correctAnswers={currentQuestion.correct_answer}
                          isAnswerChecked={state.isAnswerChecked}
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
                        />
                      )}
                      <div className="py-1">
                        <Button
                          variant={"default"}
                          className={`mt-5 w-full font-bold cursor-pointer text-lg py-6 border-b-4 rounded-2xl text-white shadow-lg hover:shadow-xl transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 ${
                            state.isAnswerChecked && state.isAnswerCorrect
                              ? "bg-green-500 hover:bg-green-600 border-green-700 hover:border-green-800"
                              : state.isAnswerChecked && !state.isAnswerCorrect
                              ? "bg-red-500 hover:bg-red-600 border-red-700 hover:border-red-800"
                              : "bg-blue-500 hover:bg-blue-600 border-blue-700 hover:border-blue-800"
                          }`}
                          disabled={state.selectedAnswer == null}
                          onClick={handleAnsweringQuestion(
                            currentQuestion.plainQuestion.questionId
                          )}
                        >
                          {!state.isAnswerChecked ? "CHECK" : "CONTINUE"}
                        </Button>
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

      {/* Success Feedback */}
      <SuccessFeedback
        isVisible={state.isAnswerChecked && state.isAnswerCorrect}
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
            // Practice session completed!
          }
        }}
      />

      {/* Exit Confirmation */}
      <ExitConfirmation
        isVisible={state.isExitConfirmationOpen}
        onConfirm={confirmExit}
        onCancel={() => dispatch({ type: "TOGGLE_EXIT_CONFIRMATION" })}
      />
    </MathJaxContext>
  );
}
