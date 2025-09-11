"use client";

import React, { useReducer, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import {
  vocabs_database,
  VocabsData,
  VocabularyWord,
  PracticePerformanceData,
  QuizAttempt,
  WordPerformance,
  ChatAPI_Definition_SuccessResponse,
  ChatAPI_FailureResponse,
} from "@/types/vocabulary";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  X,
  BotIcon,
} from "lucide-react";
import { playSound } from "@/lib/playSound";
import Link from "next/link";
import { de } from "date-fns/locale";

interface DefineQuestion {
  word: VocabularyWord;
}

interface VocabsDefinePracticeProps {
  onBackToPracticeSelection?: () => void;
}

// Define state interface
interface DefineState {
  currentQuestionIndex: number;
  userDefinition: string;
  showResult: boolean;
  score: number;
  answeredQuestions: boolean[];
  userAnswers: string[];
  isDefineComplete: boolean;
  showUserSentences: { [key: number]: boolean };
  questionStartTime: number;
  restartKey: number;
  isSubmitting: boolean;
  aiResponse: string;
  aiResults: { [key: number]: boolean }; // Store AI evaluation results per question
}

// Define actions
type DefineAction =
  | { type: "INITIALIZE_DEFINE"; payload: { questionCount: number } }
  | { type: "UPDATE_DEFINITION"; payload: string }
  | { type: "START_SUBMISSION" }
  | {
      type: "SUBMIT_DEFINITION";
      payload: { isCorrect: boolean; aiResponse: string };
    }
  | { type: "NEXT_QUESTION" }
  | { type: "PREVIOUS_QUESTION" }
  | { type: "FINISH_DEFINE" }
  | { type: "RESTART_DEFINE"; payload: { questionCount: number } }
  | { type: "TOGGLE_USER_SENTENCES"; payload: number }
  | { type: "SET_QUESTION_START_TIME"; payload: number }
  | {
      type: "LOAD_QUESTION_STATE";
      payload: { userDefinition: string; showResult: boolean };
    };

// Define reducer
function defineReducer(state: DefineState, action: DefineAction): DefineState {
  switch (action.type) {
    case "INITIALIZE_DEFINE":
      return {
        ...state,
        answeredQuestions: new Array(action.payload.questionCount).fill(false),
        userAnswers: new Array(action.payload.questionCount).fill(""),
        questionStartTime: Date.now(),
        aiResults: {},
      };

    case "UPDATE_DEFINITION":
      return {
        ...state,
        userDefinition: action.payload,
      };

    case "START_SUBMISSION":
      return {
        ...state,
        isSubmitting: true,
      };

    case "SUBMIT_DEFINITION":
      const newAnsweredQuestions = [...state.answeredQuestions];
      const newUserAnswers = [...state.userAnswers];
      const newAiResults = { ...state.aiResults };

      newAnsweredQuestions[state.currentQuestionIndex] = true;
      newUserAnswers[state.currentQuestionIndex] = state.userDefinition;
      newAiResults[state.currentQuestionIndex] = action.payload.isCorrect;

      return {
        ...state,
        showResult: true,
        isSubmitting: false,
        aiResponse: action.payload.aiResponse,
        score:
          !state.answeredQuestions[state.currentQuestionIndex] &&
          action.payload.isCorrect
            ? state.score + 1
            : state.score,
        answeredQuestions: newAnsweredQuestions,
        userAnswers: newUserAnswers,
        aiResults: newAiResults,
      };

    case "NEXT_QUESTION":
      if (state.currentQuestionIndex + 1 >= state.answeredQuestions.length) {
        return {
          ...state,
          isDefineComplete: true,
        };
      }
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        questionStartTime: Date.now(),
      };

    case "PREVIOUS_QUESTION":
      if (state.currentQuestionIndex > 0) {
        return {
          ...state,
          currentQuestionIndex: state.currentQuestionIndex - 1,
          questionStartTime: Date.now(),
        };
      }
      return state;

    case "FINISH_DEFINE":
      return {
        ...state,
        isDefineComplete: true,
      };

    case "RESTART_DEFINE":
      return {
        currentQuestionIndex: 0,
        userDefinition: "",
        showResult: false,
        score: 0,
        answeredQuestions: new Array(action.payload.questionCount).fill(false),
        userAnswers: new Array(action.payload.questionCount).fill(""),
        isDefineComplete: false,
        showUserSentences: {},
        questionStartTime: Date.now(),
        restartKey: Date.now(),
        isSubmitting: false,
        aiResponse: "",
        aiResults: {},
      };

    case "TOGGLE_USER_SENTENCES":
      return {
        ...state,
        showUserSentences: {
          ...state.showUserSentences,
          [action.payload]: !state.showUserSentences[action.payload],
        },
      };

    case "SET_QUESTION_START_TIME":
      return {
        ...state,
        questionStartTime: action.payload,
      };

    case "LOAD_QUESTION_STATE":
      return {
        ...state,
        userDefinition: action.payload.userDefinition,
        showResult: action.payload.showResult,
      };

    default:
      return state;
  }
}

