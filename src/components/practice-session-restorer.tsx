"use client";

import React from "react";
import { toast } from "sonner";
import {
  PracticeSelections,
  PracticeSession,
  SessionStatus,
} from "@/types/session";
import { domains as domainsData } from "@/static-data/domains";

export interface SessionRestorationResult {
  success: boolean;
  practiceSelections?: PracticeSelections;
  sessionData?: PracticeSession;
  error?: string;
}

/**
 * Utility function to restore a practice session from localStorage
 * @returns SessionRestorationResult with success status and restored data
 */
export function restorePracticeSession(): SessionRestorationResult {
  try {
    // Get the current practice session from localStorage
    const currentSessionData = localStorage.getItem("currentPracticeSession");

    if (!currentSessionData) {
      return {
        success: false,
        error: "No active practice session found",
      };
    }

    const session: PracticeSession = JSON.parse(currentSessionData);

    // Handle backward compatibility - add missing fields if they don't exist
    if (!session.answeredQuestionDetails) {
      session.answeredQuestionDetails = [];
    }

    // Validate that the session is not completed or abandoned
    if (session.status === SessionStatus.COMPLETED) {
      // Clean up completed session
      localStorage.removeItem("currentPracticeSession");
      return {
        success: false,
        error: "The previous session was already completed",
      };
    }

    if (session.status === SessionStatus.ABANDONED) {
      return {
        success: false,
        error:
          "The previous session was abandoned. You can start a new practice session.",
      };
    }

    // Validate that the session has the required practiceSelections
    if (!session.practiceSelections) {
      localStorage.removeItem("currentPracticeSession");
      return {
        success: false,
        error: "Session data is corrupted - missing practice selections",
      };
    }

    // Reconstruct the practice selections with proper domain and skill objects
    const practiceSelections = session.practiceSelections;

    // Validate that domains and skills still exist in our data
    try {
      const availableDomains =
        practiceSelections.subject === "math"
          ? domainsData.Math
          : domainsData["R&W"];

      // Verify that the domains still exist
      const reconstructedDomains = practiceSelections.domains.map((domain) => {
        const foundDomain = availableDomains.find(
          (d) => d.primaryClassCd === domain.primaryClassCd
        );
        if (!foundDomain) {
          throw new Error(`Domain ${domain.primaryClassCd} no longer exists`);
        }
        return {
          id: foundDomain.id,
          text: foundDomain.text,
          primaryClassCd: foundDomain.primaryClassCd,
        };
      });

      // Verify that the skills still exist
      const reconstructedSkills = practiceSelections.skills.map((skill) => {
        const foundSkill = availableDomains
          .flatMap((domain) => domain.skill || [])
          .find((s) => s.skill_cd === skill.skill_cd);

        if (!foundSkill) {
          throw new Error(`Skill ${skill.skill_cd} no longer exists`);
        }

        return {
          id: foundSkill.id,
          text: foundSkill.text,
          skill_cd: foundSkill.skill_cd,
        };
      });

      // Create the restored practice selections
      const restoredPracticeSelections: PracticeSelections = {
        ...practiceSelections,
        domains: reconstructedDomains,
        skills: reconstructedSkills,
      };

      console.log("Successfully restored practice session:", {
        sessionId: session.sessionId,
        currentStep: session.currentQuestionStep,
        answeredQuestions: Object.keys(session.questionAnswers || {}).length,
        timestamp: session.timestamp,
      });

      return {
        success: true,
        practiceSelections: restoredPracticeSelections,
        sessionData: session,
      };
    } catch (domainSkillError) {
      console.error("Error reconstructing domains/skills:", domainSkillError);
      localStorage.removeItem("currentPracticeSession");
      return {
        success: false,
        error:
          "Session data is outdated - some domains or skills no longer exist. Please start a new session.",
      };
    }
  } catch (error) {
    console.error("Error restoring practice session:", error);

    // Clean up corrupted session data
    try {
      localStorage.removeItem("currentPracticeSession");
    } catch (cleanupError) {
      console.error("Error cleaning up corrupted session:", cleanupError);
    }

    return {
      success: false,
      error:
        "Failed to restore session due to corrupted data. Please start a new practice session.",
    };
  }
}

/**
 * Component for handling session restoration with user feedback
 */
interface PracticeSessionRestorerProps {
  onSessionRestored: (
    practiceSelections: PracticeSelections,
    sessionData?: PracticeSession
  ) => void;
  onRestorationFailed: (error: string) => void;
}

export function PracticeSessionRestorer({
  onSessionRestored,
  onRestorationFailed,
}: PracticeSessionRestorerProps) {
  React.useEffect(() => {
    const result = restorePracticeSession();

    if (result.success && result.practiceSelections) {
      toast.success("Session Restored", {
        description: result.sessionData
          ? `Continuing from question ${
              (result.sessionData.currentQuestionStep || 0) + 1
            } with ${
              Object.keys(result.sessionData.questionAnswers || {}).length
            } questions already answered.`
          : "Your previous practice session has been restored.",
        duration: 4000,
      });

      onSessionRestored(result.practiceSelections, result.sessionData);
    } else {
      const errorMessage = result.error || "Unknown error occurred";

      toast.error("Cannot Restore Session", {
        description: errorMessage,
        duration: 5000,
        action: {
          label: "Start New Session",
          onClick: () => {
            // This will trigger the normal onboarding flow
            onRestorationFailed(errorMessage);
          },
        },
      });

      onRestorationFailed(errorMessage);
    }
  }, [onSessionRestored, onRestorationFailed]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Hook for checking if there's an active practice session
 */
export function useHasActivePracticeSession(): boolean {
  const [hasActiveSession, setHasActiveSession] = React.useState(false);

  React.useEffect(() => {
    try {
      const currentSessionData = localStorage.getItem("currentPracticeSession");

      if (!currentSessionData) {
        setHasActiveSession(false);
        return;
      }

      const session: PracticeSession = JSON.parse(currentSessionData);

      // Handle backward compatibility - add missing fields if they don't exist
      if (!session.answeredQuestionDetails) {
        session.answeredQuestionDetails = [];
      }

      // Consider session active only if it's in progress and has valid data
      const isActiveSession =
        session.status === SessionStatus.IN_PROGRESS &&
        !!session.practiceSelections &&
        !!session.sessionId;

      setHasActiveSession(isActiveSession);
    } catch (error) {
      console.error("Error checking for active session:", error);
      setHasActiveSession(false);
    }
  }, []);

  return hasActiveSession;
}
