/**
 * Practice Statistics Utilities
 * Functions for managing practice statistics in localStorage
 */

import {
  PracticeStatistics,
  PracticeRushStatistics, // Legacy alias
  AssessmentType,
  QuestionStatistic,
  StatisticEntry,
  AssessmentSummary,
  DomainSummary,
  SkillSummary,
  AnsweredQuestion,
  ClassStatistics,
} from "@/types/statistics";
import { DomainItems, SkillCd_Variants } from "@/types/lookup";
import { PlainQuestionType } from "@/types/question";
import { PracticeSession } from "@/types/session";

// localStorage key for practice statistics
const PRACTICE_STATISTICS_KEY = "practiceStatistics";
const LEGACY_PRACTICE_RUSH_STATISTICS_KEY = "practiceRushStatistics";

/**
 * Get practice statistics from localStorage (with migration from legacy key)
 */
export function getPracticeStatistics(): PracticeStatistics {
  try {
    // Try new key first
    const stored = localStorage.getItem(PRACTICE_STATISTICS_KEY);

    // If not found, try legacy key and migrate
    if (!stored) {
      const legacyStored = localStorage.getItem(
        LEGACY_PRACTICE_RUSH_STATISTICS_KEY
      );
      if (legacyStored) {
        const legacyData = JSON.parse(legacyStored);
        // Migrate data to new format
        const migratedData: PracticeStatistics = {};

        for (const [assessment, stats] of Object.entries(legacyData)) {
          const legacyStats = stats as {
            answeredQuestions: string[];
            statistics: ClassStatistics;
          };
          migratedData[assessment] = {
            answeredQuestions: legacyStats.answeredQuestions || [],
            answeredQuestionsDetailed: [], // Initialize empty array for new format
            statistics: legacyStats.statistics || {},
          };
        }

        // Save migrated data to new key
        savePracticeStatistics(migratedData);

        // Optionally remove legacy key
        localStorage.removeItem(LEGACY_PRACTICE_RUSH_STATISTICS_KEY);

        return migratedData;
      }
    }

    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error parsing practice statistics:", error);
    return {};
  }
}

/**
 * Save practice statistics to localStorage
 */
export function savePracticeStatistics(statistics: PracticeStatistics): void {
  try {
    localStorage.setItem(PRACTICE_STATISTICS_KEY, JSON.stringify(statistics));
    console.log("Practice statistics saved successfully");
  } catch (error) {
    console.error("Error saving practice statistics:", error);
  }
}

/**
 * Add a question statistic to the practice statistics
 */
export function addQuestionStatistic(entry: StatisticEntry): void {
  console.log("Saving question statistic for:", entry.questionId);
  const statistics = getPracticeStatistics();

  // Initialize assessment if it doesn't exist
  if (!statistics[entry.assessment]) {
    statistics[entry.assessment] = {
      answeredQuestions: [],
      answeredQuestionsDetailed: [],
      statistics: {},
    };
  }

  const assessmentStats = statistics[entry.assessment];

  // Add to answered questions list if not already there
  if (!assessmentStats.answeredQuestions.includes(entry.questionId)) {
    assessmentStats.answeredQuestions.push(entry.questionId);
  }

  // Initialize primary class code if it doesn't exist
  if (!assessmentStats.statistics[entry.primaryClassCd]) {
    assessmentStats.statistics[entry.primaryClassCd] = {};
  }

  // Initialize skill code if it doesn't exist
  if (!assessmentStats.statistics[entry.primaryClassCd][entry.skillCd]) {
    assessmentStats.statistics[entry.primaryClassCd][entry.skillCd] = {};
  }

  // Add the question statistic (including external_id, ibn, and plainQuestion in the statistic)
  const statisticWithIds = {
    ...entry.statistic,
    external_id: entry.external_id,
    ibn: entry.ibn,
    plainQuestion: entry.plainQuestion,
  };

  assessmentStats.statistics[entry.primaryClassCd][entry.skillCd][
    entry.questionId
  ] = statisticWithIds;

  // Save back to localStorage
  savePracticeStatistics(statistics);
}

/**
 * Add a detailed answered question with difficulty and metadata
 */
