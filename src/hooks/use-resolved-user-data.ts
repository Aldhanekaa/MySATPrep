"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectIsAuthenticated,
  selectUserStatistics,
  selectUserVocabulary,
} from "@/lib/redux/selectors";
import { updateVocabulary } from "@/lib/redux/slices/userDataSlice";
import { saveVocabulary } from "@/lib/utils/dataSync";
import type { PracticeStatistics } from "@/types/statistics";
import type { VocabsData } from "@/types/vocabulary";
import type { VocabularyProgress } from "@/lib/types/userData";

const DEFAULT_VOCABS_DATA: VocabsData = {
  learntVocabs: [],
  userSentences: {},
};

function vocabularyToVocabsData(
  vocabulary: VocabularyProgress | null,
): VocabsData {
  if (!vocabulary) return DEFAULT_VOCABS_DATA;
  return {
    learntVocabs: vocabulary.learntVocabs ?? [],
    userSentences: vocabulary.userSentences ?? {},
  };
}

/**
 * Returns practice statistics from Redux when authenticated, otherwise localStorage.
 */
export function useResolvedPracticeStatistics(): PracticeStatistics {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxStatistics = useAppSelector(selectUserStatistics);
  const [localStats] = useLocalStorage<PracticeStatistics>(
    "practiceStatistics",
    {},
  );

  return isAuthenticated
    ? (reduxStatistics as PracticeStatistics)
    : localStats;
}

/**
 * Returns vocabulary progress from Redux when authenticated, otherwise localStorage.
 * Writes go through dataSync (API + Redux) for authenticated users.
 */
export function useResolvedVocabsData(): [
  VocabsData,
  (value: VocabsData | ((val: VocabsData) => VocabsData)) => void,
] {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxVocabulary = useAppSelector(selectUserVocabulary);
  const dispatch = useAppDispatch();
  const reduxState = useAppSelector((s) => s);

  const [localData, setLocalData] = useLocalStorage<VocabsData>(
    "vocabsData",
    DEFAULT_VOCABS_DATA,
  );

  const vocabsData = useMemo(
    () =>
      isAuthenticated
        ? vocabularyToVocabsData(reduxVocabulary)
        : localData,
    [isAuthenticated, reduxVocabulary, localData],
  );

  const setVocabsData = useCallback(
    (value: VocabsData | ((val: VocabsData) => VocabsData)) => {
      const newValue = value instanceof Function ? value(vocabsData) : value;

      if (isAuthenticated) {
        dispatch(updateVocabulary(newValue));
        saveVocabulary(newValue, dispatch, reduxState);
      } else {
        setLocalData(newValue);
      }
    },
    [isAuthenticated, vocabsData, dispatch, reduxState, setLocalData],
  );

  return [vocabsData, setVocabsData];
}
