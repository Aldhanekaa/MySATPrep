import { useMemo, useCallback } from "react";
import { QuestionDifficulty } from "@/types/question";
import { DIFFICULTY_OPTIONS } from "./constants";
import { QuestionWithData } from "./types";

// Calculate loading indicator data
export const useLoadingIndicatorData = (
  actualFilteredQuestions: QuestionWithData[],
  visibleCount: number,
  selectedDifficulties: QuestionDifficulty[]
) => {
  return useMemo(() => {
    const visibleQuestions = actualFilteredQuestions.slice(0, visibleCount);
    const hasLoadingQuestions = visibleQuestions.some((q) => q.isLoading);
    const loadingCount = visibleQuestions.filter((q) => q.isLoading).length;
    const questionsWithMissingDifficulty = visibleQuestions.filter(
      (q) => !q.difficulty
    ).length;

    return {
      hasLoadingQuestions,
      loadingCount,
      questionsWithMissingDifficulty,
      shouldShowMissingDifficultyNote:
        questionsWithMissingDifficulty > 0 &&
        selectedDifficulties.includes("E"),
      isFiltered: selectedDifficulties.length > 0,
    };
  }, [actualFilteredQuestions, visibleCount, selectedDifficulties]);
};

// Create skill options from selectedDomains, grouped by primaryClassCd
export const useSkillOptions = (
  selectedDomains: Record<
    string,
    {
      subject: string;
      text: string;
      id: string;
      primaryClassCd: string;
      skill: { text: string; id: string; skill_cd: string }[];
    }
  >
) => {
  return useMemo(() => {
    const options: Array<{
      value: string;
      label: string;
      id: string;
      group: string;
      groupLabel: string;
    }> = [];

    Object.values(selectedDomains).forEach((domain) => {
      domain.skill.forEach((skill) => {
        options.push({
          value: skill.skill_cd,
          label: skill.text,
          id: skill.id,
          group: domain.primaryClassCd,
          groupLabel: domain.text,
        });
      });
    });

    return options;
  }, [selectedDomains]);
};

// Render selected difficulties
export const useRenderSelectedDifficulties = () => {
  return useCallback((value: string[]) => {
    if (value.length === 0) return "";
    if (value.length === 1) {
      const difficulty = DIFFICULTY_OPTIONS.find(
        (opt) => opt.value === value[0]
      );
      return difficulty ? difficulty.label : value[0];
    }
    return `${value.length} difficulties selected`;
  }, []);
};

// Render selected skills
export const useRenderSelectedSkills = (
  skillOptions: Array<{
    value: string;
    label: string;
    id: string;
    group: string;
    groupLabel: string;
  }>
) => {
  return useCallback(
    (value: string[]) => {
      if (value.length === 0) return "";
      if (value.length === 1) {
        const skill = skillOptions.find((opt) => opt.value === value[0]);
        return skill ? skill.label : value[0];
      }
      return `${value.length} skills selected`;
    },
    [skillOptions]
  );
};
