/**
 * User Profile TypeScript interfaces
 * These types handle the localStorage structure for user profile and XP tracking
 */

// User profile with XP tracking
export interface UserProfile {
  totalXP: number;
  level: number;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  lastActivity: string; // ISO timestamp
  createdAt: string; // ISO timestamp
}

// XP transaction record for tracking XP changes
export interface XPTransaction {
  questionId: string;
  change: number; // positive for gain, negative for loss
  reason: "correct_answer" | "incorrect_answer";
  timestamp: string; // ISO timestamp
  scoreBandRange: number;
}

// User profile with transaction history
export interface UserProfileWithHistory extends UserProfile {
  xpHistory: XPTransaction[];
}

/**
 * Calculate user level based on total XP
 * Level formula: Level = floor(sqrt(totalXP / 100))
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100));
}

/**
 * Calculate XP needed for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  return (currentLevel + 1) ** 2 * 100;
}

/**
 * Calculate XP progress towards next level
 */
export function getLevelProgress(totalXP: number): {
  currentLevel: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercentage: number;
} {
  const currentLevel = calculateLevel(totalXP);
  const currentLevelXP = currentLevel ** 2 * 100;
  const nextLevelXP = getXPForNextLevel(currentLevel);
  const progressXP = totalXP - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;
  const progressPercentage = Math.round((progressXP / neededXP) * 100);

  return {
    currentLevel,
    currentLevelXP,
    nextLevelXP,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
  };
}
