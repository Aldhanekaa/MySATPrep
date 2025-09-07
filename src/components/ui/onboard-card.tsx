"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, LoaderIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface Step {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface OnboardCardProps {
  duration?: number;
  steps: Step[];
  currentStep?: number;
  onStepChange?: (step: number) => void;
  autoPlay?: boolean;
}

const OnboardCard = ({
  duration = 3000,
  steps,
  currentStep: externalCurrentStep,
  onStepChange,
  autoPlay = true,
}: OnboardCardProps) => {
  const [internalCurrentStep, setInternalCurrentStep] = useState(1);
  const [stepProgress, setStepProgress] = useState<Record<string, number>>({});
  const [animateKey, setAnimateKey] = useState(0);

  // Use external currentStep if provided, otherwise use internal state
  const currentStep = externalCurrentStep ?? internalCurrentStep;

  const stepDuration = duration / steps.length;

  useEffect(() => {
    // Only run auto-play if autoPlay is true and no external control is provided
    if (!autoPlay || externalCurrentStep !== undefined) return;

    const timeouts: NodeJS.Timeout[] = [];

    // Generate timeouts for each step
    steps.forEach((step, index) => {
      const stepNumber = index + 1;

      timeouts.push(
        setTimeout(
          () => {
            setInternalCurrentStep(stepNumber);
            setStepProgress((prev) => ({
              ...prev,
              [step.id]: 100,
            }));
            // Notify parent of step change if callback is provided
            onStepChange?.(stepNumber);
          },
          stepNumber === 1
            ? 100
            : stepDuration * (stepNumber - 1) + 200 * stepNumber
        )
      );
    });

    // Reset animation after all steps complete
    timeouts.push(
      setTimeout(() => {
        setInternalCurrentStep(1);
        setStepProgress({});
        setAnimateKey((k) => k + 1);
        onStepChange?.(1);
      }, duration + 1000)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [
    animateKey,
    duration,
    stepDuration,
    steps,
    autoPlay,
    externalCurrentStep,
    onStepChange,
  ]);

  // Update progress when external currentStep changes
  useEffect(() => {
    if (externalCurrentStep !== undefined) {
      // Update progress for all steps up to the current step
      const newProgress: Record<string, number> = {};
      steps.forEach((step, index) => {
        const stepNumber = index + 1;
        if (stepNumber <= externalCurrentStep) {
          newProgress[step.id] = 100;
        }
      });
      setStepProgress(newProgress);
    }
  }, [externalCurrentStep, steps]);

  return (
    <div
      className={cn(
        "relative",
        "flex flex-col items-center max-w-sm w-full justify-center gap-1 p-4 h-[280px] overflow-hidden"
      )}
    >
      {/* Animated container that moves all cards together */}
      <motion.div
        className="flex flex-col items-center gap-2 mx-auto"
        initial={{ y: 70 }}
        animate={{
          y: 80 - (currentStep - 1) * 67, // Each step moves up by card height + gap (65px + 2px gap)
        }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      >
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep >= stepNumber;
          const isCurrentStep = currentStep === stepNumber;
          const progress = stepProgress[step.id] || 0;

          return (
            <motion.div
              key={step.id}
              className={cn(
                "flex w-[280px] h-[65px] flex-col justify-center gap-2 rounded-md border bg-gradient-to-br from-neutral-100 to-neutral-50 py-3 pl-3 pr-4",
                "dark:from-neutral-800 dark:to-neutral-950"
              )}
              initial={{
                scale: stepNumber === 1 ? 1.0 : 0.85,
                opacity: stepNumber === 1 ? 1 : 0.4,
              }}
              animate={{
                scale: isCurrentStep ? 1.0 : 0.85,
                opacity: isActive ? 1 : 0.4,
              }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
            >
              <div className="flex items-center justify-start gap-2 text-xs text-primary">
                <div>
                  {currentStep > stepNumber ? (
                    <div className="relative">
                      <svg width="16" height="16">
                        <circle cx="8" cy="8" r="8" fill="#22c55e" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-background">
                        <CheckIcon className="size-2" />
                      </div>
                    </div>
                  ) : isCurrentStep ? (
                    <div className="animate-spin">
                      <LoaderIcon className="size-4" />
                    </div>
                  ) : (
                    <LoaderIcon className="size-4" />
                  )}
                </div>
                <div>{step.content}</div>
              </div>
              <div className="ml-5 mt-1 h-1.5 w-[calc(100%-1.25rem)] overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                {isActive && (
                  <motion.div
                    key={`${step.id}-${animateKey}`}
                    className="h-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{
                      duration: stepDuration / 1000,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="absolute top-0 h-[40%] w-full [background-image:linear-gradient(to_bottom,theme(colors.background)_20%,transparent_100%)]" />
      <div className="absolute bottom-0 h-[40%] w-full [background-image:linear-gradient(to_top,theme(colors.background)_20%,transparent_100%)]" />
    </div>
  );
};
export default OnboardCard;
