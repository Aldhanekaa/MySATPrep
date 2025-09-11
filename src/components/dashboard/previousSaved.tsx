import React, {
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { Button } from "@/components/ui/button";
import { AssessmentWorkspace } from "@/app/dashboard/types";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { SavedQuestions, SavedQuestion } from "@/types/savedQuestions";
import { QuestionById_Data } from "@/types/question";
import { Card, CardContent } from "@/components/ui/card-v2";
import {
  OptimizedQuestionCard,
  BaseQuestionWithData,
} from "./shared/OptimizedQuestionCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AlignJustifyIcon,
  ListFilterIcon,
  PencilRuler,
  SigmaIcon,
  TargetIcon,
  BookOpenIcon,
  SearchIcon,
  RotateCcwIcon,
} from "lucide-react";
import { mathDomains, rwDomains } from "@/static-data/validation";
import { FetchQuestionByUniqueID } from "@/lib/functions/fetchQuestionDatabyUniqueID";
import { FetchQuestionByID } from "@/lib/functions/fetchQuestionByID";
import { EmptyState } from "@/components/ui/empty-state";

// Simple skeleton component
const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`animate-pulse rounded-md bg-gray-200 ${className || ""}`}
    {...props}
  />
);

interface SavedTabProps {
  selectedAssessment?: AssessmentWorkspace;
}

