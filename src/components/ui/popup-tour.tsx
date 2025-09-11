"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "../logo";
import PlatformAnnouncementBanner from "@/src/platform-announcement-banner.png";
import LastAnnouncementBanner from "@/src/last-announcement-banner.png";
import Insights from "@/src/insights.png";

import NewDashboard from "@/src/new-dashboard.png";
import QuestionbankDemo from "@/src/questionbank-demo.gif";
import AdvancedFilterDemo from "@/src/advanced-filter-demo.gif";
import QB_Custom_demo from "@/src/questionbank-custom-demo.gif";

import QB_Tracker from "@/src/qb-tracker.png";
import Vocabs_Tracker from "@/src/vocabs-tracker.png";
import Vocabs_Flashcard from "@/src/vocabs-flashcard.png";
import Vocabs_Practice from "@/src/vocabs-practice.png";
import Vocabs_AI from "@/src/sat-vocab-ai-demo.gif";
import BookmarkFolder from "@/src/bookmark-folder.gif";

export default function Dialog02() {
  const [step, setStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const steps = [
    {
      title: "Let's Get Started",
      description:
        "Explore the recaps of new features added through this tour.",
      image: PlatformAnnouncementBanner,
    },
    {
      title: "New Dashboard Design",
      description:
        "The dashboard has been redesigned to provide more intuitive and user-friendly experience for mobile, tablet, and desktop users.",
      image: NewDashboard,
    },
    {
      title: "Personalized Insights & Statistics",
      description:
        "You can get personalized insights and statistics based on your performance on each subject's topics.",
      image: Insights,
    },
    {
      title: "Bookmark Questions with Folders",
      description:
        "You can now bookmark questions and organize them with folders.",
      image: BookmarkFolder,
    },
    {
      title: "Questionbank Page is Here",
      description:
        "We just added a new Question Bank page like in Collegeboard. Yup, it directly fetches from Collegeboard's Question Bank collections.",
      image: QuestionbankDemo,
    },
    {
      title: "Questionbank Custom Look",
      description:
        "You can even choose the UI of question bank to be in list view or slide, whichever you prefer.",
      image: QB_Custom_demo,
    },
    {
      title: "Questionbank Advanced Filters",
      description:
        "We have more filter options to help you narrow down your search and find exactly what you're looking for in the question bank. You can even know what the latest questions that just added by the Collegeboard.",
      image: AdvancedFilterDemo,
    },
    {
      title: "Questionbank Tracker",
      description:
        "You can now track your collegeboard's question bank progress thoroughly within this platform.",
      image: QB_Tracker,
    },

    {
      title: "SAT Vocab is Here",
      description: `Learn more than 800+ SAT vocab words compiled from various sources.`,
      image: Vocabs_Tracker,
    },
    {
      title: "Learn 800+ Vocabs with Flashcards",
      description:
        "Practice & learn more than 800+ SAT vocab words with flashcards. Data saved locally within your browser's localstorage.",
      image: Vocabs_Flashcard,
    },
    {
      title: "Practice 800+ Vocabs",
      description: `Practice with various modes to help you memorize the words better.`,
      image: Vocabs_Practice,
    },
    {
      title: "Practice Vocabs with AI",
      description:
        "We use deepseek to help you do personalized practice with SAT Vocabs and most importantly instant feedback from AI!",
      image: Vocabs_AI,
    },
    {
      title: "Lastly, it's all free, forever!",
      description:
        "Yes, you heard that right! PracticeSAT is will be completely free to use, now and always. Our platform is ad-free and will remain so, it's also open source btw. ",
      image: LastAnnouncementBanner,
    },
  ];

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };

  const handleDialogClose = () => {
    localStorage.setItem("onboarding-tour-completed", "true");
    setIsOpen(false);
  };

  useEffect(() => {
    // Check if the tour has been completed
    const tourCompleted = localStorage.getItem("onboarding-tour-completed");
    if (!tourCompleted || tourCompleted === "false") {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (stepRefs.current[step]) {
      stepRefs.current[step]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [step]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleDialogClose();
        } else {
          setStep(0);
        }
      }}
    >
      <DialogContent
        className={cn(
          "max-w-3xl p-0 overflow-hidden rounded-xl border shadow-2xl",
          "bg-white text-black",
          "dark:bg-black dark:text-white dark:border-neutral-800",
          "data-[state=open]:animate-none data-[state=closed]:animate-none"
        )}
      >
        <div className="flex flex-col md:flex-row w-full h-full">
          {/* Sidebar */}
          <div className="w-full md:w-1/3 p-6 border-r border-gray-200 dark:border-neutral-800">
            <div className="flex flex-col gap-3">
              <div className="flex justify-start">
                <Logo iconOnly />
              </div>
              <h2 className="text-lg font-medium">Welcome to PracticeSAT!</h2>
              <p className="text-sm opacity-80">
                We&apos;ve got bunch of new features to help you ace your SAT
                prep.
              </p>
              <div className="flex flex-col gap-3 mt-6 max-h-60 overflow-y-auto">
                {steps.map((s, index) => (
                  <div
                    key={index}
                    ref={(el) => {
                      stepRefs.current[index] = el;
                    }}
                    className={cn(
                      "flex items-center gap-2 text-sm transition cursor-pointer",
                      index === step
                        ? "font-semibold"
                        : "opacity-60 hover:opacity-100"
                    )}
                    onClick={() => setStep(index)}
                  >
                    {index < step ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-black dark:bg-white/40" />
                    )}
                    <span className="font-normal">{s.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-2/3 p-8 flex flex-col justify-between">
            <div className="space-y-4 flex flex-col justify-between h-full">
              <DialogHeader className="flex flex-col justify-end ">
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={steps[step].title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="text-2xl font-medium"
                  >
                    {steps[step].title}
                  </motion.h2>
                </AnimatePresence>

                <div className="min-h-[60px]">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={steps[step].description}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="text-gray-600 dark:text-gray-400 text-base opacity-90"
                    >
                      {steps[step].description}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </DialogHeader>

              {/* Image */}
              <div className="relative w-full h-60 bg-gray-100 dark:bg-neutral-900 rounded-lg flex items-center justify-center">
                <Image
                  src={steps[step].image}
                  alt={steps[step].title}
                  fill
                  className="rounded-lg border-4 border-gray-200 dark:border-neutral-800"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-between items-center">
              <Button variant="outline" onClick={handleDialogClose}>
                Skip
              </Button>

              {step < steps.length - 1 ? (
                <Button variant="outline" onClick={next}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button variant="outline" onClick={handleDialogClose}>
                  Finish
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
