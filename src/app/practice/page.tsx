"use client";

import React, { useState } from "react";
import { SiteHeader } from "../navbar";
import PracticeOnboarding from "@/components/practice-onboarding";
import OnboardCard from "@/components/ui/onboard-card";

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

  // External step control states
  const [currentStep, setCurrentStep] = useState(1);
  const [useExternalControl, setUseExternalControl] = useState(false);

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

    console.log("Onboarding complete with selections:", selections);
  };

  const steps = [
    {
      id: "preparing",
      title: "Prepare",
      content: "Preparing Practice",
    },
    {
      id: "querying",
      title: "Querying",
      content: "Querying Questions 🔍",
    },
    {
      id: "filtering",
      title: "Filtering",
      content: "Generating Personalized Questions 🔍",
    },
    {
      id: "verifying",
      title: "Verifying",
      content: "Verifying Questions... ✅",
    },
  ];
  return (
    <React.Fragment>
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!onboardingComplete ? (
          <PracticeOnboarding onComplete={handleOnboardingComplete} />
        ) : (
          <div className="h-screen flex flex-col items-center justify-center gap-8">
            {/* External Control Toggle */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useExternalControl}
                  onChange={(e) => setUseExternalControl(e.target.checked)}
                  className="rounded"
                />
                External Control Mode
              </label>
            </div>

            {/* Step Control Buttons (only shown in external control mode) */}
            {useExternalControl && (
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index + 1)}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      currentStep === index + 1
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Step {index + 1}
                  </button>
                ))}
              </div>
            )}

            {/* OnboardCard Component */}
            <OnboardCard
              steps={steps}
              currentStep={currentStep}
              onStepChange={(step) => {
                console.log("Step changed to:", step);
                if (!useExternalControl) {
                  setCurrentStep(step);
                }
              }}
              autoPlay={!useExternalControl}
            />
          </div>
        )}
      </div>
    </React.Fragment>
  );
}
