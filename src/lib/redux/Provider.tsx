"use client";

/**
 * Redux Provider Component
 * Wraps children with Redux Provider for Next.js App Router compatibility
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
