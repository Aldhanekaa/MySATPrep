"use client";

import React, {
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  PlainQuestionType,
  QuestionById_Data,
  QuestionDifficulty,
} from "@/types/question";
import { Card, CardContent } from "@/components/ui/card";
import { OptimizedQuestionCard } from "../dashboard/shared/OptimizedQuestionCard";
import { MultiSelectCombobox } from "../ui/multiselect-combobox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { SlidersHorizontalIcon } from "lucide-react";

export interface BaseQuestionWithData {
  questionId: string;
  timestamp: string;
  questionData?: QuestionById_Data;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

interface QuestionWithData extends PlainQuestionType, BaseQuestionWithData {
  timestamp: string;
  questionData?: QuestionById_Data;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

// State management for better performance
interface QuestionResultsState {
  questionsWithData: QuestionWithData[];
  fetchedQuestionIds: Set<string>;
  isInitialized: boolean;
  visibleCount: number;
  hasMoreQuestions: boolean;
  isLoadingMore: boolean;
  selectedDifficulties: QuestionDifficulty[];
  selectedSkills: string[];
  filteredQuestions: QuestionWithData[];
  excludeBluebookQuestions: boolean;
  onlyBluebookQuestions: boolean;
}

type QuestionResultsAction =
  | { type: "INITIALIZE_QUESTIONS"; payload: QuestionWithData[] }
  | {
      type: "SET_QUESTION_LOADING";
      payload: { index: number; questionId: string };
    }
  | {
      type: "SET_QUESTION_SUCCESS";
      payload: { index: number; questionData: QuestionById_Data };
    }
  | {
      type: "SET_QUESTION_ERROR";
      payload: { index: number; errorMessage: string };
    }
  | { type: "ADD_FETCHED_ID"; payload: string }
  | { type: "REMOVE_FETCHED_ID"; payload: string }
  | { type: "RESET_FETCHED_IDS" }
  | { type: "INCREASE_VISIBLE_COUNT"; payload: number }
  | { type: "SET_LOADING_MORE"; payload: boolean }
  | { type: "SET_DIFFICULTY_FILTER"; payload: QuestionDifficulty[] }
  | { type: "RESET_DIFFICULTY_FILTER" }
  | { type: "SET_SKILL_FILTER"; payload: string[] }
  | { type: "RESET_SKILL_FILTER" }
  | { type: "TOGGLE_EXCLUDE_BLUEBOOK"; payload: boolean }
  | { type: "TOGGLE_ONLY_BLUEBOOK"; payload: boolean };

// Difficulty filter options constant with correct mappings
const DIFFICULTY_OPTIONS = [
  { value: "E" as QuestionDifficulty, label: "Easy", id: "E" },
  { value: "M" as QuestionDifficulty, label: "Medium", id: "M" },
  { value: "H" as QuestionDifficulty, label: "Hard", id: "H" },
];

// Helper function to check if a question has valid difficulty data
const hasValidDifficulty = (question: QuestionWithData): boolean => {
  return question.difficulty && ["E", "M", "H"].includes(question.difficulty);
};

// Helper function to filter questions by difficulty
const filterQuestionsByDifficulty = (
  questions: QuestionWithData[],
  selectedDifficulties: QuestionDifficulty[]
): QuestionWithData[] => {
  // Default behavior: show all questions when no difficulties are selected
  if (selectedDifficulties.length === 0) {
    return questions;
  }

  // Filter questions, gracefully handling missing difficulty data
  return questions.filter((question) => {
    // Handle questions with missing or invalid difficulty data
    if (!hasValidDifficulty(question)) {
      // Include questions with missing difficulty data when "Easy" is selected
      // This provides a fallback behavior for incomplete data and ensures
      // users can still access all content even with data quality issues
      return selectedDifficulties.includes("E");
    }

    // Standard filtering for questions with valid difficulty data
    return selectedDifficulties.includes(question.difficulty);
  });
};

// Helper function to filter questions by skills
const filterQuestionsBySkills = (
  questions: QuestionWithData[],
  selectedSkills: string[]
): QuestionWithData[] => {
  // Default behavior: show all questions when no skills are selected
  if (selectedSkills.length === 0) {
    return questions;
  }

  // Filter questions by skill_cd
  return questions.filter((question) => {
    return selectedSkills.includes(question.skill_cd);
  });
};

// Helper function to filter out Bluebook questions
const filterOutBluebookQuestions = (
  questions: QuestionWithData[],
  excludeBluebook: boolean,
  bluebookExternalIds?: { mathLiveItems: string[]; readingLiveItems: string[] },
  selectedSubject?: string
): QuestionWithData[] => {
  // If not excluding Bluebook questions, return all questions
  if (!excludeBluebook || !bluebookExternalIds || !selectedSubject) {
    return questions;
  }

  // Get the relevant external IDs based on selected subject
  const relevantExternalIds =
    selectedSubject === "Math"
      ? bluebookExternalIds.mathLiveItems
      : bluebookExternalIds.readingLiveItems;

  // Filter out questions that have external IDs matching Bluebook external IDs
  return questions.filter((question) => {
    // If question has no external_id, keep it
    if (!question.external_id) {
      return true;
    }

    // Exclude if the question's external_id is in the Bluebook external IDs
    return !relevantExternalIds.includes(question.external_id);
  });
};

// Helper function to show only Bluebook questions
const filterOnlyBluebookQuestions = (
  questions: QuestionWithData[],
  onlyBluebook: boolean,
  bluebookExternalIds?: { mathLiveItems: string[]; readingLiveItems: string[] },
  selectedSubject?: string
): QuestionWithData[] => {
  // If not filtering for only Bluebook questions, return all questions
  if (!onlyBluebook || !bluebookExternalIds || !selectedSubject) {
    return questions;
  }

  // Get the relevant external IDs based on selected subject
  const relevantExternalIds =
    selectedSubject === "Math"
      ? bluebookExternalIds.mathLiveItems
      : bluebookExternalIds.readingLiveItems;

  // Show only questions that have external IDs matching Bluebook external IDs
  return questions.filter((question) => {
    // If question has no external_id, exclude it
    if (!question.external_id) {
      return false;
    }

    // Include only if the question's external_id is in the Bluebook external IDs
    return relevantExternalIds.includes(question.external_id);
  });
};

// Basic filter function for reducer (without Bluebook filtering)
const filterQuestionsBasic = (
  questions: QuestionWithData[],
  selectedDifficulties: QuestionDifficulty[],
  selectedSkills: string[]
): QuestionWithData[] => {
  let filtered = questions;

  // Apply difficulty filter
  filtered = filterQuestionsByDifficulty(filtered, selectedDifficulties);

  // Apply skill filter
  filtered = filterQuestionsBySkills(filtered, selectedSkills);

  return filtered;
};

// Combined filter function (includes Bluebook filtering)
const filterQuestions = (
  questions: QuestionWithData[],
  selectedDifficulties: QuestionDifficulty[],
  selectedSkills: string[],
  excludeBluebook: boolean = false,
  onlyBluebook: boolean = false,
  bluebookExternalIds?: { mathLiveItems: string[]; readingLiveItems: string[] },
  selectedSubject?: string
): QuestionWithData[] => {
  let filtered = questions;

  // Apply Bluebook filters (exclude takes precedence over only)
  if (excludeBluebook) {
    filtered = filterOutBluebookQuestions(
      filtered,
      excludeBluebook,
      bluebookExternalIds,
      selectedSubject
    );
  } else if (onlyBluebook) {
    filtered = filterOnlyBluebookQuestions(
      filtered,
      onlyBluebook,
      bluebookExternalIds,
      selectedSubject
    );
  }

  // Apply difficulty filter
  filtered = filterQuestionsByDifficulty(filtered, selectedDifficulties);

  // Apply skill filter
  filtered = filterQuestionsBySkills(filtered, selectedSkills);

  return filtered;
};

const questionResultsReducer = (
  state: QuestionResultsState,
  action: QuestionResultsAction
): QuestionResultsState => {
  switch (action.type) {
    case "INITIALIZE_QUESTIONS": {
      const filteredQuestions = filterQuestionsBasic(
        action.payload,
        state.selectedDifficulties,
        state.selectedSkills
      );
      return {
        ...state,
        questionsWithData: action.payload,
        filteredQuestions,
        isInitialized: true,
        visibleCount: Math.min(10, filteredQuestions.length), // Start with 10 questions
        hasMoreQuestions: filteredQuestions.length > 10,
        isLoadingMore: false,
      };
    }
    case "SET_QUESTION_LOADING":
      return {
        ...state,
        questionsWithData: state.questionsWithData.map((q, i) =>
          i === action.payload.index
            ? {
                ...q,
                isLoading: true,
                hasError: false,
                errorMessage: undefined,
              }
            : q
        ),
      };
    case "SET_QUESTION_SUCCESS":
      const newQuestionData = state.questionsWithData.map((q, i) =>
        i === action.payload.index
          ? {
              ...q,
              questionData: action.payload.questionData,
              isLoading: false,
              hasError: false,
            }
          : q
      );
      const filteredQuestions = filterQuestionsBasic(
        newQuestionData,
        state.selectedDifficulties,
        state.selectedSkills
      );

      return {
        ...state,
        questionsWithData: newQuestionData,
        filteredQuestions,
      };
    case "SET_QUESTION_ERROR":
      return {
        ...state,
        questionsWithData: state.questionsWithData.map((q, i) =>
          i === action.payload.index
            ? {
                ...q,
                isLoading: false,
                hasError: true,
                errorMessage: action.payload.errorMessage,
              }
            : q
        ),
      };
    case "ADD_FETCHED_ID":
      return {
        ...state,
        fetchedQuestionIds: new Set([
          ...state.fetchedQuestionIds,
          action.payload,
        ]),
      };
    case "REMOVE_FETCHED_ID":
      const newFetchedIds = new Set(state.fetchedQuestionIds);
      newFetchedIds.delete(action.payload);
      return {
        ...state,
        fetchedQuestionIds: newFetchedIds,
      };
    case "RESET_FETCHED_IDS":
      return {
        ...state,
        fetchedQuestionIds: new Set(),
      };
    case "INCREASE_VISIBLE_COUNT": {
      const filteredQuestions = filterQuestionsBasic(
        state.questionsWithData,
        state.selectedDifficulties,
        state.selectedSkills
      );
      const newVisibleCount = Math.min(
        state.visibleCount + action.payload,
        filteredQuestions.length
      );
      return {
        ...state,
        visibleCount: newVisibleCount,
        hasMoreQuestions: newVisibleCount < filteredQuestions.length,
        filteredQuestions,
      };
    }
    case "SET_LOADING_MORE":
      return {
        ...state,
        isLoadingMore: action.payload,
      };

    case "SET_DIFFICULTY_FILTER": {
      const filteredQuestions = filterQuestionsBasic(
        state.questionsWithData,
        action.payload,
        state.selectedSkills
      );
      return {
        ...state,
        selectedDifficulties: action.payload,
        filteredQuestions,
        visibleCount: Math.min(10, filteredQuestions.length),
        hasMoreQuestions: filteredQuestions.length > 10,
        isLoadingMore: false,
      };
    }
    case "RESET_DIFFICULTY_FILTER": {
      const filteredQuestions = filterQuestionsBasic(
        state.questionsWithData,
        [],
        state.selectedSkills
      );
      return {
        ...state,
        selectedDifficulties: [],
        filteredQuestions,
        visibleCount: Math.min(10, filteredQuestions.length),
        hasMoreQuestions: filteredQuestions.length > 10,
        isLoadingMore: false,
      };
    }
    case "SET_SKILL_FILTER": {
      const filteredQuestions = filterQuestionsBasic(
        state.questionsWithData,
        state.selectedDifficulties,
        action.payload
      );
      return {
        ...state,
        selectedSkills: action.payload,
        filteredQuestions,
        visibleCount: Math.min(10, filteredQuestions.length),
        hasMoreQuestions: filteredQuestions.length > 10,
        isLoadingMore: false,
      };
    }
    case "RESET_SKILL_FILTER": {
      const filteredQuestions = filterQuestionsBasic(
        state.questionsWithData,
        state.selectedDifficulties,
        []
      );
      return {
        ...state,
        selectedSkills: [],
        filteredQuestions,
        visibleCount: Math.min(10, filteredQuestions.length),
        hasMoreQuestions: filteredQuestions.length > 10,
        isLoadingMore: false,
      };
    }
    case "TOGGLE_EXCLUDE_BLUEBOOK": {
      return {
        ...state,
        excludeBluebookQuestions: action.payload,
        // If excluding Bluebook, turn off only Bluebook
        onlyBluebookQuestions: action.payload
          ? false
          : state.onlyBluebookQuestions,
      };
    }
    case "TOGGLE_ONLY_BLUEBOOK": {
      return {
        ...state,
        onlyBluebookQuestions: action.payload,
        // If showing only Bluebook, turn off exclude Bluebook
        excludeBluebookQuestions: action.payload
          ? false
          : state.excludeBluebookQuestions,
      };
    }
    default:
      return state;
  }
};

interface QuestionResultsProps {
  questions: PlainQuestionType[];
  assessmentName: string;
  selectedSubject: string;
  selectedDomains: Record<
    string,
    {
      subject: string;
      text: string;
      id: string;
      primaryClassCd: string;
      skill: { text: string; id: string; skill_cd: string }[];
    }
  >;
  bluebookExternalIds?: {
    mathLiveItems: string[];
    readingLiveItems: string[];
  };
}

export function QuestionResults({
  questions,
  assessmentName,
  selectedSubject,
  selectedDomains,
  bluebookExternalIds,
}: QuestionResultsProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Use reducer for better state management and performance
  const [state, dispatch] = useReducer(questionResultsReducer, {
    questionsWithData: [],
    fetchedQuestionIds: new Set<string>(),
    isInitialized: false,
    visibleCount: 10,
    hasMoreQuestions: true,
    isLoadingMore: false,
    selectedDifficulties: [],
    selectedSkills: [],
    filteredQuestions: [],
    excludeBluebookQuestions: false,
    onlyBluebookQuestions: false,
  });

  // console.log("selectedDomains", selectedDomains);

  // Verify Bluebook external IDs are properly typed and accessible
  useEffect(() => {
    if (bluebookExternalIds) {
      console.log("Bluebook External IDs received in QuestionResults:", {
        mathLiveItems: bluebookExternalIds.mathLiveItems,
        readingLiveItems: bluebookExternalIds.readingLiveItems,
        mathCount: bluebookExternalIds.mathLiveItems.length,
        readingCount: bluebookExternalIds.readingLiveItems.length,
      });

      // TypeScript IntelliSense verification - these properties should be available
      const mathIds: string[] = bluebookExternalIds.mathLiveItems;
      const readingIds: string[] = bluebookExternalIds.readingLiveItems;

      // Demonstrate accessibility for further processing
      if (mathIds.length > 0) {
        console.log("First math external ID:", mathIds[0]);
      }
      if (readingIds.length > 0) {
        console.log("First reading external ID:", readingIds[0]);
      }
    }
  }, [bluebookExternalIds]);

  // Memoized filtered questions that includes Bluebook filtering
  const actualFilteredQuestions = useMemo(() => {
    const filtered = filterQuestions(
      state.questionsWithData,
      state.selectedDifficulties,
      state.selectedSkills,
      state.excludeBluebookQuestions,
      state.onlyBluebookQuestions,
      bluebookExternalIds,
      selectedSubject
    );

    // Debug logging
    if (
      (state.excludeBluebookQuestions || state.onlyBluebookQuestions) &&
      bluebookExternalIds &&
      selectedSubject
    ) {
      const relevantExternalIds =
        selectedSubject === "Math"
          ? bluebookExternalIds.mathLiveItems
          : bluebookExternalIds.readingLiveItems;

      const filteredCount = filtered.length;
      const totalCount = state.questionsWithData.length;

      console.log(`Bluebook filtering active for ${selectedSubject}:`, {
        mode: state.excludeBluebookQuestions ? "exclude" : "only",
        totalQuestions: totalCount,
        filteredQuestions: filteredCount,
        relevantExternalIds: relevantExternalIds.length,
      });
    }

    return filtered;
  }, [
    state.questionsWithData,
    state.selectedDifficulties,
    state.selectedSkills,
    state.excludeBluebookQuestions,
    state.onlyBluebookQuestions,
    bluebookExternalIds,
    selectedSubject,
  ]);

  // Fetch question data from API (memoized)
  const fetchQuestionData = useCallback(
    async (questionId: string): Promise<QuestionById_Data | null> => {
      try {
        const response = await fetch(`/api/question-by-id/${questionId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch question: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          return result.data;
        } else {
          throw new Error(result.message || "Failed to fetch question data");
        }
      } catch (error) {
        console.error(`Error fetching question ${questionId}:`, error);
        throw error;
      }
    },
    []
  );

  // Memoized retry handler to prevent recreation on every render
  const handleRetry = useCallback(
    (index: number, questionId: string) => {
      // Find the actual index in questionsWithData array
      const actualIndex = state.questionsWithData.findIndex(
        (q) => q.questionId === questionId
      );
      if (actualIndex !== -1) {
        dispatch({ type: "REMOVE_FETCHED_ID", payload: questionId });
        dispatch({
          type: "SET_QUESTION_LOADING",
          payload: { index: actualIndex, questionId },
        });
      }
    },
    [state.questionsWithData]
  );

  // Initialize questions when questions prop changes
  useEffect(() => {
    // Initialize questions with loading state
    const initialQuestions: QuestionWithData[] = questions.map((question) => ({
      ...question,
      timestamp: new Date().toISOString(),
      isLoading: true,
      hasError: false,
    }));

    dispatch({ type: "INITIALIZE_QUESTIONS", payload: initialQuestions });
    dispatch({ type: "RESET_FETCHED_IDS" });
  }, [questions]);

  // Update hasMoreQuestions based on filtered questions from state
  const hasMoreQuestions = useMemo(() => {
    return state.visibleCount < actualFilteredQuestions.length;
  }, [state.visibleCount, actualFilteredQuestions.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMoreQuestions || state.isLoadingMore || !state.isInitialized)
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !state.isLoadingMore && hasMoreQuestions) {
          dispatch({ type: "SET_LOADING_MORE", payload: true });

          // Load more questions with a slight delay for better UX
          setTimeout(() => {
            dispatch({ type: "INCREASE_VISIBLE_COUNT", payload: 10 });
            dispatch({ type: "SET_LOADING_MORE", payload: false });
          }, 300);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px", // Start loading when user is 100px away from the trigger
      }
    );

    observerRef.current = observer;

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasMoreQuestions, state.isLoadingMore, state.isInitialized]);

  // Fetch question data progressively (optimized with debouncing)
  useEffect(() => {
    if (!state.isInitialized || state.questionsWithData.length === 0) return;

    // Debounce the fetching to prevent too many rapid calls
    const fetchTimeout = setTimeout(() => {
      const fetchQuestionsProgressively = async () => {
        // Only fetch data for visible questions from filtered set
        const visibleQuestions = actualFilteredQuestions.slice(
          0,
          state.visibleCount
        );

        // Find questions that need to be fetched (only visible ones)
        const questionsToFetch = visibleQuestions
          .map((question) => {
            // Find the actual index in questionsWithData array
            const actualIndex = state.questionsWithData.findIndex(
              (q) => q.questionId === question.questionId
            );
            return { question, index: actualIndex };
          })
          .filter(
            ({ question, index }) =>
              index !== -1 &&
              question.isLoading &&
              !question.questionData &&
              !question.hasError &&
              !state.fetchedQuestionIds.has(question.questionId)
          );

        if (questionsToFetch.length === 0) return;

        // Mark these questions as being fetched
        questionsToFetch.forEach(({ question }) => {
          dispatch({ type: "ADD_FETCHED_ID", payload: question.questionId });
        });

        // Process questions with optimized batching (limit concurrent requests)
        const batchSize = 3; // Process max 3 questions at a time
        for (let i = 0; i < questionsToFetch.length; i += batchSize) {
          const batch = questionsToFetch.slice(i, i + batchSize);

          // Process batch concurrently
          const batchPromises = batch.map(async ({ question, index }) => {
            try {
              const questionData = await fetchQuestionData(question.questionId);

              if (questionData) {
                dispatch({
                  type: "SET_QUESTION_SUCCESS",
                  payload: { index, questionData },
                });
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";

              dispatch({
                type: "SET_QUESTION_ERROR",
                payload: { index, errorMessage },
              });
            }
          });

          await Promise.all(batchPromises);

          // Add delay between batches to be respectful to the API
          if (i + batchSize < questionsToFetch.length) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }
      };

      fetchQuestionsProgressively();
    }, 100); // 100ms debounce

    return () => clearTimeout(fetchTimeout);
  }, [
    state.isInitialized,
    actualFilteredQuestions,
    // state.fetchedQuestionIds,
    state.isLoadingMore,
    state.visibleCount,
  ]);

  // Memoize loading indicator to prevent unnecessary re-renders
  const loadingIndicator = useMemo(() => {
    const visibleQuestions = actualFilteredQuestions.slice(
      0,
      state.visibleCount
    );
    const hasLoadingQuestions = visibleQuestions.some((q) => q.isLoading);
    const loadingCount = visibleQuestions.filter((q) => q.isLoading).length;
    const questionsWithMissingDifficulty = visibleQuestions.filter(
      (q) => !q.difficulty
    ).length;

    return hasLoadingQuestions ? (
      <div className="text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span>
            Loading {loadingCount} question{loadingCount !== 1 ? "s" : ""}
            {(state.selectedDifficulties.length > 0 ||
              state.selectedSkills.length > 0) &&
              " (filtered)"}
            ...
          </span>
        </div>
        {questionsWithMissingDifficulty > 0 &&
          state.selectedDifficulties.includes("E") && (
            <div className="text-xs text-amber-600 mt-1">
              Including {questionsWithMissingDifficulty} question
              {questionsWithMissingDifficulty !== 1 ? "s" : ""} with missing
              difficulty data
            </div>
          )}
      </div>
    ) : null;
  }, [actualFilteredQuestions, state.visibleCount, state.selectedDifficulties]);

  // Create skill options from selectedDomains, grouped by primaryClassCd
  const skillOptions = useMemo(() => {
    const options: Array<{
      value: string;
      label: string;
      id: string;
      group: string;
      groupLabel: string;
    }> = [];

    Object.values(selectedDomains).forEach((domain) => {
      domain.skill.forEach((skill) => {
        options.push({
          value: skill.skill_cd,
          label: skill.text,
          id: skill.id,
          group: domain.primaryClassCd,
          groupLabel: domain.text,
        });
      });
    });

    return options;
  }, [selectedDomains]);

  const renderDifficultyOption = useCallback(
    (option: { value: QuestionDifficulty; label: string; id: string }) => (
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span>{option.label}</span>
        </div>
      </div>
    ),
    []
  );

  const renderSkillOption = useCallback(
    (option: {
      value: string;
      label: string;
      id: string;
      group: string;
      groupLabel: string;
    }) => (
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="text-sm">{option.label}</span>
        </div>
      </div>
    ),
    []
  );

  const renderSelectedDifficulties = useCallback((value: string[]) => {
    if (value.length === 0) return "";
    if (value.length === 1) {
      const difficulty = DIFFICULTY_OPTIONS.find(
        (opt) => opt.value === value[0]
      );
      return difficulty ? difficulty.label : value[0];
    }
    return `${value.length} difficulties selected`;
  }, []);

  const renderSelectedSkills = useCallback(
    (value: string[]) => {
      if (value.length === 0) return "";
      if (value.length === 1) {
        const skill = skillOptions.find((opt) => opt.value === value[0]);
        return skill ? skill.label : value[0];
      }
      return `${value.length} skills selected`;
    },
    [skillOptions]
  );

  if (!state.isInitialized) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Question Results</h2>
        <p className="text-sm text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  if (actualFilteredQuestions.length === 0) {
    const hasQuestionsWithMissingDifficulty = state.questionsWithData.some(
      (q) => !q.difficulty
    );

    return (
      <div className="space-y-4">
        <div className="px-8 lg:px-28 grid grid-cols-12 py-4">
          <div className="col-span-12 md:col-span-5 flex flex-col flex-wrap gap-2 items-start text-sm">
            <h2 className="text-lg font-semibold">Question Results</h2>
            <p className="text-sm text-muted-foreground">
              {state.selectedDifficulties.length > 0 ||
              state.selectedSkills.length > 0 ? (
                <>
                  No questions found for the selected filters.
                  <span className="block text-xs text-blue-600 mt-1">
                    {state.questionsWithData.length} total questions available
                  </span>
                </>
              ) : (
                "No questions found."
              )}
            </p>
          </div>
          <div className="mt-10 md:mt-0 col-span-12 md:col-span-7 flex flex-col lg:flex-row items-end justify-end gap-3">
            <MultiSelectCombobox
              label={"by Difficulty"}
              options={DIFFICULTY_OPTIONS}
              value={state.selectedDifficulties}
              onChange={(value) => {
                dispatch({
                  type: "SET_DIFFICULTY_FILTER",
                  payload: value as QuestionDifficulty[],
                });
              }}
              renderItem={renderDifficultyOption}
              renderSelectedItem={renderSelectedDifficulties}
            />
            <MultiSelectCombobox
              label={"by Skills"}
              options={skillOptions}
              value={state.selectedSkills}
              onChange={(value) => {
                dispatch({
                  type: "SET_SKILL_FILTER",
                  payload: value,
                });
              }}
              renderItem={renderSkillOption}
              renderSelectedItem={renderSelectedSkills}
              grouped={true}
            />
          </div>
        </div>

        <div className="px-8 lg:px-28">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <p className="text-4xl mb-4">🔍</p>
                <h3 className="text-lg font-medium mb-2">
                  {state.selectedDifficulties.length > 0 ||
                  state.selectedSkills.length > 0
                    ? "No questions match your filter criteria"
                    : "No questions available"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {state.selectedDifficulties.length > 0 ||
                  state.selectedSkills.length > 0 ? (
                    <>
                      We couldn't find any questions matching the selected
                      {state.selectedDifficulties.length > 0 &&
                      state.selectedSkills.length > 0
                        ? " difficulty and skill filters"
                        : state.selectedDifficulties.length > 0
                        ? " difficulty levels"
                        : " skills"}
                      .
                      {hasQuestionsWithMissingDifficulty && (
                        <span className="block mt-2 text-xs text-amber-600">
                          Note: Some questions may not have difficulty data
                          assigned. Try selecting "Easy" to include questions
                          with missing difficulty information.
                        </span>
                      )}
                    </>
                  ) : (
                    "There are no questions available for this assessment."
                  )}
                </p>

                {(state.selectedDifficulties.length > 0 ||
                  state.selectedSkills.length > 0) && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Try these options:</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button
                        onClick={() => {
                          dispatch({ type: "RESET_DIFFICULTY_FILTER" });
                          dispatch({ type: "RESET_SKILL_FILTER" });
                        }}
                        className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        Clear all filters
                      </button>
                      {!state.selectedDifficulties.includes("E") &&
                        hasQuestionsWithMissingDifficulty && (
                          <button
                            onClick={() =>
                              dispatch({
                                type: "SET_DIFFICULTY_FILTER",
                                payload: [...state.selectedDifficulties, "E"],
                              })
                            }
                            className="px-4 py-2 text-sm bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 transition-colors"
                          >
                            Include Easy (+ missing data)
                          </button>
                        )}
                    </div>
                  </div>
                )}

                {state.questionsWithData.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-muted-foreground">
                      Total questions in database:{" "}
                      {state.questionsWithData.length}
                      {hasQuestionsWithMissingDifficulty && (
                        <span className="block mt-1">
                          Questions with missing difficulty data:{" "}
                          {
                            state.questionsWithData.filter((q) => !q.difficulty)
                              .length
                          }
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // console.log("state.filteredQuestions", state.filteredQuestions);
  return (
    <div className="space-y-6 px-2 max-w-full lg:max-w-7xl xl:max-w-[92rem] mx-auto">
      <div className="px-8 lg:px-28 grid grid-cols-12 py-3">
        <div className="col-span-12 md:col-span-5 flex flex-col flex-wrap gap-2 items-start text-sm">
          <h2 className="text-lg font-semibold">Question Results</h2>
          <p className="text-sm text-muted-foreground">
            {state.selectedDifficulties.length > 0 ||
            state.selectedSkills.length > 0 ? (
              <React.Fragment>
                {actualFilteredQuestions.length} of{" "}
                {state.questionsWithData.length} question
                {state.questionsWithData.length !== 1 ? "s" : ""} for{" "}
                {assessmentName}
                <span className="text-xs text-blue-600 ml-1">
                  (filtered
                  {state.selectedDifficulties.length > 0 &&
                  state.selectedSkills.length > 0
                    ? " by difficulty & skills"
                    : state.selectedDifficulties.length > 0
                    ? " by difficulty"
                    : " by skills"}
                  {state.excludeBluebookQuestions && ", excluding Bluebook"}
                  {state.onlyBluebookQuestions && ", Bluebook only"})
                </span>
                {(() => {
                  const questionsWithMissingDifficulty =
                    actualFilteredQuestions.filter((q) => !q.difficulty).length;
                  return questionsWithMissingDifficulty > 0 &&
                    state.selectedDifficulties.includes("E") ? (
                    <span className="block text-xs text-amber-600 mt-1">
                      Including {questionsWithMissingDifficulty} question
                      {questionsWithMissingDifficulty !== 1 ? "s" : ""} with
                      missing difficulty data
                    </span>
                  ) : null;
                })()}
              </React.Fragment>
            ) : (
              <>
                {actualFilteredQuestions.length} question
                {actualFilteredQuestions.length !== 1 ? "s" : ""} for{" "}
                {assessmentName}
                {(state.excludeBluebookQuestions ||
                  state.onlyBluebookQuestions) && (
                  <span className="text-xs text-blue-600 ml-1">
                    (
                    {state.excludeBluebookQuestions
                      ? "excluding Bluebook"
                      : "Bluebook only"}
                    )
                  </span>
                )}
                {(() => {
                  const totalWithMissingDifficulty =
                    state.questionsWithData.filter((q) => !q.difficulty).length;
                  return totalWithMissingDifficulty > 0 ? (
                    <span className="block text-xs text-muted-foreground mt-1">
                      {totalWithMissingDifficulty} question
                      {totalWithMissingDifficulty !== 1 ? "s" : ""} have missing
                      difficulty data
                    </span>
                  ) : null;
                })()}
              </>
            )}
          </p>
        </div>
        <div className="mt-10 md:mt-0 col-span-12 md:col-span-7 flex flex-col lg:flex-row items-end justify-end gap-3">
          <MultiSelectCombobox
            label={"by Difficulty"}
            options={DIFFICULTY_OPTIONS}
            value={state.selectedDifficulties}
            onChange={(value) => {
              dispatch({
                type: "SET_DIFFICULTY_FILTER",
                payload: value as QuestionDifficulty[],
              });
            }}
            renderItem={renderDifficultyOption}
            renderSelectedItem={renderSelectedDifficulties}
          />
          <MultiSelectCombobox
            label={"by Skills"}
            options={skillOptions}
            value={state.selectedSkills}
            onChange={(value) => {
              dispatch({
                type: "SET_SKILL_FILTER",
                payload: value,
              });
            }}
            renderItem={renderSkillOption}
            renderSelectedItem={renderSelectedSkills}
            grouped={true}
          />

          <Popover>
            <PopoverTrigger asChild className="h-full cursor-pointer">
              <Button variant="outline" className="h-full">
                <SlidersHorizontalIcon />
              </Button>
            </PopoverTrigger>

            <PopoverContent side="bottom" align="end">
              <div className="flex flex-col gap-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={state.excludeBluebookQuestions}
                    onCheckedChange={(checked) => {
                      dispatch({
                        type: "TOGGLE_EXCLUDE_BLUEBOOK",
                        payload: checked,
                      });
                    }}
                  />
                  <span className="text-sm">Exclude Bluebook Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={state.onlyBluebookQuestions}
                    onCheckedChange={(checked) => {
                      dispatch({
                        type: "TOGGLE_ONLY_BLUEBOOK",
                        payload: checked,
                      });
                    }}
                  />
                  <span className="text-sm"> Bluebook Questions Only</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className=" max-w-full mx-auto lg:px-22">
        {actualFilteredQuestions
          .slice(0, state.visibleCount)
          .map((question, index) => (
            <div key={`${question.questionId}-${index}`} className="mb-32">
              <OptimizedQuestionCard
                question={question}
                index={index}
                onRetry={handleRetry}
                type="standard"
              />
            </div>
          ))}
      </div>

      {loadingIndicator}

      {/* Infinite scroll trigger */}
      {hasMoreQuestions && (
        <div
          ref={loadMoreRef}
          className="h-20 flex items-center justify-center"
        >
          {state.isLoadingMore && (
            <div className="flex flex-col items-center space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>
                  Loading more questions
                  {(state.selectedDifficulties.length > 0 ||
                    state.selectedSkills.length > 0) &&
                    " (filtered)"}
                  ...
                </span>
              </div>
              {(state.selectedDifficulties.length > 0 ||
                state.selectedSkills.length > 0) && (
                <div className="text-xs text-blue-600">
                  Showing{" "}
                  {state.selectedDifficulties.length > 0 && (
                    <>
                      {state.selectedDifficulties
                        .map(
                          (d) =>
                            DIFFICULTY_OPTIONS.find((opt) => opt.value === d)
                              ?.label || d
                        )
                        .join(", ")}{" "}
                      difficulty
                    </>
                  )}
                  {state.selectedDifficulties.length > 0 &&
                    state.selectedSkills.length > 0 &&
                    " & "}
                  {state.selectedSkills.length > 0 && (
                    <>
                      {state.selectedSkills.length === 1
                        ? skillOptions.find(
                            (opt) => opt.value === state.selectedSkills[0]
                          )?.label || state.selectedSkills[0]
                        : `${state.selectedSkills.length} skill${
                            state.selectedSkills.length !== 1 ? "s" : ""
                          }`}
                    </>
                  )}{" "}
                  questions
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Show completion message when all questions are loaded */}
      {!hasMoreQuestions && actualFilteredQuestions.length > 10 && (
        <div className="text-center py-8">
          <div className="text-sm text-muted-foreground">
            You've reached the end! All {actualFilteredQuestions.length}{" "}
            {state.selectedDifficulties.length > 0 ||
            state.selectedSkills.length > 0
              ? "filtered "
              : ""}
            questions loaded.
            {(state.selectedDifficulties.length > 0 ||
              state.selectedSkills.length > 0) && (
              <div className="text-xs text-blue-600 mt-1">
                Showing {actualFilteredQuestions.length} of{" "}
                {state.questionsWithData.length} total questions
                {(() => {
                  const questionsWithMissingDifficulty =
                    actualFilteredQuestions.filter((q) => !q.difficulty).length;
                  return questionsWithMissingDifficulty > 0 &&
                    state.selectedDifficulties.includes("E") ? (
                    <span className="block text-amber-600">
                      (including {questionsWithMissingDifficulty} with missing
                      difficulty data)
                    </span>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
