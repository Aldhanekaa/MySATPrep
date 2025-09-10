/**
 * Question Notes TypeScript interfaces
 * These types handle the localStorage structure for personal notes on questions
 */

// Individual question note
export interface QuestionNote {
  questionId: string;
  note: string;
  timestamp: string; // ISO timestamp when created/last modified
  createdAt: string; // ISO timestamp when first created
}

// Question notes organized by assessment
export interface QuestionNotes {
  [assessment: string]: QuestionNote[];
}
