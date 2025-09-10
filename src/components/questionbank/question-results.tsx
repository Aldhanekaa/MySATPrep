"use client";

import React, {
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { PlainQuestionType, QuestionDifficulty } from "@/types/question";
import { Card, CardContent } from "@/components/ui/card";
import { OptimizedQuestionCard } from "../dashboard/shared/OptimizedQuestionCard";
import { MultiSelectCombobox } from "../ui/multiselect-combobox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  PersistentPopover,
  PersistentPopoverContent,
  PersistentPopoverTrigger,
} from "../ui/persistent-popover";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import {
  ClockArrowDownIcon,
  ClockArrowUpIcon,
  ClockFadingIcon,
  ClockIcon,
  SlidersHorizontalIcon,
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
  QuestionResultsState,
  DIFFICULTY_OPTIONS,
  questionResultsReducer,
  filterQuestions,
  fetchQuestionData,
} from "@/lib/questionbank";
import { AlertDialog } from "../ui/alert-dialog";
import { TourAlertDialog } from "../ui/tour";
import {
  InteractiveOnboardingChecklist,
  Step,
} from "../ui/onboarding-checklist";

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
}

export function QuestionResults({
  questions,
  assessmentName,
  selectedSubject,
  selectedDomains,
  bluebookExternalIds,
}: QuestionResultsProps) {
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
      id: "advanced-filter",
      title: "Advanced Filter Options",
      description:
        "Here you can find more specific filtering options, including created date sorting, excluding bluebook options, and more. Open the advanced filter menu to explore these options.",
      targetSelector: "[data-onboard='advanced-filter']",
      completed: tourState.completedSteps.has("advanced-filter"),
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
    state.sortOrder,
    state.dateRange,
    bluebookExternalIds,
    selectedSubject,
  ]);

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

  if (actualFilteredQuestions.length === 0) {
    const hasQuestionsWithMissingDifficulty = state.questionsWithData.some(
      (q) => !q.difficulty
    );

    return (
      <div className="space-y-6 px-2 max-w-full lg:max-w-7xl xl:max-w-[92rem] mx-auto">
        <div className="px-8 lg:px-28 grid grid-cols-12 py-4">
          <div className="col-span-12 md:col-span-5 flex flex-col flex-wrap gap-2 items-start text-sm">
            <h2 className="text-lg font-semibold">Question Results</h2>
            <p className="text-sm text-muted-foreground">
              {state.selectedDifficulties.length > 0 ||
              state.selectedSkills.length > 0 ||
              state.dateRange ? (
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
                  state.selectedSkills.length > 0 ||
                  state.dateRange) && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Try these options:</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button
                        onClick={() => {
                          dispatch({ type: "RESET_DIFFICULTY_FILTER" });
                          dispatch({ type: "RESET_SKILL_FILTER" });
                          dispatch({ type: "SET_DATE_RANGE", payload: null });
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
      <TourAlertDialog
        startTour={() => {
          tourDispatch({ type: "SET_ONBOARDING_OPEN", payload: true });
          tourDispatch({ type: "SET_SHOW_TOUR_DIALOG", payload: false });
        }}
        isOpen={tourState.showTourDialog}
        setIsOpen={(isOpen) =>
          tourDispatch({ type: "SET_SHOW_TOUR_DIALOG", payload: isOpen })
        }
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
        tourLocalStorageKey="questionbank-onboarding"
      />

      <div className="px-8 lg:px-28 grid grid-cols-12 py-3">
        <div className="col-span-12 md:col-span-5 flex flex-col flex-wrap gap-2 items-start text-sm">
          <h2 className="text-lg font-semibold">Question Results</h2>
          <p className="text-sm text-muted-foreground">
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
        <div className="mt-10 md:mt-0 col-span-12 md:col-span-7 flex flex-col lg:flex-row items-end justify-end gap-3">
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

          <PersistentPopover>
            <PersistentPopoverTrigger asChild className="h-full cursor-pointer">
              <Button
                data-onboard="advanced-filter"
                onClick={() => {
                  if (
                    tourState.onboardingOpen &&
                    !tourState.completedSteps.has("advanced-filter")
                  ) {
                    handleCompleteStep("advanced-filter");
                  }
                }}
                variant="outline"
                className="h-full"
              >
                Filter <SlidersHorizontalIcon />
              </Button>
            </PersistentPopoverTrigger>

            <PersistentPopoverContent
              side="bottom"
              align="end"
              preventClose={tourState.onboardingOpen}
            >
              <div className="flex flex-col gap-y-2">
                <div
                  className="flex items-center gap-2"
                  data-onboard="exclude-bluebook-toggler"
                >
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
                <div
                  className="flex items-center gap-2"
                  data-onboard="bluebook-only-toggler"
                >
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

                <Calendar
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
            </PersistentPopoverContent>
          </PersistentPopover>
        </div>
      </div>

      <div className=" max-w-full mx-auto lg:px-22">
        {actualFilteredQuestions
          .slice(0, state.visibleCount)
          .map((question, index) => (
            <div key={`${question.questionId}-${index}`} className="mb-32">
              <OptimizedQuestionCard
                withDate
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
