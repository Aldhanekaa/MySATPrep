// components/ui/activity-card.tsx
"use client";

import {
  Activity,
  ArrowUpRight,
  Plus,
  Target,
  CheckCircle2,
  X,
  Settings,
  Edit3,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getUserProfile } from "@/lib/userProfile";
import { UserProfileWithHistory } from "@/types/userProfile";
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from "./card-v2";
import { Button } from "./button";

// Creative and flexible unit system for metrics
export type TimeUnit =
  | "ms"
  | "sec"
  | "min"
  | "hrs"
  | "days"
  | "weeks"
  | "months";
export type ScoreUnit =
  | "pts"
  | "XP"
  | "exp"
  | "score"
  | "coins"
  | "gems"
  | "stars";
export type PercentageUnit = "%" | "accuracy" | "rate" | "ratio" | "grade";
export type CountUnit =
  | "items"
  | "questions"
  | "tests"
  | "sessions"
  | "attempts"
  | "streaks";
export type LevelUnit =
  | "lvl"
  | "level"
  | "tier"
  | "rank"
  | "badge"
  | "achievement";
export type EnergyUnit =
  | "cal"
  | "kcal"
  | "energy"
  | "power"
  | "fuel"
  | "stamina";
export type DistanceUnit = "px" | "steps" | "progress" | "distance" | "journey";
export type CustomUnit = string; // For completely custom units

export type MetricUnit =
  | TimeUnit
  | ScoreUnit
  | PercentageUnit
  | CountUnit
  | LevelUnit
  | EnergyUnit
  | DistanceUnit
  | CustomUnit;

export interface Metric {
  label: string;
  value: string;
  trend: number;
  unit?: MetricUnit;
  color?: string; // Optional color override
  icon?: string; // Optional icon for the metric
  suffix?: string; // Optional suffix to display after the value
  prefix?: string; // Optional prefix to display before the value
}

