/**
 * Authentication Redux Slice
 * Manages authentication state including user information, loading states, and errors
 *
 * Validates: Requirement 4.2
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, User } from "@/lib/types/auth";

// Initial authentication state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  sessionChecked: false,
};

// Auth slice with reducers
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Set user and mark as authenticated
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },

    // Clear user and mark as unauthenticated
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error message
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Mark session as checked (used on app initialization)
    setSessionChecked: (state, action: PayloadAction<boolean>) => {
      state.sessionChecked = action.payload;
    },
  },
});

// Export actions
export const { setUser, clearUser, setLoading, setError, setSessionChecked } =
  authSlice.actions;

// Export reducer
export default authSlice.reducer;
