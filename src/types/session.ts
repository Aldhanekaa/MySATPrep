/**
 * Session-related TypeScript interfaces for the SAT Practice Application
 * These types ensure type safety for practice session data, analytics, and persistence
 */

import { QuestionDifficulty } from "./question";

// Import PlainQuestionType for enhanced answered question details
import type { PlainQuestionType } from "./question";

// Session configuration constants
export const SESSION_CONFIG = {
  MAX_HISTORY_SESSIONS: 10,
  SESSION_TIMEOUT_MS: 2 * 60 * 60 * 1000, // 2 hours
  AUTO_SAVE_INTERVAL_MS: 30 * 1000, // 30 seconds
  STORAGE_KEYS: {
    CURRENT_SESSION: "currentPracticeSession",
    SESSION_HISTORY: "practiceHistory",
    USER_PREFERENCES: "userPracticePreferences",
  },
} as const;

// Session status enum
export enum SessionStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  PAUSED = "paused",
  COMPLETED = "completed",
  ABANDONED = "abandoned",
  EXPIRED = "expired",
}

/**
 * Domain configuration for practice selection
 * Represents subject areas like Algebra, Geometry, etc.
 */
export interface Domain {
  id: string;
  text: string;
  primaryClassCd: string;
}

/**
 * Skill configuration for practice selection
 * Represents specific skills within domains
 */
export interface Skill {
  id: string;
  text: string;
  skill_cd: string;
}

/**
 * Complete practice selection configuration
 * Defines what type of practice session the user wants
 */
export interface PracticeSelections {
  practiceType: string;
  assessment: string;
  subject: string;
  domains: Domain[];
  skills: Skill[];
  difficulties: QuestionDifficulty[];
  randomize: boolean;
  questionIds?: string[]; // Optional pre-selected question IDs for shared links
}

/**
 * Question answers mapping
 * Maps question IDs to the user's selected answers
 */
export interface QuestionAnswers {
  [questionId: string]: string | null;
}

/**
 * Question timing data mapping
 * Maps question IDs to response time in milliseconds
 */
export interface QuestionTimes {
  [questionId: string]: number;
}

/**
 * Question details for answered questions
 * Contains metadata about each answered question
 */
export interface AnsweredQuestionDetail {
  questionId: string;
  externalId: string | null;
  ibn: string | null;
  plainQuestion?: PlainQuestionType; // Optional plain question data for enhanced details
}

/**
 * Array of answered question details
 * Tracks metadata for all questions answered in a session
 */
export type AnsweredQuestionDetails = AnsweredQuestionDetail[];

// Session analytics and statistics
export interface SessionAnalytics {
  totalQuestions: number;
  answeredQuestions: string[];
  averageTimePerQuestion: number; // in milliseconds
  totalTimeSpent: number; // in milliseconds
  accuracy?: number; // percentage of correct answers
  completionRate?: number; // percentage of questions completed
}

// Complete practice session data structure
export interface PracticeSession {
  // Core session identification
  sessionId: string;
  timestamp: string; // ISO 8601 format
  status: SessionStatus;

  // Practice configuration
  practiceSelections: PracticeSelections;

  // Session progress
  currentQuestionStep: number;

  // Response data
  questionAnswers: QuestionAnswers;
  questionTimes: QuestionTimes;
  answeredQuestionDetails: AnsweredQuestionDetails; // New field for question metadata

  // Analytics (computed values)
  totalQuestions: number;
  answeredQuestions: string[];
  averageTimePerQuestion: number;
  totalTimeSpent: number;
  totalXPReceived?: number; // XP gained/lost during this session
}

// Extended session with additional analytics
export interface ExtendedPracticeSession extends PracticeSession {
  analytics: SessionAnalytics;
  performance: {
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    fastestResponse: number; // milliseconds
    slowestResponse: number; // milliseconds
  };
}

// Session storage structure for localStorage
export interface SessionStorage {
  currentPracticeSession: PracticeSession | null;
  practiceHistory: PracticeSession[];
}

