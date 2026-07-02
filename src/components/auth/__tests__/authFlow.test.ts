/**
 * E2E-style authentication flow tests
 *
 * Tests the complete authentication flows through the Redux store and
 * API client layer. API calls are mocked to avoid network calls.
 *
 * Covers:
 * - Complete sign-up flow (button click → Redux state → authenticated)
 * - Complete sign-in flow with email/password
 * - Google OAuth flow (redirect initiation + session restoration)
 *
 * Validates: Requirement 20.7
 */

// ─── Mock API client (ESM-only better-auth requires this) ────────────────────

jest.mock("@/lib/api/authClient", () => ({
  loginWithGoogle: jest.fn(),
  loginWithEmail: jest.fn(),
  registerWithEmail: jest.fn(),
  logout: jest.fn(),
  checkSession: jest.fn(),
}));

import { configureStore } from "@reduxjs/toolkit";
import authReducer, {
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  logout,
  checkSession,
} from "@/lib/redux/slices/authSlice";
import userDataReducer, {
  clearUserData,
} from "@/lib/redux/slices/userDataSlice";
import * as authClient from "@/lib/api/authClient";
import type { User } from "@/lib/types/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Creates a fresh isolated store for each test. */
function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      userData: userDataReducer,
    },
  });
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockGoogleUser: User = {
  id: "google-user-1",
  email: "googleuser@gmail.com",
  name: "Google User",
  provider: "google",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const mockEmailUser: User = {
  id: "email-user-1",
  email: "user@example.com",
  name: "Email User",
  provider: "email",
  createdAt: "2024-01-01T00:00:00.000Z",
};

// ─── Sign-Up Flow ─────────────────────────────────────────────────────────────

describe("Sign-up flow", () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    jest.clearAllMocks();
  });

  it("starts unauthenticated", () => {
    const { isAuthenticated, user } = store.getState().auth;
    expect(isAuthenticated).toBe(false);
    expect(user).toBeNull();
  });

  it("sets loading=true while registration is in progress", async () => {
    // Hold the promise so we can inspect intermediate state
    let resolveRegister!: (value: User) => void;
    (authClient.registerWithEmail as jest.Mock).mockReturnValue(
      new Promise<User>((res) => {
        resolveRegister = res;
      }),
    );

    const promise = store.dispatch(
      registerWithEmail({ email: "user@example.com", password: "password123" }),
    );

    // Immediately after dispatch, loading should be true
    expect(store.getState().auth.loading).toBe(true);

    resolveRegister(mockEmailUser);
    await promise;
  });

  it("sets isAuthenticated=true after successful registration", async () => {
    (authClient.registerWithEmail as jest.Mock).mockResolvedValue(
      mockEmailUser,
    );

    await store.dispatch(
      registerWithEmail({
        email: mockEmailUser.email,
        password: "securepass",
        name: mockEmailUser.name ?? undefined,
      }),
    );

    const { isAuthenticated, user, loading, error } = store.getState().auth;
    expect(isAuthenticated).toBe(true);
    expect(user).toEqual(mockEmailUser);
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });

  it("sets error state when registration fails (duplicate email)", async () => {
    const errorMessage = "Email already registered";
    (authClient.registerWithEmail as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );

    await store.dispatch(
      registerWithEmail({ email: "taken@example.com", password: "pass1234" }),
    );

    const { isAuthenticated, user, error } = store.getState().auth;
    expect(isAuthenticated).toBe(false);
    expect(user).toBeNull();
    expect(error).toBe(errorMessage);
  });

  it("sets error state when registration fails (validation error)", async () => {
    (authClient.registerWithEmail as jest.Mock).mockRejectedValue(
      new Error("Password must be at least 8 characters"),
    );

    await store.dispatch(
      registerWithEmail({ email: "user@example.com", password: "short" }),
    );

    expect(store.getState().auth.error).toBe(
      "Password must be at least 8 characters",
    );
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it("stores the correct user object after registration", async () => {
    (authClient.registerWithEmail as jest.Mock).mockResolvedValue(
      mockEmailUser,
    );

    await store.dispatch(
      registerWithEmail({ email: mockEmailUser.email, password: "pass1234" }),
    );

    const { user } = store.getState().auth;
    expect(user?.id).toBe(mockEmailUser.id);
    expect(user?.email).toBe(mockEmailUser.email);
    expect(user?.provider).toBe("email");
  });
});

// ─── Sign-In Flow ─────────────────────────────────────────────────────────────

