/**
 * User Profile Utilities
 * Functions for managing user profile and XP in localStorage
 */

import {
  UserProfileWithHistory,
  XPTransaction,
  calculateLevel,
} from "@/types/userProfile";

// localStorage key for user profile
const USER_PROFILE_KEY = "userProfile";

/**
 * Get user profile from localStorage
 */
export function getUserProfile(): UserProfileWithHistory {
  try {
    const stored = localStorage.getItem(USER_PROFILE_KEY);

    if (stored) {
      const profile = JSON.parse(stored) as UserProfileWithHistory;

      // Ensure the profile has all required fields
      return {
        totalXP: profile.totalXP || 0,
        level: calculateLevel(profile.totalXP || 0),
        questionsAnswered: profile.questionsAnswered || 0,
        correctAnswers: profile.correctAnswers || 0,
        incorrectAnswers: profile.incorrectAnswers || 0,
        lastActivity: profile.lastActivity || new Date().toISOString(),
        createdAt: profile.createdAt || new Date().toISOString(),
        xpHistory: profile.xpHistory || [],
      };
    }

    // Return default profile if none exists
    const defaultProfile: UserProfileWithHistory = {
      totalXP: 0,
      level: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      xpHistory: [],
    };

    saveUserProfile(defaultProfile);
    return defaultProfile;
  } catch (error) {
    console.error("Error loading user profile:", error);

    // Return default profile on error
    const defaultProfile: UserProfileWithHistory = {
      totalXP: 0,
      level: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      xpHistory: [],
    };

    return defaultProfile;
  }
}

/**
 * Save user profile to localStorage
 */
export function saveUserProfile(profile: UserProfileWithHistory): void {
  try {
    // Update level based on current XP
    profile.level = calculateLevel(profile.totalXP);
    profile.lastActivity = new Date().toISOString();

    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Error saving user profile:", error);
  }
}

/**
 * Add XP for correct answer
 */
export function addXPForCorrectAnswer(
  questionId: string,
  scoreBandRange: number
): UserProfileWithHistory {
  const profile = getUserProfile();
  const xpGain = scoreBandRange * 10;

  // Add XP
  profile.totalXP += xpGain;
  profile.questionsAnswered += 1;
  profile.correctAnswers += 1;

  // Add transaction record
  const transaction: XPTransaction = {
    questionId,
    change: xpGain,
    reason: "correct_answer",
    timestamp: new Date().toISOString(),
    scoreBandRange,
  };

  profile.xpHistory.push(transaction);

  // Keep only last 100 transactions to prevent localStorage bloat
  if (profile.xpHistory.length > 100) {
    profile.xpHistory = profile.xpHistory.slice(-100);
  }

  saveUserProfile(profile);
  console.log(`🎯 XP gained: +${xpGain} (Total: ${profile.totalXP})`);

  return profile;
}

/**
 * Reduce XP for incorrect answer
 */
export function reduceXPForIncorrectAnswer(
  questionId: string,
  scoreBandRange: number
): UserProfileWithHistory {
  const profile = getUserProfile();
  const xpLoss = Math.floor((scoreBandRange * 10) / 2); // Half of the gain amount

  // Reduce XP (but don't go below 0)
  profile.totalXP = Math.max(0, profile.totalXP - xpLoss);
  profile.questionsAnswered += 1;
  profile.incorrectAnswers += 1;

  // Add transaction record
  const transaction: XPTransaction = {
    questionId,
    change: -xpLoss,
    reason: "incorrect_answer",
    timestamp: new Date().toISOString(),
    scoreBandRange,
  };

  profile.xpHistory.push(transaction);

  // Keep only last 100 transactions to prevent localStorage bloat
  if (profile.xpHistory.length > 100) {
    profile.xpHistory = profile.xpHistory.slice(-100);
  }

  saveUserProfile(profile);
  console.log(`💔 XP lost: -${xpLoss} (Total: ${profile.totalXP})`);

  return profile;
}

/**
 * Get XP statistics for a specific time period
 */
export function getXPStatistics(days: number = 7): {
  totalXPGained: number;
  totalXPLost: number;
  netXPChange: number;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
} {
  const profile = getUserProfile();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentTransactions = profile.xpHistory.filter(
    (transaction) => new Date(transaction.timestamp) >= cutoffDate
  );

  const totalXPGained = recentTransactions
    .filter((t) => t.change > 0)
    .reduce((sum, t) => sum + t.change, 0);

  const totalXPLost = Math.abs(
    recentTransactions
      .filter((t) => t.change < 0)
      .reduce((sum, t) => sum + t.change, 0)
  );

  const correctAnswers = recentTransactions.filter(
    (t) => t.reason === "correct_answer"
  ).length;

  const incorrectAnswers = recentTransactions.filter(
    (t) => t.reason === "incorrect_answer"
  ).length;

  return {
    totalXPGained,
    totalXPLost,
    netXPChange: totalXPGained - totalXPLost,
    questionsAnswered: recentTransactions.length,
    correctAnswers,
    incorrectAnswers,
  };
}

/**
 * Reset user profile (for testing or user request)
 */
export function resetUserProfile(): UserProfileWithHistory {
  const newProfile: UserProfileWithHistory = {
    totalXP: 0,
    level: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    lastActivity: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    xpHistory: [],
  };

  saveUserProfile(newProfile);
  console.log("🔄 User profile reset");

  return newProfile;
}

/**
 * Debug function to log user profile information
 * Available in browser console as window.debugUserProfile()
 */
export function debugUserProfile(): void {
  const profile = getUserProfile();

  console.group("👤 User Profile Debug Information");
  console.log("📊 Profile Stats:", {
    totalXP: profile.totalXP,
    level: profile.level,
    questionsAnswered: profile.questionsAnswered,
    correctAnswers: profile.correctAnswers,
    incorrectAnswers: profile.incorrectAnswers,
    accuracy:
      profile.questionsAnswered > 0
        ? Math.round(
            (profile.correctAnswers / profile.questionsAnswered) * 100
          ) + "%"
        : "0%",
    lastActivity: profile.lastActivity,
    createdAt: profile.createdAt,
  });

  console.log("📈 Recent XP History (last 10 transactions):");
  profile.xpHistory.slice(-10).forEach((transaction, index) => {
    console.log(
      `${index + 1}. ${transaction.reason === "correct_answer" ? "✅" : "❌"} ${
        transaction.change > 0 ? "+" : ""
      }${transaction.change} XP | Question: ${
        transaction.questionId
      } | Score Band: ${transaction.scoreBandRange}`
    );
  });

  const weekStats = getXPStatistics(7);
  console.log("📅 Last 7 Days Stats:", weekStats);

  console.groupEnd();
}

// Make debug function available globally for development
if (typeof window !== "undefined") {
  (window as unknown as { debugUserProfile: () => void }).debugUserProfile =
    debugUserProfile;
}
