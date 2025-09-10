"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "../navbar";
import ReviewOnboarding from "@/components/review-onboarding";
import PracticeRushMultistep from "@/components/practice-rush-multistep";
import { PracticeSelections, PracticeSession } from "@/types/session";
import { SavedQuestions } from "@/types/savedQuestions";
import { PracticeStatistics } from "@/types/statistics";
import { PlainQuestionType } from "@/types/question";
import { useLocalStorage } from "@/lib/useLocalStorage";
// import type { Metadata } from "next";

import { playSound } from "@/lib/playSound";
import { ProjectBanner } from "@/components/ui/project-banner";
import { toast } from "sonner";
import {
  getSubjectByPrimaryClassCd,
  primaryClassCdObjectData,
  skillCdsObjectData,
} from "@/static-data/domains";

// Interface for review-specific selections from the onboarding component
interface ReviewSelections {
  assessment: string;
  subject: string;
  reviewType: string;
}

// Interface for questions with data
interface QuestionWithData {
  questionId: string;
  timestamp: string;
  isCorrect?: boolean;
  plainQuestion?: PlainQuestionType;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

// Validation functions for URL parameters
function validateAssessment(assessment: string): boolean {
  const validAssessments = ["SAT", "PSAT/NMSQT", "PSAT"];
  return validAssessments.includes(assessment);
}

function validateSubject(subject: string): boolean {
  const validSubjects = ["math", "reading-writing"];
  return validSubjects.includes(subject);
}

function validateReviewType(type: string): boolean {
  const validTypes = ["incorrect", "bookmarks"];
  return validTypes.includes(type);
}

function Review() {
  const [sessionData, setSessionData] = useState<PracticeSession | null>(null);
  const [sessionComplete, setSessionComplete] = useState<boolean>(false);

  const searchParams = useSearchParams();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
  const [practiceSelections, setPracticeSelections] =
    useState<PracticeSelections | null>(null);
  const [reviewType, setReviewType] = useState<string>("");
  const [assessmentType, setAssessmentType] = useState<string>("");

  const [showValidationBanner, setShowValidationBanner] =
    useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [questionsWithData, setQuestionsWithData] = useState<
    QuestionWithData[]
  >([]);

  // Load localStorage data based on review type
  const [savedQuestions] = useLocalStorage<SavedQuestions>(
    "savedQuestions",
    {}
  );
  const [practiceStatistics] = useLocalStorage<PracticeStatistics>(
    "practiceStatistics",
    {}
  );

  // Load questions from localStorage based on review type
  const loadQuestionsFromStorage = useCallback(
    (assessmentType: string, reviewType: string) => {
      console.log(`assessmentType ${assessmentType} reviewType ${reviewType}`);

      const assessmentKey = getAssessmentKey(assessmentType);
      let questions: QuestionWithData[] = [];

      if (reviewType === "bookmarked") {
        const savedQuestionsForAssessment = savedQuestions[assessmentKey] || [];
        questions = savedQuestionsForAssessment.map((question) => ({
          questionId: question.questionId,
          timestamp: question.timestamp,
          isLoading: true,
          hasError: false,
          plainQuestion: question.plainQuestion,
        }));
      } else if (reviewType === "incorrect") {
        const assessmentStats = practiceStatistics[assessmentKey];
        const incorrectQuestions =
          assessmentStats?.answeredQuestionsDetailed?.filter(
            (q) => !q.isCorrect
          ) || [];
        questions = incorrectQuestions.map((question) => ({
          questionId: question.questionId,
          timestamp: question.timestamp,
          isCorrect: question.isCorrect,
          isLoading: true,
          hasError: false,
          plainQuestion: question.plainQuestion,
        }));
      }

      return questions;
    },
    [practiceSelections, reviewType, savedQuestions, practiceStatistics]
  );

  // Check for URL parameters and validate them
  useEffect(() => {
    const assessment = searchParams.get("assessment");
    const subject = searchParams.get("subject");
    const type = searchParams.get("type");

    // If no parameters are present, show onboarding
    if (!assessment && !subject && !type) {
      console.log("No URL parameters found - showing onboarding");
      return;
    }

    console.log("Processing review URL parameters:", {
      assessment,
      subject,
      type,
    });

    const errors: string[] = [];
    let isValid = true;

    // Validate assessment
    if (!assessment || assessment == null || !validateAssessment(assessment)) {
      const errorMsg = `Assessment "${
        assessment || "missing"
      }" is not valid. Valid options: SAT, PSAT/NMSQT, PSAT`;
      errors.push(errorMsg);
      isValid = false;
      return;
    }

    setAssessmentType(assessment);

    // Validate subject
    if (!subject || !validateSubject(subject)) {
      const errorMsg = `Subject "${
        subject || "missing"
      }" is not valid. Valid options: math, reading-writing`;
      errors.push(errorMsg);
      isValid = false;
    }

    // Validate review type
    if (!type || !validateReviewType(type)) {
      const errorMsg = `Review type "${
        type || "missing"
      }" is not valid. Valid options: incorrect-questions, bookmarks`;
      errors.push(errorMsg);
      isValid = false;

      return;
    }

    setReviewType(type);

    // If validation failed, show banner and onboarding
    if (!isValid) {
      setValidationErrors(errors);
      setShowValidationBanner(true);
      return;
    }

    // If validation passed, construct practice selections and skip onboarding
    if (assessment && subject && type) {
      try {
        let questions = loadQuestionsFromStorage(assessment, type);
        console.log("Loaded questions:", questions);
        questions = questions.filter(
          (e) =>
            getSubjectByPrimaryClassCd(
              e.plainQuestion?.primary_class_cd || ""
            ) == subject
        );
        setQuestionsWithData(questions);

        // Only include unique primaryClassCd values
        let seen = new Set();
        const skills = questions
          .filter((q) => {
            const skillCd = q.plainQuestion?.skill_cd;
            if (!skillCd || seen.has(skillCd)) return false;
            seen.add(skillCd);
            return true;
          })
          .map((q, idx) => ({
            id: skillCdsObjectData[q.plainQuestion?.skill_cd || ""].id,
            text: skillCdsObjectData[q.plainQuestion?.skill_cd || ""].text,
            skill_cd: q.plainQuestion?.skill_cd || "",
          }));

        console.log(
          "questions - skills",
          skills,
          questions,
          skillCdsObjectData
        );

        // Only include unique primaryClassCd values
        seen = new Set();
        const domains = questions
          .filter((q) => {
            const primaryClassCd = q.plainQuestion?.primary_class_cd;
            if (!primaryClassCd || seen.has(primaryClassCd)) return false;
            seen.add(primaryClassCd);
            return true;
          })
          .map((q, idx) => ({
            id: primaryClassCdObjectData[
              q.plainQuestion?.primary_class_cd || ""
            ].id,
            text: primaryClassCdObjectData[
              q.plainQuestion?.primary_class_cd || ""
            ].text,
            primaryClassCd: q.plainQuestion?.primary_class_cd,
          }));

        setQuestionsWithData(questions);

        // Map the URL type to the internal review type format
        const reviewTypeValue =
          type === "incorrect-questions" ? "incorrect" : "bookmarked";

        console.log("questionsWithData", questions, assessment, subject, type);

        // Create practice selections with minimal required fields for review
        const selections: PracticeSelections = {
          practiceType: "review", // Use "review" as practice type
          assessment: assessment,
          subject: subject,
          // @ts-ignore
          domains: domains, // Empty for review mode
          skills: skills, // Empty for review mode
          difficulties: [], // Empty for review mode
          randomize: false, // Not applicable for review
          excludeBluebook: false, // Not applicable for review
          duplicateSession: true,
          questionIds: questions.map((q) => q.questionId),
        };

        setPracticeSelections(selections);
        setReviewType(reviewTypeValue);
        setOnboardingComplete(true);
        playSound("loading.wav");

        console.log(
          "Successfully created review session from URL:",
          selections
        );
      } catch (error) {
        console.error("Error creating review selections from URL:", error);
        setValidationErrors([
          "Failed to process the review link. Please try the normal setup process.",
        ]);
        setShowValidationBanner(true);
      }
    }
  }, [searchParams]);

  const handleOnboardingComplete = (selections: ReviewSelections) => {
    setReviewType(selections.reviewType);
    setAssessmentType(selections.assessment);

    // console.log("Selections ", selections);

    let questions = loadQuestionsFromStorage(
      selections.assessment,
      selections.reviewType
    );
    questions = questions.filter(
      (e) =>
        getSubjectByPrimaryClassCd(e.plainQuestion?.primary_class_cd || "") ==
        selections.subject
    );
    setQuestionsWithData(questions);

    // Only include unique primaryClassCd values
    let seen = new Set();
    const skills = questions
      .filter((q) => {
        const skillCd = q.plainQuestion?.skill_cd;
        if (!skillCd || seen.has(skillCd)) return false;
        seen.add(skillCd);
        return true;
      })
      .map((q, idx) => ({
        id: skillCdsObjectData[q.plainQuestion?.skill_cd || ""].id,
        text: skillCdsObjectData[q.plainQuestion?.skill_cd || ""].text,
        skill_cd: q.plainQuestion?.skill_cd || "",
      }));

    // console.log(
    //   "questions - skills",
    //   skills,
    //   questions,
    //   selections.subject,
    //   skillCdsObjectData
    // );

    // Only include unique primaryClassCd values
    seen = new Set();
    const domains = questions
      .filter((q) => {
        const primaryClassCd = q.plainQuestion?.primary_class_cd;
        if (!primaryClassCd || seen.has(primaryClassCd)) return false;
        seen.add(primaryClassCd);
        return true;
      })
      .map((q, idx) => ({
        id: primaryClassCdObjectData[q.plainQuestion?.primary_class_cd || ""]
          .id,
        text: primaryClassCdObjectData[q.plainQuestion?.primary_class_cd || ""]
          .text,
        primaryClassCd: q.plainQuestion?.primary_class_cd,
      }));

    // console.log(questionsWithData, domains, questions);

    // Convert ReviewSelections to PracticeSelections
    const practiceSelections: PracticeSelections = {
      practiceType: "review",
      assessment: selections.assessment,
      subject: selections.subject,
      // @ts-ignore
      domains: domains, // Empty for review mode
      skills: skills, // Empty for review mode
      difficulties: [], // Empty for review mode
      randomize: false, // Not applicable for review
      excludeBluebook: false, // Not applicable for review
      duplicateSession: true,
      questionIds: questions.map((e) => e.questionId),
    };

    setPracticeSelections(practiceSelections);
    setReviewType(selections.reviewType);
    setOnboardingComplete(true);
    playSound("loading.wav");
  };

  const handleSessionComplete = (sessionData: PracticeSession) => {
    // Handle session completion if needed
    // console.log("Review session completed:", sessionData);
    toast.success("Review Session Completed", {
      description: "You've completed reviewing all available questions.",
      duration: 3000,
    });

    setSessionData(sessionData);
    setSessionComplete(true);
  };

  // Get the assessment key from practiceSelections (following the pattern from saved.tsx and answered.tsx)
  const getAssessmentKey = (assessment?: string): string => {
    if (!assessment) return "SAT"; // Default to SAT

    // Map assessment names to keys used in localStorage
    const assessmentMap: Record<string, string> = {
      SAT: "SAT",
      "PSAT/NMSQT": "PSAT/NMSQT",
      PSAT: "PSAT",
    };

    return assessmentMap[assessment] || "SAT";
  };

  // Get the assessment name for display
  const getAssessmentName = (assessment?: string): string => {
    if (!assessment) return "SAT"; // Default to SAT

    // Map assessment keys to display names
    const assessmentNameMap: Record<string, string> = {
      SAT: "SAT",
      "PSAT/NMSQT": "PSAT/NMSQT & PSAT 10",
      PSAT: "PSAT 8/9",
    };

    return assessmentNameMap[assessment] || "SAT";
  };

  // Get the count of questions available for review
  const getQuestionCount = (): number => {
    if (!practiceSelections || !reviewType) return 0;

    const assessmentKey = getAssessmentKey(practiceSelections.assessment);

    if (reviewType === "bookmarked") {
      const savedQuestionsForAssessment = savedQuestions[assessmentKey] || [];
      return savedQuestionsForAssessment.length;
    } else if (reviewType === "incorrect") {
      const assessmentStats = practiceStatistics[assessmentKey];
      const incorrectQuestions =
        assessmentStats?.answeredQuestionsDetailed?.filter(
          (q) => !q.isCorrect
        ) || [];
      return incorrectQuestions.length;
    }

    return 0;
  };

  // Validate that questions are available before starting
  const validateQuestionsAvailable = (): boolean => {
    const count = getQuestionCount();
    if (count === 0) {
      if (reviewType === "incorrect") {
        toast.error("No Incorrect Questions", {
          description: `No incorrect questions found for ${practiceSelections?.assessment}. Please complete some practice sessions first.`,
          duration: 5000,
        });
      } else {
        toast.error("No Bookmarked Questions", {
          description: `No bookmarked questions found for ${practiceSelections?.assessment}. Please bookmark some questions first.`,
          duration: 5000,
        });
      }
      return false;
    }
    return true;
  };

  return (
    <React.Fragment>
      <SiteHeader />

      {!onboardingComplete ? (
        <React.Fragment>
          <ReviewOnboarding onComplete={handleOnboardingComplete} />
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
                    Invalid Review Link Parameters
                  </div>
                  <div className="text-xs mt-1">
                    The review link contains invalid data. You can continue with
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
      ) : practiceSelections && validateQuestionsAvailable() ? (
        <PracticeRushMultistep
          practiceSelections={practiceSelections}
          onSessionComplete={handleSessionComplete}
          isReviewMode={false}
        />
      ) : null}
    </React.Fragment>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Review />
    </Suspense>
  );
}
