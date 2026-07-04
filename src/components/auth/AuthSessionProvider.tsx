"use client";

/**
 * AuthSessionProvider
 *
 * Wraps children to provide auth-related context. Session initialization
 * (checkSession + fetchUserData) is handled by SessionInitializer, which
 * is rendered inside ReduxProvider in the root layout.
 *
 * Validates: Requirements 2.4, 2.5, 10.1, 10.2, 10.3, 10.6
 */

interface AuthSessionProviderProps {
  children: React.ReactNode;
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  return <>{children}</>;
}