// Initial define state
const initialDefineState: DefineState = {
  currentQuestionIndex: 0,
  userDefinition: "",
  showResult: false,
  score: 0,
  answeredQuestions: [],
  userAnswers: [],
  isDefineComplete: false,
  showUserSentences: {},
  questionStartTime: Date.now(),
  restartKey: 0,
  isSubmitting: false,
  aiResponse: "",
  aiResults: {},
};

export default function VocabsDefinePractice({
  onBackToPracticeSelection,
}: VocabsDefinePracticeProps = {}) {
  // Define state managed by reducer
  const [defineState, dispatch] = useReducer(defineReducer, initialDefineState);

  // Use the useLocalStorage hook
  const [vocabsData, setVocabsData] = useLocalStorage<VocabsData>(
    "vocabsData",
    {
      learntVocabs: [],
      userSentences: {},
    }
  );

  // Practice performance tracking
  const [practicePerformance, setPracticePerformance] =
    useLocalStorage<PracticePerformanceData>("practicePerformanceData", {
      attempts: [],
      wordPerformance: {},
      lastUpdated: Date.now(),
      totalQuizzesTaken: 0,
      overallAccuracy: 0,
      strongWords: [],
      weakWords: [],
      improvingWords: [],
    });

  // Get learned vocabulary words
  const learnedWords = useMemo(() => {
    return vocabs_database.filter((word) =>
      vocabsData.learntVocabs.includes(word.word)
    );
  }, [vocabsData.learntVocabs]);

  // Generate define questions
  const defineQuestions = useMemo(() => {
    if (learnedWords.length === 0) return [];

    // Categorize words by performance level
    const categorizedWords = {
      notPracticed: [] as VocabularyWord[],
      struggling: [] as VocabularyWord[],
      learning: [] as VocabularyWord[],
      proficient: [] as VocabularyWord[],
      mastered: [] as VocabularyWord[],
    };

    learnedWords.forEach((word) => {
      const performance = practicePerformance.wordPerformance[word.word];

      if (!performance) {
        categorizedWords.notPracticed.push(word);
      } else {
        switch (performance.masteryLevel) {
          case "struggling":
            categorizedWords.struggling.push(word);
            break;
          case "learning":
            categorizedWords.learning.push(word);
            break;
          case "proficient":
            categorizedWords.proficient.push(word);
            break;
          case "mastered":
            categorizedWords.mastered.push(word);
            break;
          default:
            categorizedWords.notPracticed.push(word);
        }
      }
    });

    // Shuffle each category separately
    Object.keys(categorizedWords).forEach((key) => {
      categorizedWords[key as keyof typeof categorizedWords].sort(
        () => Math.random() - 0.5
      );
    });

    // Combine in priority order: not practiced → struggling → learning → proficient → mastered
    const prioritizedWords = [
      ...categorizedWords.notPracticed,
      ...categorizedWords.struggling,
      ...categorizedWords.learning,
      ...categorizedWords.proficient,
      ...categorizedWords.mastered,
    ];

    return prioritizedWords.map((word) => ({
      word,
    }));
  }, [
    learnedWords,
    practicePerformance.wordPerformance,
    defineState.restartKey,
  ]);

  // Initialize answered questions and user answers arrays
  useEffect(() => {
    const questionsLength = defineQuestions.length;
    dispatch({
      type: "INITIALIZE_DEFINE",
      payload: { questionCount: questionsLength },
    });
  }, [defineQuestions.length]);

  // Load the user definition when navigating between questions
  useEffect(() => {
    if (defineState.userAnswers[defineState.currentQuestionIndex]) {
      dispatch({
        type: "LOAD_QUESTION_STATE",
        payload: {
          userDefinition:
            defineState.userAnswers[defineState.currentQuestionIndex],
          showResult:
            defineState.answeredQuestions[defineState.currentQuestionIndex],
        },
      });
    } else {
      dispatch({
        type: "LOAD_QUESTION_STATE",
        payload: {
          userDefinition: "",
          showResult: false,
        },
      });
    }
  }, [
    defineState.currentQuestionIndex,
    defineState.userAnswers,
    defineState.answeredQuestions,
  ]);

  // Reset question start time when navigating to a new question
  useEffect(() => {
    dispatch({ type: "SET_QUESTION_START_TIME", payload: Date.now() });
  }, [defineState.currentQuestionIndex]);

  // Helper function to calculate mastery level
  const calculateMasteryLevel = (
    correctAttempts: number,
    totalAttempts: number,
    consecutiveCorrect: number
  ): WordPerformance["masteryLevel"] => {
    if (totalAttempts === 0) return "learning";

    const accuracy = correctAttempts / totalAttempts;

    if (accuracy >= 0.9 && consecutiveCorrect >= 3) return "mastered";
    if (accuracy >= 0.7 && consecutiveCorrect >= 2) return "proficient";
    if (accuracy >= 0.5) return "learning";
    return "struggling";
  };

  // Helper function to update word performance
  const updateWordPerformance = (
    word: string,
    isCorrect: boolean,
    timeSpent: number
  ) => {
    setPracticePerformance((prevData) => {
      const updatedData = { ...prevData };

      // Create or update word performance
      const wordPerf = updatedData.wordPerformance[word] || {
        word,
        totalAttempts: 0,
        correctAttempts: 0,
        incorrectAttempts: 0,
        lastAttemptTimestamp: Date.now(),
        averageTimeSpent: 0,
        strugglingAreas: [],
        masteryLevel: "learning" as const,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
      };

      // Update statistics
      wordPerf.totalAttempts++;
      wordPerf.lastAttemptTimestamp = Date.now();

      if (isCorrect) {
        wordPerf.correctAttempts++;
        wordPerf.consecutiveCorrect++;
        wordPerf.consecutiveIncorrect = 0;
      } else {
        wordPerf.incorrectAttempts++;
        wordPerf.consecutiveIncorrect++;
        wordPerf.consecutiveCorrect = 0;

        // Add to struggling areas if not already there
        if (!wordPerf.strugglingAreas.includes("define")) {
          wordPerf.strugglingAreas.push("define");
        }
      }

      // Update average time spent
      const totalTime =
        wordPerf.averageTimeSpent * (wordPerf.totalAttempts - 1) + timeSpent;
      wordPerf.averageTimeSpent = totalTime / wordPerf.totalAttempts;

      // Update mastery level
      wordPerf.masteryLevel = calculateMasteryLevel(
        wordPerf.correctAttempts,
        wordPerf.totalAttempts,
        wordPerf.consecutiveCorrect
      );

      // Update word performance in data
      updatedData.wordPerformance[word] = wordPerf;

      // Create quiz attempt record
      const attempt: QuizAttempt = {
        word,
        questionType: "define",
        isCorrect,
        userAnswer: defineState.userDefinition,
        correctAnswer: currentQuestion.word.definition,
        timeSpent,
        timestamp: Date.now(),
        difficulty: currentQuestion.word.difficulty,
      };

      // Add attempt to history
      updatedData.attempts.push(attempt);

      // Update overall statistics
      updatedData.lastUpdated = Date.now();
      const totalCorrect = updatedData.attempts.filter(
        (a) => a.isCorrect
      ).length;
      updatedData.overallAccuracy = totalCorrect / updatedData.attempts.length;

      // Categorize words based on performance
      const allWords = Object.values(updatedData.wordPerformance);
      updatedData.strongWords = allWords
        .filter(
          (w) =>
            w.masteryLevel === "mastered" || w.masteryLevel === "proficient"
        )
        .map((w) => w.word);

      updatedData.weakWords = allWords
        .filter((w) => w.masteryLevel === "struggling")
        .map((w) => w.word);

      updatedData.improvingWords = allWords
        .filter(
          (w) => w.masteryLevel === "learning" && w.consecutiveCorrect > 0
        )
        .map((w) => w.word);

      return updatedData;
    });
  };

  const currentQuestion = defineQuestions[defineState.currentQuestionIndex];

  const handleDefinitionChange = (value: string) => {
    dispatch({ type: "UPDATE_DEFINITION", payload: value });
  };

  const handleSubmitDefinition = async () => {
    if (!defineState.userDefinition.trim()) return;

    playSound("button-pressed.wav");

    // Start loading state
    dispatch({ type: "START_SUBMISSION" });

    try {
      // console.log("Sending to AI:", currentQuestion.word);

      const aiResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: defineState.userDefinition,
          data: {
            word: currentQuestion.word.word,
            userDefinition: defineState.userDefinition,
            correctDefinition: currentQuestion.word.definition,
            exampleSentence: currentQuestion.word.example,
          },
          task: "validate-user-definition",
        }),
      });

      const aiResponseData:
        | ChatAPI_Definition_SuccessResponse
        | ChatAPI_FailureResponse = await aiResponse.json();

      let isCorrect = false;
      let aiMessage = "";

      if (aiResponseData.success) {
        isCorrect = aiResponseData.result.correct;
        aiMessage = aiResponseData.result.aiResponse;
      } else {
        // Fallback to simple evaluation if AI fails
        isCorrect = evaluateDefinition(
          defineState.userDefinition,
          currentQuestion.word.definition
        );
        aiMessage = "Unable to get AI feedback. Using basic evaluation.";
      }

      const timeSpent = Math.round(
        (Date.now() - defineState.questionStartTime) / 1000
      );

      // Update define state with AI response
      dispatch({
        type: "SUBMIT_DEFINITION",
        payload: { isCorrect, aiResponse: aiMessage },
      });

      // Update practice performance data (only for new answers)
      if (!defineState.answeredQuestions[defineState.currentQuestionIndex]) {
        updateWordPerformance(currentQuestion.word.word, isCorrect, timeSpent);
      }

      if (isCorrect) {
        playSound("correct-answer.wav");
      } else {
        playSound("incorrect-answer.wav");
      }
    } catch (error) {
      console.error("AI API Error:", error);

      // Fallback to simple evaluation if AI request fails
      const isCorrect = evaluateDefinition(
        defineState.userDefinition,
        currentQuestion.word.definition
      );

      const fallbackMessage =
        "Unable to connect to AI service. Using basic evaluation.";

      const timeSpent = Math.round(
        (Date.now() - defineState.questionStartTime) / 1000
      );

      // Update define state with fallback response
      dispatch({
        type: "SUBMIT_DEFINITION",
        payload: { isCorrect, aiResponse: fallbackMessage },
      });

      // Update practice performance data (only for new answers)
      if (!defineState.answeredQuestions[defineState.currentQuestionIndex]) {
        updateWordPerformance(currentQuestion.word.word, isCorrect, timeSpent);
      }

      if (isCorrect) {
        playSound("correct-answer.wav");
      } else {
        playSound("incorrect-answer.wav");
      }
    }
  };

  // Simple evaluation function (used as fallback)
  const evaluateDefinition = (userDef: string, correctDef: string): boolean => {
    const userWords = userDef.toLowerCase().split(/\s+/);
    const correctWords = correctDef.toLowerCase().split(/\s+/);

    // Count matching words (excluding common words)
    const commonWords = new Set([
      "a",
      "an",
      "the",
      "to",
      "of",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "for",
      "with",
    ]);
    const meaningfulUserWords = userWords.filter(
      (word) => !commonWords.has(word) && word.length > 2
    );
    const meaningfulCorrectWords = correctWords.filter(
      (word) => !commonWords.has(word) && word.length > 2
    );

    let matches = 0;
    meaningfulUserWords.forEach((word) => {
      if (
        meaningfulCorrectWords.some(
          (correctWord) =>
            correctWord.includes(word) || word.includes(correctWord)
        )
      ) {
        matches++;
      }
    });

    // Consider correct if at least 50% of meaningful words match
    return (
      meaningfulUserWords.length > 0 &&
      matches / meaningfulUserWords.length >= 0.5
    );
  };

  const handleNextQuestion = () => {
    playSound("button-pressed.wav");

    if (defineState.currentQuestionIndex + 1 >= defineQuestions.length) {
      // Update total quizzes taken when completing
      setPracticePerformance((prevData) => ({
        ...prevData,
        totalQuizzesTaken: prevData.totalQuizzesTaken + 1,
        lastUpdated: Date.now(),
      }));
    }

    dispatch({ type: "NEXT_QUESTION" });
  };

  const handlePreviousQuestion = () => {
    playSound("button-pressed.wav");
    dispatch({ type: "PREVIOUS_QUESTION" });
  };

  const handleFinishPractice = () => {
    playSound("button-pressed.wav");

    // Update total quizzes taken even if not completed
    setPracticePerformance((prevData) => ({
      ...prevData,
      totalQuizzesTaken: prevData.totalQuizzesTaken + 1,
      lastUpdated: Date.now(),
    }));

    dispatch({ type: "FINISH_DEFINE" });
  };

  const canGoNext =
    defineState.answeredQuestions[defineState.currentQuestionIndex];
  const canGoPrevious = defineState.currentQuestionIndex > 0;

  const handleRestartDefine = () => {
    playSound("button-pressed.wav");
    dispatch({
      type: "RESTART_DEFINE",
      payload: { questionCount: defineQuestions.length },
    });
  };

  // If no learned words, show empty state
  if (learnedWords.length === 0) {
    return (
      <div className="w-full flex flex-col min-h-[80vh] items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">🤔</div>
          <h2 className="text-2xl font-bold text-gray-900">
            No Words to Define
          </h2>
          <p className="text-gray-600">
            You need to learn some vocabulary words first before practicing
            definitions.
          </p>
          <Button
            variant="default"
            className="mt-4 px-6 py-3 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600"
            onClick={() => (window.location.href = "/dashboard/vocabs")}
          >
            Browse Vocabularies
          </Button>
        </div>
      </div>
    );
  }

  // Define complete screen
  if (defineState.isDefineComplete) {
    const percentage = Math.round(
      (defineState.score / defineQuestions.length) * 100
    );

    return (
      <div className="w-full flex flex-col min-h-[80vh] items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 max-w-md"
        >
          <div className="text-8xl">
            {percentage >= 80 ? "🎉" : percentage >= 60 ? "👏" : "💪"}
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Define Practice Complete!
            </h2>
            <div className="text-6xl font-bold text-blue-600">
              {defineState.score}/{defineQuestions.length}
            </div>
            <p className="text-xl text-gray-600">You scored {percentage}%</p>
            <p className="text-gray-500">
              {percentage >= 80
                ? "Excellent definitions! You really understand these words!"
                : percentage >= 60
                ? "Good job! Keep practicing to improve your definitions!"
                : "Keep studying! Practice writing definitions to master these words!"}
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            {onBackToPracticeSelection ? (
              <Button
                variant="outline"
                className="px-6 py-3 rounded-2xl border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  playSound("button-pressed.wav");
                  onBackToPracticeSelection();
                }}
              >
                <ArrowLeft className="size-4 mr-2" />
                Choose Practice Type
              </Button>
            ) : (
              <Link href={"/dashboard/vocabs/practice"}>
                <Button
                  variant="outline"
                  className="px-6 py-3 rounded-2xl border-gray-300 hover:bg-gray-50"
                >
                  <ArrowLeft className="size-4 mr-2" />
                  Choose Practice Type
                </Button>
              </Link>
            )}
            <Button
              variant="default"
              className="px-6 py-3 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600"
              onClick={handleRestartDefine}
            >
              <RotateCcw className="size-4 mr-2" />
              Try Again
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-gray-700">
              Question {defineState.currentQuestionIndex + 1} of{" "}
              {defineQuestions.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              Score: {defineState.score}/
              {defineState.answeredQuestions.filter(Boolean).length}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFinishPractice}
            className="px-4 py-2 text-sm rounded-xl border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
          >
            <X className="size-4 mr-2" />
            Finish Practice
          </Button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${
                ((defineState.currentQuestionIndex + 1) /
                  defineQuestions.length) *
                100
              }%`,
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={defineState.currentQuestionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Question */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Define "
              <span className="text-blue-600">{currentQuestion.word.word}</span>
              "
            </h2>
            <div className="text-gray-600">
              <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm">
                {currentQuestion.word.part_of_speech}
              </span>
            </div>
            <p className="text-gray-600 text-lg">
              Write your own definition for this word:
            </p>
          </div>

          {/* Definition Input */}
          <div className="space-y-4">
            <textarea
              value={defineState.userDefinition}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleDefinitionChange(e.target.value)
              }
              placeholder="Enter your definition here..."
              className={`w-full min-h-[120px] p-6 text-lg rounded-2xl border-2 resize-none ${
                defineState.showResult
                  ? "border-gray-300 bg-gray-50"
                  : "border-gray-200 hover:border-blue-300 focus:border-blue-500"
              }`}
              disabled={defineState.showResult}
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center">
            {/* Previous button */}
            <Button
              variant="outline"
              className="px-6 py-3 text-lg rounded-2xl font-bold shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.25)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.3)] hover:bg-gray-50 active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.2)] active:translate-y-0.5 transform transition-all duration-150"
              onClick={handlePreviousQuestion}
              disabled={!canGoPrevious}
            >
              ← Previous
            </Button>

            {/* Submit/Next button */}
            <div className="flex gap-4">
              {!defineState.showResult ? (
                <Button
                  variant="default"
                  className="px-8 py-4 text-lg rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmitDefinition}
                  disabled={
                    !defineState.userDefinition.trim() ||
                    defineState.isSubmitting
                  }
                >
                  {defineState.isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analyzing...
                    </div>
                  ) : (
                    "Submit Definition"
                  )}
                </Button>
              ) : (
                defineState.currentQuestionIndex + 1 >=
                  defineQuestions.length && (
                  <Button
                    variant="default"
                    className="group px-8 py-4 text-lg rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600"
                    onClick={handleNextQuestion}
                  >
                    Finish Practice
                    <ArrowRight className="size-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                )
              )}
            </div>

            {/* Next button (disabled until answered) */}
            <Button
              variant="outline"
              className="px-6 py-3 text-lg rounded-2xl font-bold shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.25)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.3)] hover:bg-gray-50 active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.2)] active:translate-y-0.5 transform transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNextQuestion}
              disabled={
                !canGoNext ||
                defineState.currentQuestionIndex + 1 >= defineQuestions.length
              }
            >
              Next →
            </Button>
          </div>

          {/* Show result and correct definition after submission */}
          {defineState.showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-6"
            >
              {/* Result indicator */}
              <div
                className={`p-6 rounded-2xl border-2 ${
                  defineState.aiResults[defineState.currentQuestionIndex]
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {defineState.aiResults[defineState.currentQuestionIndex] ? (
                    <CheckCircle className="size-6 text-green-600" />
                  ) : (
                    <XCircle className="size-6 text-red-600" />
                  )}
                  <h4
                    className={`font-semibold ${
                      defineState.aiResults[defineState.currentQuestionIndex]
                        ? "text-green-900"
                        : "text-red-900"
                    }`}
                  >
                    {defineState.aiResults[defineState.currentQuestionIndex]
                      ? "Good definition!"
                      : "Not quite right"}
                  </h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">
                      Your definition:
                    </h5>
                    <p className="text-gray-800 italic">
                      "
                      {
                        defineState.userAnswers[
                          defineState.currentQuestionIndex
                        ]
                      }
                      "
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Response */}
              {defineState.aiResponse && (
                <div className="p-6 bg-purple-50 rounded-2xl border border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <BotIcon className="text-purple-600 font-bold text-sm"></BotIcon>
                    </div>
                    <h4 className="font-semibold text-purple-900">
                      AI Analysis
                    </h4>
                  </div>
                  <p className="text-purple-800 leading-relaxed">
                    {defineState.aiResponse}
                  </p>
                </div>
              )}

              {/* Word Information */}
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-900">
                    Word: {currentQuestion.word.word}
                  </h4>
                  <p className="text-blue-800">
                    <strong>Correct Definition:</strong>{" "}
                    {currentQuestion.word.definition}
                  </p>
                  <p className="text-blue-700">
                    <strong>Example:</strong> {currentQuestion.word.example}
                  </p>
                </div>
              </div>

              {/* User's Previous Sentences */}
              {(() => {
                const currentWordSentences =
                  vocabsData.userSentences[currentQuestion.word.word] || [];

                if (currentWordSentences.length > 0) {
                  return (
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                      <button
                        onClick={() => {
                          playSound("tap-radio.wav");
                          dispatch({
                            type: "TOGGLE_USER_SENTENCES",
                            payload: defineState.currentQuestionIndex,
                          });
                        }}
                        className="flex items-center justify-between w-full p-3 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors duration-200 mb-3"
                      >
                        <span className="text-sm font-medium text-blue-800">
                          Your sentences with "{currentQuestion.word.word}" (
                          {currentWordSentences.length})
                        </span>
                        {defineState.showUserSentences[
                          defineState.currentQuestionIndex
                        ] ? (
                          <ChevronUp className="h-4 w-4 text-blue-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-blue-600" />
                        )}
                      </button>

                      {defineState.showUserSentences[
                        defineState.currentQuestionIndex
                      ] && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-blue-800 mb-3">
                            Your practice sentences:
                          </h4>
                          {currentWordSentences.map((sentence, index) => (
                            <div
                              key={index}
                              className="p-3 bg-blue-100 border border-blue-100 rounded text-sm"
                            >
                              <span className="text-blue-800 italic">
                                "{sentence}"
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
