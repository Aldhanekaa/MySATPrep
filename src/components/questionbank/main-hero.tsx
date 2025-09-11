"use client";

import React from "react";

import { useReducer, useCallback } from "react";
import {
  BookOpen,
  BookOpenCheckIcon,
  Pyramid,
  PencilRuler,
  PyramidIcon,
  PencilRulerIcon,
  BookMarkedIcon,
  BookIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MultiSelectCombobox } from "@/components/ui/multiselect-combobox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WarpBackground } from "../ui/warp-background";
import { MultiIconDisplay } from "../ui/empty-state";
import { Assessments } from "@/static-data/assessment";
import { domains, primaryClassCdObjectData } from "@/static-data/domains";
import { PlainQuestionType } from "@/types";
import { QuestionResults } from "./question-results";
import ButtonsGroup from "../dashboard/buttons-group";

// Bluebook external IDs interface
interface BluebookExternalIds {
  mathLiveItems: string[];
  readingLiveItems: string[];
}

// State management for better performance
interface MainHeroState {
  selected: string[];
  selectedAssessment: string;
  selectedSubject: string;
  isExpanded: boolean;
  showResults: boolean;
  appliedFilters: {
    assessment: string;
    subject: string;
    domains: string[];
  };
  questions: PlainQuestionType[];
  isLoading: boolean;
  error: string | null;
  bluebookExternalIds: BluebookExternalIds;
}

