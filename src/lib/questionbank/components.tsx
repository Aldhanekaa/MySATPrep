import React, { useCallback } from "react";
import { QuestionDifficulty } from "@/types/question";

// Render functions for difficulty options
export const useRenderDifficultyOption = () => {
  return useCallback(
    (option: { value: QuestionDifficulty; label: string; id: string }) => (
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span>{option.label}</span>
        </div>
      </div>
    ),
    []
  );
};

// Render functions for skill options
export const useRenderSkillOption = () => {
  return useCallback(
    (option: {
      value: string;
      label: string;
      id: string;
      group: string;
      groupLabel: string;
    }) => (
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="text-sm">{option.label}</span>
        </div>
      </div>
    ),
    []
  );
};

// Loading Indicator Component
interface LoadingIndicatorProps {
  loadingCount: number;
  questionsWithMissingDifficulty: number;
  isFiltered: boolean;
  shouldShowMissingDifficultyNote: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  loadingCount,
  questionsWithMissingDifficulty,
  isFiltered,
  shouldShowMissingDifficultyNote,
}) => (
  <div className="text-center text-sm text-muted-foreground">
    <div className="flex items-center justify-center space-x-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      <span>
        Loading {loadingCount} question{loadingCount !== 1 ? "s" : ""}
        {isFiltered && " (filtered)"}
        ...
      </span>
    </div>
    {shouldShowMissingDifficultyNote && (
      <div className="text-xs text-amber-600 mt-1">
        Including {questionsWithMissingDifficulty} question
        {questionsWithMissingDifficulty !== 1 ? "s" : ""} with missing
        difficulty data
      </div>
    )}
  </div>
);
