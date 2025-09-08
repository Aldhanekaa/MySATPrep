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

// Individual answered question with metadata
export interface AnsweredQuestion {
  questionId: string;
  difficulty: "E" | "M" | "H"; // Easy, Medium, Hard
  isCorrect: boolean;
  timeSpent: number; // time in milliseconds
  timestamp: string; // ISO timestamp when answered
}

// Assessment-level statistics
export interface AssessmentStatistics {
  answeredQuestions: string[]; // list of answered question IDs (legacy)
  answeredQuestionsDetailed: AnsweredQuestion[]; // detailed answered questions with difficulty
  statistics: ClassStatistics;
}

// Main statistics structure for localStorage
export interface PracticeStatistics {
  [assessment: string]: AssessmentStatistics;
}

// Legacy alias for backward compatibility
export type PracticeRushStatistics = PracticeStatistics;

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

// Stats API Route Types

export interface StatsAssessmentInfo {
  assessment: string;
  asmtEventId: number;
}

export interface StatsDomainBreakdown {
  [domain: string]: number;
}

export interface StatsDifficultyBreakdown {
  E: number; // Easy
  M: number; // Medium
  H: number; // Hard
}

export interface StatsSkillBreakdown {
  [skillCd: string]: number;
}

export interface StatsData {
  totalQuestions: number;
  domainBreakdown: StatsDomainBreakdown;
  difficultyBreakdown: StatsDifficultyBreakdown;
  skillBreakdown: StatsSkillBreakdown;
  assessmentInfo: StatsAssessmentInfo;
}

export interface StatsAPIResponseData {
  stats: StatsData;
  totalQuestions: number;
  domainBreakdown: StatsDomainBreakdown;
  difficultyBreakdown: StatsDifficultyBreakdown;
  skillBreakdown: StatsSkillBreakdown;
  assessmentInfo: StatsAssessmentInfo;
}

export interface StatsAPIResponse {
  success: true;
  data: StatsAPIResponseData;
  message: string;
}

export interface StatsAPIErrorResponse {
  success: false;
  error: string;
  details?: string;
}