export function addAnsweredQuestion(
  assessment: AssessmentType,
  questionId: string,
  difficulty: "E" | "M" | "H",
  isCorrect: boolean,
  timeSpent: number,
  plainQuestion?: PlainQuestionType
): void {
  console.log("Adding detailed answered question:", questionId);
  const statistics = getPracticeStatistics();

  // Initialize assessment if it doesn't exist
  if (!statistics[assessment]) {
    statistics[assessment] = {
      answeredQuestions: [],
      answeredQuestionsDetailed: [],
      statistics: {},
    };
  }

  const assessmentStats = statistics[assessment];

  // Check if this question is already in the detailed list
  const existingIndex = assessmentStats.answeredQuestionsDetailed.findIndex(
    (q) => q.questionId === questionId
  );

  const answeredQuestion: AnsweredQuestion = {
    questionId,
    difficulty,
    isCorrect,
    timeSpent,
    timestamp: new Date().toISOString(),
    plainQuestion,
  };

  if (existingIndex !== -1) {
    // Update existing entry
    assessmentStats.answeredQuestionsDetailed[existingIndex] = answeredQuestion;
  } else {
    // Add new entry
    assessmentStats.answeredQuestionsDetailed.push(answeredQuestion);
  }

  // Also add to legacy answered questions list if not already there
  if (!assessmentStats.answeredQuestions.includes(questionId)) {
    assessmentStats.answeredQuestions.push(questionId);
  }

  // Save back to localStorage
  savePracticeStatistics(statistics);
}

/**
 * Get statistics for a specific question
 */
export function getQuestionStatistic(
  assessment: AssessmentType,
  primaryClassCd: DomainItems,
  skillCd: SkillCd_Variants,
  questionId: string
): QuestionStatistic | null {
  const statistics = getPracticeStatistics();

  return (
    statistics[assessment]?.statistics[primaryClassCd]?.[skillCd]?.[
      questionId
    ] || null
  );
}

/**
 * Calculate summary statistics for a skill
 */
export function getSkillSummary(
  assessment: AssessmentType,
  primaryClassCd: DomainItems,
  skillCd: SkillCd_Variants
): SkillSummary | null {
  const statistics = getPracticeStatistics();
  const skillStats =
    statistics[assessment]?.statistics[primaryClassCd]?.[skillCd];

  if (!skillStats || Object.keys(skillStats).length === 0) {
    return null;
  }

  const questions = Object.values(skillStats) as QuestionStatistic[];
  const totalQuestions = questions.length;
  const correctAnswers = questions.filter((q) => q.isCorrect).length;
  const totalTime = questions.reduce((sum, q) => sum + q.time, 0);
  const averageTime = totalTime / totalQuestions;
  const accuracy = (correctAnswers / totalQuestions) * 100;

  return {
    skillCd,
    totalQuestions,
    correctAnswers,
    averageTime,
    accuracy,
  };
}

/**
 * Calculate summary statistics for a domain (primary class)
 */
export function getDomainSummary(
  assessment: AssessmentType,
  primaryClassCd: DomainItems
): DomainSummary | null {
  const statistics = getPracticeStatistics();
  const domainStats = statistics[assessment]?.statistics[primaryClassCd];

  if (!domainStats || Object.keys(domainStats).length === 0) {
    return null;
  }

  const skills: SkillSummary[] = [];
  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalTime = 0;

  for (const skillCd of Object.keys(domainStats) as SkillCd_Variants[]) {
    const skillSummary = getSkillSummary(assessment, primaryClassCd, skillCd);
    if (skillSummary) {
      skills.push(skillSummary);
      totalQuestions += skillSummary.totalQuestions;
      totalCorrect += skillSummary.correctAnswers;
      totalTime += skillSummary.averageTime * skillSummary.totalQuestions;
    }
  }

  const averageTime = totalQuestions > 0 ? totalTime / totalQuestions : 0;
  const accuracy =
    totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  return {
    primaryClassCd,
    skills,
    totalQuestions,
    correctAnswers: totalCorrect,
    averageTime,
    accuracy,
  };
}

/**
 * Calculate summary statistics for an entire assessment
 */
