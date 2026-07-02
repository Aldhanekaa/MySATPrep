/**
 * Auth API Client
 * Client-side functions for interacting with Better Auth endpoints
 *
 * Validates: Requirements 2.1, 2.2, 3.1, 3.2, 17.1
 */

import { createAuthClient } from "better-auth/react";
import type {
  LoginCredentials,
  RegisterCredentials,
  User,
} from "@/lib/types/auth";

// Initialize the Better Auth client
const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
});

/**
 * Initiates Google OAuth sign-in by redirecting to the Google consent screen.
 * The redirect URL after OAuth completion defaults to the current page.
 * Validates: Requirement 2.1
 */
export async function loginWithGoogle(callbackURL?: string): Promise<void> {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: callbackURL ?? "/",
  });
}

/**
 * Signs in an existing user with email and password.
 * Returns the authenticated user on success.
 * Validates: Requirement 3.1
 */
export async function loginWithEmail(
  credentials: LoginCredentials,
): Promise<User> {
  const result = await authClient.signIn.email({
    email: credentials.email,
    password: credentials.password,
  });

  if (result.error) {
    throw new Error(result.error.message ?? "Invalid credentials");
  }

  if (!result.data?.user) {
    throw new Error("Sign-in failed: no user returned");
  }

  return mapBetterAuthUser(result.data.user);
}

/**
 * Registers a new user with email and password.
 * Returns the newly created user on success.
 * Validates: Requirement 3.2
 */
export async function registerWithEmail(
  credentials: RegisterCredentials,
): Promise<User> {
  const result = await authClient.signUp.email({
    email: credentials.email,
    password: credentials.password,
    name: credentials.name ?? "",
  });

  if (result.error) {
    throw new Error(result.error.message ?? "Registration failed");
  }

  if (!result.data?.user) {
    throw new Error("Registration failed: no user returned");
  }

  return mapBetterAuthUser(result.data.user);
}

/**
 * Signs out the current user, ending their session.
 * Validates: Requirement 17.1
 */
export async function logout(): Promise<void> {
  const result = await authClient.signOut();

  if (result.error) {
    throw new Error(result.error.message ?? "Logout failed");
  }
}

/**
 * Checks whether there is a valid current session.
 * Returns the authenticated user if a session exists, or null if not.
 * Validates: Requirement 10.2
 */
export async function checkSession(): Promise<User | null> {
  const result = await authClient.getSession();

  if (result.error || !result.data?.user) {
    return null;
  }

  return mapBetterAuthUser(result.data.user);
}

/**
 * Maps a Better Auth user object to the app's User type.
 * Better Auth uses camelCase internally; we normalise here.
 */
function mapBetterAuthUser(betterAuthUser: {
  id: string;
  email: string;
  name?: string | null;
  createdAt?: Date | string;
  [key: string]: unknown;
}): User {
  return {
    id: betterAuthUser.id,
    email: betterAuthUser.email,
    name: betterAuthUser.name ?? null,
    // Better Auth stores provider info differently; default to "email"
    // The actual provider is set server-side when the user is created
    provider: (betterAuthUser.provider as "google" | "email") ?? "email",
    createdAt:
      betterAuthUser.createdAt instanceof Date
        ? betterAuthUser.createdAt.toISOString()
        : ((betterAuthUser.createdAt as string) ?? new Date().toISOString()),
  };
}
