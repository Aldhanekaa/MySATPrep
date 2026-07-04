"use client";

/**
 * SessionInitializer
 *
 * Runs on app mount to:
 * 1. Dispatch checkSession to verify the Better Auth cookie and restore Redux
 *    auth state if a valid session exists.
 * 2. After checkSession resolves, if the user is authenticated, dispatch
 *    fetchUserData to populate the userData Redux slice.
 * 3. Re-dispatches fetchUserData any time the user logs in during the session
 *    (isAuthenticated transitions false → true after the initial check).
 *
 * This component renders nothing — it is a side-effect-only initializer.
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
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

  // Track whether we've already fetched data for the current login so we
  // don't fire duplicate requests on re-renders.
  const hasFetchedRef = useRef(false);

  // On mount: check session. fetchUserData is triggered reactively below.
  useEffect(() => {
    dispatch(checkSession());
  }, [dispatch]);

  // Whenever auth becomes authenticated (on mount restore OR after login),
  // fetch user data exactly once per login session.
  useEffect(() => {
    if (!sessionChecked) return; // Wait until the initial check finishes
    if (!isAuthenticated) {
      // Reset so the next login triggers a fresh fetch
      hasFetchedRef.current = false;
      return;
    }
    if (hasFetchedRef.current) return; // Already fetched for this login
    hasFetchedRef.current = true;
    dispatch(fetchUserData());
  }, [isAuthenticated, sessionChecked, dispatch]);

  return null;
}
