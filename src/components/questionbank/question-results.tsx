"use client";

import React, {
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
  useId,
} from "react";
import { PlainQuestionType, QuestionDifficulty } from "@/types/question";
import { Card, CardContent } from "@/components/ui/card";
import { MultiSelectCombobox } from "../ui/multiselect-combobox";

import {
  ClockArrowDownIcon,
  ClockArrowUpIcon,
  ClockFadingIcon,
  ClockIcon,
  GalleryHorizontalIcon,
  GalleryThumbnailsIcon,
  ListIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar } from "../ui/calendar";
import {
  QuestionWithData,
  DIFFICULTY_OPTIONS,
  questionResultsReducer,
  filterQuestions,
} from "@/lib/questionbank";
import { TourAlertDialog } from "../ui/tour";
import {
  InteractiveOnboardingChecklist,
  Step,
} from "../ui/onboarding-checklist";
import { Separator } from "../ui/separator";
import { FetchQuestionByID } from "@/lib/functions/fetchQuestionByID";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { GlassFilter } from "../ui/liquid-radio";
import QB_List_Render from "./list-render";
import QB_Single_Render from "./single-render";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { SavedQuestions } from "@/types/savedQuestions";
import { PracticeStatistics } from "@/types";
import QB_Compact_Render from "./compact-render";

// Tour state interface
interface TourState {
  showTourDialog: boolean;
  onboardingOpen: boolean;
  completedSteps: Set<string>;
}

// Tour actions
type TourAction =
  | { type: "SET_SHOW_TOUR_DIALOG"; payload: boolean }
  | { type: "SET_ONBOARDING_OPEN"; payload: boolean }
  | { type: "ADD_COMPLETED_STEP"; payload: string }
  | { type: "RESET_COMPLETED_STEPS" };