export interface Goal {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface ActivityCardProps {
  category?: string;
  title?: string;
  externalMetrics?: Metric[]; // Allow external metrics to be passed in
  externalStreakDays?: number; // Allow external streak calculation to be passed in
  onViewDetails?: () => void;
  className?: string;
}

// Helper function to get dynamic metric styling based on unit type
const getMetricStyling = (unit?: MetricUnit) => {
  const unitStyleMap: Record<
    string,
    { gradient: string; shadowColor: string; textColor: string }
  > = {
    // Time units
    ms: {
      gradient: "from-blue-400 to-blue-600",
      shadowColor: "shadow-blue-200",
      textColor: "text-blue-700",
    },
    sec: {
      gradient: "from-blue-400 to-blue-600",
      shadowColor: "shadow-blue-200",
      textColor: "text-blue-700",
    },
    min: {
      gradient: "from-green-400 to-emerald-600",
      shadowColor: "shadow-green-200",
      textColor: "text-green-700",
    },
    hrs: {
      gradient: "from-amber-400 to-orange-600",
      shadowColor: "shadow-amber-200",
      textColor: "text-amber-700",
    },
    days: {
      gradient: "from-purple-400 to-indigo-600",
      shadowColor: "shadow-purple-200",
      textColor: "text-purple-700",
    },

    // Score units
    XP: {
      gradient: "from-yellow-400 to-orange-600",
      shadowColor: "shadow-yellow-200",
      textColor: "text-yellow-700",
    },
    exp: {
      gradient: "from-yellow-400 to-orange-600",
      shadowColor: "shadow-yellow-200",
      textColor: "text-yellow-700",
    },
    pts: {
      gradient: "from-red-400 to-pink-600",
      shadowColor: "shadow-red-200",
      textColor: "text-red-700",
    },
    coins: {
      gradient: "from-yellow-400 to-yellow-600",
      shadowColor: "shadow-yellow-200",
      textColor: "text-yellow-700",
    },
    gems: {
      gradient: "from-emerald-400 to-teal-600",
      shadowColor: "shadow-emerald-200",
      textColor: "text-emerald-700",
    },
    stars: {
      gradient: "from-yellow-300 to-amber-500",
      shadowColor: "shadow-yellow-200",
      textColor: "text-yellow-600",
    },

    // Percentage units
    "%": {
      gradient: "from-cyan-400 to-blue-600",
      shadowColor: "shadow-cyan-200",
      textColor: "text-cyan-700",
    },
    accuracy: {
      gradient: "from-cyan-400 to-blue-600",
      shadowColor: "shadow-cyan-200",
      textColor: "text-cyan-700",
    },
    rate: {
      gradient: "from-indigo-400 to-purple-600",
      shadowColor: "shadow-indigo-200",
      textColor: "text-indigo-700",
    },

    // Level units
    lvl: {
      gradient: "from-violet-400 to-purple-600",
      shadowColor: "shadow-violet-200",
      textColor: "text-violet-700",
    },
    level: {
      gradient: "from-violet-400 to-purple-600",
      shadowColor: "shadow-violet-200",
      textColor: "text-violet-700",
    },
    tier: {
      gradient: "from-slate-400 to-gray-600",
      shadowColor: "shadow-slate-200",
      textColor: "text-slate-700",
    },
    rank: {
      gradient: "from-orange-400 to-red-600",
      shadowColor: "shadow-orange-200",
      textColor: "text-orange-700",
    },

    // Count units
    questions: {
      gradient: "from-blue-400 to-indigo-600",
      shadowColor: "shadow-blue-200",
      textColor: "text-blue-700",
    },
    items: {
      gradient: "from-gray-400 to-slate-600",
      shadowColor: "shadow-gray-200",
      textColor: "text-gray-700",
    },
    sessions: {
      gradient: "from-green-400 to-teal-600",
      shadowColor: "shadow-green-200",
      textColor: "text-green-700",
    },
  };

  return (
    unitStyleMap[unit || ""] || {
      gradient: "from-gray-400 to-gray-600",
      shadowColor: "shadow-gray-200",
      textColor: "text-gray-700",
    }
  );
};

const DEFAULT_GOALS: Goal[] = [
  { id: "1", title: "Complete 10 practice questions", isCompleted: false },
  { id: "2", title: "Study for 30 minutes", isCompleted: false },
  { id: "3", title: "Review incorrect answers", isCompleted: false },
];

// localStorage key for daily goals
const DAILY_GOALS_KEY = "dailyGoals";
const GOALS_DATE_KEY = "goalsDate";

// Helper function to get today's date string
const getTodayDateString = (): string => {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
};

// Helper function to load goals from localStorage
const loadGoalsFromStorage = (): Goal[] => {
  if (typeof window === "undefined") return DEFAULT_GOALS;

  try {
    const storedDate = localStorage.getItem(GOALS_DATE_KEY);
    const todayDate = getTodayDateString();

    // If it's a new day, reset goals to defaults
    if (storedDate !== todayDate) {
      const resetGoals = DEFAULT_GOALS.map((goal) => ({
        ...goal,
        isCompleted: false,
      }));
      saveGoalsToStorage(resetGoals);
      localStorage.setItem(GOALS_DATE_KEY, todayDate);
      return resetGoals;
    }

    // Load existing goals for today
    const storedGoals = localStorage.getItem(DAILY_GOALS_KEY);
    if (storedGoals) {
      return JSON.parse(storedGoals);
    }

    return DEFAULT_GOALS;
  } catch (error) {
    console.error("Error loading goals from localStorage:", error);
    return DEFAULT_GOALS;
  }
};

// Helper function to save goals to localStorage
const saveGoalsToStorage = (goals: Goal[]): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(DAILY_GOALS_KEY, JSON.stringify(goals));
    localStorage.setItem(GOALS_DATE_KEY, getTodayDateString());
  } catch (error) {
    console.error("Error saving goals to localStorage:", error);
  }
};

