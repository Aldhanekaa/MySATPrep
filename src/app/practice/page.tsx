"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "../navbar";
import PracticeOnboarding from "@/components/practice-onboarding";
import PracticeRushMultistep from "@/components/practice-rush-multistep";
import PracticeRushCelebration from "@/components/celebrating-section/practice-rush-celebration";
import {
  PracticeSelections,
  PracticeSession,
  isValidPracticeSession,
  isValidPracticeSelections,
  SessionStatus,
} from "@/types/session";
import { QuestionDifficulty } from "@/types/question";
import { domains as domainsData } from "@/static-data/domains";
import { Assessments } from "@/static-data/assessment";
import { playSound } from "@/lib/playSound";
import { ProjectBanner } from "@/components/ui/project-banner";
import { toast } from "sonner";
import { DomainItemsArray, SkillCd_Variants } from "@/types/lookup";
import {
  validSkillCds,
  mathDomains,
  rwDomains,
  mathSkillPrefixes,
  rwSkillCds,
  validSubjects,
  validPracticeTypes,
} from "@/static-data/validation";
import { PracticeSessionRestorer } from "@/components/practice-session-restorer";

// Validation functions for URL parameters
function validateAssessment(assessment: string): boolean {
  return Object.keys(Assessments).includes(assessment);
}

function validateDomains(domainIds: string[], subject: string): boolean {
  // Validate against the standard DomainItemsArray from lookup.ts
  const validDomainIds = DomainItemsArray;

  // Check if all provided domain IDs are valid
  const areValidDomains = domainIds.every((id) => validDomainIds.includes(id));

  if (!areValidDomains) {
    return false;
  }

  // Additional validation: check if domains match the subject
  if (subject === "math") {
    // Math domains: H, P, Q, S
    return domainIds.every((id) => mathDomains.includes(id));
  } else if (subject === "reading-writing") {
    // Reading & Writing domains: INI, CAS, EOI, SEC
    return domainIds.every((id) => rwDomains.includes(id));
  }

  return false;
}

function validateSkillCds(skillCds: string[], subject: string): boolean {
  // First validate against the complete SkillCd_Variants type
  // Check if all provided skill codes are valid
  const areValidSkillCds = skillCds.every((skillCd) =>
    validSkillCds.includes(skillCd as SkillCd_Variants)
  );

  if (!areValidSkillCds) {
    return false;
  }

  // Additional validation: check if skills match the subject
  if (subject === "math") {
    return skillCds.every((skillCd) =>
      mathSkillPrefixes.some((prefix) => skillCd.startsWith(prefix))
    );
  } else if (subject === "reading-writing") {
    return skillCds.every((skillCd) => rwSkillCds.includes(skillCd));
  }

  return false;
}

function getSubjectFromDomains(domainIds: string[]): string | null {
  // Validate against DomainItemsArray first
  const validDomainIds = DomainItemsArray;
  const areValidDomains = domainIds.every((id) => validDomainIds.includes(id));

  if (!areValidDomains) {
    return null;
  }

  // Check if domains belong to Math or Reading & Writing
  const isMath = domainIds.every((id) => mathDomains.includes(id));
  const isRW = domainIds.every((id) => rwDomains.includes(id));

  if (isMath) return "math";
  if (isRW) return "reading-writing";
  return null;
}

