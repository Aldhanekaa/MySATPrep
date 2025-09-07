"use client";

import React, { useState } from "react";
import { SiteHeader } from "../navbar";
import PracticeOnboarding from "@/components/practice-onboarding";

export default function PracticePage() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [practiceSelections, setPracticeSelections] = useState<{
    practiceType: string;
    subject: string;
    domains: string[];
    skills: Array<{
      id: string;
      text: string;
      skill_cd: string;
    }>;
  } | null>(null);

  const handleOnboardingComplete = (selections: {
    practiceType: string;
    subject: string;
    domains: string[];
    skills: Array<{
      id: string;
      text: string;
      skill_cd: string;
    }>;
  }) => {
    setPracticeSelections(selections);
    setOnboardingComplete(true);
    console.log("Practice selections:", selections);
  };

  return (
    <React.Fragment>
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!onboardingComplete ? (
          <PracticeOnboarding onComplete={handleOnboardingComplete} />
        ) : (
          <div className="w-full flex flex-col min-h-screen py-60 items-center justify-center">
            <h1 className="text-4xl font-bold mb-8">Practice Session</h1>
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl">
              <h2 className="text-2xl font-semibold mb-4">Your Selections:</h2>
              <div className="space-y-4">
                <p>
                  <strong>Practice Type:</strong>{" "}
                  {practiceSelections?.practiceType}
                </p>
                <p>
                  <strong>Subject:</strong> {practiceSelections?.subject}
                </p>
                <p>
                  <strong>Domains:</strong> {practiceSelections?.domains.length}{" "}
                  selected
                </p>
                <div>
                  <strong>Skills:</strong> {practiceSelections?.skills.length}{" "}
                  selected
                  <div className="mt-2 space-y-2">
                    {practiceSelections?.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="bg-gray-100 p-3 rounded-lg"
                      >
                        <p className="font-medium">{skill.text}</p>
                        <p className="text-sm text-gray-600">
                          Code: {skill.skill_cd}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOnboardingComplete(false)}
                className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Back to Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}
