import { QuestionResultsState, QuestionResultsAction } from "./types";
import { INITIAL_VISIBLE_COUNT } from "./constants";

export const questionResultsReducer = (
  state: QuestionResultsState,
  action: QuestionResultsAction
): QuestionResultsState => {
  switch (action.type) {
    case "INITIALIZE_QUESTIONS": {
      return {
        ...state,
        questionsWithData: action.payload,
        isInitialized: true,
        visibleCount: INITIAL_VISIBLE_COUNT,
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

      return {
        ...state,
        questionsWithData: newQuestionData,
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
      const newVisibleCount = state.visibleCount + action.payload;
      return {
        ...state,
        visibleCount: newVisibleCount,
      };
    }
    case "SET_LOADING_MORE":
      return {
        ...state,
        isLoadingMore: action.payload,
      };

    case "SET_DIFFICULTY_FILTER": {
      return {
        ...state,
        selectedDifficulties: action.payload,
        visibleCount: INITIAL_VISIBLE_COUNT,
        isLoadingMore: false,
      };
    }
    case "RESET_DIFFICULTY_FILTER": {
      return {
        ...state,
        selectedDifficulties: [],
        visibleCount: INITIAL_VISIBLE_COUNT,
        isLoadingMore: false,
      };
    }
    case "SET_SKILL_FILTER": {
      return {
        ...state,
        selectedSkills: action.payload,
        visibleCount: INITIAL_VISIBLE_COUNT,
        isLoadingMore: false,
      };
    }
    case "RESET_SKILL_FILTER": {
      return {
        ...state,
        selectedSkills: [],
        visibleCount: INITIAL_VISIBLE_COUNT,
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
    case "SET_SORT_ORDER": {
      return {
        ...state,
        sortOrder: action.payload,
        visibleCount: INITIAL_VISIBLE_COUNT, // Reset visible count when sorting changes
      };
    }
    case "SET_DATE_RANGE": {
      return {
        ...state,
        dateRange: action.payload,
        visibleCount: INITIAL_VISIBLE_COUNT, // Reset visible count when date filter changes
      };
    }
    default:
      return state;
  }
};
