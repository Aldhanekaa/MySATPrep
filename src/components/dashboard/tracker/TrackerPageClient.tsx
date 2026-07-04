"use client";

import { useEffect, useRef } from "react";
import Tracker from "@/components/dashboard/tracker/tracker";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchAnswerHistory } from "@/lib/redux";
import { selectIsAuthenticated } from "@/lib/redux/selectors";

export default function TrackerPageClient() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !hasFetched.current) {
      hasFetched.current = true;
      dispatch(fetchAnswerHistory());
    }
  }, [isAuthenticated, dispatch]);

  return <Tracker />;
}