// Session state for useReducer or state management
export interface SessionState {
  isActive: boolean;
  startTime: number;
  endTime?: number;
  isPaused: boolean;
  pausedTime: number; // total paused duration
}

// Factory function return type for creating new sessions
export interface CreateSessionOptions {
  practiceSelections: PracticeSelections;
  totalQuestions: number;
}

// Session update payload for analytics
export interface SessionUpdatePayload {
  questionId: string;
  selectedAnswer: string | null;
  timeElapsed: number;
  isCorrect?: boolean;
}

// Session completion summary
export interface SessionSummary {
  sessionId: string;
  completedAt: string;
  duration: number; // total session time in milliseconds
  questionsAttempted: number;
  questionsCorrect: number;
  averageTimePerQuestion: number;
  subject: string;
  difficulty: QuestionDifficulty[];
}

// Session performance metrics
export interface SessionPerformance {
  accuracy: number; // percentage (0-100)
  completionRate: number; // percentage (0-100)
  averageTimePerQuestion: number; // milliseconds
  totalTimeSpent: number; // milliseconds
  questionsCorrect: number;
  questionsIncorrect: number;
  questionsSkipped: number;
  fastestResponse: number; // milliseconds
  slowestResponse: number; // milliseconds
  difficultyBreakdown: {
    [key in QuestionDifficulty]: {
      attempted: number;
      correct: number;
      averageTime: number;
    };
  };
}

// Session comparison data for progress tracking
export interface SessionComparison {
  currentSession: SessionSummary;
  previousSession?: SessionSummary;
  improvement: {
    accuracyChange: number; // percentage point change
    speedChange: number; // milliseconds change in average time
    completionRateChange: number; // percentage point change
  };
  streaks: {
    correctAnswers: number;
    sessionsCompleted: number;
  };
}

// Type guards for session validation
export const isValidPracticeSession = (
  obj: unknown
): obj is PracticeSession => {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "sessionId" in obj &&
    "timestamp" in obj &&
    "currentQuestionStep" in obj &&
    "practiceSelections" in obj &&
    "questionAnswers" in obj &&
    "questionTimes" in obj &&
    "answeredQuestionDetails" in obj &&
    "answeredQuestions" in obj &&
    "totalQuestions" in obj &&
    "averageTimePerQuestion" in obj &&
    "totalTimeSpent" in obj &&
    typeof (obj as PracticeSession).sessionId === "string" &&
    typeof (obj as PracticeSession).timestamp === "string" &&
    typeof (obj as PracticeSession).currentQuestionStep === "number" &&
    Array.isArray((obj as PracticeSession).answeredQuestions) &&
    Array.isArray((obj as PracticeSession).answeredQuestionDetails) &&
    typeof (obj as PracticeSession).totalQuestions === "number" &&
    typeof (obj as PracticeSession).averageTimePerQuestion === "number" &&
    typeof (obj as PracticeSession).totalTimeSpent === "number"
  );
};

export const isValidPracticeSelections = (
  obj: unknown
): obj is PracticeSelections => {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "practiceType" in obj &&
    "assessment" in obj &&
    "subject" in obj &&
    "domains" in obj &&
    "skills" in obj &&
    "difficulties" in obj &&
    "randomize" in obj &&
    typeof (obj as PracticeSelections).practiceType === "string" &&
    typeof (obj as PracticeSelections).assessment === "string" &&
    typeof (obj as PracticeSelections).subject === "string" &&
    Array.isArray((obj as PracticeSelections).domains) &&
    Array.isArray((obj as PracticeSelections).skills) &&
    Array.isArray((obj as PracticeSelections).difficulties) &&
    typeof (obj as PracticeSelections).randomize === "boolean" &&
    ((obj as PracticeSelections).questionIds === undefined ||
      Array.isArray((obj as PracticeSelections).questionIds))
  );
};

