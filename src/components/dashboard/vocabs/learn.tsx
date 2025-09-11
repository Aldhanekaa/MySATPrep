"use client";

import { cn } from "@/lib/utils";
import {
  vocabs_database,
  VocabsData,
  VocabularyWord,
} from "@/types/vocabulary";
import React, { useReducer, useEffect, useState } from "react";
import CardFlip from "@/components/ui/flip-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutGridIcon,
  RotateCcw,
  SearchIcon,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useSearchParams } from "next/navigation";

// Learn vocab reducer
type LearnState = {
  currentVocab: VocabularyWord | null;
  currentIndex: number;
  isLoading: boolean;
  isCardFlipped: boolean;
  difficultyFilter: "all" | "easy" | "medium" | "hard";
  learnedFilter: "all" | "learned" | "not-learned";
  filteredVocabs: VocabularyWord[];
};

type LearnAction =
  | {
      type: "SET_CURRENT_VOCAB";
      payload: { vocab: VocabularyWord; index: number };
    }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "NEXT_VOCAB" }
  | { type: "PREV_VOCAB" }
  | { type: "RESET_TO_FIRST" }
  | { type: "SET_CARD_FLIPPED"; payload: boolean }
  | {
      type: "SET_DIFFICULTY_FILTER";
      payload: "all" | "easy" | "medium" | "hard";
    }
  | {
      type: "SET_LEARNED_FILTER";
      payload: "all" | "learned" | "not-learned";
    }
  | {
      type: "UPDATE_FILTERED_VOCABS";
      payload: VocabularyWord[];
    };

