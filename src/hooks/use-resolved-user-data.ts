"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectIsAuthenticated,
  selectUserStatistics,
  selectUserVocabulary,
  selectUserBookmarks,
  selectUserCollections,
  selectUserProfile,
  selectVocabPracticePerformance,
} from "@/lib/redux/selectors";
import {
  updateVocabulary,
  updateStatistics,
} from "@/lib/redux/slices/userDataSlice";
import {
  saveVocabulary,
  saveUserStatistics,
  debouncedSavePracticePerformance,
} from "@/lib/utils/dataSync";
import type { PracticeStatistics } from "@/types/statistics";
import type { VocabsData, PracticePerformanceData } from "@/types/vocabulary";
import type { VocabularyProgress } from "@/lib/types/userData";
import type { SavedQuestions, SavedQuestion } from "@/types/savedQuestions";
import type {
  SavedCollections,
  SavedCollection,
} from "@/types/savedCollections";
import type { UserProfileWithHistory } from "@/types/userProfile";
import type { PlainQuestionType } from "@/types/question";

import type { SavedQuestion as ReduxSavedQuestion } from "@/lib/types/userData";
import type { SavedCollection as ReduxSavedCollection } from "@/lib/types/userData";
import { reconstructPlainQuestion } from "@/lib/db/bookmarkTransforms";

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

    // Reconstruct a PlainQuestionType-compatible object from whatever is stored
    // in plain_question. Handles two shapes transparently:
    //   A) New rows — slim { primary_class_cd, skill_cd, difficulty }
    //   B) Old rows — full PlainQuestionType (returned as-is, nothing breaks)
    //   C) null     — bookmark was saved without metadata (plainQuestion = undefined)
    //
    // All three consumer paths (saved.tsx filter, saved.tsx / previousSaved.tsx
    // card rendering, review/page.tsx session building) only read:
    //   primary_class_cd, skill_cd, difficulty
    // from the reconstructed object, so unused fields default to "" or 0 safely.
    const plainQuestion = reconstructPlainQuestion({
      questionId: bookmark.questionId,
      externalId: bookmark.externalId,
      ibn: bookmark.ibn,
      storedMeta: bookmark.plainQuestion as
        | PlainQuestionType
        | {
            primary_class_cd: string;
            skill_cd: string;
            difficulty: "E" | "M" | "H";
          }
        | null
        | undefined,
    });

    acc[key].push({ ...bookmark, plainQuestion } as SavedQuestion);
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
      questionIds: col.questionIds ?? [], // guard against undefined from server
      questionDetails: (col.questionDetails ?? []).map((d) => ({
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

  return isAuthenticated ? (reduxStatistics as PracticeStatistics) : localStats;
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
    [isAuthenticated, practiceStatistics, dispatch, reduxState, setLocalStats],
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
 * Authenticated: reads from Redux collections; writes keep an optimistic local
 * overlay so the UI reflects changes immediately before Redux catches up.
 * Unauthenticated: reads/writes localStorage.
 */
export function useResolvedCollections(): [
  SavedCollections,
  (value: SavedCollections) => void,
] {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxCollections = useAppSelector(selectUserCollections);
  const [localCollections, setLocalCollections] =
    useLocalStorage<SavedCollections>("savedCollections", {});

  // Optimistic overlay for authenticated users: keeps the last value written by
  // the component so the UI doesn't flash back to stale Redux data while the
  // thunk is in-flight. Once Redux updates (reduxCollections changes), we clear
  // the overlay so the authoritative value takes over.
  const [authOverlay, setAuthOverlay] = useState<SavedCollections | null>(null);
  const prevReduxRef = useRef(reduxCollections);

  useEffect(() => {
    // When Redux resolves a new value (length or content changed), drop the
    // optimistic overlay so we show the server-confirmed state.
    if (prevReduxRef.current !== reduxCollections) {
      prevReduxRef.current = reduxCollections;
      setAuthOverlay(null);
    }
  }, [reduxCollections]);

  const reduxDerived = useMemo(
    () => collectionsToSavedCollections(reduxCollections),
    [reduxCollections],
  );

  const savedCollections = useMemo(
    () => (isAuthenticated ? (authOverlay ?? reduxDerived) : localCollections),
    [isAuthenticated, authOverlay, reduxDerived, localCollections],
  );

  const setSavedCollections = useCallback(
    (value: SavedCollections) => {
      if (isAuthenticated) {
        // Optimistically show the new value while the Redux thunk is in-flight
        setAuthOverlay(value);
      } else {
        setLocalCollections(value);
      }
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
      isAuthenticated ? vocabularyToVocabsData(reduxVocabulary) : localData,
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

const DEFAULT_PRACTICE_PERFORMANCE: PracticePerformanceData = {
  attempts: [],
  wordPerformance: {},
  lastUpdated: 0,
  totalQuizzesTaken: 0,
  overallAccuracy: 0,
  strongWords: [],
  weakWords: [],
  improvingWords: [],
};

/**
 * Returns [practicePerformance, setPracticePerformance].
 *
 * Authenticated users: reads from Redux (`vocabPracticePerformance` field),
 * writes go through dataSync → PUT /api/user/vocab-practice-performance + Redux.
 *
 * Unauthenticated users: reads/writes localStorage ("practicePerformanceData").
 *
 * The setter is debounced at 500 ms to coalesce rapid per-answer updates.
 */
export function useResolvedPracticePerformanceData(): [
  PracticePerformanceData,
  (
    value:
      | PracticePerformanceData
      | ((val: PracticePerformanceData) => PracticePerformanceData),
  ) => void,
] {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxPerformance = useAppSelector(selectVocabPracticePerformance);
  const dispatch = useAppDispatch();
  const reduxState = useAppSelector((s) => s);

  const [localData, setLocalData] = useLocalStorage<PracticePerformanceData>(
    "practicePerformanceData",
    DEFAULT_PRACTICE_PERFORMANCE,
  );

  const practicePerformance = useMemo(
    () =>
      isAuthenticated
        ? (reduxPerformance ?? DEFAULT_PRACTICE_PERFORMANCE)
        : localData,
    [isAuthenticated, reduxPerformance, localData],
  );

  const setPracticePerformance = useCallback(
    (
      value:
        | PracticePerformanceData
        | ((val: PracticePerformanceData) => PracticePerformanceData),
    ) => {
      const newValue =
        value instanceof Function ? value(practicePerformance) : value;

      if (isAuthenticated) {
        // Use debounced save — practice components call this on every answer
        debouncedSavePracticePerformance(newValue, dispatch, reduxState);
      } else {
        setLocalData(newValue);
      }
    },
    [isAuthenticated, practicePerformance, dispatch, reduxState, setLocalData],
  );

  return [practicePerformance, setPracticePerformance];
}
