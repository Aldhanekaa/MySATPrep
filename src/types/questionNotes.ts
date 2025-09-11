/**
 * Question Notes TypeScript interfaces
 * These types handle the localStorage structure for personal notes on questions
 */

// Individual question note
export interface QuestionNote {
  questionId: string;
  // New metadata fields for richer notes filtering/grouping
  difficulty?: string; // "E" | "M" | "H"
  primaryClassCd?: string; // domain code
  skillCd?: string; // skill code
  subject?: string; // derived subject (e.g., "math", "reading-writing")
  createdDate?: number; // from question.createDate
  updatedDate?: number; // from question.updateDate
  note: string;
  timestamp: string; // ISO timestamp when created/last modified
  createdAt: string; // ISO timestamp when first created
}

// Question notes organized by assessment
export interface QuestionNotes {
  [assessment: string]: QuestionNote[];
}
