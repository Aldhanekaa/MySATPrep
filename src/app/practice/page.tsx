"use client";

import React, { useState } from "react";
import { SiteHeader } from "../navbar";
import PracticeOnboarding from "@/components/practice-onboarding";
import PracticeRushMultistep from "@/components/practice-rush-multistep";
import { PracticeSelections } from "@/types/session";

export default function Practice() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
  const [practiceSelections, setPracticeSelections] =
    useState<PracticeSelections | null>(null);

  const handleOnboardingComplete = (selections: PracticeSelections) => {
    setPracticeSelections(selections);
    setOnboardingComplete(true);
  };

  return (
    <React.Fragment>
      <SiteHeader />
      {!onboardingComplete ? (
        <PracticeOnboarding onComplete={handleOnboardingComplete} />
      ) : (
        practiceSelections && (
          <PracticeRushMultistep practiceSelections={practiceSelections} />
        )
      )}
    </React.Fragment>
  );
}
