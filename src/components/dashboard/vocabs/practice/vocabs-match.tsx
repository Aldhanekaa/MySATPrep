"use client";

import React, { useReducer, useEffect, useMemo, useCallback } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  X,
  GripVertical,
  Target,
  Trophy,
  BookOpen,
} from "lucide-react";
import { playSound } from "@/lib/playSound";
import Link from "next/link";

interface MatchPair {
  word: VocabularyWord;
  definition: string;
  id: string;
}

interface DroppedPair {
  wordId: string;
  definitionId: string;
  isCorrect: boolean;
}

interface VocabsMatchPracticeProps {
  onBackToPracticeSelection?: () => void;
}

// Match state interface
interface MatchState {
  currentRoundIndex: number;
  draggedItem: { id: string; type: "word" | "definition" } | null;
  droppedPairs: DroppedPair[];
  score: number;
  completedRounds: boolean[];
  roundStartTime: number;
  isRoundComplete: boolean;
  isGameComplete: boolean;
  showResults: boolean;
  newlyLearnedWords: string[];
  shuffledWordsOrder: MatchPair[];
  shuffledDefinitionsOrder: MatchPair[];
}

// Match actions
type MatchAction =
  | { type: "INITIALIZE_GAME"; payload: { roundCount: number } }
  | { type: "START_DRAG"; payload: { id: string; type: "word" | "definition" } }
  | { type: "END_DRAG" }
  | {
      type: "DROP_PAIR";
      payload: { wordId: string; definitionId: string; isCorrect: boolean };
    }
  | { type: "COMPLETE_ROUND" }
  | { type: "NEXT_ROUND" }
  | { type: "PREVIOUS_ROUND" }
  | { type: "SHOW_RESULTS" }
  | { type: "RESTART_GAME"; payload: { roundCount: number } }
  | { type: "ADD_NEWLY_LEARNED"; payload: string }
  | { type: "SET_ROUND_START_TIME"; payload: number }
  | {
      type: "SET_SHUFFLED_ORDER";
      payload: { words: MatchPair[]; definitions: MatchPair[] };
    };

// Match reducer
function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case "INITIALIZE_GAME":
      return {
        ...state,
        completedRounds: new Array(action.payload.roundCount).fill(false),
        roundStartTime: Date.now(),
      };

    case "START_DRAG":
      return {
        ...state,
        draggedItem: { id: action.payload.id, type: action.payload.type },
      };

    case "END_DRAG":
      return {
        ...state,
        draggedItem: null,
      };

    case "DROP_PAIR":
      const newDroppedPairs = [
        ...state.droppedPairs,
        {
          wordId: action.payload.wordId,
          definitionId: action.payload.definitionId,
          isCorrect: action.payload.isCorrect,
        },
      ];

      return {
        ...state,
        droppedPairs: newDroppedPairs,
        score: action.payload.isCorrect ? state.score + 1 : state.score,
        draggedItem: null,
      };

    case "COMPLETE_ROUND":
      const newCompletedRounds = [...state.completedRounds];
      newCompletedRounds[state.currentRoundIndex] = true;

      return {
        ...state,
        completedRounds: newCompletedRounds,
        isRoundComplete: true,
      };

    case "NEXT_ROUND":
      if (state.currentRoundIndex + 1 >= state.completedRounds.length) {
        return {
          ...state,
          isGameComplete: true,
        };
      }
      return {
        ...state,
        currentRoundIndex: state.currentRoundIndex + 1,
        droppedPairs: [],
        isRoundComplete: false,
        roundStartTime: Date.now(),
        shuffledWordsOrder: [],
        shuffledDefinitionsOrder: [],
      };

    case "PREVIOUS_ROUND":
      if (state.currentRoundIndex > 0) {
        return {
          ...state,
          currentRoundIndex: state.currentRoundIndex - 1,
          droppedPairs: [],
          isRoundComplete: false,
          roundStartTime: Date.now(),
          shuffledWordsOrder: [],
          shuffledDefinitionsOrder: [],
        };
      }
      return state;

    case "SHOW_RESULTS":
      return {
        ...state,
        showResults: true,
      };

    case "RESTART_GAME":
      return {
        currentRoundIndex: 0,
        draggedItem: null,
        droppedPairs: [],
        score: 0,
        completedRounds: new Array(action.payload.roundCount).fill(false),
        roundStartTime: Date.now(),
        isRoundComplete: false,
        isGameComplete: false,
        showResults: false,
        newlyLearnedWords: [],
        shuffledWordsOrder: [],
        shuffledDefinitionsOrder: [],
      };

    case "ADD_NEWLY_LEARNED":
      return {
        ...state,
        newlyLearnedWords: [...state.newlyLearnedWords, action.payload],
      };

    case "SET_ROUND_START_TIME":
      return {
        ...state,
        roundStartTime: action.payload,
      };

    case "SET_SHUFFLED_ORDER":
      return {
        ...state,
        shuffledWordsOrder: action.payload.words,
        shuffledDefinitionsOrder: action.payload.definitions,
      };

    default:
      return state;
  }
}