export function ActivityCard({
  category = "Learning Activity",
  title = "Today's Progress",
  externalMetrics,
  externalStreakDays,
  onViewDetails,
  className,
}: ActivityCardProps) {
  const [isHovering, setIsHovering] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [monthlyStats, setMonthlyStats] = useState<{
    questionsCompleted: number;
    testsCompleted: number;
  } | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalText, setEditingGoalText] = useState<string>("");

  // Load user data and calculate metrics on component mount
  useEffect(() => {
    try {
      // Load goals from localStorage (resets daily)
      const loadedGoals = loadGoalsFromStorage();
      setGoals(loadedGoals);

      // Use external metrics if provided, otherwise calculate from user data
      if (externalMetrics) {
        setMetrics(externalMetrics);
        setStreakDays(externalStreakDays || 0); // Use external streak or 0
        setMonthlyStats(null); // Let external component handle monthly stats
        return;
      }

      const profile = getUserProfile();

      // Calculate metrics based on user data
      const calculatedMetrics: Metric[] = [
        {
          label: "Total XP",
          value: profile.totalXP.toString(),
          trend: Math.min(100, (profile.totalXP / 1000) * 100),
          unit: "XP",
          color: "#FF2D55",
          prefix: "",
          suffix: " earned",
        },
        {
          label: "Questions",
          value: profile.questionsAnswered.toString(),
          trend:
            profile.questionsAnswered > 0
              ? Math.min(
                  100,
                  (profile.correctAnswers / profile.questionsAnswered) * 100
                )
              : 0,
          unit: "questions",
          color: "#2CD758",
          prefix: "",
          suffix: " completed",
        },
        {
          label: "Level",
          value: profile.level.toString(),
          trend: 100,
          unit: "lvl",
          color: "#007AFF",
          prefix: "Lv.",
          suffix: " achieved",
        },
      ];

      setMetrics(calculatedMetrics);

      // Calculate streak days
      const calculatedStreak = calculateStreakDays(profile);
      setStreakDays(calculatedStreak);

      // Calculate monthly stats
      const calculatedMonthlyStats = {
        questionsCompleted: Math.min(500, profile.questionsAnswered),
        testsCompleted: Math.floor(profile.questionsAnswered / 20),
      };
      setMonthlyStats(calculatedMonthlyStats);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, [externalMetrics, externalStreakDays]);

  // Calculate streak days based on user activity
  const calculateStreakDays = (profile: UserProfileWithHistory): number => {
    if (!profile?.lastActivity) return 0;

    const lastActivity = new Date(profile.lastActivity);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastActivity.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If last activity was within last 2 days, show a streak
    if (diffDays <= 2) {
      return Math.max(1, Math.floor(profile.questionsAnswered / 10));
    }
    return 0;
  };

  const handleGoalToggle = (goalId: string) => {
    setGoals((prev) => {
      const updatedGoals = prev.map((goal) =>
        goal.id === goalId ? { ...goal, isCompleted: !goal.isCompleted } : goal
      );
      // Save to localStorage whenever goals are updated
      saveGoalsToStorage(updatedGoals);
      return updatedGoals;
    });
  };

  const handleAddGoal = () => {
    const newGoal: Goal = {
      id: `goal-${Date.now()}`, // Use timestamp for unique ID
      title: `Custom Goal ${
        goals.filter((g) => g.id.startsWith("goal-")).length + 1
      }`,
      isCompleted: false,
    };
    setGoals((prev) => {
      const updatedGoals = [...prev, newGoal];
      // Save to localStorage whenever goals are updated
      saveGoalsToStorage(updatedGoals);
      return updatedGoals;
    });
    // Immediately start editing the new goal
    setEditingGoalId(newGoal.id);
    setEditingGoalText(newGoal.title);
  };

  const handleRemoveGoal = (goalId: string) => {
    setGoals((prev) => {
      const updatedGoals = prev.filter((goal) => goal.id !== goalId);
      // Save to localStorage whenever goals are updated
      saveGoalsToStorage(updatedGoals);
      return updatedGoals;
    });
  };

  const handleStartEdit = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditingGoalText(goal.title);
  };

  const handleSaveEdit = (goalId: string) => {
    if (editingGoalText.trim()) {
      setGoals((prev) => {
        const updatedGoals = prev.map((goal) =>
          goal.id === goalId ? { ...goal, title: editingGoalText.trim() } : goal
        );
        saveGoalsToStorage(updatedGoals);
        return updatedGoals;
      });
    }
    setEditingGoalId(null);
    setEditingGoalText("");
  };

  const handleCancelEdit = () => {
    setEditingGoalId(null);
    setEditingGoalText("");
  };

  return (
    <Card
      variant="accent"
      className={cn(
        "rounded-3xl sticky top-16",
        "transition-all duration-300",
        className
      )}
    >
      <CardHeader>
        <CardHeading>
          <CardTitle>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800/50">
                <Activity className="w-5 h-5 text-zinc-800" />
              </div>{" "}
              Activity Progress
            </div>
          </CardTitle>
        </CardHeading>
      </CardHeader>

      <CardContent className="p-6">
        {/* Streak Section */}
        {streakDays > 0 && (
          <div className=" mb-6 space-y-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 p-4">
            <div className="flex items-center gap-1.5 text-orange-400">
              <svg
                className="size-5"
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 32 32"
              >
                <g fill="none">
                  <path
                    fill="#ff6723"
                    d="M26 19.34c0 6.1-5.05 11.005-11.15 10.641c-6.269-.374-10.56-6.403-9.752-12.705c.489-3.833 2.286-7.12 4.242-9.67c.34-.445.689 3.136 1.038 2.742c.35-.405 3.594-6.019 4.722-7.991a.694.694 0 0 1 1.028-.213C18.394 3.854 26 10.277 26 19.34"
                  ></path>
                  <path
                    fill="#ffb02e"
                    d="M23 21.851c0 4.042-3.519 7.291-7.799 7.144c-4.62-.156-7.788-4.384-7.11-8.739C9.07 14.012 15.48 10 15.48 10S23 14.707 23 21.851"
                  ></path>
                </g>
              </svg>
              <div className="text-sm font-medium">
                {streakDays} Days Streak!
              </div>
            </div>
            {monthlyStats && (
              <div className="space-y-3">
                <div className="text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700 pb-3 text-sm">
                  In the past month, you have completed{" "}
                  {monthlyStats.questionsCompleted}+ questions and{" "}
                  {monthlyStats.testsCompleted}+ practice sessions.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metrics Rings */}
        <div className="grid grid-cols-3 gap-4">
          {metrics.map((metric) => {
            const styling = getMetricStyling(metric.unit);
            return (
              <div
                key={metric.label}
                className="relative flex flex-col items-center"
                onMouseEnter={() => setIsHovering(metric.label)}
                onMouseLeave={() => setIsHovering(null)}
              >
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800/50" />
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full border-4 transition-all duration-500",
                      isHovering === metric.label && "scale-105 shadow-lg"
                    )}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {/* Icon display */}
                    {metric.icon && (
                      <span
                        className="text-lg mb-1"
                        role="img"
                        aria-label={metric.label}
                      >
                        {metric.icon}
                      </span>
                    )}
                    <div className="flex items-center justify-center">
                      {/* Prefix */}
                      {metric.prefix && (
                        <span
                          className={cn(
                            "text-sm font-medium",
                            styling.textColor,
                            "dark:text-zinc-400"
                          )}
                        >
                          {metric.prefix}
                        </span>
                      )}
                      {/* Main value */}
                      <span
                        className={cn(
                          "font-bold",
                          metric.color
                            ? "text-zinc-900 dark:text-white"
                            : styling.textColor,
                          "dark:text-white",
                          metric.icon ? "text-lg" : "text-xl"
                        )}
                      >
                        {metric.value}
                      </span>
                      {/* Unit */}
                      {metric.unit && (
                        <span
                          className={cn(
                            "text-xs ml-1",
                            styling.textColor,
                            "dark:text-zinc-400"
                          )}
                        >
                          {metric.unit}
                        </span>
                      )}
                    </div>
                    {/* Suffix */}
                    {metric.suffix && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-1 max-w-20 leading-tight">
                        {metric.suffix}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "mt-3 text-sm font-medium",
                    styling.textColor,
                    "dark:text-zinc-300"
                  )}
                >
                  {metric.label}
                </span>
                <span
                  className={cn(
                    "text-xs",
                    styling.textColor,
                    "dark:text-zinc-500"
                  )}
                >
                  {metric.trend}% progress
                </span>
              </div>
            );
          })}
        </div>

        {/* Goals Section */}
        <div className="mt-8 space-y-6">
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <Target className="w-4 h-4" />
                Today{"'"}s Goals
              </h4>
              <button
                type="button"
                onClick={handleAddGoal}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </button>
            </div>

            <div className="space-y-2">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl",
                    "bg-zinc-50 dark:bg-zinc-900/50",
                    "border border-zinc-200/50 dark:border-zinc-800/50",
                    "hover:border-zinc-300/50 dark:hover:border-zinc-700/50",
                    "transition-all group"
                  )}
                >
                  {editingGoalId === goal.id ? (
                    // Edit mode
                    <>
                      <CheckCircle2
                        className={cn(
                          "w-5 h-5 flex-shrink-0",
                          goal.isCompleted
                            ? "text-emerald-500"
                            : "text-zinc-400 dark:text-zinc-600"
                        )}
                      />
                      <input
                        type="text"
                        value={editingGoalText}
                        onChange={(e) => setEditingGoalText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveEdit(goal.id);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                        className="flex-1 px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(goal.id)}
                        className="p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                        title="Save changes"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900/20 transition-colors"
                        title="Cancel editing"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </>
                  ) : (
                    // Display mode
                    <>
                      <button
                        onClick={() => handleGoalToggle(goal.id)}
                        className="flex items-center gap-3 flex-1"
                      >
                        <CheckCircle2
                          className={cn(
                            "w-5 h-5",
                            goal.isCompleted
                              ? "text-emerald-500"
                              : "text-zinc-400 dark:text-zinc-600"
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm text-left",
                            goal.isCompleted
                              ? "text-zinc-500 dark:text-zinc-400 line-through"
                              : "text-zinc-700 dark:text-zinc-300"
                          )}
                        >
                          {goal.title}
                        </span>
                      </button>

                      {/* Edit button */}
                      <button
                        onClick={() => handleStartEdit(goal)}
                        className={cn(
                          "p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors",
                          "opacity-0 group-hover:opacity-100"
                        )}
                        title="Edit goal"
                      >
                        <Edit3 className="w-4 h-4 text-blue-500" />
                      </button>

                      {/* Remove button - only show on hover or for custom goals */}
                      <button
                        onClick={() => handleRemoveGoal(goal.id)}
                        className={cn(
                          "p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors",
                          "opacity-0 group-hover:opacity-100",
                          // Always show for custom goals (goals with timestamp IDs)
                          goal.id.startsWith("goal-") && "opacity-100"
                        )}
                        title="Remove goal"
                      >
                        <X className="w-4 h-4 text-red-500 hover:text-red-600" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            {/* <button
            onClick={onViewDetails}
            className="inline-flex items-center gap-2 text-sm font-medium
              text-zinc-600 hover:text-zinc-900 
              dark:text-zinc-400 dark:hover:text-white
              transition-colors duration-200"
          >
            View Activity Details
            <ArrowUpRight className="w-4 h-4" />
          </button> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
