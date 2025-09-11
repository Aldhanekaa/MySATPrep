"use client";

import React, { useReducer, useEffect, useMemo } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import {
  vocabs_database,
  VocabsData,
  VocabularyWord,
  PracticePerformanceData,
  QuizAttempt,
  WordPerformance,
} from "@/types/vocabulary";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
} from "lucide-react";
import { playSound } from "@/lib/playSound";
import Link from "next/link";

interface FillInTheBlankQuestion {
  word: VocabularyWord;
  options: string[];
  correctAnswer: string;
  exampleWithBlank: string;
  originalExample: string;
  isUserSentence: boolean;
}

interface VocabsFillinTheBlankPracticeProps {
  onBackToPracticeSelection?: () => void;
}

// Quiz state interface
interface QuizState {
  currentQuestionIndex: number;
  selectedAnswer: string;
  showResult: boolean;
  score: number;
  answeredQuestions: boolean[];
  userAnswers: string[];
  isQuizComplete: boolean;
  showUserSentences: { [key: number]: boolean };
  questionStartTime: number;
  restartKey: number; // Add this to force question regeneration on restart
}

// Quiz actions
type QuizAction =
  | { type: "INITIALIZE_QUIZ"; payload: { questionCount: number } }
  | { type: "SELECT_ANSWER"; payload: string }
  | { type: "SUBMIT_ANSWER"; payload: { isCorrect: boolean } }
  | { type: "NEXT_QUESTION" }
  | { type: "PREVIOUS_QUESTION" }
  | { type: "FINISH_QUIZ" }
  | { type: "RESTART_QUIZ"; payload: { questionCount: number } }
  | { type: "TOGGLE_USER_SENTENCES"; payload: number }
  | { type: "SET_QUESTION_START_TIME"; payload: number }
  | {
      type: "LOAD_QUESTION_STATE";
      payload: { selectedAnswer: string; showResult: boolean };
    };

// Quiz reducer
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "INITIALIZE_QUIZ":
      return {
        ...state,
        answeredQuestions: new Array(action.payload.questionCount).fill(false),
        userAnswers: new Array(action.payload.questionCount).fill(""),
        questionStartTime: Date.now(),
      };

    case "SELECT_ANSWER":
      return {
        ...state,
        selectedAnswer: action.payload,
      };

    case "SUBMIT_ANSWER":
      const newAnsweredQuestions = [...state.answeredQuestions];
      const newUserAnswers = [...state.userAnswers];

      newAnsweredQuestions[state.currentQuestionIndex] = true;
      newUserAnswers[state.currentQuestionIndex] = state.selectedAnswer;

      return {
        ...state,
        showResult: true,
        score:
          !state.answeredQuestions[state.currentQuestionIndex] &&
          action.payload.isCorrect
            ? state.score + 1
            : state.score,
        answeredQuestions: newAnsweredQuestions,
        userAnswers: newUserAnswers,
      };

    case "NEXT_QUESTION":
      if (state.currentQuestionIndex + 1 >= state.answeredQuestions.length) {
        return {
          ...state,
          isQuizComplete: true,
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

    case "FINISH_QUIZ":
      return {
        ...state,
        isQuizComplete: true,
      };

    case "RESTART_QUIZ":
      return {
        currentQuestionIndex: 0,
        selectedAnswer: "",
        showResult: false,
        score: 0,
        answeredQuestions: new Array(action.payload.questionCount).fill(false),
        userAnswers: new Array(action.payload.questionCount).fill(""),
        isQuizComplete: false,
        showUserSentences: {},
        questionStartTime: Date.now(),
        restartKey: Date.now(), // Use timestamp to force question regeneration
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
        selectedAnswer: action.payload.selectedAnswer,
        showResult: action.payload.showResult,
      };

    default:
      return state;
  }
}

// Initial quiz state
const initialQuizState: QuizState = {
  currentQuestionIndex: 0,
  selectedAnswer: "",
  showResult: false,
  score: 0,
  answeredQuestions: [],
  userAnswers: [],
  isQuizComplete: false,
  showUserSentences: {},
  questionStartTime: Date.now(),
  restartKey: 0, // Initial restart key
};