export function getAssessmentSummary(
  assessment: AssessmentType
): AssessmentSummary | null {
  const statistics = getPracticeStatistics();
  const assessmentStats = statistics[assessment];

  if (
    !assessmentStats ||
    Object.keys(assessmentStats.statistics).length === 0
  ) {
    return null;
  }

  const domains: DomainSummary[] = [];
  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalTime = 0;

  for (const primaryClassCd of Object.keys(
    assessmentStats.statistics
  ) as DomainItems[]) {
    const domainSummary = getDomainSummary(assessment, primaryClassCd);
    if (domainSummary) {
      domains.push(domainSummary);
      totalQuestions += domainSummary.totalQuestions;
      totalCorrect += domainSummary.correctAnswers;
      totalTime += domainSummary.averageTime * domainSummary.totalQuestions;
    }
  }

  const averageTime = totalQuestions > 0 ? totalTime / totalQuestions : 0;
  const accuracy =
    totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  return {
    assessment,
    domains,
    totalQuestions,
    correctAnswers: totalCorrect,
    averageTime,
    accuracy,
  };
}

/**
 * Clear all statistics for a specific assessment
 */
export function clearAssessmentStatistics(assessment: AssessmentType): void {
  const statistics = getPracticeStatistics();
  delete statistics[assessment];
  savePracticeStatistics(statistics);
}

/**
 * Clear all practice rush statistics
 */
export function clearAllStatistics(): void {
  localStorage.removeItem(LEGACY_PRACTICE_RUSH_STATISTICS_KEY);
}

/**
 * Export statistics as JSON string for backup/sharing
 */
export function exportStatistics(): string {
  const statistics = getPracticeStatistics();
  return JSON.stringify(statistics, null, 2);
}

/**
 * Import statistics from JSON string
 */
export function importStatistics(jsonData: string): boolean {
  try {
    const statistics = JSON.parse(jsonData) as PracticeRushStatistics;
    savePracticeStatistics(statistics);
    return true;
  } catch (error) {
    console.error("Error importing statistics:", error);
    return false;
  }
}

/**
 * Update XP for a specific session in practice history
 */
export function updateSessionXP(sessionId: string, xpChange: number): void {
  try {
    const existingSessions = localStorage.getItem("practiceHistory");
    const sessions: PracticeSession[] = existingSessions
      ? JSON.parse(existingSessions)
      : [];

    // Find the session and update its totalXPReceived
    const existingIndex = sessions.findIndex(
      (session) => session.sessionId === sessionId
    );

    if (existingIndex !== -1) {
      const currentXP = sessions[existingIndex].totalXPReceived || 0;
      sessions[existingIndex].totalXPReceived = currentXP + xpChange;
      localStorage.setItem("practiceHistory", JSON.stringify(sessions));
      console.log(
        `📊 Updated session ${sessionId} XP: ${currentXP} + ${xpChange} = ${
          currentXP + xpChange
        }`
      );
    } else {
      console.warn(`Session ${sessionId} not found in practice history`);
    }
  } catch (error) {
    console.error("Error updating session XP:", error);
  }
}

/**
 * Debug function to check localStorage content
 */
export function debugStatistics(): void {
  console.log("=== PRACTICE RUSH STATISTICS DEBUG ===");
  console.log("localStorage key:", LEGACY_PRACTICE_RUSH_STATISTICS_KEY);

  const raw = localStorage.getItem(LEGACY_PRACTICE_RUSH_STATISTICS_KEY);
  console.log("Raw localStorage content:", raw);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as PracticeRushStatistics;
      console.log("Parsed content:", parsed);
      console.log("Number of assessments:", Object.keys(parsed).length);

      for (const [assessment, data] of Object.entries(parsed)) {
        console.log(`Assessment: ${assessment}`);
        console.log(
          `  Questions answered: ${data.answeredQuestions?.length || 0}`
        );
        console.log(`  Domains:`, Object.keys(data.statistics || {}));
      }
    } catch (error) {
      console.error("Error parsing stored data:", error);
    }
  } else {
    console.log("No data found in localStorage");
  }
  console.log("==========================================");
}

// Make it available globally for debugging
if (typeof window !== "undefined") {
  (
    window as unknown as { debugPracticeStatistics: () => void }
  ).debugPracticeStatistics = debugStatistics;
}
