"use client";
import { useEffect, useRef } from "react";
import { SessionsTab } from "@/components/dashboard";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchSessions } from "@/lib/redux";
import {
  selectIsAuthenticated,
  selectUserDataLoading,
} from "@/lib/redux/selectors";

function Spinner() {
  return (
    <svg
      className="size-8 animate-spin text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function SessionsPage() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectUserDataLoading);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (fetchedRef.current) return;
    if (loading.sessions) return;

    fetchedRef.current = true;
    dispatch(fetchSessions());
  }, [isAuthenticated, loading.sessions, dispatch]);

  const isLoading = isAuthenticated && loading.sessions;

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] gap-4"
        role="status"
        aria-live="polite"
        aria-label="Loading sessions"
      >
        <Spinner />
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading your sessions…
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4 max-w-4xl lg:max-w-5xl xl:max-w-7xl w-full mx-auto px-3 py-10">
      <SessionsTab />
    </section>
  );
}
