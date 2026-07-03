"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectIsAuthenticated,
  selectUserStatistics,
  selectUserVocabulary,
  selectUserBookmarks,
  selectUserCollections,
  selectUserProfile,
} from "@/lib/redux/selectors";
import {
  updateVocabulary,
  updateStatistics,
} from "@/lib/redux/slices/userDataSlice";
import {
  saveVocabulary,
  saveUserStatistics,
} from "@/lib/utils/dataSync";
import type { PracticeStatistics } from "@/types/statistics";
import type { VocabsData } from "@/types/vocabulary";
import type { VocabularyProgress } from "@/lib/types/userData";
import type { SavedQuestions, SavedQuestion } from "@/types/savedQuestions";
import type { SavedCollections, SavedCollection } from "@/types/savedCollections";
import type { UserProfileWithHistory } from "@/types/userProfile";

import type { SavedQuestion as ReduxSavedQuestion } from "@/lib/types/userData";
import type { SavedCollection as ReduxSavedCollection } from "@/lib/types/userData";

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

function bookmarksToSavedQuestions(
  bookmarks: ReduxSavedQuestion[],
): SavedQuestions {
  return bookmarks.reduce<SavedQuestions>((acc, bookmark) => {
    const key = bookmark.assessment;
    if (!acc[key]) acc[key] = [];
    acc[key].push(bookmark as SavedQuestion);
    return acc;
  }, {});
}

function collectionsToSavedCollections(
  collections: ReduxSavedCollection[],
): SavedCollections {
  return collections.reduce<SavedCollections>((acc, col) => {
    const key = col.collectionId;
    acc[key] = {
      id: col.collectionId,
      name: col.name,
      description: col.description,
      createdAt: col.createdAt,
      updatedAt: col.updatedAt,
      questionIds: col.questionIds,
      questionDetails: col.questionDetails.map((d) => ({
        questionId: d.questionId,
        externalId: d.externalId ?? null,
        ibn: d.ibn ?? null,
      })),
      color: col.color,
    };
    return acc;
  }, {});
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
 * Returns [practiceStatistics, setPracticeStatistics].
 * Authenticated writes go through dataSync (API + Redux).
 */
export function usePracticeStatisticsState(): [
  PracticeStatistics,
  (
    value:
      | PracticeStatistics
      | ((val: PracticeStatistics) => PracticeStatistics),
  ) => void,
] {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxStatistics = useAppSelector(selectUserStatistics);
  const dispatch = useAppDispatch();
  const reduxState = useAppSelector((s) => s);
  const [localStats, setLocalStats] = useLocalStorage<PracticeStatistics>(
    "practiceStatistics",
    {},
  );

  const practiceStatistics = isAuthenticated
    ? (reduxStatistics as PracticeStatistics)
    : localStats;

  const setPracticeStatistics = useCallback(
    (
      value:
        | PracticeStatistics
        | ((val: PracticeStatistics) => PracticeStatistics),
    ) => {
      const newValue =
        value instanceof Function ? value(practiceStatistics) : value;

      if (isAuthenticated) {
        dispatch(updateStatistics(newValue));
        saveUserStatistics(newValue, dispatch, reduxState);
      } else {
        setLocalStats(newValue);
      }
    },
    [
      isAuthenticated,
      practiceStatistics,
      dispatch,
      reduxState,
      setLocalStats,
    ],
  );

  return [practiceStatistics, setPracticeStatistics];
}

/**
 * Returns [savedQuestions, setSavedQuestions].
 * Authenticated reads from Redux bookmarks; writes only affect localStorage
 * (individual bookmark ops should use dataSync saveBookmark/removeBookmark).
 */
export function useResolvedBookmarks(): [
  SavedQuestions,
  (value: SavedQuestions) => void,
] {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxBookmarks = useAppSelector(selectUserBookmarks);
  const [localBookmarks, setLocalBookmarks] = useLocalStorage<SavedQuestions>(
    "savedQuestions",
    {},
  );

  const savedQuestions = useMemo(
    () =>
      isAuthenticated
        ? bookmarksToSavedQuestions(reduxBookmarks)
        : localBookmarks,
    [isAuthenticated, reduxBookmarks, localBookmarks],
  );

  const setSavedQuestions = useCallback(
    (value: SavedQuestions) => {
      if (!isAuthenticated) setLocalBookmarks(value);
    },
    [isAuthenticated, setLocalBookmarks],
  );

  return [savedQuestions, setSavedQuestions];
}

/**
 * Returns [savedCollections, setSavedCollections].
 * Authenticated reads from Redux collections; writes only affect localStorage
 * (individual collection ops should use dataSync).
 */
export function useResolvedCollections(): [
  SavedCollections,
  (value: SavedCollections) => void,
] {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxCollections = useAppSelector(selectUserCollections);
  const [localCollections, setLocalCollections] =
    useLocalStorage<SavedCollections>("savedCollections", {});

  const savedCollections = useMemo(
    () =>
      isAuthenticated
        ? collectionsToSavedCollections(reduxCollections)
        : localCollections,
    [isAuthenticated, reduxCollections, localCollections],
  );

  const setSavedCollections = useCallback(
    (value: SavedCollections) => {
      if (!isAuthenticated) setLocalCollections(value);
    },
    [isAuthenticated, setLocalCollections],
  );

  return [savedCollections, setSavedCollections];
}

/**
 * Returns user profile from Redux when authenticated, otherwise localStorage.
 */
export function useResolvedUserProfile(): UserProfileWithHistory | null {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxProfile = useAppSelector(selectUserProfile);
  const [localProfile] = useLocalStorage<UserProfileWithHistory | null>(
    "userProfile",
    null,
  );

  return isAuthenticated ? reduxProfile : localProfile;
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
