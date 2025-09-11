/**
 * Saved Collections TypeScript interfaces
 * These types handle the localStorage structure for saved question collections/folders
 */

import { SavedQuestion } from "./savedQuestions";

// Individual collection folder
export interface SavedCollection {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  questionIds: string[]; // Array of question IDs in this collection
  questionDetails: Array<{
    questionId: string;
    externalId?: string | null;
    ibn?: string | null;
  }>; // Additional question metadata for better identification
  color?: string; // Optional color for the folder
}

// Collections organized by ID
export interface SavedCollections {
  [collectionId: string]: SavedCollection;
}

// Interface for collection with actual question data
export interface CollectionWithQuestions extends SavedCollection {
  questions: SavedQuestion[];
}
