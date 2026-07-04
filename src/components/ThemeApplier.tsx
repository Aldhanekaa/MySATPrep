"use client";

/**
 * ThemeApplier
 *
 * Watches `userData.preferences.theme` in the Redux store and immediately
 * applies it to <html> by toggling the "dark" class. This runs whenever the
 * theme value changes — including right after `fetchUserData/fulfilled`
 * populates preferences from the server.
 *
 * Renders nothing. Must be placed inside <ReduxProvider>.
 */

import { useEffect } from "react";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectUserPreferences } from "@/lib/redux/selectors";

export function ThemeApplier() {
  const preferences = useAppSelector(selectUserPreferences);

  useEffect(() => {
    const root = document.documentElement;
    if (preferences?.theme === "dark") {
      root.classList.add("dark");
    } else if (preferences?.theme === "light") {
      root.classList.remove("dark");
    }
    // If theme is undefined, leave whatever is already set (e.g. from localStorage)
  }, [preferences?.theme]);

  return null;
}