// Tour reducer
const tourReducer = (state: TourState, action: TourAction): TourState => {
  switch (action.type) {
    case "SET_SHOW_TOUR_DIALOG":
      return { ...state, showTourDialog: action.payload };
    case "SET_ONBOARDING_OPEN":
      return { ...state, onboardingOpen: action.payload };
    case "ADD_COMPLETED_STEP":
      return {
        ...state,
        completedSteps: new Set([...state.completedSteps, action.payload]),
      };
    case "RESET_COMPLETED_STEPS":
      return { ...state, completedSteps: new Set() };
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
  skillsFilter?: string[]; // Skills filter from URL parameters
}

export function QuestionResults({
  questions,
  assessmentName,
  selectedSubject,
  selectedDomains,
  bluebookExternalIds,
  skillsFilter = [], // Default to empty array if not provided
}: QuestionResultsProps) {
  const id = useId();

  // Load practice statistics from localStorage with setter
  const [practiceStatistics, setPracticeStatistics] =
    useLocalStorage<PracticeStatistics>("practiceStatistics", {});

  // Check if question has been answered before in practice statistics
  const answeredQuestions =
    practiceStatistics[assessmentName]?.answeredQuestionsDetailed || [];

  // Combined state for view and answer visibility
  interface CombinedState {
    selectedValue: string;
    answerVisibility: string;
  }

  type CombinedAction =
    | { type: "SET_SELECTED_VALUE"; payload: string }
    | { type: "SET_ANSWER_VISIBILITY"; payload: string };

  const combinedReducer = (
    state: CombinedState,
    action: CombinedAction
  ): CombinedState => {
    switch (action.type) {
      case "SET_SELECTED_VALUE":
        return { ...state, selectedValue: action.payload };
      case "SET_ANSWER_VISIBILITY":
        return { ...state, answerVisibility: action.payload };
      default:
        return state;
    }
  };

  const [combinedState, combinedDispatch] = useReducer(combinedReducer, {
    selectedValue: "list",
    answerVisibility: "show",
  });

  // Use reducer for tour state management
  const [tourState, tourDispatch] = useReducer(tourReducer, {
    showTourDialog: false, // Start with false, will be set by useEffect
    onboardingOpen: false,
    completedSteps: new Set<string>(),
  });

  // Check localStorage to determine if tour should be shown
  useEffect(() => {
    const tourKey = "questionbank-onboarding";
    const hasCompletedTour = localStorage.getItem(tourKey) === "true";
    tourDispatch({ type: "SET_SHOW_TOUR_DIALOG", payload: !hasCompletedTour });
  }, []);

  // Auto-apply skills filter from URL parameters
  useEffect(() => {
    if (skillsFilter.length > 0) {
      console.log("Auto-applying skills filter:", skillsFilter);
      dispatch({
        type: "SET_SKILL_FILTER",
        payload: skillsFilter,
      });
    }
  }, [skillsFilter]);

  const steps: Step[] = [
    {
      id: "welcome",
      title: "Filter Questions by Difficulty",
      description:
        "Filter questions by difficulty level. Now try select at least 2 difficulty levels.",
      targetSelector: "[data-onboard='select-difficulties']",
      completed: tourState.completedSteps.has("welcome"),
    },
    {
      id: "skills",
      title: "Filter Questions by Skills or Topics",
      description:
        "Filter the questions by specific skills or topics to find the most relevant ones. Now try select at least 3 topics.",
      targetSelector: "[data-onboard='select-skills']",
      completed: tourState.completedSteps.has("skills"),
    },

    {
      id: "exclude-bluebook-toggler",
      title: "Exclude Bluebook Questions",
      description:
        "Toggle this option to exclude questions that are part of the Bluebook. This can help you focus on non-Bluebook content.",
      targetSelector: "[data-onboard='exclude-bluebook-toggler']",
      completed: tourState.completedSteps.has("exclude-bluebook-toggler"),
      biggerZIndex: true,
      requirePreviousStep: true,
    },
    {
      id: "bluebook-only-toggler",
      title: "Show Bluebook Questions Only",
      description:
        "Toggle this option to show only questions that are appear on Bluebook app.",
      targetSelector: "[data-onboard='bluebook-only-toggler']",
      completed: tourState.completedSteps.has("bluebook-only-toggler"),
      biggerZIndex: true,
      requirePreviousStep: true,
    },
    {
      id: "time-sort",
      title: "Sort by Time",
      description:
        "You can sort questions by their created time, sort it by newest or oldest.",
      targetSelector: "[data-onboard='time-sort']",
      completed: tourState.completedSteps.has("time-sort"),
      biggerZIndex: true,
    },
    {
      id: "date-range-filter",
      title: "Time Filter",
      description:
        "Here you can filter questions by their creation date. Use this option to find questions created within a specific date range.",
      targetSelector: "[data-onboard='date-range-filter']",
      completed: tourState.completedSteps.has("date-range-filter"),
      biggerZIndex: true,
    },
  ];

  const handleCompleteStep = (stepId: string) => {
    tourDispatch({ type: "ADD_COMPLETED_STEP", payload: stepId });
  };

  const handleFinish = () => {
    console.log("Onboarding completed!");
    tourDispatch({ type: "SET_ONBOARDING_OPEN", payload: false });
  };

  const resetDemo = () => {
    tourDispatch({ type: "RESET_COMPLETED_STEPS" });
    tourDispatch({ type: "SET_ONBOARDING_OPEN", payload: true });
  };

  const completedCount = steps.filter((step) =>
    tourState.completedSteps.has(step.id)
  ).length;
  const isOnboardingComplete = completedCount === steps.length;

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
    excludeBluebookQuestions: false,
    onlyBluebookQuestions: false,
    sortOrder: "default",
    dateRange: null,
    answerStatus: "all",
  });

  // Memoized filtered questions that includes Bluebook filtering
  const actualFilteredQuestions = useMemo(() => {
    const filtered = filterQuestions(
      state.questionsWithData,
      state.selectedDifficulties,
      state.selectedSkills,
      state.excludeBluebookQuestions,
      state.onlyBluebookQuestions,
      state.sortOrder,
      state.dateRange,
      bluebookExternalIds,
      selectedSubject,
      state.answerStatus,
      answeredQuestions
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
    state.sortOrder,
    state.dateRange,
    state.answerStatus,
    bluebookExternalIds,
    selectedSubject,
    answeredQuestions,
  ]);

  // Memoized callback for requesting more questions in single view
  const handleRequestMoreQuestions = useCallback(() => {
    // Only increase visible count if we haven't reached the total questions
    if (state.visibleCount < actualFilteredQuestions.length) {
      dispatch({ type: "INCREASE_VISIBLE_COUNT", payload: 10 });
    }
  }, [state.visibleCount, actualFilteredQuestions.length]);

  // Memoized callback for fetching a specific question
  const fetchSpecificQuestion = useCallback(
    async (questionId: string) => {
      // Find the question in the questionsWithData array
      const questionIndex = state.questionsWithData.findIndex(
        (q) => q.questionId === questionId
      );

      if (questionIndex === -1) {
        console.warn(`Question with ID ${questionId} not found`);
        return;
      }

      const question = state.questionsWithData[questionIndex];

      // Don't fetch if already fetched, has data, or has error
      if (
        !question.isLoading ||
        question.questionData ||
        question.hasError ||
        state.fetchedQuestionIds.has(questionId)
      ) {
        return;
      }

      try {
        // Mark this question as being fetched
        dispatch({ type: "ADD_FETCHED_ID", payload: questionId });

        const id = question.external_id || question.ibn;
        if (!id) {
          dispatch({
            type: "SET_QUESTION_ERROR",
            payload: {
              index: questionIndex,
              errorMessage: "No valid ID to fetch question",
            },
          });
          return;
        }

        const questionData = await FetchQuestionByID(id);

        if (questionData) {
          dispatch({
            type: "SET_QUESTION_SUCCESS",
            payload: {
              index: questionIndex,
              questionData: {
                problem: questionData,
                question: question,
              },
            },
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        dispatch({
          type: "SET_QUESTION_ERROR",
          payload: { index: questionIndex, errorMessage },
        });
      }
    },
    [state.questionsWithData, state.fetchedQuestionIds]
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

  // Reset fetched IDs when sort order changes to prevent stale fetching state
  useEffect(() => {
    dispatch({ type: "RESET_FETCHED_IDS" });
  }, [state.sortOrder]);

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
  }, [
    hasMoreQuestions,
    state.isLoadingMore,
    state.isInitialized,
    combinedState.selectedValue,
  ]);

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

        // console.log("state.visibleCount", state.visibleCount);

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

        // console.log(
        //   "questionsToFetch",
        //   questionsToFetch,
        //   questionsToFetch.length
        // );
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
              const id = question.external_id || question.ibn;
              if (!id) {
                dispatch({
                  type: "SET_QUESTION_ERROR",
                  payload: {
                    index,
                    errorMessage: "No valid ID to fetch question",
                  },
                });
                return;
              }
              const questionData = await FetchQuestionByID(id);

              if (questionData) {
                dispatch({
                  type: "SET_QUESTION_SUCCESS",
                  payload: {
                    index,
                    questionData: {
                      problem: questionData,
                      question: question,
                    },
                  },
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

  useEffect(() => {
    if (tourState.onboardingOpen && !isOnboardingComplete) {
      if (
        !tourState.completedSteps.has("welcome") &&
        state.selectedDifficulties.length > 1
      ) {
        handleCompleteStep("welcome");
      }
      if (
        !tourState.completedSteps.has("skills") &&
        state.selectedSkills.length > 2
      ) {
        handleCompleteStep("skills");
      }

      if (
        !tourState.completedSteps.has("exclude-bluebook-toggler") &&
        state.excludeBluebookQuestions
      ) {
        handleCompleteStep("exclude-bluebook-toggler");
      }
      if (
        !tourState.completedSteps.has("bluebook-only-toggler") &&
        state.onlyBluebookQuestions
      ) {
        handleCompleteStep("bluebook-only-toggler");
      }

      if (
        !tourState.completedSteps.has("time-sort") &&
        state.sortOrder !== "default"
      ) {
        handleCompleteStep("time-sort");
      }
    }
  }, [
    state.selectedDifficulties,
    state.selectedSkills,
    state.excludeBluebookQuestions,
    state.onlyBluebookQuestions,
    state.sortOrder,
  ]);

  if (!state.isInitialized) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Question Results</h2>
        <p className="text-sm text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  // console.log("state.filteredQuestions", state.filteredQuestions);
  return (
    <div className="space-y-6 px-2 max-w-full lg:max-w-7xl xl:max-w-[92rem] mx-auto">
      <TourAlertDialog
        startTour={() => {
          tourDispatch({ type: "SET_ONBOARDING_OPEN", payload: true });
          tourDispatch({ type: "SET_SHOW_TOUR_DIALOG", payload: false });
        }}
        isOpen={tourState.showTourDialog}
        setIsOpen={(isOpen) => {
          tourDispatch({ type: "SET_SHOW_TOUR_DIALOG", payload: isOpen });
        }}
        tourLocalStorageKey="questionbank-onboarding"
        tourTitle="Welcome to Question Bank!"
        tourDescription="This short tour will guide you through filtering and finding questions effectively."
      />

      <InteractiveOnboardingChecklist
        steps={steps}
        open={tourState.onboardingOpen}
        onOpenChange={(open) =>
          tourDispatch({ type: "SET_ONBOARDING_OPEN", payload: open })
        }
        onCompleteStep={handleCompleteStep}
        onFinish={handleFinish}
        mode="standard"
        placement="right"
        tourLocalStorageKey="questionbank-onboarding"
      />

      <div className="px-8 lg:px-28 grid grid-cols-12 pt-3">
        <div className="col-span-12  flex flex-col flex-wrap gap-2 items-start text-sm">
          <h2 className="text-lg lg:text-2xl font-semibold">
            Question Results
          </h2>
          <p className="text-sm lg:text-lg text-muted-foreground">
            {state.selectedDifficulties.length > 0 ||
            state.selectedSkills.length > 0 ||
            state.dateRange ? (
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
                    : state.selectedSkills.length > 0
                    ? " by skills"
                    : ""}
                  {state.dateRange ? " by date" : ""}
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
      </div>
      <div className="px-8 lg:px-28 flex flex-col lg:flex-row items-start justify-start gap-3">
        <div className="h-12">
          <MultiSelectCombobox
            data-onboard="select-difficulties"
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
        </div>
        <div className="h-12">
          <MultiSelectCombobox
            data-onboard="select-skills"
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
        <div className="h-12">
          <Select
            value={state.sortOrder}
            onValueChange={(value: "default" | "newest" | "oldest") => {
              dispatch({
                type: "SET_SORT_ORDER",
                payload: value,
              });
            }}
          >
            <SelectTrigger
              className="bg-white h-full"
              icon={ClockFadingIcon}
              data-onboard="time-sort"
            >
              <SelectValue placeholder={"Filter by Date"} />
            </SelectTrigger>
            <SelectContent className="font-medium">
              <SelectItem value="default" icon={ClockIcon}>
                Default
              </SelectItem>
              <SelectItem value="newest" icon={ClockArrowUpIcon}>
                Newest First
              </SelectItem>
              <SelectItem value="oldest" icon={ClockArrowDownIcon}>
                Oldest First
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-12">
          <Calendar
            compact
            allowClear
            dataOnboard="date-range-filter"
            disableFuture
            isDocsPage
            showTimeInput={false}
            onChange={(dateRange) =>
              dispatch({ type: "SET_DATE_RANGE", payload: dateRange })
            }
            onClick={() => {
              if (!tourState.completedSteps.has("date-range-filter")) {
                handleCompleteStep("date-range-filter");
              }
            }}
            value={state.dateRange}
          />
        </div>
      </div>

      <Separator className="my-6 lg:my-10" />
      <div className="max-w-full  mx-auto lg:px-22">
        <div className="mt-10 mb-10 max-w-full lg:max-w-6xl xl:max-w-5xl px-8 md:mt-0 col-span-12 flex flex-row flex-wrap items-end justify-start gap-3">
          <div className="border-2 border-gray-200 rounded-full p-1">
            <RadioGroup
              value={combinedState.selectedValue}
              onValueChange={(value) =>
                combinedDispatch({ type: "SET_SELECTED_VALUE", payload: value })
              }
              className="group rounded-full  p-2 relative inline-grid grid-cols-[1fr_1fr_1fr] items-center gap-3 text-sm font-medium after:absolute after:inset-y-0 after:w-[calc(33.333%)] after:rounded-full after:bg-blue-500 after:text-white after:shadow-sm after:shadow-black/5 after:outline-offset-2 after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] has-[:focus-visible]:after:outline has-[:focus-visible]:after:outline-2 has-[:focus-visible]:after:outline-ring/70 data-[state=list]:after:translate-x-0 data-[state=single]:after:translate-x-full data-[state=compact]:after:translate-x-[200%]"
              data-state={combinedState.selectedValue}
            >
              <label
                className={`relative z-10 inline-flex h-full  cursor-pointer select-none items-center justify-center whitespace-nowrap  space-x-1 transition-colors ${
                  combinedState.selectedValue === "list"
                    ? "text-neutral-50"
                    : "text-neutral-400"
                }`}
              >
                <ListIcon />
                List
                <RadioGroupItem
                  id={`${id}-1`}
                  value="list"
                  className="sr-only p-2 "
                />
              </label>
              <label
                className={`relative z-10 inline-flex h-full  cursor-pointer select-none items-center justify-center whitespace-nowrap  space-x-1 transition-colors ${
                  combinedState.selectedValue === "single"
                    ? "text-neutral-50"
                    : "text-neutral-400"
                }`}
              >
                <GalleryHorizontalIcon />
                Single
                <RadioGroupItem
                  id={`${id}-2`}
                  value="single"
                  className="sr-only"
                />
              </label>
              <label
                className={`relative z-10 inline-flex h-full  cursor-pointer select-none items-center px-2 justify-center whitespace-nowrap  space-x-1 transition-colors ${
                  combinedState.selectedValue === "compact"
                    ? "text-neutral-50"
                    : "text-neutral-400"
                }`}
              >
                <GalleryThumbnailsIcon />
                Compact
                <RadioGroupItem
                  id={`${id}-2`}
                  value="compact"
                  className="sr-only"
                />
              </label>
            </RadioGroup>
          </div>

          <div
            className="border-2 border-gray-200 rounded-full p-1 mt-2"
            data-onboard="exclude-bluebook-toggler"
          >
            <RadioGroup
              value={state.excludeBluebookQuestions ? "exclude" : "include"}
              onValueChange={(value) =>
                dispatch({
                  type: "TOGGLE_EXCLUDE_BLUEBOOK",
                  payload: value === "exclude",
                })
              }
              className="group rounded-full p-2 relative inline-grid grid-cols-[1fr_1fr] items-center gap-3 text-sm font-medium after:absolute after:inset-y-0 after:w-[calc(50%)] after:rounded-full after:bg-blue-500 after:text-white after:shadow-sm after:shadow-black/5 after:outline-offset-2 after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] has-[:focus-visible]:after:outline has-[:focus-visible]:after:outline-2 has-[:focus-visible]:after:outline-ring/70 data-[state=include]:after:translate-x-0 data-[state=exclude]:after:translate-x-full"
              data-state={
                state.excludeBluebookQuestions ? "exclude" : "include"
              }
            >
              <label
                className={`relative z-10 inline-flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap space-x-1 transition-colors ${
                  !state.excludeBluebookQuestions
                    ? "text-neutral-50"
                    : "text-neutral-400"
                }`}
              >
                Include Bluebook
                <RadioGroupItem
                  id={`${id}-include`}
                  value="include"
                  className="sr-only"
                />
              </label>
              <label
                className={`relative z-10 inline-flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap space-x-1 transition-colors ${
                  state.excludeBluebookQuestions
                    ? "text-neutral-50"
                    : "text-neutral-400"
                }`}
              >
                Exclude Bluebook
                <RadioGroupItem
                  id={`${id}-exclude`}
                  value="exclude"
                  className="sr-only"
                />
              </label>
            </RadioGroup>
          </div>
          <div
            className="border-2 border-gray-200 rounded-full p-1 mt-2"
            data-onboard="bluebook-only-toggler"
          >
            <RadioGroup
              value={state.onlyBluebookQuestions ? "bluebook-only" : "all"}
              onValueChange={(value) =>
                dispatch({
                  type: "TOGGLE_ONLY_BLUEBOOK",
                  payload: value === "bluebook-only",
                })
              }
              className="group rounded-full p-2 relative inline-grid grid-cols-[1fr_1fr] items-center gap-3 text-sm font-medium after:absolute after:inset-y-0 after:w-[calc(50%)] after:rounded-full after:bg-blue-500 after:text-white after:shadow-sm after:shadow-black/5 after:outline-offset-2 after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] has-[:focus-visible]:after:outline has-[:focus-visible]:after:outline-2 has-[:focus-visible]:after:outline-ring/70 data-[state=all]:after:translate-x-0 data-[state=bluebook-only]:after:translate-x-full"
              data-state={state.onlyBluebookQuestions ? "bluebook-only" : "all"}
            >
              <label
                className={`relative z-10 inline-flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap space-x-1 transition-colors ${
                  !state.onlyBluebookQuestions
                    ? "text-neutral-50"
                    : "text-neutral-400"
                }`}
              >
                All Questions
                <RadioGroupItem
                  id={`${id}-all`}
                  value="all"
                  className="sr-only"
                />
              </label>
              <label
                className={`relative z-10 inline-flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap space-x-1 transition-colors ${
                  state.onlyBluebookQuestions
                    ? "text-neutral-50"
                    : "text-neutral-400"
                }`}
              >
                Bluebook Only
                <RadioGroupItem
                  id={`${id}-bluebook-only`}
                  value="bluebook-only"
                  className="sr-only"
                />
              </label>
            </RadioGroup>
          </div>
          <div className="border-2 border-gray-200 rounded-full p-1 mt-2">
            <RadioGroup
              value={state.answerStatus}
              onValueChange={(value: "all" | "answered" | "not-answered") =>
                dispatch({
                  type: "SET_ANSWER_STATUS",
                  payload: value,
                })
              }
              className="group rounded-full p-2 relative inline-grid grid-cols-[1fr_1fr_1fr] items-center gap-3 text-sm font-medium after:absolute after:inset-y-0 after:w-[calc(33.333%)] after:rounded-full after:bg-blue-500 after:text-white after:shadow-sm after:shadow-black/5 after:outline-offset-2 after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] has-[:focus-visible]:after:outline has-[:focus-visible]:after:outline-2 has-[:focus-visible]:after:outline-ring/70 data-[state=all]:after:translate-x-0 data-[state=answered]:after:translate-x-full data-[state=not-answered]:after:translate-x-[200%]"
              data-state={state.answerStatus}
            >
              <label
                className={`relative z-10 inline-flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap space-x-1 transition-colors ${
                  state.answerStatus === "all"
                    ? "text-neutral-50"
                    : "text-neutral-400"
                }`}
              >
                All
                <RadioGroupItem
                  id={`${id}-all`}
                  value="all"
                  className="sr-only"
                />
              </label>
              <label
                className={`relative z-10 inline-flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap space-x-1 transition-colors ${
                  state.answerStatus === "answered"
                    ? "text-neutral-50"
                    : "text-neutral-400"
                }`}
              >
                Answered
                <RadioGroupItem
                  id={`${id}-answered`}
                  value="answered"
                  className="sr-only"
                />
              </label>
              <label
                className={`relative z-10 inline-flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap space-x-1 transition-colors ${
                  state.answerStatus === "not-answered"
                    ? "text-neutral-50"
                    : "text-neutral-400"
                }`}
              >
                Not Answered
                <RadioGroupItem
                  id={`${id}-not-answered`}
                  value="not-answered"
                  className="sr-only"
                />
              </label>
            </RadioGroup>
          </div>
          <div className="border-2 border-gray-200 rounded-full p-1 mt-2">
            <RadioGroup
              value={combinedState.answerVisibility}
              onValueChange={(value) =>
                combinedDispatch({
                  type: "SET_ANSWER_VISIBILITY",
                  payload: value,
                })
              }
              className="group rounded-full p-2 relative inline-grid grid-cols-[1fr_1fr] items-center gap-3 text-sm font-medium after:absolute after:inset-y-0 after:w-[calc(50%)] after:rounded-full after:bg-blue-500 after:text-white after:shadow-sm after:shadow-black/5 after:outline-offset-2 after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] has-[:focus-visible]:after:outline has-[:focus-visible]:after:outline-2 has-[:focus-visible]:after:outline-ring/70 data-[state=show]:after:translate-x-0 data-[state=hide]:after:translate-x-full"
              data-state={combinedState.answerVisibility}
            >
              <label
                className={`relative z-10 inline-flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap space-x-1 transition-colors ${
                  combinedState.answerVisibility === "show"
                    ? "text-neutral-50"
                    : "text-neutral-400"
                }`}
              >
                Show Answer Choice
                <RadioGroupItem
                  id={`${id}-show`}
                  value="show"
                  className="sr-only"
                />
              </label>
              <label
                className={`relative z-10 inline-flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap space-x-1 transition-colors ${
                  combinedState.answerVisibility === "hide"
                    ? "text-neutral-50"
                    : "text-neutral-400"
                }`}
              >
                Hide Answer Choice
                <RadioGroupItem
                  id={`${id}-hide`}
                  value="hide"
                  className="sr-only"
                />
              </label>
            </RadioGroup>
          </div>
        </div>
        {actualFilteredQuestions.length > 0 ? (
          combinedState.selectedValue == "list" ? (
            <QB_List_Render
              answerVisibility={combinedState.answerVisibility}
              questions={actualFilteredQuestions}
              visibleCount={state.visibleCount}
              handleRetry={handleRetry}
            />
          ) : combinedState.selectedValue == "single" ? (
            <QB_Single_Render
              questions={actualFilteredQuestions}
              visibleCount={state.visibleCount}
              handleRetry={handleRetry}
              onRequestMoreQuestions={handleRequestMoreQuestions}
              answerVisibility={combinedState.answerVisibility}
            />
          ) : (
            <QB_Compact_Render
              questions={actualFilteredQuestions}
              visibleCount={state.visibleCount}
              handleRetry={handleRetry}
              onRequestMoreQuestions={handleRequestMoreQuestions}
              fetchSpecificQuestion={fetchSpecificQuestion}
              answerVisibility={combinedState.answerVisibility}
              assessmentName={assessmentName}
            />
          )
        ) : (
          (() => {
            const hasQuestionsWithMissingDifficulty =
              state.questionsWithData.some((q) => !q.difficulty);

            return (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <p className="text-4xl mb-4">🔍</p>
                    <h3 className="text-lg font-medium mb-2">
                      {state.selectedDifficulties.length > 0 ||
                      state.selectedSkills.length > 0 ||
                      state.dateRange
                        ? "No questions match your filter criteria"
                        : "No questions available"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {state.selectedDifficulties.length > 0 ||
                      state.selectedSkills.length > 0 ||
                      state.dateRange ? (
                        <>
                          We couldn't find any questions matching the selected
                          {state.selectedDifficulties.length > 0 &&
                          state.selectedSkills.length > 0 &&
                          state.dateRange
                            ? " difficulty, skill, and date filters"
                            : state.selectedDifficulties.length > 0 &&
                              state.selectedSkills.length > 0
                            ? " difficulty and skill filters"
                            : state.selectedDifficulties.length > 0 &&
                              state.dateRange
                            ? " difficulty and date filters"
                            : state.selectedSkills.length > 0 && state.dateRange
                            ? " skill and date filters"
                            : state.selectedDifficulties.length > 0
                            ? " difficulty levels"
                            : state.selectedSkills.length > 0
                            ? " skills"
                            : " date range"}
                          .
                          {hasQuestionsWithMissingDifficulty && (
                            <span className="block mt-2 text-xs text-amber-600">
                              Note: Some questions may not have difficulty data
                              assigned. Try selecting "Easy" to include
                              questions with missing difficulty information.
                            </span>
                          )}
                        </>
                      ) : (
                        "There are no questions available for this assessment."
                      )}
                    </p>

                    {(state.selectedDifficulties.length > 0 ||
                      state.selectedSkills.length > 0 ||
                      state.dateRange) && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium">
                          Try these options:
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <button
                            onClick={() => {
                              dispatch({ type: "RESET_DIFFICULTY_FILTER" });
                              dispatch({ type: "RESET_SKILL_FILTER" });
                              dispatch({
                                type: "SET_DATE_RANGE",
                                payload: null,
                              });
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
                                    payload: [
                                      ...state.selectedDifficulties,
                                      "E",
                                    ],
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
                                state.questionsWithData.filter(
                                  (q) => !q.difficulty
                                ).length
                              }
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })()
        )}
      </div>

      {loadingIndicator}

      {/* Infinite scroll trigger */}
      {combinedState.selectedValue == "list" && hasMoreQuestions && (
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
      {combinedState.selectedValue == "list" &&
        !hasMoreQuestions &&
        actualFilteredQuestions.length > 10 && (
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
                      actualFilteredQuestions.filter(
                        (q) => !q.difficulty
                      ).length;
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
