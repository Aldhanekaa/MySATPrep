/**
 * Practice Rush Statistics TypeScript interfaces
 * These types handle the localStorage structure for tracking user performance
 */

import { SkillCd_Variants, DomainItems } from "./lookup";

// Assessment types that match your practice selections
export type AssessmentType = "SAT" | "PSAT/NMSQT" | "PSAT";

// Individual question statistics
export interface QuestionStatistic {
  time: number; // time taken in milliseconds
  answer: string; // user's selected answer
  isCorrect: boolean; // whether the answer was correct
  external_id?: string; // external ID of the question
  ibn?: string; // ISBN of the question
}

// Statistics organized by skill code and question ID
export interface SkillStatistics {
  [questionId: string]: QuestionStatistic;
}

// Statistics organized by primary class code (domain) and skill code
export interface DomainStatistics {
  [skillCd: string]: SkillStatistics;
}

// Statistics organized by primary class code
export interface ClassStatistics {
  [primaryClassCd: string]: DomainStatistics;
}

// Assessment-level statistics
export interface AssessmentStatistics {
  answeredQuestions: string[]; // list of answered question IDs
  statistics: ClassStatistics;
}

// Main statistics structure for localStorage
export interface PracticeRushStatistics {
  [assessment: string]: AssessmentStatistics;
}

// Utility interfaces for working with statistics
export interface StatisticEntry {
  assessment: AssessmentType;
  primaryClassCd: DomainItems;
  skillCd: SkillCd_Variants;
  questionId: string;
  statistic: QuestionStatistic;
  external_id?: string;
  ibn?: string;
}

// Summary statistics for analysis
export interface SkillSummary {
  skillCd: SkillCd_Variants;
  totalQuestions: number;
  correctAnswers: number;
  averageTime: number;
  accuracy: number; // percentage
}

export interface DomainSummary {
  primaryClassCd: DomainItems;
  skills: SkillSummary[];
  totalQuestions: number;
  correctAnswers: number;
  averageTime: number;
  accuracy: number; // percentage
}

export interface AssessmentSummary {
  assessment: AssessmentType;
  domains: DomainSummary[];
  totalQuestions: number;
  correctAnswers: number;
  averageTime: number;
  accuracy: number; // percentage
}
