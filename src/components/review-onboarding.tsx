"use client";

import React, { useId, useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { playSound } from "@/lib/playSound";

interface ReviewSelections {
  assessment: string;
  subject: string;
  reviewType: string;
}

interface ReviewOnboardingProps {
  onComplete: (selections: ReviewSelections) => void;
  assessment?: string;
  subject?: string;
}

export default function ReviewOnboarding({
  onComplete,
  assessment,
  subject,
}: ReviewOnboardingProps) {
  const id = useId();
  const [step, setStep] = useState<number>(1);
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedReviewType, setSelectedReviewType] = useState<string>("");

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    console.log("Initial assessment:", assessment);
    if (assessment) {
      setSelectedAssessment(assessment);
      setStep(2);
    }

    if (subject) {
      setSelectedSubject(subject);
      setStep(3);
    }
  }, [assessment, subject]);

  const assessmentItems = [
    {
      value: "SAT",
      label: "SAT",
      description: "Digital SAT Assessment",
    },
    {
      value: "PSAT/NMSQT",
      label: "PSAT/NMSQT",
      description: "PSAT/NMSQT & PSAT 10",
    },
    {
      value: "PSAT",
      label: "PSAT 8/9",
      description: "PSAT 8/9 Assessment",
    },
  ];

  const subjectItems = [
    {
      value: "math",
      label: "Math",
      description: "Review SAT Math problems",
    },
    {
      value: "reading-writing",
      label: "Reading & Writing",
      description: "Review SAT Reading and Writing problems",
    },
  ];

  const reviewTypeItems = [
    {
      value: "incorrect",
      label: "Incorrect Questions",
      description: "Review questions you answered incorrectly",
    },
    {
      value: "bookmarked",
      label: "Bookmarked Questions",
      description: "Review questions you bookmarked for later",
    },
  ];

  const handleContinue = () => {
    playSound("navigation_forward-selection-minimal.wav");

    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      // Handle final submission
      onComplete({
        assessment: selectedAssessment,
        subject: selectedSubject,
        reviewType: selectedReviewType,
      });
    }
  };

  const handleBack = () => {
    playSound("navigation_backward-selection-minimal.wav");

    if (step === 3) {
      setStep(2);
      setSelectedReviewType("");
    } else if (step === 2) {
      setStep(1);
      setSelectedSubject("");
    } else if (step === 1) {
      setSelectedAssessment("");
    }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Choose Assessment";
      case 2:
        return "Choose Subject to Review";
      case 3:
        return "Choose Review Type";
      default:
        return "";
    }
  };

  const getCurrentItems = () => {
    switch (step) {
      case 1:
        return assessmentItems;
      case 2:
        return subjectItems;
      case 3:
        return reviewTypeItems;
      default:
        return [];
    }
  };

  const getCurrentValue = () => {
    switch (step) {
      case 1:
        return selectedAssessment;
      case 2:
        return selectedSubject;
      case 3:
        return selectedReviewType;
      default:
        return "";
    }
  };

  const setCurrentValue = (value: string) => {
    switch (step) {
      case 1:
        setSelectedAssessment(value);
        break;
      case 2:
        setSelectedSubject(value);
        break;
      case 3:
        setSelectedReviewType(value);
        break;
    }
  };

  const isCurrentStepValid = () => {
    switch (step) {
      case 1:
        return selectedAssessment !== "";
      case 2:
        return selectedSubject !== "";
      case 3:
        return selectedReviewType !== "";
      default:
        return false;
    }
  };

  const getContinueButtonText = () => {
    switch (step) {
      case 1:
        return "Choose Subject to Review";
      case 2:
        return "Choose Review Type";
      case 3:
        return "Start Review";
      default:
        return "Continue";
    }
  };

  return (
    <div className="w-full flex flex-col min-h-[85vh] py-60 items-center justify-center">
      <motion.h1
        className="text-4xl font-bold"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        key={step}
      >
        {getStepTitle()}
      </motion.h1>

      <AnimatePresence mode="wait">
        <motion.fieldset
          key={step}
          className="space-y-4 max-w-3xl mx-auto mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={cardVariants}>
              <RadioGroup
                className={`w-full grid gap-6 ${
                  step === 1 ? "grid-cols-3" : "grid-cols-2"
                }`}
                value={getCurrentValue()}
                onValueChange={(value) => {
                  playSound("tap-radio.wav");
                  setCurrentValue(value);
                }}
              >
                {getCurrentItems().map((item) => (
                  <label
                    key={`${id}-${step}-${item.value}`}
                    className="w-full px-4 py-6 relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-input text-center shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.15)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.2)] outline-offset-2 transition-all duration-150 has-[[data-disabled]]:cursor-not-allowed has-[[data-state=checked]]:border-blue-500 has-[[data-state=checked]]:bg-blue-50 has-[[data-state=checked]]:shadow-[0_4px_0_0_theme(colors.blue.500),0_8px_20px_theme(colors.blue.500/0.25)] has-[[data-disabled]]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70 active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.15)] active:translate-y-0.5 has-[[data-state=checked]]:active:shadow-[0_2px_0_0_theme(colors.blue.500),0_4px_10px_theme(colors.blue.500/0.2)]"
                  >
                    <RadioGroupItem
                      id={`${id}-${step}-${item.value}`}
                      value={item.value}
                      className="sr-only after:absolute after:inset-0"
                    />
                    <Image
                      src={"https://originui.com/ui-light.png"}
                      alt={"label"}
                      width={88}
                      height={70}
                      className="mt-6 mb-8 relative cursor-pointer overflow-hidden rounded-lg border border-input shadow-sm shadow-black/5 outline-offset-2 transition-colors peer-[:focus-visible]:outline peer-[:focus-visible]:outline-2 peer-[:focus-visible]:outline-ring/70 peer-data-[disabled]:cursor-not-allowed peer-data-[state=checked]:border-ring peer-data-[state=checked]:bg-accent peer-data-[disabled]:opacity-50"
                    />
                    <p className="text-2xl font-bold leading-none text-foreground">
                      {item.label}
                    </p>
                    <p className="text-lg">{item.description}</p>
                  </label>
                ))}
              </RadioGroup>
            </motion.div>

            <motion.div
              variants={cardVariants}
              className="grid grid-cols-1 w-full gap-4 mt-10"
            >
              <Button
                variant="default"
                className="group w-full hover:cursor-pointer text-lg py-6 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold shadow-[0_4px_0_0_theme(colors.blue.600),0_8px_20px_theme(colors.blue.500/0.25)] hover:shadow-[0_6px_0_0_theme(colors.blue.700),0_10px_25px_theme(colors.blue.500/0.3)] active:shadow-[0_2px_0_0_theme(colors.blue.600),0_4px_10px_theme(colors.blue.500/0.2)] active:translate-y-0.5 transform transition-all duration-150 cursor-pointer"
                onClick={handleContinue}
                disabled={!isCurrentStepValid()}
              >
                {getContinueButtonText()}
                <div className="text-white size-6 overflow-hidden rounded-full duration-500">
                  <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                    <span className="flex size-6">
                      <ArrowRight className="m-auto size-5" />
                    </span>
                    <span className="flex size-6">
                      <ArrowRight className="m-auto size-5" />
                    </span>
                  </div>
                </div>
              </Button>

              {step > 1 && (
                <Button
                  variant="outline"
                  className="text-lg w-full py-6 rounded-2xl font-bold shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.25)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.3)] hover:bg-gray-50 active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.2)] active:translate-y-0.5 transform transition-all duration-150 dark:shadow-[0_4px_0_0_theme(colors.gray.600),0_8px_20px_theme(colors.gray.700/0.25)] dark:hover:shadow-[0_6px_0_0_theme(colors.gray.500),0_8px_20px_theme(colors.gray.700/0.3)] dark:hover:bg-gray-800 cursor-pointer"
                  onClick={handleBack}
                >
                  Back
                </Button>
              )}
            </motion.div>
          </motion.div>
        </motion.fieldset>
      </AnimatePresence>
    </div>
  );
}
