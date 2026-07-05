/**
 * Authentication Redux Slice
 * Manages authentication state including user information, loading states, and errors.
 * Includes async thunks for all authentication actions.
 *
 * Validates: Requirements 4.2, 4.7
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type {
  AuthState,
  User,
  LoginCredentials,
  RegisterCredentials,
} from "@/lib/types/auth";
import {
  loginWithGoogle as apiLoginWithGoogle,
  loginWithEmail as apiLoginWithEmail,
  registerWithEmail as apiRegisterWithEmail,
  logout as apiLogout,
  checkSession as apiCheckSession,
  ConnectionTimeoutError,
} from "@/lib/api/authClient";

// ─── Async Thunks ────────────────────────────────────────────────────────────

/**
 * Initiates Google OAuth sign-in (redirects; no return value needed in Redux).
 * Validates: Requirement 2.1
 */
export const loginWithGoogle = createAsyncThunk<void, string | undefined>(
  "auth/loginWithGoogle",
  async (callbackURL, { rejectWithValue }) => {
    try {
      await apiLoginWithGoogle(callbackURL);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Google sign-in failed",
      );
    }
  },
);

/**
 * Signs in with email and password, then stores the user in Redux.
 * Validates: Requirement 3.1, 4.7
 */
export const loginWithEmail = createAsyncThunk<User, LoginCredentials>(
  "auth/loginWithEmail",
  async (credentials, { rejectWithValue }) => {
    try {
      return await apiLoginWithEmail(credentials);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Login failed",
      );
    }
  },
);

/**
 * Registers a new user with email and password, then stores the user in Redux.
 * Validates: Requirement 3.2, 4.7
 */
export const registerWithEmail = createAsyncThunk<User, RegisterCredentials>(
  "auth/registerWithEmail",
  async (credentials, { rejectWithValue }) => {
    try {
      return await apiRegisterWithEmail(credentials);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Registration failed",
      );
    }
  },
);

/**
 * Signs out the current user and clears Redux auth state.
 * Validates: Requirement 17.1, 4.7
 */
export const logout = createAsyncThunk<void, void>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await apiLogout();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Logout failed",
      );
    }
  },
);

/**
 * Checks the current session on app load and restores auth state if valid.
 * Validates: Requirements 10.2, 10.3, 10.6, 4.7
 */
export const checkSession = createAsyncThunk<
  User | null,
  void,
  { rejectValue: { message: string; isConnectionError: boolean } }
>(
  "auth/checkSession",
  async (_, { rejectWithValue }) => {
    try {
      return await apiCheckSession();
    } catch (error) {
      const isConnectionError = error instanceof ConnectionTimeoutError;
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "Session check failed",
        isConnectionError,
      });
    }
  },
  {
    // Skip if already checked or currently checking.
    // Guards against React StrictMode double-mount and any other re-trigger.
    condition: (_, { getState }) => {
      const { sessionChecked, loading } = (getState() as { auth: AuthState })
        .auth;
      if (sessionChecked) return false;
      if (loading) return false; // check already in-flight
      return true;
    },
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

// Initial authentication state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  sessionChecked: false,
  connectionError: false,
};

// Auth slice with reducers and extraReducers for async thunks
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

    // Clear the connection error flag (e.g. when user initiates a retry)
    clearConnectionError: (state) => {
      state.connectionError = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── loginWithGoogle ──────────────────────────────────────────────────────
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state) => {
        // OAuth redirects away; state will be updated via checkSession on return
        state.loading = false;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── loginWithEmail ───────────────────────────────────────────────────────
    builder
      .addCase(loginWithEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── registerWithEmail ────────────────────────────────────────────────────
    builder
      .addCase(registerWithEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerWithEmail.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(registerWithEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── logout ───────────────────────────────────────────────────────────────
    builder
      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        // Keep sessionChecked = true: the session IS checked, result is "not authenticated".
        // Setting it to false would cause DashboardLoadingGuard to spin forever
        // because SessionInitializer only dispatches checkSession on mount and
        // won't re-run after logout/redirect.
        state.sessionChecked = true;
      })
      .addCase(logout.rejected, (state, action) => {
        // Even on failure, clear local state for security
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload as string;
        // Same as fulfilled: session is resolved (unauthenticated), not pending.
        state.sessionChecked = true;
      });

    // ── checkSession ─────────────────────────────────────────────────────────
    builder
      .addCase(checkSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
        state.loading = false;
        state.sessionChecked = true;
      })
      .addCase(checkSession.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.sessionChecked = true;
        state.error = action.payload?.message ?? action.error.message ?? null;
        state.connectionError = action.payload?.isConnectionError ?? false;
      });
  },
});

// Export actions
export const {
  setUser,
  clearUser,
  setLoading,
  setError,
  setSessionChecked,
  clearConnectionError,
} = authSlice.actions;

// Export reducer
export default authSlice.reducer;
