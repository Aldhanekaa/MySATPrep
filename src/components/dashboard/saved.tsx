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
} from "lucide-react";
import { mathDomains, rwDomains } from "@/static-data/validation";
import { FetchQuestionByUniqueID } from "@/lib/functions/fetchQuestionDatabyUniqueID";

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
        displayedQuestionsCount: action.payload.questions.length,
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
      const newQuestions = state.allSavedQuestions
        .slice(state.displayedQuestionsCount, nextCount)
        .map((q) => ({
          ...q,
          isLoading: true,
          hasError: false,
        }));

      return {
        ...state,
        questionsWithData: [...state.questionsWithData, ...newQuestions],
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
  const fetchQuestionData = useCallback(FetchQuestionByUniqueID, []);

  // Memoized retry handler to prevent recreation on every render
  const handleRetry = useCallback((index: number, questionId: string) => {
    dispatch({ type: "REMOVE_FETCHED_ID", payload: questionId });
    dispatch({ type: "SET_QUESTION_LOADING", payload: { index, questionId } });
  }, []);

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
        try {
          const questionData = await fetchQuestionData(question.questionId);

          dispatch({
            type: "SET_QUESTION_SUCCESS",
            payload: { index, questionData },
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
    state.questionsWithData,
    state.fetchedQuestionIds,
    fetchQuestionData,
  ]);

  // Function to load more questions
  const loadMoreQuestions = useCallback(() => {
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
  }, [
    state.isLoadingMore,
    state.allSavedQuestions.length,
    state.displayedQuestionsCount,
  ]);

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
    state.allSavedQuestions.length,
    state.displayedQuestionsCount,
    state.isLoadingMore,
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
    <div className=" w-full">
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
        </div>
      </div>

      <div className="space-y-4 max-w-full mx-auto  mt-10">
        {state.questionsWithData
          .filter((question) => {
            // console.log("state.filterSubject", state.filterSubject);
            // Apply subject filter
            if (state.filterSubject !== "all") {
              // console.log("question.questionData", question.questionData);
              const subject = question.questionData?.question.primary_class_cd;

              if (subject && question.questionData?.question.primary_class_cd) {
                if (
                  state.filterSubject === "math" &&
                  mathDomains.includes(
                    question.questionData?.question.primary_class_cd
                  )
                ) {
                  return true;
                }

                if (
                  state.filterSubject === "reading" &&
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
          .map((question, index) => (
            <div key={`${question.questionId}-${index}`} className=" mb-32">
              <OptimizedQuestionCard
                question={question}
                index={index}
                onRetry={handleRetry}
                type="saved"
              />
            </div>
          ))}
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
