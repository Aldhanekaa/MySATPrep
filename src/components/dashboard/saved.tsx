import React, { useEffect, useCallback, useMemo, useReducer } from "react";
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
  fetchedQuestionIds: Set<string>;
  isInitialized: boolean;
  filterSubject: string; // Add this new state property for subject filter
}

type SavedTabAction =
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
  | { type: "SET_FILTER_SUBJECT"; payload: string }; // Add this new action type

const savedTabReducer = (
  state: SavedTabState,
  action: SavedTabAction
): SavedTabState => {
  switch (action.type) {
    case "INITIALIZE_QUESTIONS":
      return {
        ...state,
        questionsWithData: action.payload,
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
                questionData: action.payload.questionData,
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
    fetchedQuestionIds: new Set<string>(),
    isInitialized: false,
    filterSubject: "all", // Default filter value for subject
  });

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
  const handleRetry = useCallback((index: number, questionId: string) => {
    dispatch({ type: "REMOVE_FETCHED_ID", payload: questionId });
    dispatch({ type: "SET_QUESTION_LOADING", payload: { index, questionId } });
  }, []);

  // Initialize questions when assessment or saved questions change
  useEffect(() => {
    const assessmentSavedQuestions = savedQuestions[assessmentKey] || [];

    // Initialize questions with loading state
    const initialQuestions: QuestionWithData[] = assessmentSavedQuestions.map(
      (question) => ({
        ...question,
        isLoading: true,
        hasError: false,
      })
    );

    console.log("HEYY!", assessmentKey, selectedAssessment);
    dispatch({ type: "INITIALIZE_QUESTIONS", payload: initialQuestions });
    dispatch({ type: "RESET_FETCHED_IDS" });
  }, [assessmentKey, savedQuestions]);

  // Fetch question data progressively (optimized with debouncing)
  useEffect(() => {
    if (!state.isInitialized || state.questionsWithData.length === 0) return;

    // Debounce the fetching to prevent too many rapid calls
    const fetchTimeout = setTimeout(() => {
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
    state.questionsWithData,
    state.fetchedQuestionIds,
    fetchQuestionData,
  ]);

  // Memoize loading indicator to prevent unnecessary re-renders
  const loadingIndicator = useMemo(() => {
    const hasLoadingQuestions = state.questionsWithData.some(
      (q) => q.isLoading
    );
    return hasLoadingQuestions ? (
      <div className="text-center text-sm text-muted-foreground">
        Loading more questions...
      </div>
    ) : null;
  }, [state.questionsWithData]);

  if (!state.isInitialized) {
    return (
      <div className="space-y-4">
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
    <div className="space-y-6 px-2 max-w-7xl mx-auto">
      <div className="px-8 lg:px-28 grid grid-cols-12">
        <div className="col-span-12 md:col-span-8 flex flex-col flex-wrap gap-2 items-start text-sm ">
          <h2 className="text-lg font-semibold">Saved Questions</h2>
          <p className="text-sm text-muted-foreground">
            {state.questionsWithData.length} saved question
            {state.questionsWithData.length !== 1 ? "s" : ""} for{" "}
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

      <div className="space-y-4 max-w-full mx-auto lg:px-22">
        {state.questionsWithData
          .filter((question) => {
            console.log("state.filterSubject", state.filterSubject);
            // Apply subject filter
            if (state.filterSubject !== "all") {
              console.log("question.questionData", question.questionData);
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

      {loadingIndicator}
    </div>
  );
}
