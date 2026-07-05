"use client";

/**
 * SessionInitializer
 *
 * Runs on app mount to:
 * 1. Dispatch checkSession — the thunk's condition guard ensures it only runs
 *    once (skips if sessionChecked is already true or a check is in-flight).
 * 2. After checkSession resolves, dispatch fetchUserData if authenticated —
 *    the thunk's condition guard ensures it only runs once (skips if
 *    dataInitialized is true or a fetch is in-flight).
 *
 * This component renders nothing — it is a side-effect-only initializer.
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import { checkSession } from "@/lib/redux/slices/authSlice";
import { fetchUserData } from "@/lib/redux/slices/userDataSlice";

export function SessionInitializer() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const sessionChecked = useSelector(
    (state: RootState) => state.auth.sessionChecked,
  );

  // Dispatch on mount. The thunk's condition bails out if already done or
  // in-flight, so double-mounts (React StrictMode) are harmless.
  useEffect(() => {
    dispatch(checkSession());
  }, [dispatch]);

  // Once session is confirmed and user is authenticated, fetch their data.
  // The thunk's condition bails out if dataInitialized is true or in-flight.
  useEffect(() => {
    if (!sessionChecked || !isAuthenticated) return;
    dispatch(fetchUserData());
  }, [sessionChecked, isAuthenticated, dispatch]);

  return null;
}
