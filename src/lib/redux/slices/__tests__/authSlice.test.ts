/**
 * Unit tests for the auth Redux slice
 * Validates: Requirement 20.1
 */

// Mock the API client so Jest doesn't need to parse ESM-only better-auth packages.
// These tests only exercise Redux reducer logic, not the async thunks.
jest.mock("@/lib/api/authClient", () => ({
  loginWithGoogle: jest.fn(),
  loginWithEmail: jest.fn(),
  registerWithEmail: jest.fn(),
  logout: jest.fn(),
  checkSession: jest.fn(),
}));

import authReducer, {
  setUser,
  clearUser,
  setLoading,
  setError,
  setSessionChecked,
} from "../authSlice";
import type { AuthState, User } from "@/lib/types/auth";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockUser: User = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  provider: "google",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const mockEmailUser: User = {
  id: "user-456",
  email: "email@example.com",
  name: "Email User",
  provider: "email",
  createdAt: "2024-01-02T00:00:00.000Z",
};

// ─── Initial state ────────────────────────────────────────────────────────────

describe("authSlice – initial state", () => {
  it("should have the correct initial state shape", () => {
    const state = authReducer(undefined, { type: "@@INIT" });

    expect(state).toEqual({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
      sessionChecked: false,
      connectionError: false,
    });
  });

  it("isAuthenticated should default to false", () => {
    const state = authReducer(undefined, { type: "@@INIT" });
    expect(state.isAuthenticated).toBe(false);
  });

  it("user should default to null", () => {
    const state = authReducer(undefined, { type: "@@INIT" });
    expect(state.user).toBeNull();
  });

  it("loading should default to false", () => {
    const state = authReducer(undefined, { type: "@@INIT" });
    expect(state.loading).toBe(false);
  });

  it("error should default to null", () => {
    const state = authReducer(undefined, { type: "@@INIT" });
    expect(state.error).toBeNull();
  });

  it("sessionChecked should default to false", () => {
    const state = authReducer(undefined, { type: "@@INIT" });
    expect(state.sessionChecked).toBe(false);
  });

  it("connectionError should default to false", () => {
    const state = authReducer(undefined, { type: "@@INIT" });
    expect(state.connectionError).toBe(false);
  });
});

// ─── setUser ─────────────────────────────────────────────────────────────────

describe("authSlice – setUser", () => {
  it("should set the user in state", () => {
    const state = authReducer(undefined, setUser(mockUser));
    expect(state.user).toEqual(mockUser);
  });

  it("should mark isAuthenticated as true", () => {
    const state = authReducer(undefined, setUser(mockUser));
    expect(state.isAuthenticated).toBe(true);
  });

  it("should set loading to false", () => {
    const loadingState: AuthState = {
      isAuthenticated: false,
      user: null,
      loading: true,
      error: null,
      sessionChecked: false,
      connectionError: false,
    };
    const state = authReducer(loadingState, setUser(mockUser));
    expect(state.loading).toBe(false);
  });

  it("should clear any existing error", () => {
    const errorState: AuthState = {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: "Previous error",
      sessionChecked: false,
      connectionError: false,
    };
    const state = authReducer(errorState, setUser(mockUser));
    expect(state.error).toBeNull();
  });

  it("should work with a Google provider user", () => {
    const state = authReducer(undefined, setUser(mockUser));
    expect(state.user?.provider).toBe("google");
  });

  it("should work with an email provider user", () => {
    const state = authReducer(undefined, setUser(mockEmailUser));
    expect(state.user?.provider).toBe("email");
    expect(state.isAuthenticated).toBe(true);
  });

  it("should overwrite a previously set user", () => {
    const withFirstUser = authReducer(undefined, setUser(mockUser));
    const withSecondUser = authReducer(withFirstUser, setUser(mockEmailUser));
    expect(withSecondUser.user).toEqual(mockEmailUser);
    expect(withSecondUser.isAuthenticated).toBe(true);
  });

  it("should preserve sessionChecked when setting user", () => {
    const checkedState: AuthState = {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
      sessionChecked: true,
      connectionError: false,
    };
    const state = authReducer(checkedState, setUser(mockUser));
    expect(state.sessionChecked).toBe(true);
  });
});

// ─── clearUser ────────────────────────────────────────────────────────────────

