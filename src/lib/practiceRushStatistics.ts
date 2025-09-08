/**
 * Practice Rush Statistics Utilities
 * Functions for managing practice rush statistics in localStorage
 */

import {
  PracticeRushStatistics,
  AssessmentType,
  QuestionStatistic,
  StatisticEntry,
  AssessmentSummary,
  DomainSummary,
  SkillSummary,
} from "@/types/statistics";
import { DomainItems, SkillCd_Variants } from "@/types/lookup";

// localStorage key for practice rush statistics
const PRACTICE_RUSH_STATISTICS_KEY = "practiceRushStatistics";

/**
 * Get practice rush statistics from localStorage
 */
export function getPracticeRushStatistics(): PracticeRushStatistics {
  try {
    const stored = localStorage.getItem(PRACTICE_RUSH_STATISTICS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error parsing practice rush statistics:", error);
    return {};
  }
}

/**
 * Save practice rush statistics to localStorage
 */
export function savePracticeRushStatistics(
  statistics: PracticeRushStatistics
): void {
  try {
    localStorage.setItem(
      PRACTICE_RUSH_STATISTICS_KEY,
      JSON.stringify(statistics)
    );
    console.log("Practice statistics saved successfully");
  } catch (error) {
    console.error("Error saving practice rush statistics:", error);
  }
}

/**
 * Add a single question statistic to the statistics
 */
export function addQuestionStatistic(entry: StatisticEntry): void {
  console.log("Saving question statistic for:", entry.questionId);

  const statistics = getPracticeRushStatistics();

  // Initialize assessment if it doesn't exist
  if (!statistics[entry.assessment]) {
    statistics[entry.assessment] = {
      answeredQuestions: [],
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

  // Add the question statistic (including external_id and ibn in the statistic)
  const statisticWithIds = {
    ...entry.statistic,
    external_id: entry.external_id,
    ibn: entry.ibn,
  };

  assessmentStats.statistics[entry.primaryClassCd][entry.skillCd][
    entry.questionId
  ] = statisticWithIds;

  // Save back to localStorage
  savePracticeRushStatistics(statistics);
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
  const statistics = getPracticeRushStatistics();

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
  const statistics = getPracticeRushStatistics();
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
  const statistics = getPracticeRushStatistics();
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
  const statistics = getPracticeRushStatistics();
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
  const statistics = getPracticeRushStatistics();
  delete statistics[assessment];
  savePracticeRushStatistics(statistics);
}

/**
 * Clear all practice rush statistics
 */
export function clearAllStatistics(): void {
  localStorage.removeItem(PRACTICE_RUSH_STATISTICS_KEY);
}

/**
 * Export statistics as JSON string for backup/sharing
 */
export function exportStatistics(): string {
  const statistics = getPracticeRushStatistics();
  return JSON.stringify(statistics, null, 2);
}

/**
 * Import statistics from JSON string
 */
export function importStatistics(jsonData: string): boolean {
  try {
    const statistics = JSON.parse(jsonData) as PracticeRushStatistics;
    savePracticeRushStatistics(statistics);
    return true;
  } catch (error) {
    console.error("Error importing statistics:", error);
    return false;
  }
}

/**
 * Debug function to check localStorage content
 */
export function debugStatistics(): void {
  console.log("=== PRACTICE RUSH STATISTICS DEBUG ===");
  console.log("localStorage key:", PRACTICE_RUSH_STATISTICS_KEY);

  const raw = localStorage.getItem(PRACTICE_RUSH_STATISTICS_KEY);
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
    window as unknown as { debugPracticeRushStatistics: () => void }
  ).debugPracticeRushStatistics = debugStatistics;
}