type MainHeroAction =
  | { type: "SET_SELECTED"; payload: string[] }
  | { type: "SET_SELECTED_ASSESSMENT"; payload: string }
  | { type: "SET_SELECTED_SUBJECT"; payload: string }
  | { type: "SET_IS_EXPANDED"; payload: boolean }
  | { type: "SET_SHOW_RESULTS"; payload: boolean }
  | {
      type: "SET_APPLIED_FILTERS";
      payload: { assessment: string; subject: string; domains: string[] };
    }
  | { type: "SET_QUESTIONS"; payload: PlainQuestionType[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET_SUBJECT_AND_DOMAINS" }
  | { type: "RESET_DOMAINS" }
  | { type: "SET_BLUEBOOK_MATH_IDS"; payload: string[] }
  | { type: "SET_BLUEBOOK_READING_IDS"; payload: string[] }
  | {
      type: "SET_BLUEBOOK_IDS";
      payload: { mathLiveItems: string[]; readingLiveItems: string[] };
    }
  | { type: "RESET_BLUEBOOK_IDS" };

const mainHeroReducer = (
  state: MainHeroState,
  action: MainHeroAction
): MainHeroState => {
  switch (action.type) {
    case "SET_SELECTED":
      return { ...state, selected: action.payload };
    case "SET_SELECTED_ASSESSMENT":
      return { ...state, selectedAssessment: action.payload };
    case "SET_SELECTED_SUBJECT":
      return { ...state, selectedSubject: action.payload };
    case "SET_IS_EXPANDED":
      return { ...state, isExpanded: action.payload };
    case "SET_SHOW_RESULTS":
      return { ...state, showResults: action.payload };
    case "SET_APPLIED_FILTERS":
      return { ...state, appliedFilters: action.payload };
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "RESET_SUBJECT_AND_DOMAINS":
      return { ...state, selectedSubject: "", selected: [] };
    case "RESET_DOMAINS":
      return { ...state, selected: [] };
    case "SET_BLUEBOOK_MATH_IDS":
      return {
        ...state,
        bluebookExternalIds: {
          ...state.bluebookExternalIds,
          mathLiveItems: action.payload,
        },
      };
    case "SET_BLUEBOOK_READING_IDS":
      return {
        ...state,
        bluebookExternalIds: {
          ...state.bluebookExternalIds,
          readingLiveItems: action.payload,
        },
      };
    case "SET_BLUEBOOK_IDS":
      return {
        ...state,
        bluebookExternalIds: action.payload,
      };
    case "RESET_BLUEBOOK_IDS":
      return {
        ...state,
        bluebookExternalIds: {
          mathLiveItems: [],
          readingLiveItems: [],
        },
      };
    default:
      return state;
  }
};

export function QB_MainHero() {
  const [state, dispatch] = useReducer(mainHeroReducer, {
    selected: [],
    selectedAssessment: "",
    selectedSubject: "",
    isExpanded: false,
    showResults: false,
    appliedFilters: {
      assessment: "",
      subject: "",
      domains: [],
    },
    questions: [],
    isLoading: false,
    error: null,
    bluebookExternalIds: {
      mathLiveItems: [],
      readingLiveItems: [],
    },
  });

  // Get available domains based on selected subject (memoized)
  const getAvailableDomains = useCallback(() => {
    if (
      !state.selectedSubject ||
      !domains[state.selectedSubject as keyof typeof domains]
    ) {
      return [];
    }

    return domains[state.selectedSubject as keyof typeof domains].map(
      (domain) => ({
        value: domain.primaryClassCd,
        label: domain.text,
        description: `${domain.skill.length} skills`,
        id: domain.id,
      })
    );
  }, [state.selectedSubject]);

  const renderDomain = useCallback(
    (option: ReturnType<typeof getAvailableDomains>[0]) => (
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span>{option.label}</span>
          <span className="text-xs text-muted-foreground">
            {option.description}
          </span>
        </div>
      </div>
    ),
    []
  );

  const renderSelectedDomains = useCallback((value: string[]) => {
    if (value.length === 0) return "";
    if (value.length === 1) {
      const domain = primaryClassCdObjectData[value[0]];
      return domain ? domain.text : value[0];
    }
    return `${value.length} domains selected`;
  }, []);

  // Check if current filters differ from applied filters (memoized)
  const hasFiltersChanged = useCallback(() => {
    return (
      state.selectedAssessment !== state.appliedFilters.assessment ||
      state.selectedSubject !== state.appliedFilters.subject ||
      JSON.stringify(state.selected.sort()) !==
        JSON.stringify(state.appliedFilters.domains.sort())
    );
  }, [
    state.selectedAssessment,
    state.selectedSubject,
    state.selected,
    state.appliedFilters,
  ]);

  // Check if filters have been applied (not initial state) (memoized)
  const hasAppliedFilters = useCallback(() => {
    return (
      state.appliedFilters.assessment !== "" &&
      state.appliedFilters.subject !== "" &&
      state.appliedFilters.domains.length > 0
    );
  }, [state.appliedFilters]);

  const handleAssessmentChange = useCallback((value: string) => {
    dispatch({ type: "SET_SELECTED_ASSESSMENT", payload: value });
    dispatch({ type: "RESET_SUBJECT_AND_DOMAINS" });
    dispatch({ type: "SET_SHOW_RESULTS", payload: false });
    dispatch({ type: "SET_IS_EXPANDED", payload: false });
    console.log(
      "Selected assessment:",
      value,
      Assessments[value as keyof typeof Assessments]
    );
  }, []);

  const handleSubjectChange = useCallback((value: string) => {
    dispatch({ type: "SET_SELECTED_SUBJECT", payload: value });
    dispatch({ type: "RESET_DOMAINS" });
    dispatch({ type: "SET_SHOW_RESULTS", payload: false });
    dispatch({ type: "SET_IS_EXPANDED", payload: false });
    console.log("Selected subject:", value);
  }, []);

  const handleApplyFilter = useCallback(async () => {
    const filterData = {
      assessment: state.selectedAssessment,
      assessmentData:
        Assessments[state.selectedAssessment as keyof typeof Assessments],
      subject: state.selectedSubject,
      domains: state.selected,
      domainData: state.selected
        .map((domainId) => primaryClassCdObjectData[domainId])
        .filter(Boolean),
    };

    console.log("Applying filter with:", filterData);

    // Save applied filters
    dispatch({
      type: "SET_APPLIED_FILTERS",
      payload: {
        assessment: state.selectedAssessment,
        subject: state.selectedSubject,
        domains: [...state.selected],
      },
    });

    // Trigger card expansion animation
    dispatch({ type: "SET_IS_EXPANDED", payload: true });

    // Delay showing results until animation completes (800ms animation + 200ms buffer)
    setTimeout(() => {
      dispatch({ type: "SET_SHOW_RESULTS", payload: true });
    }, 1000);

    // Start loading
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const response = await fetch(
        `/api/get-questions?assessment=${
          state.selectedAssessment
        }&domains=${state.selected.join(",")}`
      );

      const responseData = await response.json();
      // console.log("API response:", responseData);

      if (responseData && responseData.success && responseData.data) {
        const questionsDataBasedOnFilter: PlainQuestionType[] =
          responseData.data;

        console.log("questionsDataBasedOnFilter", questionsDataBasedOnFilter);
        dispatch({
          type: "SET_QUESTIONS",
          payload: questionsDataBasedOnFilter,
        });
      } else {
        throw new Error(responseData.error || "Failed to fetch questions");
      }

      if (state.bluebookExternalIds.mathLiveItems.length == 0) {
        // now fetch the Bluebook's questions
        const responseLookup = await fetch(`/api/lookup`);
        const responseLookupData = await responseLookup.json();

        console.log("responseLookupData", responseLookupData);
        console.log("responseLookupData", responseLookupData.data);

        if (
          responseLookupData &&
          responseLookupData.success &&
          responseLookupData.data
        ) {
          const BluebookMathsQuestionsExternalIds =
            responseLookupData.data.mathLiveItems;
          const BluebookReadingWritingsQuestionsExternalIds =
            responseLookupData.data.readingLiveItems;

          // console.log(
          //   "BluebookMathsQuestionsExternalIds",
          //   BluebookMathsQuestionsExternalIds
          // );

          // Dispatch the external IDs to state
          dispatch({
            type: "SET_BLUEBOOK_IDS",
            payload: {
              mathLiveItems: BluebookMathsQuestionsExternalIds || [],
              readingLiveItems:
                BluebookReadingWritingsQuestionsExternalIds || [],
            },
          });

          console.log("Bluebook external IDs dispatched to state successfully");
        }

        console.log("responseLookupData", responseLookupData);
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      dispatch({
        type: "SET_ERROR",
        payload:
          err instanceof Error ? err.message : "Failed to fetch questions",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.selectedAssessment, state.selectedSubject, state.selected]);

  return (
    <React.Fragment>
      <WarpBackground
        disableAnimation={state.isExpanded}
        className={`${
          state.isExpanded ? "border-0 " : "min-h-[1100px]"
        } flex items-center justify-center p-0`}
      >
        <motion.div
          className="relative w-full md:w-[10/12] xl:w-5xl"
          initial={false}
          animate={state.isExpanded ? { width: "100%" } : {}}
          transition={{
            duration: 0.8,
            ease: [0.4, 0.0, 0.2, 1],
          }}
        >
          <motion.div
            className="mx-auto my-auto"
            initial={false}
            animate={state.isExpanded ? { height: "auto", width: "100%" } : {}}
            transition={{
              duration: 0.8,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            style={{ height: "60vh", width: "100%" }}
          >
            <Card
              className={`w-full h-full ${
                state.isExpanded && "shadow-none border-0 bg-none  "
              }`}
            >
              <CardContent className="flex flex-col gap-2 px-0 overflow-hidden">
                <div className=" p-3">
                  <motion.div
                    className="flex flex-col items-center justify-center p-0 rounded-3xl"
                    initial={false}
                    animate={
                      state.isExpanded
                        ? {
                            backgroundColor: "var(--color-secondary)",
                            paddingBottom: 80,
                            paddingTop: 20,
                          }
                        : { backgroundColor: "transparent" }
                    }
                    transition={{
                      duration: 0.8,
                      ease: [0.4, 0.0, 0.2, 1],
                    }}
                  >
                    <div className="w-full max-w-3xl mx-auto flex flex-col items-center pt-20">
                      <motion.div
                        className="mb-10"
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          duration: 0.6,
                          ease: [0.4, 0.0, 0.2, 1],
                          delay: 0.2,
                        }}
                      >
                        <MultiIconDisplay
                          icons={[
                            <Pyramid />,
                            <BookOpenCheckIcon />,
                            <PencilRuler />,
                          ]}
                          theme={"light"}
                        />
                      </motion.div>
                      {/* Welcome message */}
                      <div className="mb-10 text-center">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex flex-col items-center"
                        >
                          <h1 className="text-3xl font-bold bg-clip-text text-blue-500 mb-2">
                            SAT/PSAT Question Bank
                          </h1>
                          <p className="text-gray-500 max-w-md">
                            Search and explore a vast of SAT and PSAT questions
                            directly from Collegeboard question bank collections
                            to enhance your test preparation.
                          </p>
                        </motion.div>
                      </div>

                      {/* Input area with integrated functions and file upload */}
                      <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-4">
                        <motion.div
                          className="px-4 py-3 grid grid-cols-4 md:grid-cols-7 gap-3"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.7,
                            ease: [0.4, 0.0, 0.2, 1],
                            delay: 0.4,
                          }}
                        >
                          <motion.div
                            className="col-span-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.5,
                              ease: [0.4, 0.0, 0.2, 1],
                              delay: 0.5,
                            }}
                          >
                            <Select
                              value={state.selectedAssessment}
                              onValueChange={handleAssessmentChange}
                            >
                              <SelectTrigger
                                className="bg-white h-full"
                                icon={BookMarkedIcon}
                              >
                                <SelectValue placeholder="Select Assessment" />
                              </SelectTrigger>
                              <SelectContent className="font-medium">
                                {Object.entries(Assessments).map(
                                  ([key, assessment]) => (
                                    <SelectItem
                                      key={key}
                                      value={key}
                                      icon={BookIcon}
                                    >
                                      {assessment.text}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </motion.div>

                          <motion.div
                            className="col-span-2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.5,
                              ease: [0.4, 0.0, 0.2, 1],
                              delay: 0.6,
                            }}
                          >
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="bg-white h-full">
                                    <Select
                                      value={state.selectedSubject}
                                      onValueChange={handleSubjectChange}
                                      disabled={!state.selectedAssessment}
                                    >
                                      <SelectTrigger
                                        className="bg-white h-full"
                                        icon={BookOpen}
                                      >
                                        <SelectValue
                                          placeholder={
                                            state.selectedAssessment
                                              ? "Select Subject"
                                              : "Select Assessment First"
                                          }
                                        />
                                      </SelectTrigger>
                                      <SelectContent className="font-medium">
                                        <SelectItem
                                          value="Math"
                                          icon={PyramidIcon}
                                        >
                                          Maths
                                        </SelectItem>
                                        <SelectItem
                                          value="R&W"
                                          icon={PencilRulerIcon}
                                        >
                                          Reading & Writing
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TooltipTrigger>
                                {!state.selectedAssessment && (
                                  <TooltipContent>
                                    <p>Please select an assessment first</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </motion.div>

                          <motion.div
                            className="col-span-4 md:col-span-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.5,
                              ease: [0.4, 0.0, 0.2, 1],
                              delay: 0.7,
                            }}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`h-full transition-opacity duration-300 ${
                                      !state.selectedSubject
                                        ? "pointer-events-none opacity-50"
                                        : ""
                                    }`}
                                  >
                                    <MultiSelectCombobox
                                      label={
                                        state.selectedSubject
                                          ? "Domains"
                                          : "Select Subject First"
                                      }
                                      options={getAvailableDomains()}
                                      value={state.selected}
                                      onChange={(value) =>
                                        dispatch({
                                          type: "SET_SELECTED",
                                          payload: value,
                                        })
                                      }
                                      renderItem={renderDomain}
                                      renderSelectedItem={renderSelectedDomains}
                                    />
                                  </div>
                                </TooltipTrigger>
                                {!state.selectedSubject && (
                                  <TooltipContent>
                                    <p>Please select a subject first</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </motion.div>
                        </motion.div>

                        {/* Error Display */}
                        {state.error && (
                          <div className="px-4 py-2">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-red-700 text-sm">
                                {state.error}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Apply Filter Button */}
                        <motion.div
                          className="px-4 pb-4"
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            duration: 0.6,
                            ease: [0.4, 0.0, 0.2, 1],
                            delay: 0.8,
                          }}
                        >
                          <motion.div
                            whileHover={{
                              scale: 1.02,
                              transition: { duration: 0.2, ease: "easeOut" },
                            }}
                            whileTap={{
                              scale: 0.98,
                              transition: { duration: 0.1, ease: "easeOut" },
                            }}
                          >
                            <Button
                              onClick={() => {
                                if (
                                  !(hasAppliedFilters() && !hasFiltersChanged())
                                ) {
                                  handleApplyFilter();
                                }
                              }}
                              disabled={
                                !state.selectedAssessment ||
                                !state.selectedSubject ||
                                state.selected.length === 0 ||
                                state.isLoading
                              }
                              className={`group w-full text-lg py-6 rounded-2xl font-bold transform transition-all duration-200 ${
                                !state.selectedAssessment ||
                                !state.selectedSubject ||
                                state.selected.length === 0
                                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                  : state.isLoading
                                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                  : hasAppliedFilters() && !hasFiltersChanged()
                                  ? "bg-gradient-to-b from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white shadow-[0_4px_0_0_theme(colors.green.600),0_8px_20px_theme(colors.green.500/0.25)] hover:shadow-[0_6px_0_0_theme(colors.green.700),0_10px_25px_theme(colors.green.500/0.3)] active:shadow-[0_2px_0_0_theme(colors.green.600),0_4px_10px_theme(colors.green.500/0.2)] active:translate-y-0.5"
                                  : "hover:cursor-pointer bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-[0_4px_0_0_theme(colors.blue.600),0_8px_20px_theme(colors.blue.500/0.25)] hover:shadow-[0_6px_0_0_theme(colors.blue.700),0_10px_25px_theme(colors.blue.500/0.3)] active:shadow-[0_2px_0_0_theme(colors.blue.600),0_4px_10px_theme(colors.blue.500/0.2)] active:translate-y-0.5"
                              }`}
                            >
                              <motion.span
                                key={
                                  state.isLoading
                                    ? "loading"
                                    : hasAppliedFilters() &&
                                      !hasFiltersChanged()
                                    ? "applied"
                                    : "apply"
                                }
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                              >
                                {state.isLoading
                                  ? "Loading Questions..."
                                  : state.error
                                  ? "Error - Try Again"
                                  : hasAppliedFilters() && !hasFiltersChanged()
                                  ? `Filter Applied (${
                                      state.selected.length
                                    } domain${
                                      state.selected.length !== 1 ? "s" : ""
                                    })`
                                  : `Apply Filter (${
                                      state.selected.length
                                    } domain${
                                      state.selected.length !== 1 ? "s" : ""
                                    } selected)`}
                              </motion.span>
                            </Button>
                          </motion.div>
                        </motion.div>
                      </div>
                      <ButtonsGroup showReview={false} />
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </WarpBackground>

      {state.questions.length > 0 && state.showResults && (
        <div className="min-h-screen">
          <QuestionResults
            selectedSubject={state.selectedSubject}
            questions={state.questions}
            selectedDomains={state.selected
              .map((domainId) => primaryClassCdObjectData[domainId])
              .filter(Boolean)
              .reduce((acc, domain) => {
                acc[domain.primaryClassCd] = domain;
                return acc;
              }, {} as Record<string, (typeof primaryClassCdObjectData)[string]>)}
            assessmentName={
              Assessments[state.selectedAssessment as keyof typeof Assessments]
                ?.text || state.selectedAssessment
            }
            bluebookExternalIds={state.bluebookExternalIds}
          />
        </div>
      )}
    </React.Fragment>
  );
}