describe("authSlice – clearUser", () => {
  const authenticatedState: AuthState = {
    isAuthenticated: true,
    user: mockUser,
    loading: false,
    error: null,
    sessionChecked: true,
    connectionError: false,
  };

  it("should set user to null", () => {
    const state = authReducer(authenticatedState, clearUser());
    expect(state.user).toBeNull();
  });

  it("should set isAuthenticated to false", () => {
    const state = authReducer(authenticatedState, clearUser());
    expect(state.isAuthenticated).toBe(false);
  });

  it("should set loading to false", () => {
    const state = authReducer(
      { ...authenticatedState, loading: true },
      clearUser(),
    );
    expect(state.loading).toBe(false);
  });

  it("should clear any existing error", () => {
    const state = authReducer(
      { ...authenticatedState, error: "Some error" },
      clearUser(),
    );
    expect(state.error).toBeNull();
  });

  it("should be idempotent when called on an already-cleared state", () => {
    const clearedOnce = authReducer(authenticatedState, clearUser());
    const clearedTwice = authReducer(clearedOnce, clearUser());
    expect(clearedTwice).toEqual(clearedOnce);
  });
});

// ─── setLoading ───────────────────────────────────────────────────────────────

describe("authSlice – setLoading", () => {
  it("should set loading to true", () => {
    const state = authReducer(undefined, setLoading(true));
    expect(state.loading).toBe(true);
  });

  it("should set loading to false", () => {
    const loadingState: AuthState = {
      isAuthenticated: false,
      user: null,
      loading: true,
      error: null,
      sessionChecked: false,
      connectionError: false,
    };
    const state = authReducer(loadingState, setLoading(false));
    expect(state.loading).toBe(false);
  });

  it("should not affect other state fields", () => {
    const initialState = authReducer(undefined, setUser(mockUser));
    const state = authReducer(initialState, setLoading(true));
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.error).toBeNull();
  });
});

// ─── setError ────────────────────────────────────────────────────────────────

describe("authSlice – setError", () => {
  it("should set an error string", () => {
    const state = authReducer(undefined, setError("Authentication failed"));
    expect(state.error).toBe("Authentication failed");
  });

  it("should set loading to false when error is set", () => {
    const loadingState: AuthState = {
      isAuthenticated: false,
      user: null,
      loading: true,
      error: null,
      sessionChecked: false,
      connectionError: false,
    };
    const state = authReducer(loadingState, setError("Something went wrong"));
    expect(state.loading).toBe(false);
  });

  it("should accept null to clear the error", () => {
    const errorState: AuthState = {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: "Existing error",
      sessionChecked: false,
      connectionError: false,
    };
    const state = authReducer(errorState, setError(null));
    expect(state.error).toBeNull();
  });

  it("should replace the previous error", () => {
    const errorState: AuthState = {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: "Old error",
      sessionChecked: false,
      connectionError: false,
    };
    const state = authReducer(errorState, setError("New error"));
    expect(state.error).toBe("New error");
  });

  it("should not change user or auth state when an error is set", () => {
    const authenticatedState: AuthState = {
      isAuthenticated: true,
      user: mockUser,
      loading: false,
      error: null,
      sessionChecked: true,
      connectionError: false,
    };
    const state = authReducer(
      authenticatedState,
      setError("Non-critical error"),
    );
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
  });
});

// ─── setSessionChecked ────────────────────────────────────────────────────────

describe("authSlice – setSessionChecked", () => {
  it("should set sessionChecked to true", () => {
    const state = authReducer(undefined, setSessionChecked(true));
    expect(state.sessionChecked).toBe(true);
  });

  it("should set sessionChecked to false", () => {
    const checkedState: AuthState = {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
      sessionChecked: true,
      connectionError: false,
    };
    const state = authReducer(checkedState, setSessionChecked(false));
    expect(state.sessionChecked).toBe(false);
  });

  it("should not affect other state fields", () => {
    const authenticatedState: AuthState = {
      isAuthenticated: true,
      user: mockUser,
      loading: false,
      error: null,
      sessionChecked: false,
      connectionError: false,
    };
    const state = authReducer(authenticatedState, setSessionChecked(true));
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});

// ─── Action composition ───────────────────────────────────────────────────────

describe("authSlice – action composition", () => {
  it("should handle a typical login sequence: loading → setUser → sessionChecked", () => {
    let state = authReducer(undefined, setLoading(true));
    expect(state.loading).toBe(true);

    state = authReducer(state, setUser(mockUser));
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.loading).toBe(false);

    state = authReducer(state, setSessionChecked(true));
    expect(state.sessionChecked).toBe(true);
  });

  it("should handle a failed login sequence: loading → setError", () => {
    let state = authReducer(undefined, setLoading(true));
    expect(state.loading).toBe(true);

    state = authReducer(state, setError("Invalid credentials"));
    expect(state.loading).toBe(false);
    expect(state.error).toBe("Invalid credentials");
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it("should handle a logout sequence: authenticated → clearUser", () => {
    let state = authReducer(undefined, setUser(mockUser));
    state = authReducer(state, setSessionChecked(true));

    state = authReducer(state, clearUser());
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});
