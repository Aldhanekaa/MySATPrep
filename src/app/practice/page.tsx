"use client";

import React, { useState } from "react";
import { SiteHeader } from "../navbar";
import PracticeOnboarding from "@/components/practice-onboarding";
import PracticeRushMultistep from "@/components/practice-rush-multistep";

export default function Practice() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
  const [practiceSelections, setPracticeSelections] = useState<{
    practiceType: string;
    assessment: string;
    subject: string;
    domains: Array<{
      id: string;
      text: string;
      primaryClassCd: string;
    }>;
    skills: Array<{
      id: string;
      text: string;
      skill_cd: string;
    }>;
    difficulties: string[];
  } | null>(null);

  const handleOnboardingComplete = (selections: {
    practiceType: string;
    assessment: string;
    subject: string;
    domains: Array<{
      id: string;
      text: string;
      primaryClassCd: string;
    }>;
    skills: Array<{
      id: string;
      text: string;
      skill_cd: string;
    }>;
    difficulties: string[];
  }) => {
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
