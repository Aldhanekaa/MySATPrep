"use client";

/**
 * Redux Provider Component
 * Wraps the application with Redux Provider for state management
 * Compatible with Next.js 15 App Router
 *
 * Validates: Requirement 4.4
 */

import { Provider } from "react-redux";
import { store } from "./store";

interface ReduxProviderProps {
  children: React.ReactNode;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