export default function Practice() {
  const searchParams = useSearchParams();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
  const [practiceSelections, setPracticeSelections] =
    useState<PracticeSelections | null>(null);
  const [sessionComplete, setSessionComplete] = useState<boolean>(false);
  const [sessionData, setSessionData] = useState<PracticeSession | null>(null);
  const [showValidationBanner, setShowValidationBanner] =
    useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [shouldRestoreSession, setShouldRestoreSession] =
    useState<boolean>(false);
  const [restoredSessionData, setRestoredSessionData] =
    useState<PracticeSession | null>(null);

  // Check for session continuation parameter first
  useEffect(() => {
    const sessionParam = searchParams.get("session");

    if (sessionParam === "continue") {
      console.log(
        "Detected session=continue parameter, validating localStorage data..."
      );

      // Validate currentPracticeSession localStorage data
      try {
        const currentSessionData = localStorage.getItem(
          "currentPracticeSession"
        );

        // Check for null, undefined, empty string, or any falsy value
        if (!currentSessionData || currentSessionData.trim() === "") {
          console.warn(
            "No currentPracticeSession found in localStorage, falling back to onboarding"
          );
          toast.error("No Active Session Found", {
            description:
              "No practice session was found to continue. Please start a new practice session.",
            duration: 5000,
          });
          setShouldRestoreSession(false);
          // Force redirect to normal onboarding by removing the session parameter
          const url = new URL(window.location.href);
          url.searchParams.delete("session");
          window.history.replaceState({}, "", url.toString());
          return;
        }

        // Parse and validate the session data
        let sessionData: PracticeSession;
        try {
          sessionData = JSON.parse(currentSessionData);
        } catch (parseError) {
          console.error(
            "Failed to parse currentPracticeSession JSON:",
            parseError
          );
          toast.error("Invalid Session Data", {
            description:
              "The saved session data is corrupted. Please start a new practice session.",
            duration: 5000,
          });
          // Clean up corrupted data
          localStorage.removeItem("currentPracticeSession");
          setShouldRestoreSession(false);
          // Force redirect to normal onboarding by removing the session parameter
          const url = new URL(window.location.href);
          url.searchParams.delete("session");
          window.history.replaceState({}, "", url.toString());
          return;
        }

        // Validate session structure using type guard
        if (!isValidPracticeSession(sessionData)) {
          console.error(
            "Invalid session structure found in localStorage:",
            sessionData
          );
          toast.error("Invalid Session Format", {
            description:
              "The saved session data format is invalid. Please start a new practice session.",
            duration: 5000,
          });
          // Clean up invalid data
          localStorage.removeItem("currentPracticeSession");
          setShouldRestoreSession(false);
          // Force redirect to normal onboarding by removing the session parameter
          const url = new URL(window.location.href);
          url.searchParams.delete("session");
          window.history.replaceState({}, "", url.toString());
          return;
        }

        // Additional validation: check session status
        if (sessionData.status === SessionStatus.COMPLETED) {
          console.warn(
            "Found completed session, cannot continue. Falling back to onboarding"
          );
          toast.error("Session Already Completed", {
            description:
              "This practice session has already been completed. Please start a new practice session.",
            duration: 5000,
          });
          // Clean up completed session
          localStorage.removeItem("currentPracticeSession");
          setShouldRestoreSession(false);
          // Force redirect to normal onboarding by removing the session parameter
          const url = new URL(window.location.href);
          url.searchParams.delete("session");
          window.history.replaceState({}, "", url.toString());
          return;
        }

        if (sessionData.status === SessionStatus.ABANDONED) {
          console.warn(
            "Found abandoned session, cannot continue. Falling back to onboarding"
          );
          toast.error("Session Was Abandoned", {
            description:
              "This practice session was previously abandoned. Please start a new practice session.",
            duration: 5000,
          });
          setShouldRestoreSession(false);
          // Force redirect to normal onboarding by removing the session parameter
          const url = new URL(window.location.href);
          url.searchParams.delete("session");
          window.history.replaceState({}, "", url.toString());
          return;
        }

        // Validate practice selections structure
        if (!isValidPracticeSelections(sessionData.practiceSelections)) {
          console.error(
            "Invalid practice selections found in session:",
            sessionData.practiceSelections
          );
          toast.error("Invalid Practice Configuration", {
            description:
              "The saved practice configuration is invalid. Please start a new practice session.",
            duration: 5000,
          });
          localStorage.removeItem("currentPracticeSession");
          setShouldRestoreSession(false);
          // Force redirect to normal onboarding by removing the session parameter
          const url = new URL(window.location.href);
          url.searchParams.delete("session");
          window.history.replaceState({}, "", url.toString());
          return;
        }

        // Handle backward compatibility for missing fields
        if (!sessionData.answeredQuestionDetails) {
          console.log(
            "Adding backward compatibility for answeredQuestionDetails"
          );
          sessionData.answeredQuestionDetails = [];
        }

        // Additional validation: check if session has meaningful data
        if (!sessionData.sessionId || sessionData.sessionId.trim() === "") {
          console.error("Session has empty or invalid sessionId");
          toast.error("Invalid Session ID", {
            description:
              "The saved session has an invalid ID. Please start a new practice session.",
            duration: 5000,
          });
          localStorage.removeItem("currentPracticeSession");
          setShouldRestoreSession(false);
          // Force redirect to normal onboarding by removing the session parameter
          const url = new URL(window.location.href);
          url.searchParams.delete("session");
          window.history.replaceState({}, "", url.toString());
          return;
        }

        // Check if practice selections have required data
        const selections = sessionData.practiceSelections;
        if (!selections.domains || selections.domains.length === 0) {
          console.error("Session has no domains selected");
          toast.error("Invalid Practice Configuration", {
            description:
              "The saved session has no practice domains. Please start a new practice session.",
            duration: 5000,
          });
          localStorage.removeItem("currentPracticeSession");
          setShouldRestoreSession(false);
          // Force redirect to normal onboarding by removing the session parameter
          const url = new URL(window.location.href);
          url.searchParams.delete("session");
          window.history.replaceState({}, "", url.toString());
          return;
        }

        if (!selections.skills || selections.skills.length === 0) {
          console.error("Session has no skills selected");
          toast.error("Invalid Practice Configuration", {
            description:
              "The saved session has no practice skills. Please start a new practice session.",
            duration: 5000,
          });
          localStorage.removeItem("currentPracticeSession");
          setShouldRestoreSession(false);
          // Force redirect to normal onboarding by removing the session parameter
          const url = new URL(window.location.href);
          url.searchParams.delete("session");
          window.history.replaceState({}, "", url.toString());
          return;
        }

        console.log(
          "Session validation successful, proceeding with restoration:",
          {
            sessionId: sessionData.sessionId,
            status: sessionData.status,
            currentStep: sessionData.currentQuestionStep,
            totalQuestions: sessionData.totalQuestions,
            answeredQuestions: sessionData.answeredQuestions.length,
            domains: selections.domains.length,
            skills: selections.skills.length,
          }
        );

        // Store the session data to be passed down as props
        setRestoredSessionData(sessionData);
        setShouldRestoreSession(true);
      } catch (error) {
        console.error("Error validating session data:", error);
        toast.error("Session Validation Failed", {
          description:
            "Failed to validate the saved session. Please start a new practice session.",
          duration: 5000,
        });
        setShouldRestoreSession(false);
        // Force redirect to normal onboarding by removing the session parameter
        const url = new URL(window.location.href);
        url.searchParams.delete("session");
        window.history.replaceState({}, "", url.toString());
        return;
      }
    }
  }, [searchParams]);

  // Handle session restoration
  const handleSessionRestored = (
    practiceSelections: PracticeSelections,
    sessionData?: PracticeSession
  ) => {
    console.log("Successfully restored practice session:", {
      sessionId: sessionData?.sessionId,
      currentStep: sessionData?.currentQuestionStep,
      subject: practiceSelections.subject,
      assessment: practiceSelections.assessment,
    });

    // No need to store in sessionStorage since we're passing it as props
    setPracticeSelections(practiceSelections);
    setOnboardingComplete(true);
    setShouldRestoreSession(false);

    // Play success sound
    playSound("loading.wav");
  };

  const handleRestorationFailed = (error: string) => {
    console.error(
      "Session restoration failed from PracticeSessionRestorer:",
      error
    );
    setShouldRestoreSession(false);
    setRestoredSessionData(null); // Clear the restored session data

    // Show user-friendly error message
    toast.error("Session Restoration Failed", {
      description:
        error ||
        "Could not restore your previous session. Starting fresh practice session.",
      duration: 5000,
    });

    // Reset any existing state and continue with normal onboarding flow
    setOnboardingComplete(false);
    setPracticeSelections(null);
    setSessionComplete(false);
    setSessionData(null);

    // Force redirect to normal onboarding by removing the session parameter
    const url = new URL(window.location.href);
    url.searchParams.delete("session");
    window.history.replaceState({}, "", url.toString());

    console.log(
      "Redirecting to normal onboarding flow due to restoration failure"
    );
  };

  // Check for URL parameters and validate them (skip if restoring session)
  useEffect(() => {
    // Skip URL parameter processing if we're restoring a session
    if (shouldRestoreSession) {
      console.log(
        "Skipping URL parameter processing - restoring session instead"
      );
      return;
    }

    const assessment = searchParams.get("assessment");
    const urlSubject = searchParams.get("subject");
    const domains = searchParams.get("domains");
    const skillCds = searchParams.get("skillCds");
    const questionIds = searchParams.get("questionIds");
    const type = searchParams.get("type");
    const randomize = searchParams.get("randomize");

    // If no parameters are present, proceed normally
    if (
      !assessment &&
      !urlSubject &&
      !domains &&
      !skillCds &&
      !questionIds &&
      !type &&
      !randomize
    ) {
      console.log("No URL parameters found - showing normal onboarding");
      return;
    }

    console.log("Processing shared URL parameters:", {
      assessment,
      subject: urlSubject,
      domains,
      skillCds,
      questionIds,
      type,
      randomize,
    });

    const errors: string[] = [];
    let isValid = true;

    // Validate and set practice type (default to "rush")
    const practiceType =
      type && validPracticeTypes.includes(type) ? type : "rush";
    if (type && !validPracticeTypes.includes(type)) {
      errors.push(
        `Practice type "${type}" is not valid. Valid options: ${validPracticeTypes.join(
          ", "
        )}. Defaulting to "rush".`
      );

      // Don't set isValid to false since we'll fall back to default
    }

    console.log(
      `Using practice type: ${practiceType}${
        type && type !== practiceType
          ? ` (fallback from invalid "${type}")`
          : ""
      }`
    );

    // Validate and set randomize option (default to false)
    const randomizeQuestions = randomize === "true";
    if (randomize && randomize !== "true" && randomize !== "false") {
      errors.push(
        `Randomize option "${randomize}" is not valid. Valid options: true, false. Defaulting to "false".`
      );

      // Don't set isValid to false since we'll fall back to default
    }

    console.log(
      `Using randomize: ${randomizeQuestions}${
        !randomize
          ? " (default)"
          : randomize && randomize !== randomizeQuestions.toString()
          ? ` (fallback from invalid "${randomize}")`
          : ""
      }`
    );

    // Validate assessment
    if (!assessment || !validateAssessment(assessment)) {
      const errorMsg = `Assessment "${
        assessment || "missing"
      }" is not valid. Valid options: ${Object.keys(Assessments).join(", ")}`;
      errors.push(errorMsg);

      isValid = false;
    }

    // Parse domains
    const domainIds = domains
      ? domains.split(",").filter((id) => id.trim())
      : [];
    if (domainIds.length === 0) {
      const errorMsg = "No practice domains were specified in the shared link";
      errors.push(errorMsg);

      isValid = false;
    } else {
      // Validate domain IDs against DomainItemsArray
      const invalidDomainIds = domainIds.filter(
        (id) => !DomainItemsArray.includes(id)
      );
      if (invalidDomainIds.length > 0) {
        const errorMsg = `Invalid domain IDs: ${invalidDomainIds.join(
          ", "
        )}. Valid options: ${DomainItemsArray.join(", ")}`;
        errors.push(errorMsg);

        isValid = false;
      }
    }

    // Determine subject from URL parameter first, then from domains as fallback
    const subject =
      urlSubject ||
      (domainIds.length > 0 ? getSubjectFromDomains(domainIds) : null);
    if (!subject) {
      if (urlSubject && !validSubjects.includes(urlSubject)) {
        const errorMsg = `Invalid subject "${urlSubject}" in shared link. Valid options: ${validSubjects.join(
          ", "
        )}`;
        errors.push(errorMsg);
      } else {
        const errorMsg =
          "The domains in the shared link don't belong to a single subject (must be all Math or all Reading & Writing)";
        errors.push(errorMsg);
      }
      isValid = false;
    }

    // Validate domains against subject
    if (
      subject &&
      domainIds.length > 0 &&
      !validateDomains(domainIds, subject)
    ) {
      if (subject === "math") {
        const invalidMathDomains = domainIds.filter(
          (id) => !mathDomains.includes(id)
        );
        const errorMsg = `Some domains are not valid for Math: ${invalidMathDomains.join(
          ", "
        )}. Valid Math domains: ${mathDomains.join(", ")}`;
        errors.push(errorMsg);
      } else if (subject === "reading-writing") {
        const invalidRWDomains = domainIds.filter(
          (id) => !rwDomains.includes(id)
        );
        const errorMsg = `Some domains are not valid for Reading & Writing: ${invalidRWDomains.join(
          ", "
        )}. Valid R&W domains: ${rwDomains.join(", ")}`;
        errors.push(errorMsg);
      }

      isValid = false;
    }

    // Parse and validate skill codes
    const skillCdList = skillCds
      ? skillCds.split(",").filter((cd) => cd.trim())
      : [];
    if (skillCdList.length === 0) {
      const errorMsg = "No skills were specified in the shared link";
      errors.push(errorMsg);

      isValid = false;
    } else if (subject && !validateSkillCds(skillCdList, subject)) {
      // Provide detailed skill validation errors
      const invalidSkillCds = skillCdList.filter(
        (skillCd) => !validSkillCds.includes(skillCd as SkillCd_Variants)
      );

      if (invalidSkillCds.length > 0) {
        const errorMsg = `Invalid skill codes: ${invalidSkillCds.join(
          ", "
        )}. Must be valid skill codes from the SkillCd_Variants type.`;
        errors.push(errorMsg);
      }

      if (subject === "math") {
        const nonMathSkills = skillCdList.filter(
          (skillCd) =>
            !mathSkillPrefixes.some((prefix) => skillCd.startsWith(prefix))
        );
        if (nonMathSkills.length > 0) {
          const errorMsg = `Some skills are not valid for Math: ${nonMathSkills.join(
            ", "
          )}. Math skills must start with: ${mathSkillPrefixes.join(", ")}`;
          errors.push(errorMsg);
        }
      } else if (subject === "reading-writing") {
        const nonRWSkills = skillCdList.filter(
          (skillCd) => !rwSkillCds.includes(skillCd)
        );
        if (nonRWSkills.length > 0) {
          const errorMsg = `Some skills are not valid for Reading & Writing: ${nonRWSkills.join(
            ", "
          )}. Valid R&W skills: ${rwSkillCds.join(", ")}`;
          errors.push(errorMsg);
        }
      }

      isValid = false;
    }

    // If validation failed, show banner
    if (!isValid) {
      setValidationErrors(errors);
      setShowValidationBanner(true);

      return;
    }

    // If validation passed, construct practice selections and skip onboarding
    if (
      assessment &&
      subject &&
      domainIds.length > 0 &&
      skillCdList.length > 0
    ) {
      try {
        const availableDomains =
          subject === "math" ? domainsData.Math : domainsData["R&W"];

        // Map domain IDs (primaryClassCd values) to domain objects
        const selectedDomains = availableDomains
          .filter((domain) => domainIds.includes(domain.primaryClassCd))
          .map((domain) => ({
            id: domain.id,
            text: domain.text,
            primaryClassCd: domain.primaryClassCd,
          }));

        // Map skill codes to skill objects
        const selectedSkills = availableDomains
          .flatMap((domain) => domain.skill || [])
          .filter((skill) => skillCdList.includes(skill.skill_cd))
          .map((skill) => ({
            id: skill.id,
            text: skill.text,
            skill_cd: skill.skill_cd,
          }));

        // Validate that we actually found matching domains and skills
        if (selectedDomains.length === 0) {
          errors.push("No valid domains found matching the shared link");
          setValidationErrors(errors);
          setShowValidationBanner(true);

          return;
        }

        if (selectedSkills.length === 0) {
          errors.push("No valid skills found matching the shared link");
          setValidationErrors(errors);
          setShowValidationBanner(true);

          return;
        }

        // Parse questionIds (optional)
        const questionIdList = questionIds
          ? questionIds.split(",").filter((id) => id.trim())
          : [];

        // Create practice selections with validated values
        const selections: PracticeSelections = {
          practiceType: practiceType,
          assessment: assessment,
          subject: subject,
          domains: selectedDomains,
          skills: selectedSkills,
          difficulties: ["E", "M", "H"] as QuestionDifficulty[], // Default to all difficulties
          randomize: randomizeQuestions,
          ...(questionIdList.length > 0 && { questionIds: questionIdList }),
        };

        setPracticeSelections(selections);
        setOnboardingComplete(true);
        playSound("loading.wav");

        console.log("Successfully created practice session from shared URL:", {
          ...selections,
          note: `Practice type: ${practiceType}${
            type && type !== practiceType ? ` (fallback from "${type}")` : ""
          }, Randomize: ${randomizeQuestions}${
            randomize && randomize !== randomizeQuestions.toString()
              ? ` (fallback from "${randomize}")`
              : ""
          }${
            questionIdList.length > 0
              ? `, Pre-selected questions: ${questionIdList.length}`
              : ""
          }`,
        });
      } catch (error) {
        console.error("Error creating practice selections from URL:", error);
        setValidationErrors([
          "Failed to process the shared link. Please try the normal setup process.",
        ]);
        setShowValidationBanner(true);
      }
    }
  }, [searchParams, shouldRestoreSession]);

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
    <Suspense fallback={<div>Loading...</div>}>
      <SiteHeader />

      {/* Handle session restoration */}
      {shouldRestoreSession && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Restoring Your Practice Session
            </h2>
            <p className="text-gray-600 mb-2">
              Validating saved session data and restoring your progress...
            </p>
            <p className="text-xs text-gray-500">
              If this takes too long, you&apos;ll be redirected to start a new
              session
            </p>
          </div>
          <PracticeSessionRestorer
            onSessionRestored={handleSessionRestored}
            onRestorationFailed={handleRestorationFailed}
          />
        </div>
      )}

      {!shouldRestoreSession && sessionComplete && sessionData ? (
        <PracticeRushCelebration
          sessionData={sessionData}
          onContinue={handleContinuePracticing}
        />
      ) : !shouldRestoreSession && !onboardingComplete ? (
        <React.Fragment>
          <PracticeOnboarding onComplete={handleOnboardingComplete} />
          {showValidationBanner && validationErrors.length > 0 && (
            <ProjectBanner
              variant="error"
              icon={
                <div className="w-4 h-4 bg-red-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              }
              label={
                <div>
                  <div className="font-medium">
                    Invalid Share Link Parameters
                  </div>
                  <div className="text-xs mt-1">
                    The shared link contains invalid data. You can continue with
                    the normal setup process.
                  </div>
                </div>
              }
              callToAction={{
                label: "View Details",
                onClick: () => {
                  // Show detailed toast with all validation errors
                  const detailedMessage = validationErrors.join("\n• ");
                  toast.error("Configuration Issues", {
                    description: `• ${detailedMessage}`,
                    duration: 10000, // Show for 10 seconds
                    action: {
                      label: "Dismiss",
                      onClick: () => {
                        // Toast will auto-dismiss, this is just for user convenience
                      },
                    },
                  });
                },
              }}
            />
          )}
        </React.Fragment>
      ) : !shouldRestoreSession && practiceSelections ? (
        <PracticeRushMultistep
          practiceSelections={practiceSelections}
          onSessionComplete={handleSessionComplete}
          restoredSessionData={restoredSessionData || undefined}
        />
      ) : null}
    </Suspense>
  );
}