export default function VocabsFillinTheBlankPractice({
  onBackToPracticeSelection,
}: VocabsFillinTheBlankPracticeProps = {}) {
  // Quiz state managed by reducer
  const [quizState, dispatch] = useReducer(quizReducer, initialQuizState);

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

  // Helper function to create example with blank
  const createExampleWithBlank = (example: string, word: string): string => {
    // Create a regex that matches the word with word boundaries and case insensitive
    const regex = new RegExp(
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi"
    );
    return example.replace(regex, "____");
  };

  // Generate quiz questions
  const quizQuestions = useMemo(() => {
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

    return prioritizedWords
      .filter((word) => {
        // Check if word has database example or user sentences
        // Words need at least one usable sentence source for fill-in-the-blank practice
        const hasExample =
          word.example &&
          word.example.length > 0 &&
          new RegExp(
            `\\b${word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "gi"
          ).test(word.example);

        const userSentences = vocabsData.userSentences[word.word] || [];
        const hasUserSentences =
          userSentences.length > 0 &&
          userSentences.some((sentence) =>
            new RegExp(
              `\\b${word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
              "gi"
            ).test(sentence)
          );

        // Include word if it has either a valid database example OR user sentences
        // This ensures words without user sentences can still appear using database examples
        return hasExample || hasUserSentences;
      })
      .map((word) => {
        // First, try to get wrong answers with the same part of speech
        const samePartOfSpeechWords = vocabs_database.filter(
          (w) =>
            w.word !== word.word && w.part_of_speech === word.part_of_speech
        );

        let wrongAnswers: string[] = [];

        if (samePartOfSpeechWords.length >= 3) {
          // If we have enough words with the same part of speech, use them
          wrongAnswers = samePartOfSpeechWords
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map((w) => w.word);
        } else {
          // If not enough words with same part of speech, use what we have and fill with others
          const samePoSAnswers = samePartOfSpeechWords.map((w) => w.word);

          const otherWords = vocabs_database
            .filter(
              (w) =>
                w.word !== word.word && w.part_of_speech !== word.part_of_speech
            )
            .sort(() => Math.random() - 0.5)
            .slice(0, 3 - samePoSAnswers.length)
            .map((w) => w.word);

          wrongAnswers = [...samePoSAnswers, ...otherWords];
        }

        // Create options array with correct answer
        const options = [word.word, ...wrongAnswers].sort(
          () => Math.random() - 0.5
        );

        // Determine which sentence to use (50% chance for user sentence vs database example)
        const userSentences = vocabsData.userSentences[word.word] || [];
        const hasValidUserSentences =
          userSentences.length > 0 &&
          userSentences.some((sentence) =>
            new RegExp(
              `\\b${word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
              "gi"
            ).test(sentence)
          );

        const hasValidExample =
          word.example &&
          word.example.length > 0 &&
          new RegExp(
            `\\b${word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "gi"
          ).test(word.example);

        let selectedSentence: string;
        let isUserSentence = false;

        // Priority: 50% chance to use user sentence if available, otherwise fallback to example
        if (hasValidUserSentences && hasValidExample) {
          // Both available: 50% chance for either
          isUserSentence = Math.random() < 0.5;
        } else if (hasValidUserSentences) {
          // Only user sentences available
          isUserSentence = true;
        } else if (hasValidExample) {
          // Only database example available
          isUserSentence = false;
        } else {
          // Fallback: use database example even if word might not be perfectly matched
          isUserSentence = false;
        }

        if (isUserSentence && hasValidUserSentences) {
          // Filter valid user sentences and pick one randomly
          const validUserSentences = userSentences.filter((sentence) =>
            new RegExp(
              `\\b${word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
              "gi"
            ).test(sentence)
          );
          const randomIndex = Math.floor(
            Math.random() * validUserSentences.length
          );
          selectedSentence = validUserSentences[randomIndex];
        } else {
          // Use database example (fallback)
          selectedSentence =
            word.example || `This is a sentence with the word ${word.word}.`;
        }

        const exampleWithBlank = createExampleWithBlank(
          selectedSentence,
          word.word
        );

        return {
          word,
          options,
          correctAnswer: word.word,
          exampleWithBlank,
          originalExample: selectedSentence,
          isUserSentence,
        };
      });
  }, [
    learnedWords,
    practicePerformance.wordPerformance,
    vocabsData.userSentences,
    quizState.restartKey,
  ]);

  // Initialize answered questions and user answers arrays
  useEffect(() => {
    const questionsLength = quizQuestions.length;
    dispatch({
      type: "INITIALIZE_QUIZ",
      payload: { questionCount: questionsLength },
    });
  }, [quizQuestions.length]);

  // Load the selected answer when navigating between questions
  useEffect(() => {
    if (quizState.userAnswers[quizState.currentQuestionIndex]) {
      dispatch({
        type: "LOAD_QUESTION_STATE",
        payload: {
          selectedAnswer: quizState.userAnswers[quizState.currentQuestionIndex],
          showResult:
            quizState.answeredQuestions[quizState.currentQuestionIndex],
        },
      });
    } else {
      dispatch({
        type: "LOAD_QUESTION_STATE",
        payload: {
          selectedAnswer: "",
          showResult: false,
        },
      });
    }
  }, [
    quizState.currentQuestionIndex,
    quizState.userAnswers,
    quizState.answeredQuestions,
  ]);

  // Reset question start time when navigating to a new question
  useEffect(() => {
    dispatch({ type: "SET_QUESTION_START_TIME", payload: Date.now() });
  }, [quizState.currentQuestionIndex]);

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
        if (!wordPerf.strugglingAreas.includes("fill-blank")) {
          wordPerf.strugglingAreas.push("fill-blank");
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
        questionType: "fill-blank",
        isCorrect,
        userAnswer: quizState.selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
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

  const currentQuestion = quizQuestions[quizState.currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    playSound("tap-radio.wav");
    dispatch({ type: "SELECT_ANSWER", payload: answer });
  };

  const handleSubmitAnswer = () => {
    if (!quizState.selectedAnswer) return;

    playSound("button-pressed.wav");
    const isCorrect =
      quizState.selectedAnswer === currentQuestion.correctAnswer;
    const timeSpent = Math.round(
      (Date.now() - quizState.questionStartTime) / 1000
    ); // Convert to seconds

    // Update quiz state
    dispatch({ type: "SUBMIT_ANSWER", payload: { isCorrect } });

    // Update practice performance data (only for new answers)
    if (!quizState.answeredQuestions[quizState.currentQuestionIndex]) {
      updateWordPerformance(currentQuestion.word.word, isCorrect, timeSpent);
    }

    if (isCorrect) {
      playSound("correct-answer.wav");
    } else {
      playSound("incorrect-answer.wav");
    }
  };

  const handleNextQuestion = () => {
    playSound("button-pressed.wav");

    if (quizState.currentQuestionIndex + 1 >= quizQuestions.length) {
      // Update total quizzes taken when completing a quiz
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

    dispatch({ type: "FINISH_QUIZ" });
  };

  const canGoNext = quizState.answeredQuestions[quizState.currentQuestionIndex];
  const canGoPrevious = quizState.currentQuestionIndex > 0;

  const handleRestartQuiz = () => {
    playSound("button-pressed.wav");
    dispatch({
      type: "RESTART_QUIZ",
      payload: { questionCount: quizQuestions.length },
    });
  };

  // If no learned words, show empty state
  if (learnedWords.length === 0) {
    return (
      <div className="w-full flex flex-col min-h-[80vh] items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">🤔</div>
          <h2 className="text-2xl font-bold text-gray-900">
            No Words to Practice
          </h2>
          <p className="text-gray-600">
            You need to learn some vocabulary words first before taking the
            fill-in-the-blank practice.
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

  // If no valid questions (words without examples), show different empty state
  if (quizQuestions.length === 0) {
    return (
      <div className="w-full flex flex-col min-h-[80vh] items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">📝</div>
          <h2 className="text-2xl font-bold text-gray-900">
            No Questions Available
          </h2>
          <p className="text-gray-600">
            None of your learned words have example sentences available for
            fill-in-the-blank practice.
          </p>
          <Button
            variant="default"
            className="mt-4 px-6 py-3 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600"
            onClick={() =>
              (window.location.href = "/dashboard/vocabs/practice")
            }
          >
            Try Other Practice Types
          </Button>
        </div>
      </div>
    );
  }

  // Quiz complete screen
  if (quizState.isQuizComplete) {
    const percentage = Math.round(
      (quizState.score / quizQuestions.length) * 100
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
              Practice Complete!
            </h2>
            <div className="text-6xl font-bold text-blue-600">
              {quizState.score}/{quizQuestions.length}
            </div>
            <p className="text-xl text-gray-600">You scored {percentage}%</p>
            <p className="text-gray-500">
              {percentage >= 80
                ? "Excellent work! You really understand these words in context!"
                : percentage >= 60
                ? "Good job! Keep practicing to improve even more!"
                : "Keep studying! Practice makes perfect!"}
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
              onClick={handleRestartQuiz}
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
              Question {quizState.currentQuestionIndex + 1} of{" "}
              {quizQuestions.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              Score: {quizState.score}/
              {quizState.answeredQuestions.filter(Boolean).length}
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
                ((quizState.currentQuestionIndex + 1) / quizQuestions.length) *
                100
              }%`,
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={quizState.currentQuestionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Question */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Fill in the blank:
            </h2>
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200 max-w-3xl mx-auto">
              <p className="text-xl text-blue-900 leading-relaxed">
                "{currentQuestion.exampleWithBlank}"
              </p>
              {currentQuestion.isUserSentence && (
                <div className="mt-3 flex justify-center">
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    📝 Your sentence
                  </span>
                </div>
              )}
            </div>
            <div className="text-gray-600">
              <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm">
                {currentQuestion.word.part_of_speech}
              </span>
            </div>
          </div>

          {/* Answer options */}
          <div className="space-y-4">
            <RadioGroup
              value={quizState.selectedAnswer}
              onValueChange={handleAnswerSelect}
              className="space-y-3"
              disabled={quizState.showResult}
            >
              {currentQuestion.options.map((option, index) => {
                const isSelected = quizState.selectedAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                const isWrong =
                  quizState.showResult && isSelected && !isCorrect;
                const shouldHighlight = quizState.showResult && isCorrect;

                return (
                  <label
                    key={index}
                    className={`block p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                      quizState.showResult
                        ? shouldHighlight
                          ? "border-green-500 bg-green-50"
                          : isWrong
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 bg-gray-50"
                        : isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <RadioGroupItem
                        value={option}
                        className="mt-1"
                        disabled={quizState.showResult}
                      />
                      <div className="flex-1">
                        <p className="text-gray-900 leading-relaxed font-semibold text-lg">
                          {option}
                        </p>
                        {quizState.showResult &&
                          (() => {
                            const wordDefinition = vocabs_database.find(
                              (word) => word.word === option
                            )?.definition;

                            return wordDefinition ? (
                              <p className="text-sm text-gray-600 mt-2 italic">
                                "{wordDefinition}"
                              </p>
                            ) : null;
                          })()}
                      </div>
                      {quizState.showResult && (
                        <div className="ml-2">
                          {shouldHighlight && (
                            <CheckCircle className="size-6 text-green-600" />
                          )}
                          {isWrong && (
                            <XCircle className="size-6 text-red-600" />
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
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
              {!quizState.showResult ? (
                <Button
                  variant="default"
                  className="px-8 py-4 text-lg rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600"
                  onClick={handleSubmitAnswer}
                  disabled={!quizState.selectedAnswer}
                >
                  Submit Answer
                </Button>
              ) : (
                quizState.currentQuestionIndex + 1 >= quizQuestions.length && (
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
                quizState.currentQuestionIndex + 1 >= quizQuestions.length
              }
            >
              Next →
            </Button>
          </div>

          {/* Show correct answer and example after submission */}
          {quizState.showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-6"
            >
              {/* Word Information */}
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-900">
                    Correct Answer: {currentQuestion.word.word}
                  </h4>
                  <p className="text-blue-800">
                    <strong>Definition:</strong>{" "}
                    {currentQuestion.word.definition}
                  </p>
                  <p className="text-blue-700">
                    <strong>
                      {currentQuestion.isUserSentence
                        ? "Your Complete Sentence:"
                        : "Complete Sentence:"}
                    </strong>{" "}
                    {currentQuestion.originalExample}
                    {currentQuestion.isUserSentence && (
                      <span className="ml-2 inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        📝 Your sentence
                      </span>
                    )}
                  </p>
                  {currentQuestion.isUserSentence &&
                    currentQuestion.word.example && (
                      <p className="text-blue-600 text-sm">
                        <strong>Dictionary Example:</strong>{" "}
                        {currentQuestion.word.example}
                      </p>
                    )}
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
                            payload: quizState.currentQuestionIndex,
                          });
                        }}
                        className="flex items-center justify-between w-full p-3 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors duration-200 mb-3"
                      >
                        <span className="text-sm font-medium text-blue-800">
                          Your sentences with "{currentQuestion.word.word}" (
                          {currentWordSentences.length})
                        </span>
                        {quizState.showUserSentences[
                          quizState.currentQuestionIndex
                        ] ? (
                          <ChevronUp className="h-4 w-4 text-blue-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-blue-600" />
                        )}
                      </button>

                      {quizState.showUserSentences[
                        quizState.currentQuestionIndex
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
