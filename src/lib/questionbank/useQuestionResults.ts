import { useEffect, useCallback, useMemo, useReducer, useRef } from "react";
import { PlainQuestionType } from "@/types/question";
import { QuestionWithData, QuestionResultsState } from "./types";
import { questionResultsReducer } from "./reducer";
import { filterQuestions } from "./filters";
import { fetchQuestionData } from "./api";
import {
  INITIAL_VISIBLE_COUNT,
  LOAD_MORE_BATCH_SIZE,
  API_BATCH_SIZE,
  API_BATCH_DELAY,
  FETCH_DEBOUNCE_DELAY,
  OBSERVER_THRESHOLD,
  OBSERVER_ROOT_MARGIN,
  LOAD_MORE_DELAY,
} from "./constants";

export const useQuestionResults = (
  questions: PlainQuestionType[],
  selectedSubject: string,
  bluebookExternalIds?: { mathLiveItems: string[]; readingLiveItems: string[] }
) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Use reducer for better state management and performance
  const [state, dispatch] = useReducer(questionResultsReducer, {
    questionsWithData: [],
    fetchedQuestionIds: new Set<string>(),
    isInitialized: false,
    visibleCount: INITIAL_VISIBLE_COUNT,
    hasMoreQuestions: true,
    isLoadingMore: false,
    selectedDifficulties: [],
    selectedSkills: [],
    excludeBluebookQuestions: false,
    onlyBluebookQuestions: false,
    sortOrder: "default",
    dateRange: null,
  });

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
            dispatch({
              type: "INCREASE_VISIBLE_COUNT",
              payload: LOAD_MORE_BATCH_SIZE,
            });
            dispatch({ type: "SET_LOADING_MORE", payload: false });
          }, LOAD_MORE_DELAY);
        }
      },
      {
        threshold: OBSERVER_THRESHOLD,
        rootMargin: OBSERVER_ROOT_MARGIN, // Start loading when user is 100px away from the trigger
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
        for (let i = 0; i < questionsToFetch.length; i += API_BATCH_SIZE) {
          const batch = questionsToFetch.slice(i, i + API_BATCH_SIZE);

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
          if (i + API_BATCH_SIZE < questionsToFetch.length) {
            await new Promise((resolve) =>
              setTimeout(resolve, API_BATCH_DELAY)
            );
          }
        }
      };

      fetchQuestionsProgressively();
    }, FETCH_DEBOUNCE_DELAY); // 100ms debounce

    return () => clearTimeout(fetchTimeout);
  }, [
    state.isInitialized,
    actualFilteredQuestions,
    state.isLoadingMore,
    state.visibleCount,
  ]);

  return {
    state,
    dispatch,
    actualFilteredQuestions,
    hasMoreQuestions,
    handleRetry,
    loadMoreRef,
  };
};
