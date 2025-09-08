"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useHasActivePracticeSession } from "./practice-session-restorer";

export default function ContinuePracticeRushButton() {
  const hasActiveSession = useHasActivePracticeSession();

  // Only show the button if there's an active session
  if (!hasActiveSession) {
    return null;
  }

  return (
    <Link
      href="/practice?session=continue"
      className="mb-10 hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
    >
      <span className="text-foreground text-sm">
        Continue Where You Left Off
      </span>
      <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

      <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
        <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
          <span className="flex size-6">
            <ArrowRight className="m-auto size-3" />
          </span>
          <span className="flex size-6">
            <ArrowRight className="m-auto size-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
