"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export type Step = {
  id: string;
  title: string;
  description?: string;
  targetSelector: string;
  completed?: boolean;
  biggerZIndex?: boolean;
  requirePreviousStep?: boolean;
};

export interface InteractiveOnboardingChecklistProps {
  steps: Step[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?(open: boolean): void;
  onCompleteStep?(id: string): void;
  onFinish?(): void;
  accentColorVar?: string;
  placement?: "left" | "right";
  mode?: "standard" | "strict";
  tourLocalStorageKey?: string;
}

const getElementPosition = (selector: string) => {
  const element = document.querySelector(selector) as HTMLElement;
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
    element,
  };
};

const CoachmarkOverlay = ({
  step,
  onNext,
  onPrev,
  onComplete,
  onClose,
  isFirst,
  isLast,
  stepIndex,
  totalSteps,
  steps,
  completedSteps,
  mode,
  onFinishTour,
}: {
  step: Step;
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  onClose: () => void;
  isFirst: boolean;
  isLast: boolean;
  stepIndex: number;
  totalSteps: number;
  steps: Step[];
  completedSteps: Set<string>;
  mode?: "standard" | "strict";
  onFinishTour?: () => void;
}) => {
  const [targetPosition, setTargetPosition] = useState(
    getElementPosition(step.targetSelector)
  );
  const overlayRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    setTargetPosition(getElementPosition(step.targetSelector));
  }, [step.targetSelector]);

  useEffect(() => {
    updatePosition();

    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    const resizeObserver = new ResizeObserver(updatePosition);
    const targetElement = document.querySelector(step.targetSelector);
    if (targetElement) {
      resizeObserver.observe(targetElement);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [step.targetSelector, updatePosition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" && !isLast) {
        onNext();
      } else if (e.key === "ArrowLeft" && !isFirst) {
        onPrev();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onComplete();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev, onComplete, isFirst, isLast]);

  if (!targetPosition) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 h-screen z-50 bg-black/50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coachmark-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card border rounded-xl p-6 max-w-md mx-4 shadow-lg"
        >
          <h3 id="coachmark-title" className="font-semibold text-lg mb-2">
            {step.title}
          </h3>
          <p className="text-muted-foreground mb-4">
            Target element not found. Please ensure the element with selector "
            {step.targetSelector}" exists.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" onClick={onComplete}>
              Mark Complete
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const { top, left, width, height } = targetPosition;
  const spotlightPadding = 8;

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 ${
        step.biggerZIndex ? "z-[100]" : "z-50"
      } pointer-events-none h-screen`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="coachmark-title"
      style={{
        background: `radial-gradient(circle at ${left + width / 2}px ${
          top + height / 2
        }px, transparent ${
          Math.max(width, height) / 2 + spotlightPadding
        }px, rgba(0,0,0,0.7) ${
          Math.max(width, height) / 2 + spotlightPadding + 1
        }px)`,
      }}
    >
      <div
        className="absolute border-2 border-primary rounded-lg shadow-lg"
        style={{
          top: top - spotlightPadding,
          left: left - spotlightPadding,
          width: width + spotlightPadding * 2,
          height: height + spotlightPadding * 2,
          boxShadow: `0 0 0 2px hsl(var(--primary)), 0 0 20px rgba(0,0,0,0.3)`,
        }}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 10 }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 400,
          opacity: { duration: 0.15 },
        }}
        className="absolute bg-card border rounded-xl p-4 shadow-xl max-w-sm pointer-events-auto"
        style={(() => {
          const cardWidth = 384;
          const cardHeight = 200;
          const margin = 16;
          const onboardingCardWidth = 320;
          const onboardingCardHeight = 400;

          const positions = [
            {
              top: top + height + margin,
              left: left + width / 2 - cardWidth / 2,
              priority: 1,
            },
            {
              top: top - cardHeight - margin,
              left: left + width / 2 - cardWidth / 2,
              priority: 2,
            },
            {
              top: top + height / 2 - cardHeight / 2,
              left: left + width + margin,
              priority: 3,
            },
            {
              top: top + height / 2 - cardHeight / 2,
              left: left - cardWidth - margin,
              priority: 4,
            },
          ];

          const bestPosition = positions
            .map((pos) => ({
              ...pos,
              fitsHorizontally:
                pos.left >= margin &&
                pos.left + cardWidth <= window.innerWidth - margin,
              fitsVertically:
                pos.top >= margin &&
                pos.top + cardHeight <= window.innerHeight - margin,
              overlapsOnboarding:
                pos.left + cardWidth >
                  window.innerWidth - onboardingCardWidth - margin * 2 &&
                pos.top + cardHeight >
                  window.innerHeight - onboardingCardHeight - margin * 2,
            }))
            .filter(
              (pos) =>
                pos.fitsHorizontally &&
                pos.fitsVertically &&
                !pos.overlapsOnboarding
            )
            .sort((a, b) => a.priority - b.priority)[0];

          if (bestPosition) {
            return {
              top: bestPosition.top,
              left: bestPosition.left,
            };
          }

          let fallbackTop = top + height + margin;
          let fallbackLeft = left + width / 2 - cardWidth / 2;

          fallbackLeft = Math.max(
            margin,
            Math.min(fallbackLeft, window.innerWidth - cardWidth - margin)
          );

          const maxTop = window.innerHeight - cardHeight - margin;
          const onboardingTop =
            window.innerHeight - onboardingCardHeight - margin * 2;

          if (
            fallbackTop + cardHeight > onboardingTop &&
            fallbackLeft + cardWidth >
              window.innerWidth - onboardingCardWidth - margin * 2
          ) {
            fallbackTop = Math.max(margin, top - cardHeight - margin);
          } else {
            fallbackTop = Math.max(margin, Math.min(fallbackTop, maxTop));
          }

          return {
            top: fallbackTop,
            left: fallbackLeft,
          };
        })()}
      >
        <div className="mb-3">
          <h3 id="coachmark-title" className="font-semibold text-base mb-1">
            {step.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            Step {stepIndex + 1} of {totalSteps}
          </p>
        </div>

        {step.description && (
          <p className="text-sm text-foreground mb-4">{step.description}</p>
        )}

        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={isFirst}
            aria-label="Previous step"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>

          {(() => {
            // Check if next step requires previous step to be completed
            const nextStep =
              stepIndex < totalSteps - 1 ? steps[stepIndex + 1] : null;
            const nextStepRequiresPrevious = nextStep?.requirePreviousStep;
            const currentStepCompleted = completedSteps.has(step.id);
            const shouldDisableNext =
              isLast || (nextStepRequiresPrevious && !currentStepCompleted);

            // Check if we should show "Finish tour" button
            const isLastStepInStandardMode = isLast && mode === "standard";

            const nextButton = (
              <Button
                variant="outline"
                size="sm"
                onClick={isLastStepInStandardMode ? onFinishTour : onNext}
                disabled={shouldDisableNext && !isLastStepInStandardMode}
                aria-label={
                  isLastStepInStandardMode ? "Finish tour" : "Next step"
                }
              >
                {isLastStepInStandardMode ? "Finish tour" : "Next"}
                {!isLastStepInStandardMode && (
                  <ChevronRight className="h-4 w-4 ml-1" />
                )}
              </Button>
            );

            if (
              nextStepRequiresPrevious &&
              !currentStepCompleted &&
              !isLastStepInStandardMode
            ) {
              return (
                <div className="relative group">
                  {nextButton}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    This step should be completed
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              );
            }

            return nextButton;
          })()}
        </div>
      </motion.div>
    </motion.div>
  );
};

export function InteractiveOnboardingChecklist({
  steps,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onCompleteStep,
  onFinish,
  accentColorVar = "--primary",
  placement = "right",
  mode = "strict",
  tourLocalStorageKey,
}: InteractiveOnboardingChecklistProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const [internalCompletedSteps, setInternalCompletedSteps] = useState<
    Set<string>
  >(new Set());

  const completedSteps = new Set([
    ...steps.filter((step) => step.completed).map((step) => step.id),
    ...internalCompletedSteps,
  ]);
  const [activeCoachmark, setActiveCoachmark] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeStepRef = useRef<HTMLLIElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const advanceToNextStep = useCallback(
    (completedStepId: string) => {
      const newCompletedSteps = new Set([
        ...steps.filter((step) => step.completed).map((step) => step.id),
        ...internalCompletedSteps,
        completedStepId,
      ]);

      const currentStepIndex = steps.findIndex(
        (step) => step.id === completedStepId
      );
      const nextIncompleteStep = steps
        .slice(currentStepIndex + 1)
        .find((step) => !newCompletedSteps.has(step.id));

      if (nextIncompleteStep) {
        setActiveCoachmark(nextIncompleteStep.id);
      } else {
        setActiveCoachmark(null);
      }

      const completedAllSteps = steps.filter((step) =>
        newCompletedSteps.has(step.id)
      );

      if (completedAllSteps.length === steps.length) {
        // Save completion status to localStorage if key is provided
        if (tourLocalStorageKey) {
          localStorage.setItem(tourLocalStorageKey, "true");
        }
        setTimeout(() => onFinish?.(), 100);
      }
    },
    [steps, internalCompletedSteps, onFinish]
  );

  useEffect(() => {
    if (open && !activeCoachmark) {
      const firstIncompleteStep = steps.find(
        (step) => !completedSteps.has(step.id)
      );
      if (firstIncompleteStep) {
        const timer = setTimeout(() => {
          setActiveCoachmark(firstIncompleteStep.id);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [open, activeCoachmark, steps, completedSteps]);

  useEffect(() => {
    if (activeCoachmark) {
      const activeStep = steps.find((s) => s.id === activeCoachmark);
      if (activeStep && activeStep.completed) {
        setTimeout(() => {
          advanceToNextStep(activeCoachmark);
        }, 500);
      }
    }
  }, [steps, activeCoachmark, advanceToNextStep]);

  // Auto-scroll to active step
  useEffect(() => {
    if (activeStepRef.current && scrollContainerRef.current) {
      // Add a small delay to ensure the DOM is updated
      const timeoutId = setTimeout(() => {
        activeStepRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [activeCoachmark]);

  // Disable body scroll when onboarding is open
  useEffect(() => {
    if (open) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;

      // Disable scroll
      document.body.style.overflow = "hidden";

      // Cleanup function to restore original overflow
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && activeCoachmark) {
      return;
    }

    // Save completion status to localStorage if closing and all steps are completed
    if (!newOpen && allStepsCompleted && tourLocalStorageKey) {
      localStorage.setItem(tourLocalStorageKey, "true");
    }

    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);

    if (!newOpen) {
      setActiveCoachmark(null);
    }
  };

  const handleCompleteStep = (stepId: string) => {
    setInternalCompletedSteps((prev) => new Set([...prev, stepId]));
    onCompleteStep?.(stepId);

    setTimeout(() => {
      advanceToNextStep(stepId);
    }, 500);
  };

  const handleFinishTour = () => {
    // Save completion status to localStorage if key is provided
    if (tourLocalStorageKey) {
      localStorage.setItem(tourLocalStorageKey, "true");
    }

    // Close the onboarding immediately
    setActiveCoachmark(null);
    if (!isControlled) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
    onFinish?.();
  };

  const handleStepClick = (step: Step) => {
    if (completedSteps.has(step.id)) return;
    setActiveCoachmark(step.id);
  };

  const activeStep = activeCoachmark
    ? steps.find((s) => s.id === activeCoachmark)
    : null;
  const activeStepIndex = activeStep ? steps.indexOf(activeStep) : -1;

  const completedCount = steps.filter((step) =>
    completedSteps.has(step.id)
  ).length;
  const totalSteps = steps.length;
  const progress = (completedCount / totalSteps) * 100;

  const allStepsCompleted = completedCount === totalSteps;

  const hasPrevIncompleteStep =
    activeStepIndex > 0 &&
    steps
      .slice(0, activeStepIndex)
      .some((step) => !completedSteps.has(step.id));
  const hasNextIncompleteStep =
    activeStepIndex < totalSteps - 1 &&
    steps
      .slice(activeStepIndex + 1)
      .some((step) => !completedSteps.has(step.id));

  return (
    <>
      <Dialog.Root open={open} onOpenChange={handleOpenChange} modal={false}>
        <Dialog.Portal>
          <Dialog.Content
            className={`fixed bottom-4 ${
              placement == "left" ? "left-4" : "right-4"
            } z-100 w-80 max-h-[calc(100vh-2rem)] bg-card border rounded-xl shadow-xl pointer-events-auto`}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0.0, 0.2, 1],
              }}
              className="flex flex-col max-h-full"
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-semibold">
                    Getting Started
                  </Dialog.Title>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setActiveCoachmark(null);

                      // Save completion status if all steps are completed
                      if (allStepsCompleted && tourLocalStorageKey) {
                        localStorage.setItem(tourLocalStorageKey, "true");
                      }

                      if (!isControlled) {
                        setInternalOpen(false);
                      }
                      onOpenChange?.(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {completedCount}/{totalSteps}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      className="h-2 rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>

              <div
                className="overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent"
                style={{ maxHeight: "calc(100vh - 600px)" }}
                ref={scrollContainerRef}
              >
                <ul role="list" className="space-y-3">
                  {steps.map((step, index) => {
                    const isCompleted = completedSteps.has(step.id);
                    const isActive = activeCoachmark === step.id;

                    return (
                      <li key={step.id} ref={isActive ? activeStepRef : null}>
                        <button
                          onClick={() => handleStepClick(step)}
                          disabled={isCompleted}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-colors",
                            "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring",
                            isCompleted &&
                              "bg-success/10 border-success/30 cursor-default",
                            isActive && "ring-2 ring-primary"
                          )}
                          aria-describedby={`step-${step.id}-description`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {isCompleted ? (
                                <div className="h-5 w-5 rounded-full bg-success flex items-center justify-center">
                                  <Check className="h-3 w-3 text-success-foreground" />
                                </div>
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={cn(
                                    "font-medium text-sm",
                                    isCompleted
                                      ? "text-muted-foreground line-through"
                                      : "text-foreground"
                                  )}
                                >
                                  {step.title}
                                </span>
                              </div>
                              {step.description && (
                                <p
                                  id={`step-${step.id}-description`}
                                  className={cn(
                                    "text-xs",
                                    isCompleted
                                      ? "text-muted-foreground"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {step.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {allStepsCompleted && (
                <div className="p-6 border-t">
                  <Button
                    className="w-full"
                    onClick={() => {
                      // Save completion status to localStorage if key is provided
                      if (tourLocalStorageKey) {
                        localStorage.setItem(tourLocalStorageKey, "true");
                      }

                      onFinish?.();
                      handleOpenChange(false);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Finish Setup
                  </Button>
                </div>
              )}
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AnimatePresence>
        {activeStep && (
          <CoachmarkOverlay
            step={activeStep}
            stepIndex={activeStepIndex}
            totalSteps={totalSteps}
            steps={steps}
            completedSteps={completedSteps}
            mode={mode}
            onFinishTour={handleFinishTour}
            isFirst={!hasPrevIncompleteStep}
            isLast={!hasNextIncompleteStep}
            onNext={() => {
              for (let i = activeStepIndex + 1; i < totalSteps; i++) {
                if (!completedSteps.has(steps[i].id)) {
                  setActiveCoachmark(steps[i].id);
                  return;
                }
              }
            }}
            onPrev={() => {
              for (let i = activeStepIndex - 1; i >= 0; i--) {
                if (!completedSteps.has(steps[i].id)) {
                  setActiveCoachmark(steps[i].id);
                  return;
                }
              }
            }}
            onComplete={() => handleCompleteStep(activeStep.id)}
            onClose={() => setActiveCoachmark(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