// Initial match state
const initialMatchState: MatchState = {
  currentRoundIndex: 0,
  draggedItem: null,
  droppedPairs: [],
  score: 0,
  completedRounds: [],
  roundStartTime: Date.now(),
  isRoundComplete: false,
  isGameComplete: false,
  showResults: false,
  newlyLearnedWords: [],
  shuffledWordsOrder: [],
  shuffledDefinitionsOrder: [],
};

const WORDS_PER_ROUND = 4;

export default function VocabsMatchPractice({
  onBackToPracticeSelection,
}: VocabsMatchPracticeProps = {}) {
  // Match state managed by reducer
  const [matchState, dispatch] = useReducer(matchReducer, initialMatchState);

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

  // Generate match rounds (groups of words to match)
  const matchRounds = useMemo(() => {
    // Mix learned and unlearned words
    const learnedWords = vocabs_database.filter((word) =>
      vocabsData.learntVocabs.includes(word.word)
    );

    const unlearnedWords = vocabs_database.filter(
      (word) => !vocabsData.learntVocabs.includes(word.word)
    );

    // Create a mix: 60% learned words, 40% unlearned words for discovery
    const totalWords = Math.min(vocabs_database.length, 40); // Limit to 40 words total
    const unlearnedCount = Math.min(
      Math.floor(totalWords * 0.4),
      unlearnedWords.length
    );
    const learnedCount = Math.min(
      totalWords - unlearnedCount,
      learnedWords.length
    );

    const selectedUnlearnedWords = unlearnedWords
      .sort(() => Math.random() - 0.5)
      .slice(0, unlearnedCount);

    const selectedLearnedWords = learnedWords
      .sort(() => Math.random() - 0.5)
      .slice(0, learnedCount);

    const allSelectedWords = [
      ...selectedLearnedWords,
      ...selectedUnlearnedWords,
    ].sort(() => Math.random() - 0.5);

    // Create rounds of WORDS_PER_ROUND words each
    const rounds: MatchPair[][] = [];
    for (let i = 0; i < allSelectedWords.length; i += WORDS_PER_ROUND) {
      const roundWords = allSelectedWords.slice(i, i + WORDS_PER_ROUND);
      const roundPairs: MatchPair[] = roundWords.map((word, index) => ({
        word,
        definition: word.definition,
        id: `round-${rounds.length}-pair-${index}`,
      }));
      rounds.push(roundPairs);
    }

    return rounds;
  }, [vocabsData.learntVocabs]);

  // Initialize game when rounds change
  useEffect(() => {
    dispatch({
      type: "INITIALIZE_GAME",
      payload: { roundCount: matchRounds.length },
    });
  }, [matchRounds.length]);

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
        if (!wordPerf.strugglingAreas.includes("vocabs-match")) {
          wordPerf.strugglingAreas.push("vocabs-match");
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

      return updatedData;
    });
  };

  // Helper function to add word to learned vocabulary
  const addToLearnedVocabs = useCallback(
    (wordToAdd: string) => {
      setVocabsData((prevData) => {
        if (!prevData.learntVocabs.includes(wordToAdd)) {
          return {
            ...prevData,
            learntVocabs: [...prevData.learntVocabs, wordToAdd],
          };
        }
        return prevData;
      });
    },
    [setVocabsData]
  );

  const currentRound = matchRounds[matchState.currentRoundIndex];

  // Generate stable shuffled arrays only when round changes or when arrays are empty
  useEffect(() => {
    if (
      currentRound &&
      (matchState.shuffledWordsOrder.length === 0 ||
        matchState.shuffledDefinitionsOrder.length === 0)
    ) {
      const shuffledWords = [...currentRound].sort(() => Math.random() - 0.5);
      const shuffledDefinitions = [...currentRound].sort(
        () => Math.random() - 0.5
      );

      dispatch({
        type: "SET_SHUFFLED_ORDER",
        payload: {
          words: shuffledWords,
          definitions: shuffledDefinitions,
        },
      });
    }
  }, [
    currentRound,
    matchState.shuffledWordsOrder.length,
    matchState.shuffledDefinitionsOrder.length,
  ]);

  // Use the stable shuffled arrays from state
  const shuffledWords = matchState.shuffledWordsOrder;
  const shuffledDefinitions = matchState.shuffledDefinitionsOrder;

  // Handle drag start
  const handleDragStart = (
    e: React.DragEvent,
    id: string,
    type: "word" | "definition"
  ) => {
    playSound("tap-radio.wav");
    dispatch({ type: "START_DRAG", payload: { id, type } });
    e.dataTransfer.setData("text/plain", JSON.stringify({ id, type }));
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = (
    e: React.DragEvent,
    targetId: string,
    targetType: "word" | "definition"
  ) => {
    e.preventDefault();

    try {
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
      const { id: draggedId, type: draggedType } = dragData;

      // Only allow matching word to definition or definition to word
      if (draggedType === targetType) {
        dispatch({ type: "END_DRAG" });
        return;
      }

      const wordId = draggedType === "word" ? draggedId : targetId;
      const definitionId = draggedType === "definition" ? draggedId : targetId;

      // Find the corresponding pair by matching the IDs directly
      const wordPair = currentRound.find(
        (pair) => wordId === `word-${pair.id}`
      );
      const definitionPair = currentRound.find(
        (pair) => definitionId === `definition-${pair.id}`
      );

      const isCorrect = !!(
        wordPair &&
        definitionPair &&
        wordPair.id === definitionPair.id
      );

      if (isCorrect) {
        playSound("correct-answer.wav");

        // If this word wasn't learned before, add it to learned vocabulary
        const wordText = wordPair.word.word;
        if (!vocabsData.learntVocabs.includes(wordText)) {
          addToLearnedVocabs(wordText);
          dispatch({ type: "ADD_NEWLY_LEARNED", payload: wordText });
        }

        // Update performance
        const timeSpent = Math.round(
          (Date.now() - matchState.roundStartTime) / 1000
        );
        updateWordPerformance(wordText, true, timeSpent);
      } else {
        playSound("incorrect-answer.wav");

        // Update performance for wrong matches (if we can identify the word)
        if (wordPair) {
          const timeSpent = Math.round(
            (Date.now() - matchState.roundStartTime) / 1000
          );
          updateWordPerformance(wordPair.word.word, false, timeSpent);
        }
      }

      dispatch({
        type: "DROP_PAIR",
        payload: { wordId, definitionId, isCorrect },
      });

      // Check if round is complete
      const newPairCount = matchState.droppedPairs.length + 1;
      if (newPairCount === currentRound.length) {
        setTimeout(() => {
          dispatch({ type: "COMPLETE_ROUND" });
        }, 1000);
      }
    } catch (error) {
      console.error("Error handling drop:", error);
      dispatch({ type: "END_DRAG" });
    }
  };

  const handleNextRound = () => {
    playSound("button-pressed.wav");

    if (matchState.currentRoundIndex + 1 >= matchRounds.length) {
      // Update total quizzes taken when completing the game
      setPracticePerformance((prevData) => ({
        ...prevData,
        totalQuizzesTaken: prevData.totalQuizzesTaken + 1,
        lastUpdated: Date.now(),
      }));
    }

    dispatch({ type: "NEXT_ROUND" });
  };

  const handlePreviousRound = () => {
    playSound("button-pressed.wav");
    dispatch({ type: "PREVIOUS_ROUND" });
  };

  const handleRestartGame = () => {
    playSound("button-pressed.wav");
    dispatch({
      type: "RESTART_GAME",
      payload: { roundCount: matchRounds.length },
    });
  };

  const handleFinishPractice = () => {
    playSound("button-pressed.wav");

    // Update total quizzes taken
    setPracticePerformance((prevData) => ({
      ...prevData,
      totalQuizzesTaken: prevData.totalQuizzesTaken + 1,
      lastUpdated: Date.now(),
    }));

    dispatch({ type: "SHOW_RESULTS" });
  };

  // Check if item is already matched
  const isItemMatched = (id: string, type: "word" | "definition") => {
    return matchState.droppedPairs.some(
      (pair) =>
        (type === "word" && pair.wordId === id) ||
        (type === "definition" && pair.definitionId === id)
    );
  };

  // Get match result for a pair
  const getMatchResult = (id: string, type: "word" | "definition") => {
    const matchResult = matchState.droppedPairs.find(
      (pair) =>
        (type === "word" && pair.wordId === id) ||
        (type === "definition" && pair.definitionId === id)
    );
    return matchResult;
  };

  // If no words available, show empty state
  if (matchRounds.length === 0) {
    return (
      <div className="w-full flex flex-col min-h-[80vh] items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">🎯</div>
          <h2 className="text-2xl font-bold text-gray-900">
            No Words Available
          </h2>
          <p className="text-gray-600">
            There aren't enough vocabulary words available for matching
            practice.
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

  // Game complete screen
  if (matchState.isGameComplete || matchState.showResults) {
    const totalPairs = matchRounds.reduce(
      (sum, round) => sum + round.length,
      0
    );
    const percentage = Math.round((matchState.score / totalPairs) * 100);

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
              Matching Complete!
            </h2>
            <div className="text-6xl font-bold text-blue-600">
              {matchState.score}/{totalPairs}
            </div>
            <p className="text-xl text-gray-600">You scored {percentage}%</p>

            {matchState.newlyLearnedWords.length > 0 && (
              <div className="p-4 bg-green-50 rounded-2xl border border-green-200 mt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BookOpen className="size-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">
                    New Words Learned!
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {matchState.newlyLearnedWords.map((word, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-gray-500">
              {percentage >= 80
                ? "Excellent matching skills! You've mastered these word-definition pairs!"
                : percentage >= 60
                ? "Good job! Keep practicing to improve your vocabulary recognition!"
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
              onClick={handleRestartGame}
            >
              <RotateCcw className="size-4 mr-2" />
              Play Again
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (
    !currentRound ||
    shuffledWords.length === 0 ||
    shuffledDefinitions.length === 0
  ) {
    return (
      <div className="w-full flex flex-col min-h-[80vh] items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-gray-700">
              Round {matchState.currentRoundIndex + 1} of {matchRounds.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              Score: {matchState.score}
            </span>
            {matchState.newlyLearnedWords.length > 0 && (
              <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                <BookOpen className="size-4" />+
                {matchState.newlyLearnedWords.length} learned
              </span>
            )}
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
                ((matchState.currentRoundIndex + 1) / matchRounds.length) * 100
              }%`,
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={matchState.currentRoundIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Instructions */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <Target className="size-8 text-blue-600" />
              Match Words to Definitions
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Drag words to their matching definitions. Match all pairs
              correctly to complete the round!
            </p>
          </div>

          {/* Matching Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Words Column */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 text-center mb-6">
                📚 Vocabulary Words
              </h3>
              <div className="space-y-3">
                {shuffledWords.map((pair, index) => {
                  const wordId = `word-${pair.id}`;
                  const isMatched = isItemMatched(wordId, "word");
                  const matchResult = getMatchResult(wordId, "word");
                  const isBeingDragged = matchState.draggedItem?.id === wordId;
                  const isNewlyLearned = matchState.newlyLearnedWords.includes(
                    pair.word.word
                  );

                  return (
                    <motion.div
                      key={wordId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div
                        draggable={!isMatched}
                        onDragStart={(e) => handleDragStart(e, wordId, "word")}
                        className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                          isMatched
                            ? matchResult?.isCorrect
                              ? "border-green-500 bg-green-50 cursor-default"
                              : "border-red-500 bg-red-50 cursor-default"
                            : isBeingDragged
                            ? "border-blue-500 bg-blue-50 scale-105 shadow-lg cursor-move"
                            : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md cursor-move"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {!isMatched && (
                            <GripVertical className="size-5 text-gray-400" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-semibold text-gray-900">
                                {pair.word.word}
                              </p>
                              {!vocabsData.learntVocabs.includes(
                                pair.word.word
                              ) && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                                  New
                                </span>
                              )}
                              {isNewlyLearned && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                  ✨ Learned!
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {pair.word.part_of_speech}
                            </p>
                          </div>
                          {isMatched && (
                            <div className="ml-2">
                              {matchResult?.isCorrect ? (
                                <CheckCircle className="size-6 text-green-600" />
                              ) : (
                                <XCircle className="size-6 text-red-600" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Definitions Column */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 text-center mb-6">
                📖 Definitions
              </h3>
              <div className="space-y-3">
                {shuffledDefinitions.map((pair, index) => {
                  const definitionId = `definition-${pair.id}`;
                  const isMatched = isItemMatched(definitionId, "definition");
                  const matchResult = getMatchResult(
                    definitionId,
                    "definition"
                  );
                  const isBeingDragged =
                    matchState.draggedItem?.id === definitionId;

                  return (
                    <motion.div
                      key={definitionId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div
                        draggable={!isMatched}
                        onDragStart={(e) =>
                          handleDragStart(e, definitionId, "definition")
                        }
                        onDragOver={handleDragOver}
                        onDrop={(e) =>
                          handleDrop(e, definitionId, "definition")
                        }
                        className={`p-4 rounded-2xl border-2 min-h-[80px] transition-all duration-200 ${
                          isMatched
                            ? matchResult?.isCorrect
                              ? "border-green-500 bg-green-50"
                              : "border-red-500 bg-red-50"
                            : isBeingDragged
                            ? "border-blue-500 bg-blue-50 scale-105 shadow-lg cursor-move"
                            : matchState.draggedItem &&
                              matchState.draggedItem.type === "word"
                            ? "border-dashed border-blue-400 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md cursor-move"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {!isMatched && (
                            <GripVertical className="size-5 text-gray-400 mt-1" />
                          )}
                          <div className="flex-1">
                            <p className="text-gray-900 leading-relaxed">
                              {pair.definition}
                            </p>
                          </div>
                          {isMatched && (
                            <div className="ml-2">
                              {matchResult?.isCorrect ? (
                                <CheckCircle className="size-6 text-green-600" />
                              ) : (
                                <XCircle className="size-6 text-red-600" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation buttons */}
          {matchState.isRoundComplete && (
            <React.Fragment>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center pt-8"
              >
                <Button
                  variant="outline"
                  className="px-6 py-3 text-lg rounded-2xl font-bold"
                  onClick={handlePreviousRound}
                  disabled={matchState.currentRoundIndex === 0}
                >
                  ← Previous Round
                </Button>

                <div className="text-center">
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Round {matchState.currentRoundIndex + 1} Complete!
                  </p>
                  <p className="text-sm text-gray-500">
                    {matchState.droppedPairs.filter((p) => p.isCorrect).length}{" "}
                    out of {currentRound.length} correct
                  </p>
                </div>

                <Button
                  variant="default"
                  className="group px-8 py-4 text-lg rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600"
                  onClick={handleNextRound}
                >
                  {matchState.currentRoundIndex + 1 >= matchRounds.length ? (
                    <>
                      Finish Game
                      <Trophy className="size-5 ml-2 transition-transform group-hover:scale-110" />
                    </>
                  ) : (
                    <>
                      Next Round
                      <ArrowRight className="size-5 ml-2 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Show incorrect matches with correct definitions */}
              {(() => {
                const incorrectPairs = matchState.droppedPairs.filter(
                  (p) => !p.isCorrect
                );
                if (incorrectPairs.length > 0) {
                  return (
                    <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h3 className="text-sm font-semibold text-orange-800 mb-3">
                        Let's learn from mistakes:
                      </h3>
                      <div className="space-y-2">
                        {incorrectPairs.map((pair) => {
                          // Find the word that was incorrectly matched
                          // pair.wordId is something like "word-round-0-pair-1", we need to extract the pair ID
                          const wordIdParts = pair.wordId.split("-");
                          const pairId = wordIdParts.slice(-1)[0]; // Get the last part (pair index)
                          const roundPair = currentRound.find((w) =>
                            w.id.endsWith(`-${pairId}`)
                          );
                          if (!roundPair) return null;

                          return (
                            <div
                              key={pair.wordId}
                              className="text-left bg-white p-3 rounded border"
                            >
                              <div className="text-sm">
                                <span className="font-medium text-gray-800">
                                  {roundPair.word.word}
                                </span>
                                <span className="text-gray-600 mx-2">
                                  should match:
                                </span>
                                <span className="text-orange-700 font-medium">
                                  {roundPair.definition}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </React.Fragment>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
