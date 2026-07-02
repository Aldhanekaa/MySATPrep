"use client";

/**
 * SessionInitializer
 *
 * Runs on app mount to:
 * 1. Dispatch checkSession to verify the Better Auth cookie and restore Redux
 *    auth state if a valid session exists.
 * 2. After checkSession resolves, if the user is authenticated, dispatch
 *    fetchUserData to populate the userData Redux slice.
 *
 * This component renders nothing — it is a side-effect-only initializer.
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/redux/store";
import { checkSession } from "@/lib/redux/slices/authSlice";
import { fetchUserData } from "@/lib/redux/slices/userDataSlice";

export function SessionInitializer() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Verify session on mount and restore Redux auth state.
    // If the session is valid, also fetch user data to populate the userData slice.
    dispatch(checkSession()).then((result) => {
      if (
        result.meta.requestStatus === "fulfilled" &&
        result.payload !== null
      ) {
        dispatch(fetchUserData());
      }
    });
  }, [dispatch]);

  return null;
}
