/**
 * Redux Store Configuration
 * Configures Redux Toolkit store with auth and userData slices
 *
 * Validates: Requirement 4.1
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userDataReducer from "./slices/userDataSlice";

// Configure Redux store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    userData: userDataReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ["userData/addSession", "userData/updateSession"],
        // Ignore these paths in the state
        ignoredPaths: ["userData.sessions"],
      },
    }),
});

// Infer RootState and AppDispatch types from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