describe("Sign-in flow (email/password)", () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    jest.clearAllMocks();
  });

  it("sets loading=true while sign-in is in progress", async () => {
    let resolveLogin!: (value: User) => void;
    (authClient.loginWithEmail as jest.Mock).mockReturnValue(
      new Promise<User>((res) => {
        resolveLogin = res;
      }),
    );

    const promise = store.dispatch(
      loginWithEmail({ email: "user@example.com", password: "pass1234" }),
    );

    expect(store.getState().auth.loading).toBe(true);

    resolveLogin(mockEmailUser);
    await promise;
  });

  it("transitions to authenticated state after successful sign-in", async () => {
    (authClient.loginWithEmail as jest.Mock).mockResolvedValue(mockEmailUser);

    await store.dispatch(
      loginWithEmail({ email: mockEmailUser.email, password: "pass1234" }),
    );

    const { isAuthenticated, user, loading, error } = store.getState().auth;
    expect(isAuthenticated).toBe(true);
    expect(user).toEqual(mockEmailUser);
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });

  it("stores the full user object in Redux after sign-in", async () => {
    (authClient.loginWithEmail as jest.Mock).mockResolvedValue(mockEmailUser);

    await store.dispatch(
      loginWithEmail({ email: mockEmailUser.email, password: "pass1234" }),
    );

    const { user } = store.getState().auth;
    expect(user?.id).toBe(mockEmailUser.id);
    expect(user?.email).toBe(mockEmailUser.email);
    expect(user?.name).toBe(mockEmailUser.name);
    expect(user?.provider).toBe("email");
  });

  it("sets error state on invalid credentials", async () => {
    (authClient.loginWithEmail as jest.Mock).mockRejectedValue(
      new Error("Invalid email or password"),
    );

    await store.dispatch(
      loginWithEmail({ email: "wrong@example.com", password: "wrongpass" }),
    );

    const { isAuthenticated, user, error } = store.getState().auth;
    expect(isAuthenticated).toBe(false);
    expect(user).toBeNull();
    expect(error).toBe("Invalid email or password");
  });

  it("clears any previous error on a new sign-in attempt", async () => {
    // First attempt fails
    (authClient.loginWithEmail as jest.Mock).mockRejectedValueOnce(
      new Error("Bad credentials"),
    );
    await store.dispatch(
      loginWithEmail({ email: "user@example.com", password: "wrong" }),
    );
    expect(store.getState().auth.error).toBe("Bad credentials");

    // Second attempt succeeds — error must be cleared
    (authClient.loginWithEmail as jest.Mock).mockResolvedValueOnce(
      mockEmailUser,
    );
    await store.dispatch(
      loginWithEmail({ email: "user@example.com", password: "correct" }),
    );
    expect(store.getState().auth.error).toBeNull();
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });

  it("does not alter userData slice on successful sign-in", async () => {
    (authClient.loginWithEmail as jest.Mock).mockResolvedValue(mockEmailUser);

    await store.dispatch(
      loginWithEmail({ email: mockEmailUser.email, password: "pass" }),
    );

    const userData = store.getState().userData;
    expect(userData.profile).toBeNull();
    expect(userData.bookmarks).toEqual([]);
  });
});

// ─── Google OAuth Flow ────────────────────────────────────────────────────────

describe("Google OAuth flow", () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    jest.clearAllMocks();
  });

  it("calls loginWithGoogle API and sets loading=true during redirect", async () => {
    (authClient.loginWithGoogle as jest.Mock).mockResolvedValue(undefined);

    const promise = store.dispatch(loginWithGoogle("/dashboard"));
    // Loading set to true while the thunk is pending
    expect(store.getState().auth.loading).toBe(true);
    await promise;
  });

  it("invokes the Google OAuth endpoint with the correct callbackURL", async () => {
    (authClient.loginWithGoogle as jest.Mock).mockResolvedValue(undefined);

    await store.dispatch(loginWithGoogle("/dashboard"));

    expect(authClient.loginWithGoogle).toHaveBeenCalledWith("/dashboard");
  });

  it("restores auth state via checkSession after OAuth redirect", async () => {
    // Simulate the post-OAuth page load: browser navigates back, checkSession
    // reads the cookie and returns the authenticated user.
    (authClient.checkSession as jest.Mock).mockResolvedValue(mockGoogleUser);

    await store.dispatch(checkSession());

    const { isAuthenticated, user, sessionChecked } = store.getState().auth;
    expect(isAuthenticated).toBe(true);
    expect(user).toEqual(mockGoogleUser);
    expect(sessionChecked).toBe(true);
  });

  it("clears auth state when checkSession returns null (no active session)", async () => {
    (authClient.checkSession as jest.Mock).mockResolvedValue(null);

    await store.dispatch(checkSession());

    const { isAuthenticated, user, sessionChecked } = store.getState().auth;
    expect(isAuthenticated).toBe(false);
    expect(user).toBeNull();
    expect(sessionChecked).toBe(true);
  });

  it("sets sessionChecked=true even when checkSession fails", async () => {
    (authClient.checkSession as jest.Mock).mockRejectedValue(
      new Error("Network error"),
    );

    await store.dispatch(checkSession());

    expect(store.getState().auth.sessionChecked).toBe(true);
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it("stores Google provider user correctly after OAuth", async () => {
    (authClient.checkSession as jest.Mock).mockResolvedValue(mockGoogleUser);

    await store.dispatch(checkSession());

    const { user } = store.getState().auth;
    expect(user?.provider).toBe("google");
    expect(user?.email).toBe(mockGoogleUser.email);
  });
});

// ─── Logout Flow ─────────────────────────────────────────────────────────────

describe("Logout flow", () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(async () => {
    store = makeStore();
    jest.clearAllMocks();
    // Start from an authenticated state
    (authClient.loginWithEmail as jest.Mock).mockResolvedValue(mockEmailUser);
    await store.dispatch(
      loginWithEmail({ email: mockEmailUser.email, password: "pass" }),
    );
  });

  it("clears auth state after logout", async () => {
    (authClient.logout as jest.Mock).mockResolvedValue(undefined);

    await store.dispatch(logout());

    const { isAuthenticated, user, sessionChecked } = store.getState().auth;
    expect(isAuthenticated).toBe(false);
    expect(user).toBeNull();
    expect(sessionChecked).toBe(false);
  });

  it("clears userData slice after logout + clearUserData", async () => {
    (authClient.logout as jest.Mock).mockResolvedValue(undefined);

    await store.dispatch(logout());
    store.dispatch(clearUserData());

    const userData = store.getState().userData;
    expect(userData.profile).toBeNull();
    expect(userData.bookmarks).toEqual([]);
    expect(userData.collections).toEqual([]);
  });

  it("clears auth state even when the logout API call fails", async () => {
    (authClient.logout as jest.Mock).mockRejectedValue(new Error("API error"));

    await store.dispatch(logout());

    // Security: local state must be cleared regardless of API error
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.user).toBeNull();
  });
});
