"use client";

/**
 * Google Sign-In Button Component
 *
 * Initiates Google OAuth flow by redirecting to the Better Auth Google endpoint.
 * Validates: Requirements 2.1, 16.8
 */

import { useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/redux/store";
import { loginWithGoogle } from "@/lib/redux/slices/authSlice";

interface GoogleSignInButtonProps {
  /** URL to redirect to after successful OAuth (defaults to "/") */
  callbackURL?: string;
  /** Additional CSS class names */
  className?: string;
}

export function GoogleSignInButton({
  callbackURL = "/",
  className = "",
}: GoogleSignInButtonProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    // loginWithGoogle triggers a full-page redirect, so loading state
    // is intentionally left true until the browser navigates away.
    dispatch(loginWithGoogle(callbackURL));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-busy={isLoading}
      aria-label="Sign in with Google"
      className={[
        "flex w-full items-center justify-center gap-3 rounded-md border border-gray-300",
        "bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm",
        "transition-colors hover:bg-gray-50 focus-visible:outline-2",
        "focus-visible:outline-offset-2 focus-visible:outline-blue-600",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isLoading ? (
        /* Animated spinner - announces "loading" to assistive tech via aria-busy above */
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      ) : (
        /* Google "G" logo SVG */
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      <span>{isLoading ? "Redirecting…" : "Continue with Google"}</span>
    </button>
  );
}
