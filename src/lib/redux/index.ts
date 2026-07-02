/**
 * Centralized Redux Exports
 * Export all Redux-related functionality from a single location
 */

// Store
export { store } from "./store";
export type { RootState, AppDispatch } from "./store";

// Provider
export { ReduxProvider } from "./Provider";

// Hooks
export { useAppDispatch, useAppSelector } from "./hooks";

// Auth slice
export {
  setUser,
  clearUser,
  setLoading,
  setError,
  setSessionChecked,
} from "./slices/authSlice";

// User data slice
export {
  setProfile,
  updateProfile,
  setStatistics,
  updateStatistics,
  setSessions,
  addSession,
  updateSession,
  removeSession,
  setBookmarks,
  addBookmark,
  removeBookmark,
  setCollections,
  addCollection,
  updateCollection,
  removeCollection,
  setVocabulary,
  updateVocabulary,
  setPreferences,
  updatePreferences,
  setDataLoading,
  setDataError,
  clearUserData,
} from "./slices/userDataSlice";
