"use client";

import React, { useState } from "react";
import { SiteHeader } from "../navbar";
import PracticeOnboarding from "@/components/practice-onboarding";
import PracticeRushMultistep from "@/components/practice-rush-multistep";
import PracticeRushCelebration from "@/components/celebrating-section/practice-rush-celebration";
import { PracticeSelections, PracticeSession } from "@/types/session";
import { playSound } from "@/lib/playSound";

export default function Practice() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
  const [practiceSelections, setPracticeSelections] =
    useState<PracticeSelections | null>(null);
  const [sessionComplete, setSessionComplete] = useState<boolean>(false);
  const [sessionData, setSessionData] = useState<PracticeSession | null>(null);

  const handleOnboardingComplete = (selections: PracticeSelections) => {
    setPracticeSelections(selections);
    setOnboardingComplete(true);
    playSound("loading.wav");
  };

  const handleSessionComplete = (sessionData: PracticeSession) => {
    setSessionData(sessionData);
    setSessionComplete(true);
  };

  const handleContinuePracticing = () => {
    // Reset to onboarding to start a new practice session
    setSessionComplete(false);
    setSessionData(null);
    setOnboardingComplete(false);
    setPracticeSelections(null);
  };

  return (
    <React.Fragment>
      <SiteHeader />
      {sessionComplete && sessionData ? (
        <PracticeRushCelebration
          sessionData={sessionData}
          onContinue={handleContinuePracticing}
        />
      ) : !onboardingComplete ? (
        <PracticeOnboarding onComplete={handleOnboardingComplete} />
      ) : (
        practiceSelections && (
          <PracticeRushMultistep
            practiceSelections={practiceSelections}
            onSessionComplete={handleSessionComplete}
          />
        )
      )}
    </React.Fragment>
  );
}
