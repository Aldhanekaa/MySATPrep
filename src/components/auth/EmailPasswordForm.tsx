"use client";

/**
 * Email/Password Authentication Form
 *
 * Supports both "signin" and "signup" modes. Connects to the
 * loginWithEmail and registerWithEmail Redux thunks.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 16.8, 19.2
 */

import { memo, useState, useId } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import type { AppDispatch } from "@/lib/redux/store";
import { selectAuthLoading, selectAuthError } from "@/lib/redux/selectors";
import {
  loginWithEmail,
  registerWithEmail,
} from "@/lib/redux/slices/authSlice";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmailPasswordFormProps {
  /** Controls whether the form operates in sign-in or sign-up mode */
  mode: "signin" | "signup";
  /** Called after a successful authentication / registration */
  onSuccess?: () => void;
  /** Additional CSS class names for the form element */
  className?: string;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

/** Very simple RFC-5322-ish check sufficient for client-side feedback */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Password must be at least 8 characters (Req 3.4) */
function isStrongEnough(password: string): boolean {
  return password.length >= 8;
}

/**
 * Returns a human-readable strength label and a numeric level (0-3)
 * so we can render a simple strength bar.
 */
function passwordStrength(password: string): {
  label: string;
  level: 0 | 1 | 2 | 3;
} {
  if (password.length === 0) return { label: "", level: 0 };
  if (password.length < 8) return { label: "Too short", level: 1 };
  if (password.length < 12) return { label: "Fair", level: 2 };
  return { label: "Strong", level: 3 };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const EmailPasswordForm = memo(function EmailPasswordForm({
  mode,
  onSuccess,
  className = "",
}: EmailPasswordFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectAuthLoading);
  const reduxError = useSelector(selectAuthError);

  // ── Field state ──────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // signup only

  // ── Validation errors (client-side) ─────────────────────────────────────
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ── Password visibility toggle ───────────────────────────────────────────
  const [showPassword, setShowPassword] = useState(false);

  // ── Stable IDs for accessibility ─────────────────────────────────────────
  const uid = useId();
  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;
  const nameId = `${uid}-name`;
  const emailErrorId = `${uid}-email-error`;
  const passwordErrorId = `${uid}-password-error`;
  const formErrorId = `${uid}-form-error`;

  // ── Derived state ─────────────────────────────────────────────────────────
  const strength = passwordStrength(password);
  const isSignUp = mode === "signup";
  const submitLabel = isSignUp ? "Create account" : "Sign in";

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function validateFields(): boolean {
    let valid = true;

    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      valid = false;
    } else {
      setEmailError(null);
    }

    if (!isStrongEnough(password)) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    } else {
      setPasswordError(null);
    }

    return valid;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validateFields()) return;

    const thunk = isSignUp
      ? registerWithEmail({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
        })
      : loginWithEmail({ email: email.trim(), password });

    const result = await dispatch(thunk);

    // If the thunk fulfilled without error, show success toast and call the success callback
    if (result.meta.requestStatus === "fulfilled") {
      if (isSignUp) {
        toast.success("Account created! Welcome to MySATPrep.");
      } else {
        toast.success("Welcome back!");
      }
      onSuccess?.();
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const strengthColors: Record<0 | 1 | 2 | 3, string> = {
    0: "bg-gray-200 dark:bg-gray-700",
    1: "bg-red-500",
    2: "bg-yellow-400",
    3: "bg-green-500",
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={isSignUp ? "Create account form" : "Sign in form"}
      className={["flex flex-col gap-4", className].filter(Boolean).join(" ")}
    >
      {/* ── Server / Redux error banner ── */}
      {reduxError && (
        <div
          id={formErrorId}
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          {reduxError}
        </div>
      )}

      {/* ── Name field (sign-up only) ── */}
      {isSignUp && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={nameId}
            className="text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            Name{" "}
            <span className="text-gray-400 dark:text-gray-500">(optional)</span>
          </label>
          <input
            id={nameId}
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={[
              "h-10 w-full rounded-md border px-3 text-sm outline-none transition-colors",
              "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400",
              "hover:border-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500",
              "dark:hover:border-gray-500 dark:focus:ring-blue-400",
            ].join(" ")}
          />
        </div>
      )}

      {/* ── Email field ── */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={emailId}
          className="text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          Email address
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete={isSignUp ? "email" : "username"}
          required
          aria-required="true"
          aria-describedby={emailError ? emailErrorId : undefined}
          aria-invalid={emailError ? "true" : "false"}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            // Clear error once user starts correcting
            if (emailError) setEmailError(null);
          }}
          onBlur={() => {
            if (email && !isValidEmail(email)) {
              setEmailError("Enter a valid email address.");
            }
          }}
          placeholder="you@example.com"
          className={[
            "h-10 w-full rounded-md border px-3 text-sm outline-none transition-colors",
            emailError
              ? "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/30"
              : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800",
            "text-gray-900 placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500",
            "hover:border-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "dark:hover:border-gray-500 dark:focus:ring-blue-400",
          ].join(" ")}
        />
        {emailError && (
          <p
            id={emailErrorId}
            role="alert"
            className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
          >
            <svg
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {emailError}
          </p>
        )}
      </div>

      {/* ── Password field ── */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={passwordId}
          className="text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          Password
        </label>
        <div className="relative">
          <input
            id={passwordId}
            type={showPassword ? "text" : "password"}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            aria-required="true"
            aria-describedby={
              [
                passwordError ? passwordErrorId : null,
                isSignUp && password.length > 0 ? `${uid}-strength` : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            aria-invalid={passwordError ? "true" : "false"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            onBlur={() => {
              if (password && !isStrongEnough(password)) {
                setPasswordError("Password must be at least 8 characters.");
              }
            }}
            placeholder={isSignUp ? "At least 8 characters" : "Your password"}
            className={[
              "h-10 w-full rounded-md border px-3 pr-10 text-sm outline-none transition-colors",
              passwordError
                ? "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/30"
                : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800",
              "text-gray-900 placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500",
              "hover:border-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "dark:hover:border-gray-500 dark:focus:ring-blue-400",
            ].join(" ")}
          />
          {/* Show/hide password toggle */}
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className={[
              "absolute inset-y-0 right-0 flex items-center px-3",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
              "focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 rounded-r-md",
            ].join(" ")}
          >
            {showPassword ? (
              /* Eye-off icon */
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              /* Eye icon */
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {/* Strength indicator (sign-up only, visible once user types) */}
        {isSignUp && password.length > 0 && (
          <div
            id={`${uid}-strength`}
            aria-label={`Password strength: ${strength.label}`}
            aria-live="polite"
            className="flex items-center gap-2"
          >
            {/* Three-segment bar */}
            <div className="flex flex-1 gap-1" aria-hidden="true">
              {([1, 2, 3] as const).map((seg) => (
                <div
                  key={seg}
                  className={[
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    strength.level >= seg
                      ? strengthColors[strength.level]
                      : "bg-gray-200 dark:bg-gray-700",
                  ].join(" ")}
                />
              ))}
            </div>
            {strength.label && (
              <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right">
                {strength.label}
              </span>
            )}
          </div>
        )}

        {passwordError && (
          <p
            id={passwordErrorId}
            role="alert"
            className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
          >
            <svg
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {passwordError}
          </p>
        )}
      </div>

      {/* ── Submit button ── */}
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className={[
          "flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5",
          "bg-blue-600 text-sm font-medium text-white shadow-sm",
          "transition-colors hover:bg-blue-700 active:bg-blue-800",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "dark:bg-blue-500 dark:hover:bg-blue-400",
        ].join(" ")}
      >
        {loading ? (
          <>
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
            <span>{isSignUp ? "Creating account…" : "Signing in…"}</span>
          </>
        ) : (
          <span>{submitLabel}</span>
        )}
      </button>
    </form>
  );
});
