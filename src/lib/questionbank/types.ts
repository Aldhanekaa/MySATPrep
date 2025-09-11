import {
  PlainQuestionType,
  QuestionById_Data,
  QuestionDifficulty,
} from "@/types/question";
import { RangeValue } from "@/components/ui/calendar";

export interface BaseQuestionWithData {
  questionId: string;
  timestamp: string;
  questionData?: QuestionById_Data;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export interface QuestionWithData
  extends PlainQuestionType,
    BaseQuestionWithData {
  timestamp: string;
  questionData?: QuestionById_Data;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export interface QuestionResultsState {
  questionsWithData: QuestionWithData[];
  fetchedQuestionIds: Set<string>;
  isInitialized: boolean;
  visibleCount: number;
  hasMoreQuestions: boolean;
  isLoadingMore: boolean;
  selectedDifficulties: QuestionDifficulty[];
  selectedSkills: string[];
  excludeBluebookQuestions: boolean;
  onlyBluebookQuestions: boolean;
  sortOrder: "default" | "newest" | "oldest";
  dateRange: RangeValue | null;
  answerStatus: "all" | "answered" | "not-answered";
}

export type QuestionResultsAction =
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
  | { type: "TOGGLE_ONLY_BLUEBOOK"; payload: boolean }
  | { type: "SET_SORT_ORDER"; payload: "default" | "newest" | "oldest" }
  | { type: "SET_DATE_RANGE"; payload: RangeValue | null }
  | { type: "SET_ANSWER_STATUS"; payload: "all" | "answered" | "not-answered" };

export interface QuestionResultsProps {
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

export interface BluebookExternalIds {
  mathLiveItems: string[];
  readingLiveItems: string[];
}