interface QuestionWithData extends SavedQuestion, BaseQuestionWithData {
  questionData?: QuestionById_Data;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

// State management for better performance
interface SavedTabState {
  questionsWithData: QuestionWithData[];
  allSavedQuestions: QuestionWithData[];
  displayedQuestionsCount: number;
  isLoadingMore: boolean;
  fetchedQuestionIds: Set<string>;
  isInitialized: boolean;
  filterSubject: string; // Add this new state property for subject filter
  filterDifficulty: string; // Add this new state property for difficulty filter
  filteredQuestions: QuestionWithData[]; // Filtered questions based on current filters
}

type SavedTabAction =
  | {
      type: "INITIALIZE_QUESTIONS";
      payload: { questions: QuestionWithData[]; all: QuestionWithData[] };
    }
  | {
      type: "SET_QUESTION_LOADING";
      payload: { index: number; questionId: string };
    }
  | {
      type: "SET_QUESTION_SUCCESS";
      payload: { index: number; questionData: QuestionById_Data | null };
    }
  | {
      type: "SET_QUESTION_ERROR";
      payload: { index: number; errorMessage: string };
    }
  | { type: "ADD_FETCHED_ID"; payload: string }
  | { type: "REMOVE_FETCHED_ID"; payload: string }
  | { type: "RESET_FETCHED_IDS" }
  | { type: "SET_FILTER_SUBJECT"; payload: string }
  | { type: "SET_FILTER_DIFFICULTY"; payload: string }
  | { type: "SET_FILTERED_QUESTIONS"; payload: QuestionWithData[] }
  | { type: "LOAD_MORE" }
  | { type: "SET_LOADING_MORE"; payload: boolean };

const savedTabReducer = (
  state: SavedTabState,
  action: SavedTabAction
): SavedTabState => {
  switch (action.type) {
    case "INITIALIZE_QUESTIONS":
      return {
        ...state,
        questionsWithData: action.payload.questions,
        allSavedQuestions: action.payload.all,
        displayedQuestionsCount: 10,
        isInitialized: true,
      };
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
      return {
        ...state,
        allSavedQuestions: state.questionsWithData.map((q, i) =>
          i === action.payload.index
            ? {
                ...q,
                questionData: action.payload.questionData || undefined,
                isLoading: false,
                hasError: false,
              }
            : q
        ),
        questionsWithData: state.questionsWithData.map((q, i) =>
          i === action.payload.index
            ? {
                ...q,
                questionData: action.payload.questionData || undefined,
                isLoading: false,
                hasError: false,
              }
            : q
        ),
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
      console.log("Adding fetched ID:", action.payload);
      return {
        ...state,
        fetchedQuestionIds: new Set([
          ...state.fetchedQuestionIds,
          action.payload,
        ]),
      };
    case "SET_FILTER_SUBJECT":
      return {
        ...state,
        filterSubject: action.payload,
      };
    case "SET_FILTER_DIFFICULTY":
      return {
        ...state,
        filterDifficulty: action.payload,
      };
    case "SET_FILTERED_QUESTIONS":
      return {
        ...state,
        filteredQuestions: action.payload,
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
    case "LOAD_MORE":
      const nextCount = Math.min(
        state.displayedQuestionsCount + 15,
        state.allSavedQuestions.length
      );

      return {
        ...state,
        displayedQuestionsCount: nextCount,
        isLoadingMore: false,
      };
    case "SET_LOADING_MORE":
      return {
        ...state,
        isLoadingMore: action.payload,
      };
    default:
      return state;
  }
};

export function SavedTab({ selectedAssessment }: SavedTabProps) {
  // Load saved questions from localStorage
  const [savedQuestions] = useLocalStorage<SavedQuestions>(
    "savedQuestions",
    {}
  );

  // Use reducer for better state management and performance
  const [state, dispatch] = useReducer(savedTabReducer, {
    questionsWithData: [],
    allSavedQuestions: [],
    displayedQuestionsCount: 0,
    isLoadingMore: false,
    fetchedQuestionIds: new Set<string>(),
    isInitialized: false,
    filterSubject: "all", // Default filter value for subject
    filterDifficulty: "all", // Default filter value for difficulty
    filteredQuestions: [], // Initially empty
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Get the assessment key from selectedAssessment (memoized)
  const getAssessmentKey = useCallback(
    (assessment?: AssessmentWorkspace): string => {
      if (!assessment) return "SAT"; // Default to SAT

      // Map assessment names to keys used in localStorage
      const assessmentMap: Record<string, string> = {
        SAT: "SAT",
        "PSAT/NMSQT & PSAT 10": "PSAT/NMSQT",
        "PSAT 8/9": "PSAT",
      };

      return assessmentMap[assessment.name] || "SAT";
    },
    []
  );

  // Memoize assessment key to prevent unnecessary recalculations
  const assessmentKey = useMemo(
    () => getAssessmentKey(selectedAssessment),
    [selectedAssessment, getAssessmentKey]
  );

  // Memoize assessment name to prevent unnecessary recalculations
  const assessmentName = useMemo(
    () => selectedAssessment?.name || "SAT",
    [selectedAssessment?.name]
  );

  // Fetch question data from API (memoized)
  const fetchQuestionData = useCallback(FetchQuestionByID, []);

  // Memoized retry handler to prevent recreation on every render
  const handleRetry = useCallback((index: number, questionId: string) => {
    dispatch({ type: "REMOVE_FETCHED_ID", payload: questionId });
    dispatch({ type: "SET_QUESTION_LOADING", payload: { index, questionId } });
  }, []);

  // Function to compute filtered questions
  const computeFilteredQuestions = useCallback(
    (
      questions: QuestionWithData[],
      filterSubject: string,
      filterDifficulty: string
    ): QuestionWithData[] => {
      return questions
        .filter((question) => {
          // Apply subject filter
          if (filterSubject !== "all") {
            const subject = question.questionData?.question.primary_class_cd;

            if (subject && question.questionData?.question.primary_class_cd) {
              if (
                filterSubject === "math" &&
                mathDomains.includes(
                  question.questionData?.question.primary_class_cd
                )
              ) {
                return true;
              }

              if (
                filterSubject === "reading" &&
                rwDomains.includes(
                  question.questionData?.question.primary_class_cd
                )
              ) {
                return true;
              }
            }

            return false;
          }

          return true;
        })
        .filter((question) => {
          // Apply difficulty filter
          if (filterDifficulty !== "all") {
            const difficulty = question.questionData?.question.difficulty;

            if (difficulty) {
              return filterDifficulty === difficulty.toLowerCase();
            }

            return false;
          }

          return true;
        });
    },
    []
  );

  // Compute filtered questions when questions or filters change
  useEffect(() => {
    if (state.isInitialized) {
      const filtered = computeFilteredQuestions(
        state.allSavedQuestions,
        state.filterSubject,
        state.filterDifficulty
      );
      dispatch({ type: "SET_FILTERED_QUESTIONS", payload: filtered });
    }
  }, [
    state.allSavedQuestions,
    state.filterSubject,
    state.filterDifficulty,
    state.isInitialized,
    computeFilteredQuestions,
  ]);

  // Initialize questions when assessment or saved questions change
  useEffect(() => {
    const assessmentSavedQuestions = savedQuestions[assessmentKey] || [];

    // Initialize questions with loading state
    const allQuestions: QuestionWithData[] = assessmentSavedQuestions.map(
      (question) => ({
        ...question,
        isLoading: false,
        hasError: false,
      })
    );

    const initialQuestions = allQuestions.slice(0, 15).map((q) => ({
      ...q,
      isLoading: true,
      hasError: false,
    }));

    // console.log("HEYY!", assessmentKey, selectedAssessment);
    dispatch({
      type: "INITIALIZE_QUESTIONS",
      payload: { questions: initialQuestions, all: allQuestions },
    });
    dispatch({ type: "RESET_FETCHED_IDS" });
  }, [assessmentKey, savedQuestions]);

  // Fetch question data progressively
  useEffect(() => {
    if (!state.isInitialized || state.questionsWithData.length === 0) return;

    const fetchQuestionsProgressively = async () => {
      // Find questions that need to be fetched
      const questionsToFetch = state.questionsWithData
        .slice(0, state.displayedQuestionsCount)
        .map((question, index) => ({ question, index }))
        .filter(
          ({ question }) =>
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

      // Process questions with small delays
      for (const { question, index } of questionsToFetch) {
        const id = question.externalId || question.ibn;
        if (!id) {
          dispatch({
            type: "SET_QUESTION_ERROR",
            payload: { index, errorMessage: "No valid ID to fetch question" },
          });
          continue;
        }
        try {
          console.log("FETCH question", question);
          const questionData = await fetchQuestionData(id);
          if (!questionData) {
            dispatch({
              type: "SET_QUESTION_ERROR",
              payload: { index, errorMessage: "Failed to fetch question data" },
            });
            continue;
          }
          if (!question.plainQuestion) {
            dispatch({
              type: "SET_QUESTION_ERROR",
              payload: {
                index,
                errorMessage: "Question metadata not available",
              },
            });
            continue;
          }
          dispatch({
            type: "SET_QUESTION_SUCCESS",
            payload: {
              index,
              questionData: {
                problem: questionData,
                question: question.plainQuestion,
              },
            },
          });

          // Small delay between requests
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          dispatch({
            type: "SET_QUESTION_ERROR",
            payload: { index, errorMessage },
          });
        }
      }
    };

    fetchQuestionsProgressively();
  }, [
    state.isInitialized,
    state.displayedQuestionsCount,
    state.fetchedQuestionIds,
    fetchQuestionData,
  ]);

  // Function to load more questions
  const loadMoreQuestions = useCallback(() => {
    console.log("Load more questions triggered", state.fetchedQuestionIds);
    if (
      state.isLoadingMore ||
      state.allSavedQuestions.length <= state.displayedQuestionsCount
    ) {
      return;
    }

    dispatch({ type: "SET_LOADING_MORE", payload: true });
    setTimeout(() => {
      dispatch({ type: "LOAD_MORE" });
    }, 100);
  }, [state.isLoadingMore]);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const currentLoadMoreRef = loadMoreRef.current;
    if (
      !currentLoadMoreRef ||
      state.allSavedQuestions.length <= state.displayedQuestionsCount
    )
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !state.isLoadingMore) {
          loadMoreQuestions();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentLoadMoreRef);

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [
    state.displayedQuestionsCount,
    state.isLoadingMore,
    state.fetchedQuestionIds,
    loadMoreQuestions,
  ]);

  if (!state.isInitialized) {
    return (
      <div className="w-full lg:px-28">
        <h2 className="text-lg font-semibold">Saved Questions</h2>
        <p className="text-sm text-muted-foreground">
          Loading saved questions...
        </p>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (state.questionsWithData.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Saved Questions</h2>
        <p className="text-sm text-muted-foreground">
          No saved questions found for {assessmentName}.
        </p>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <p className="text-lg">📚</p>
              <p className="mt-2">You haven&apos;t saved any questions yet.</p>
              <p className="text-sm text-muted-foreground">
                Questions you bookmark will appear here for easy review.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className=" w-full lg:px-22">
      <div className="px-8  grid grid-cols-12">
        <div className="col-span-12 md:col-span-8 flex flex-col flex-wrap gap-2 items-start text-sm ">
          <h2 className="text-lg font-semibold">Saved Questions</h2>
          <p className="text-sm text-muted-foreground">
            {state.allSavedQuestions.length} saved question
            {state.allSavedQuestions.length !== 1 ? "s" : ""} for{" "}
            {assessmentName}
          </p>
        </div>
        <div className="mt-10 md:mt-0 col-span-12 md:col-span-4 flex flex-col items-end justify-end gap-3">
          <Select
            onValueChange={(value) =>
              dispatch({ type: "SET_FILTER_SUBJECT", payload: value })
            }
          >
            <SelectTrigger
              icon={
                state.filterSubject === "all"
                  ? ListFilterIcon
                  : state.filterSubject == "math"
                  ? SigmaIcon
                  : PencilRuler
              }
              className="w-full lg:w-[80%] bg-background"
            >
              <SelectValue placeholder="Sort by subject" />
            </SelectTrigger>
            <SelectContent className="font-medium absolute">
              <SelectItem value="all" icon={AlignJustifyIcon}>
                All Subjects
              </SelectItem>
              <SelectItem value="math" icon={SigmaIcon}>
                Maths
              </SelectItem>
              <SelectItem value="reading" icon={PencilRuler}>
                Reading & Writing
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) =>
              dispatch({ type: "SET_FILTER_DIFFICULTY", payload: value })
            }
          >
            <SelectTrigger
              icon={
                state.filterDifficulty === "all" ? ListFilterIcon : TargetIcon
              }
              className="w-full lg:w-[80%] bg-background"
            >
              <SelectValue placeholder="Sort by difficulty" />
            </SelectTrigger>
            <SelectContent className="font-medium absolute">
              <SelectItem value="all" icon={AlignJustifyIcon}>
                All Difficulties
              </SelectItem>
              <SelectItem value="e" icon={TargetIcon}>
                Easy
              </SelectItem>
              <SelectItem value="m" icon={TargetIcon}>
                Medium
              </SelectItem>
              <SelectItem value="h" icon={TargetIcon}>
                Hard
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 max-w-full mx-auto  mt-10">
        {state.filteredQuestions.length === 0 ? (
          <EmptyState
            title="No questions found"
            description="No saved questions match your current filters. Try adjusting the subject or difficulty filters to see more results."
            icons={[
              <BookOpenIcon key="book" />,
              <SearchIcon key="search" />,
              <RotateCcwIcon key="reset" />,
            ]}
            action={{
              label: "Reset Filters",
              onClick: () => {
                dispatch({ type: "SET_FILTER_SUBJECT", payload: "all" });
                dispatch({ type: "SET_FILTER_DIFFICULTY", payload: "all" });
              },
              icon: <RotateCcwIcon />,
            }}
            theme="light"
            size="default"
          />
        ) : (
          state.filteredQuestions
            .slice(0, state.displayedQuestionsCount)
            .map((question, index) => (
              <div key={`${question.questionId}-${index}`} className=" mb-32">
                <OptimizedQuestionCard
                  question={question}
                  index={index}
                  onRetry={handleRetry}
                  type="saved"
                />
              </div>
            ))
        )}
      </div>

      {/* Load more trigger - invisible element for intersection observer */}
      {state.allSavedQuestions.length > state.displayedQuestionsCount && (
        <div className="space-y-4">
          <div
            ref={loadMoreRef}
            className="h-10 flex items-center justify-center"
          >
            {state.isLoadingMore && (
              <div className="text-center text-sm text-muted-foreground">
                Loading more questions...
              </div>
            )}
          </div>

          {/* Manual load more button as fallback */}
          {!state.isLoadingMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={loadMoreQuestions}
                disabled={state.isLoadingMore}
                className="px-6 py-2"
              >
                Load More Questions (
                {state.allSavedQuestions.length - state.displayedQuestionsCount}{" "}
                remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {state.questionsWithData.some((q) => q.isLoading) &&
        !state.isLoadingMore && (
          <div className="text-center text-sm text-muted-foreground">
            Loading questions...
          </div>
        )}
    </div>
  );
}
