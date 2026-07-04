"use client";

import React from "react";
import { logError } from "@/lib/utils/errorLogger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback UI. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component
 *
 * Catches unhandled rendering errors anywhere in the component tree,
 * logs them via the centralised errorLogger, and displays a user-friendly
 * fallback UI instead of a blank screen.
 *
 * Validates: Requirements 18.1
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    logError("[ErrorBoundary] Uncaught render error", error, {
      componentStack: info.componentStack ?? undefined,
    });
  }

  reset(): void {
    this.setState({ hasError: false, error: null });
  }

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      // Custom fallback takes priority
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="flex max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. Our team has been notified. You
                can try reloading the page or going back to the home page.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={this.reset}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg border border-border bg-background px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Reload page
              </button>
              <a
                href="/"
                className="rounded-lg border border-border bg-background px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
