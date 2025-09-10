import { QuestionDifficulty } from "@/types/question";

// Difficulty filter options constant with correct mappings
export const DIFFICULTY_OPTIONS = [
  { value: "E" as QuestionDifficulty, label: "Easy", id: "E" },
  { value: "M" as QuestionDifficulty, label: "Medium", id: "M" },
  { value: "H" as QuestionDifficulty, label: "Hard", id: "H" },
];

// Pagination constants
export const INITIAL_VISIBLE_COUNT = 10;
export const LOAD_MORE_BATCH_SIZE = 10;

// API fetching constants
export const API_BATCH_SIZE = 3;
export const API_BATCH_DELAY = 200;
export const FETCH_DEBOUNCE_DELAY = 100;

// Intersection Observer constants
export const OBSERVER_THRESHOLD = 0.1;
export const OBSERVER_ROOT_MARGIN = "100px";
export const LOAD_MORE_DELAY = 300;