// Utility type for session data persistence
export type SerializedSession = Omit<PracticeSession, "timestamp"> & {
  timestamp: string;
};

// Session utility functions
export const createPracticeSession = (
  options: CreateSessionOptions
): PracticeSession => {
  return {
    sessionId: `practice-${Date.now()}`,
    timestamp: new Date().toISOString(),
    status: SessionStatus.NOT_STARTED,
    practiceSelections: options.practiceSelections,
    currentQuestionStep: 0,
    questionAnswers: {},
    questionTimes: {},
    answeredQuestionDetails: [], // Initialize empty array
    totalQuestions: options.totalQuestions,
    answeredQuestions: [],
    averageTimePerQuestion: 0,
    totalTimeSpent: 0,
  };
};

export const updateSessionProgress = (
  session: PracticeSession,
  payload: SessionUpdatePayload
): PracticeSession => {
  const updatedAnswers = {
    ...session.questionAnswers,
    [payload.questionId]: payload.selectedAnswer,
  };

  const updatedTimes = {
    ...session.questionTimes,
    [payload.questionId]: payload.timeElapsed,
  };

  const answeredQuestions = Object.keys(updatedAnswers).filter(
    (id) => updatedAnswers[id] !== null
  );

  const totalTimeSpent = Object.values(updatedTimes).reduce(
    (sum, time) => sum + time,
    0
  );

  const averageTimePerQuestion =
    Object.keys(updatedTimes).length > 0
      ? totalTimeSpent / Object.keys(updatedTimes).length
      : 0;

  return {
    ...session,
    questionAnswers: updatedAnswers,
    questionTimes: updatedTimes,
    answeredQuestions,
    totalTimeSpent,
    averageTimePerQuestion,
  };
};

export const getSessionSummary = (session: PracticeSession): SessionSummary => {
  const correctAnswers = session.answeredQuestions.length; // This would need actual correctness checking

  return {
    sessionId: session.sessionId,
    completedAt: session.timestamp,
    duration: session.totalTimeSpent,
    questionsAttempted: session.answeredQuestions.length,
    questionsCorrect: correctAnswers, // This would need actual implementation
    averageTimePerQuestion: session.averageTimePerQuestion,
    subject: session.practiceSelections.subject,
    difficulty: session.practiceSelections.difficulties,
  };
};

// Session storage helpers
export const saveSessionToStorage = (session: PracticeSession): void => {
  try {
    localStorage.setItem("currentPracticeSession", JSON.stringify(session));

    // Also add to history
    const existingHistory = localStorage.getItem("practiceHistory");
    const history: PracticeSession[] = existingHistory
      ? JSON.parse(existingHistory)
      : [];
    history.push(session);

    // Keep only last 10 sessions
    const recentHistory = history.slice(-10);
    localStorage.setItem("practiceHistory", JSON.stringify(recentHistory));
  } catch (error) {
    console.error("Failed to save session to storage:", error);
  }
};

export const loadSessionFromStorage = (): PracticeSession | null => {
  try {
    const sessionData = localStorage.getItem("currentPracticeSession");
    if (!sessionData) return null;

    const parsed = JSON.parse(sessionData);
    return isValidPracticeSession(parsed) ? parsed : null;
  } catch (error) {
    console.error("Failed to load session from storage:", error);
    return null;
  }
};

export const getSessionHistory = (): PracticeSession[] => {
  try {
    const historyData = localStorage.getItem("practiceHistory");
    if (!historyData) return [];

    const parsed = JSON.parse(historyData);
    return Array.isArray(parsed) ? parsed.filter(isValidPracticeSession) : [];
  } catch (error) {
    console.error("Failed to load session history:", error);
    return [];
  }
};

export const clearSessionStorage = (): void => {
  try {
    localStorage.removeItem("currentPracticeSession");
    localStorage.removeItem("practiceHistory");
  } catch (error) {
    console.error("Failed to clear session storage:", error);
  }
};