// Helper function to shuffle an array
const shuffleArray = (array: VocabularyWord[]): VocabularyWord[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to filter vocabularies
const filterVocabs = (
  difficultyFilter: "all" | "easy" | "medium" | "hard",
  learnedFilter: "all" | "learned" | "not-learned",
  learntVocabs: string[],
  shouldShuffle = false
): VocabularyWord[] => {
  let filtered = vocabs_database;

  // Filter by difficulty
  if (difficultyFilter !== "all") {
    filtered = filtered.filter(
      (vocab) => vocab.difficulty === difficultyFilter
    );
  }

  // Filter by learned status
  if (learnedFilter === "learned") {
    filtered = filtered.filter((vocab) => learntVocabs.includes(vocab.word));
  } else if (learnedFilter === "not-learned") {
    filtered = filtered.filter((vocab) => !learntVocabs.includes(vocab.word));
  }

  // Shuffle if requested
  if (shouldShuffle) {
    filtered = shuffleArray(filtered);
  }

  return filtered;
};

function learnReducer(state: LearnState, action: LearnAction): LearnState {
  switch (action.type) {
    case "SET_CURRENT_VOCAB":
      return {
        ...state,
        currentVocab: action.payload.vocab,
        currentIndex: action.payload.index,
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "NEXT_VOCAB":
      const nextIndex = Math.min(
        state.currentIndex + 1,
        state.filteredVocabs.length - 1
      );
      return {
        ...state,
        currentVocab: state.filteredVocabs[nextIndex],
        currentIndex: nextIndex,
        isCardFlipped: false, // Reset flip state on navigation
      };
    case "PREV_VOCAB":
      const prevIndex = Math.max(state.currentIndex - 1, 0);
      return {
        ...state,
        currentVocab: state.filteredVocabs[prevIndex],
        currentIndex: prevIndex,
        isCardFlipped: false, // Reset flip state on navigation
      };
    case "RESET_TO_FIRST":
      return {
        ...state,
        currentVocab: state.filteredVocabs[0],
        currentIndex: 0,
        isCardFlipped: false, // Reset flip state on reset
      };
    case "SET_CARD_FLIPPED":
      return {
        ...state,
        isCardFlipped: action.payload,
      };
    case "SET_DIFFICULTY_FILTER":
      return {
        ...state,
        difficultyFilter: action.payload,
        currentIndex: 0,
        isCardFlipped: false,
      };
    case "SET_LEARNED_FILTER":
      return {
        ...state,
        learnedFilter: action.payload,
        currentIndex: 0,
        isCardFlipped: false,
      };
    case "UPDATE_FILTERED_VOCABS":
      return {
        ...state,
        filteredVocabs: action.payload,
        currentVocab: action.payload[0] || null,
        currentIndex: 0,
        isCardFlipped: false,
      };
    default:
      return state;
  }
}

export default function LearnVocab() {
  const [learnState, dispatch] = useReducer(learnReducer, {
    currentVocab: null,
    currentIndex: 0,
    isLoading: true,
    isCardFlipped: false,
    difficultyFilter: "all",
    learnedFilter: "all",
    filteredVocabs: vocabs_database,
  });

  const [userSentence, setUserSentence] = useState("");
  const [showPreviousSentences, setShowPreviousSentences] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [sentenceError, setSentenceError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const wordParam = searchParams.get("word");

  // Use the useLocalStorage hook
  const [vocabsData, setVocabsData] = useLocalStorage<VocabsData>(
    "vocabsData",
    {
      learntVocabs: [],
      userSentences: {},
    }
  );

  // Handle URL parameter for specific word
  useEffect(() => {
    if (wordParam) {
      // Find the word in the database
      const foundWord = vocabs_database.find(
        (vocab) => vocab.word.toLowerCase() === wordParam.toLowerCase()
      );

      if (foundWord) {
        // Find the index of this word in the current filtered vocabs
        const wordIndex = learnState.filteredVocabs.findIndex(
          (vocab) => vocab.word.toLowerCase() === wordParam.toLowerCase()
        );

        if (wordIndex !== -1) {
          dispatch({
            type: "SET_CURRENT_VOCAB",
            payload: { vocab: foundWord, index: wordIndex },
          });
          dispatch({ type: "SET_LOADING", payload: false });
        } else {
          // If word is not in current filtered vocabs, we need to adjust filters
          // Find what filters would include this word
          const wordDifficulty = foundWord.difficulty;
          const isWordLearned = vocabsData.learntVocabs.includes(
            foundWord.word
          );

          // Check if current filters exclude this word
          const difficultyMatch =
            learnState.difficultyFilter === "all" ||
            learnState.difficultyFilter === wordDifficulty;
          const learnedMatch =
            learnState.learnedFilter === "all" ||
            (learnState.learnedFilter === "learned" && isWordLearned) ||
            (learnState.learnedFilter === "not-learned" && !isWordLearned);

          if (!difficultyMatch || !learnedMatch) {
            // Reset filters to show the requested word
            dispatch({ type: "SET_DIFFICULTY_FILTER", payload: "all" });
            dispatch({ type: "SET_LEARNED_FILTER", payload: "all" });
          }
        }
      } else {
        // Word not found, show error or redirect to first word
        console.warn(`Word "${wordParam}" not found in vocabulary database`);
        dispatch({ type: "SET_LOADING", payload: false });
      }
    }
  }, [
    wordParam,
    learnState.filteredVocabs,
    learnState.difficultyFilter,
    learnState.learnedFilter,
    vocabsData.learntVocabs,
  ]);

  // Load vocabs data from localStorage on mount - no longer needed with useLocalStorage

  // Update user sentence when current vocab changes
  useEffect(() => {
    if (learnState.currentVocab) {
      // Clear the input when switching to a new word
      setUserSentence("");
      // Clear any error message
      setSentenceError(null);
    }
  }, [learnState.currentVocab]);

  // Update filtered vocabs when filters or learned vocabs change
  useEffect(() => {
    const filteredVocabs = filterVocabs(
      learnState.difficultyFilter,
      learnState.learnedFilter,
      vocabsData.learntVocabs,
      !wordParam // Shuffle only when there's no specific word parameter
    );

    dispatch({
      type: "UPDATE_FILTERED_VOCABS",
      payload: filteredVocabs,
    });

    // If we have a word parameter, try to maintain focus on that word
    if (wordParam && filteredVocabs.length > 0) {
      const foundWordIndex = filteredVocabs.findIndex(
        (vocab) => vocab.word.toLowerCase() === wordParam.toLowerCase()
      );

      if (foundWordIndex !== -1) {
        dispatch({
          type: "SET_CURRENT_VOCAB",
          payload: {
            vocab: filteredVocabs[foundWordIndex],
            index: foundWordIndex,
          },
        });
      }
    }
  }, [
    learnState.difficultyFilter,
    learnState.learnedFilter,
    vocabsData.learntVocabs,
    wordParam,
  ]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!learnState.currentVocab || !userSentence.trim()) {
      return;
    }

    const word = learnState.currentVocab.word;
    const sentence = userSentence.trim();

    // Check if the sentence contains the current word (case-insensitive)
    if (!sentence.toLowerCase().includes(word.toLowerCase())) {
      setSentenceError(`Your sentence must contain the word "${word}"`);
      return;
    }

    // Clear any previous error
    setSentenceError(null);

    setVocabsData((prevData) => {
      const updatedData = { ...prevData };

      // Add word to learnt list if not already there
      if (!updatedData.learntVocabs.includes(word)) {
        updatedData.learntVocabs.push(word);
      }

      // Add sentence to the array of sentences for this word
      if (!updatedData.userSentences[word]) {
        updatedData.userSentences[word] = [];
      }
      updatedData.userSentences[word].push(sentence);

      return updatedData;
    });

    // Clear the input after submission
    setUserSentence("");

    console.log("Vocab learned:", word);
    console.log("User sentence:", sentence);
  };

  // Handle deleting a sentence
  const handleDeleteSentence = (sentenceIndex: number) => {
    if (!learnState.currentVocab) return;

    // Set the deleting index to show confirmation
    setDeletingIndex(sentenceIndex);
  };

  // Confirm deletion
  const confirmDeleteSentence = () => {
    if (!learnState.currentVocab || deletingIndex === null) return;

    const word = learnState.currentVocab.word;

    setVocabsData((prevData) => {
      const updatedData = { ...prevData };

      // Remove the sentence at the specified index
      if (updatedData.userSentences[word]) {
        updatedData.userSentences[word] = updatedData.userSentences[
          word
        ].filter((_, index) => index !== deletingIndex);

        // If no sentences left, remove the word from userSentences
        if (updatedData.userSentences[word].length === 0) {
          delete updatedData.userSentences[word];

          // Also remove from learnt vocabs if no sentences exist
          updatedData.learntVocabs = updatedData.learntVocabs.filter(
            (learntWord) => learntWord !== word
          );
        }
      }

      return updatedData;
    });

    console.log(`Deleted sentence ${deletingIndex} for word: ${word}`);
    setDeletingIndex(null);
  };

  // Cancel deletion
  const cancelDeleteSentence = () => {
    setDeletingIndex(null);
  };

  // Select the first item from vocabs_database on component mount (only if no word param)
  useEffect(() => {
    if (!wordParam && learnState.filteredVocabs.length > 0) {
      dispatch({
        type: "SET_CURRENT_VOCAB",
        payload: { vocab: learnState.filteredVocabs[0], index: 0 },
      });
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [learnState.filteredVocabs, wordParam]);

  if (learnState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Learn Vocabulary</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!learnState.currentVocab) {
    // Check if we're looking for a specific word that doesn't exist
    if (wordParam) {
      const foundWord = vocabs_database.find(
        (vocab) => vocab.word.toLowerCase() === wordParam.toLowerCase()
      );

      if (!foundWord) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Word Not Found</h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                The word "{wordParam}" was not found in our vocabulary database.
              </p>
              <Link href="/dashboard/vocabs/learn">
                <Button variant="default" size="lg">
                  Start Learning from Beginning
                </Button>
              </Link>
              <Link href="/dashboard/vocabs" className="ml-4">
                <Button variant="outline" size="lg">
                  Browse All Words
                </Button>
              </Link>
            </div>
          </div>
        );
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Learn Vocabulary</h1>
          <p>No vocabulary items available.</p>
        </div>
      </div>
    );
  }

  const canGoPrev = learnState.currentIndex > 0;
  const canGoNext =
    learnState.currentIndex < learnState.filteredVocabs.length - 1;

  // Check if current word is already learned
  const isCurrentWordLearned = learnState.currentVocab
    ? vocabsData.learntVocabs.includes(learnState.currentVocab.word)
    : false;

  // Get previous sentences for current word
  const currentWordSentences = learnState.currentVocab
    ? vocabsData.userSentences[learnState.currentVocab.word] || []
    : [];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br  dark:from-zinc-900 dark:to-zinc-800 p-6">
      <div className=" w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
            Learn Vocabulary
          </h1>
          <div className="flex items-center justify-center gap-3">
            <p className="text-zinc-600 dark:text-zinc-400">
              Card {learnState.currentIndex + 1} of{" "}
              {learnState.filteredVocabs.length}
              {wordParam && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  • Viewing: "{wordParam}"
                </span>
              )}
            </p>
            {isCurrentWordLearned && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                ✓ Learned ({currentWordSentences.length} sentence
                {currentWordSentences.length !== 1 ? "s" : ""})
              </span>
            )}
          </div>
        </div>

        {/* Difficulty and Learned Filters */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Difficulty:
              </label>
              <Select
                value={learnState.difficultyFilter}
                onValueChange={(value: "all" | "easy" | "medium" | "hard") =>
                  dispatch({ type: "SET_DIFFICULTY_FILTER", payload: value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Progress:
              </label>
              <Select
                value={learnState.learnedFilter}
                onValueChange={(value: "all" | "learned" | "not-learned") =>
                  dispatch({ type: "SET_LEARNED_FILTER", payload: value })
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Words</SelectItem>
                  <SelectItem value="learned">Learned</SelectItem>
                  <SelectItem value="not-learned">Not Learned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="flex justify-center mb-8">
          <CardFlip
            isVocabCard={true}
            word={learnState.currentVocab.word}
            partOfSpeech={learnState.currentVocab.part_of_speech}
            difficulty={learnState.currentVocab.difficulty}
            definition={learnState.currentVocab.definition}
            example={learnState.currentVocab.example}
            categories={learnState.currentVocab.categories}
            isFlipped={learnState.isCardFlipped}
            onFlip={(flipped) =>
              dispatch({ type: "SET_CARD_FLIPPED", payload: flipped })
            }
          />
        </div>

        <form className="flex gap-2 mb-14" onSubmit={handleSubmit}>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={
                currentWordSentences.length > 0
                  ? "Add another sentence with this word..."
                  : "Use this word in a sentence"
              }
              value={userSentence}
              onChange={(e) => {
                setUserSentence(e.target.value);
                // Clear error when user starts typing
                if (sentenceError) {
                  setSentenceError(null);
                }
              }}
              className={cn(
                "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent",
                sentenceError
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              )}
            />
            {sentenceError && (
              <p className="text-red-500 text-sm mt-1 absolute">
                {sentenceError}
              </p>
            )}
          </div>
          <Button
            variant="default"
            type="submit"
            size="lg"
            className="px-6 bg-blue-500 hover:bg-blue-400 cursor-pointer"
            disabled={!userSentence.trim()}
          >
            Submit
          </Button>
        </form>

        {/* Add some spacing if there's an error to prevent layout shift */}
        {sentenceError && <div className="mb-4"></div>}

        {/* Navigation Controls */}
        <div className="flex items-center justify-between gap-4 w-full mt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => dispatch({ type: "PREV_VOCAB" })}
            disabled={!canGoPrev}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <Link href="/dashboard/vocabs">
            <Button
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <LayoutGridIcon className="h-4 w-4" />
              View All Words
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={() => dispatch({ type: "NEXT_VOCAB" })}
            disabled={!canGoNext}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {/* Previous Sentences */}
        {currentWordSentences.length > 0 && (
          <div className="max-w-2xl mx-auto mb-6 mt-10">
            <button
              onClick={() => setShowPreviousSentences(!showPreviousSentences)}
              className="flex items-center justify-center mx-auto p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 mb-3"
            >
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mr-2">
                View previous sentences ({currentWordSentences.length})
              </span>
              {showPreviousSentences ? (
                <ChevronUp className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              )}
            </button>

            {showPreviousSentences && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3">
                  Your previous sentences with "{learnState.currentVocab.word}":
                </h4>

                {/* Confirmation Dialog */}
                {deletingIndex !== null && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                      Are you sure you want to delete this sentence?
                    </p>
                    <div className="text-xs text-red-600 dark:text-red-400 italic mb-3 p-2 bg-red-100 dark:bg-red-800/30 rounded">
                      "{currentWordSentences[deletingIndex]}"
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={confirmDeleteSentence}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={cancelDeleteSentence}
                        className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {currentWordSentences.map((sentence, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-3 dark:bg-blue-800/30 border border-blue-100 dark:border-blue-700 rounded text-sm flex items-start justify-between group transition-colors",
                        deletingIndex === index
                          ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700"
                          : "hover:bg-blue-100 dark:hover:bg-blue-800/50"
                      )}
                    >
                      <span className="text-zinc-700 dark:text-zinc-300 italic flex-1 mr-3">
                        "{sentence}"
                      </span>
                      {deletingIndex !== index && (
                        <button
                          onClick={() => handleDeleteSentence(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Delete this sentence"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
