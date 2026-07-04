import { LRUCache } from "lru-cache";

const cacheConfigs = {
  userProfile: { max: 1000, ttl: 5 * 60 * 1000 },
  practiceStatistics: { max: 1000, ttl: 5 * 60 * 1000 },
  practiceSessions: { max: 500, ttl: 10 * 60 * 1000 },
  savedQuestions: { max: 500, ttl: 10 * 60 * 1000 },
  savedCollections: { max: 500, ttl: 10 * 60 * 1000 },
  vocabularyProgress: { max: 1000, ttl: 10 * 60 * 1000 },
  userPreferences: { max: 1000, ttl: 10 * 60 * 1000 },
  questionNotes: { max: 1000, ttl: 10 * 60 * 1000 },
  answerHistory: { max: 1000, ttl: 10 * 60 * 1000 },
  vocabPracticePerformance: { max: 1000, ttl: 5 * 60 * 1000 },
};

export const userProfileCache = new LRUCache<string, any>(
  cacheConfigs.userProfile,
);
export const statisticsCache = new LRUCache<string, any>(
  cacheConfigs.practiceStatistics,
);
export const sessionsCache = new LRUCache<string, any>(
  cacheConfigs.practiceSessions,
);
export const bookmarksCache = new LRUCache<string, any>(
  cacheConfigs.savedQuestions,
);
export const collectionsCache = new LRUCache<string, any>(
  cacheConfigs.savedCollections,
);
export const vocabularyCache = new LRUCache<string, any>(
  cacheConfigs.vocabularyProgress,
);
export const preferencesCache = new LRUCache<string, any>(
  cacheConfigs.userPreferences,
);
export const notesCache = new LRUCache<string, any>(cacheConfigs.questionNotes);
export const answerHistoryCache = new LRUCache<string, any>(
  cacheConfigs.answerHistory,
);
export const vocabPracticePerformanceCache = new LRUCache<string, any>(
  cacheConfigs.vocabPracticePerformance,
);

export function getCacheKey(
  type: string,
  userId: string,
  ...rest: string[]
): string {
  return [type, userId, ...rest].join(":");
}

export function invalidateUserCache(userId: string): void {
  userProfileCache.delete(getCacheKey("userProfile", userId));
  // Invalidate all assessment statistics
  ["SAT", "PSAT/NMSQT", "PSAT"].forEach((assessment) => {
    statisticsCache.delete(getCacheKey("statistics", userId, assessment));
  });
  sessionsCache.delete(getCacheKey("sessions", userId));
  bookmarksCache.delete(getCacheKey("bookmarks", userId));
  collectionsCache.delete(getCacheKey("collections", userId));
  vocabularyCache.delete(getCacheKey("vocabulary", userId));
  preferencesCache.delete(getCacheKey("preferences", userId));
  notesCache.delete(getCacheKey("notes", userId));
  answerHistoryCache.delete(getCacheKey("answerHistory", userId));
  vocabPracticePerformanceCache.delete(
    getCacheKey("vocabPracticePerformance", userId),
  );
}

// Sentinel value to cache `null` results — LRUCache ignores actual null values.
const NULL_SENTINEL = "__NULL__";

export async function getCachedOrFetch<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cache: LRUCache<string, any>,
  key: string,
  fetcher: () => Promise<T | null>,
): Promise<T | null> {
  const cached = cache.get(key);
  // console.log("cached", cached);
  if (cached !== undefined) {
    return cached === NULL_SENTINEL ? null : (cached as T);
  }

  const data = await fetcher();

  cache.set(key, data === null ? NULL_SENTINEL : data);
  return data;
}
