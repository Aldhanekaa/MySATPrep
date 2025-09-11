import SAT_Vocabs from "@/static-data/cleaned_sat_vocabulary.json";
import { partOfSpeechType } from "./dictionaryapi";

export interface VocabularyWord {
  word: string;
  part_of_speech: partOfSpeechType;
  definition: string;
  example: string;
  page: number;
  categories: string[];
  difficulty: "easy" | "medium" | "hard";
  syllable_count: number;
  word_length: number;
}

export type VocabularyData = VocabularyWord[];

export const vocabs_database: VocabularyData = SAT_Vocabs.words.map(
  (vocab) => ({
    ...vocab,
    difficulty: vocab.difficulty as "easy" | "medium" | "hard",
    part_of_speech: vocab.part_of_speech as partOfSpeechType,
  })
);

export interface VocabsData {
  // LocalStorage interface for vocabs data
  learntVocabs: string[];
  userSentences: { [word: string]: string[] }; // Changed to array of strings
}

export interface QuizAttempt {
  word: string;
  questionType:
    | "definition-quiz"
    | "vocab-quiz"
    | "vocabs-match"
    | "fill-blank"
    | "define"
    | "sentence";
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  timeSpent?: number; // in seconds
  timestamp: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface WordPerformance {
  word: string;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  lastAttemptTimestamp: number;
  averageTimeSpent: number;
  strugglingAreas: (
    | "definition-quiz"
    | "vocab-quiz"
    | "vocabs-match"
    | "fill-blank"
    | "define"
    | "sentence"
  )[];
  masteryLevel: "struggling" | "learning" | "proficient" | "mastered";
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
}

export interface PracticePerformanceData {
  attempts: QuizAttempt[];
  wordPerformance: { [word: string]: WordPerformance };
  lastUpdated: number;
  totalQuizzesTaken: number;
  overallAccuracy: number;
  strongWords: string[]; // Words user is good at
  weakWords: string[]; // Words user needs to practice
  improvingWords: string[]; // Words user is getting better at
}

export type ChatAPI_Definition_SuccessResponse = {
  result: {
    correct: boolean;
    exampleSentence: string;
    aiResponse: string;
    hint: string;
  };
  success: true;
};

export type ChatAPI_WriteASentence_SuccessResponse = {
  result: {
    correct: boolean;
    exampleSentence: string;
    aiResponse: string;
    hint: string;
  };
  success: true;
};

export type ChatAPI_FailureResponse = {
  message: string;
  success: false;
};
