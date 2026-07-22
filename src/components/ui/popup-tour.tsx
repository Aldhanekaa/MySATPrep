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

import FeatureAnnouncement from "@/src/fourthJuly.png";
import Proof from "@/src/proof.png";
import IncorrectAnswers from "@/src/incorrect-answers.png";
import OpenSource from "@/src/opensource.png";

import SyncDataAcrossDevices from "@/src/SyncDataAcrossDevices.png";

export default function Dialog02() {
  const [step, setStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const steps = [
    {
      title: "July 22nd Release",
      description:
        "Fixed Bugs and Answering Your Question. One of the bug fixed is the issue with duplicated questions. ",
      image: PlatformAnnouncementBanner,
    },
    {
      title: "Is it real questions?",
      description:
        "Yes. We directly use College Board question bank original source. It's an open source project : https://github.com/aldhanekaa/MySATPrep",
      image: Proof,
    },
    {
      title: "Why are there ridiculous incorrect answers?",
      description:
        "Long story short, it's due to the unstructured data from College Board database. Sometimes they don't provide all possible answers such as .5, 0.5, 1/2. Nevertheless, we’ve partially fixed it (not sure about the rest), so it's important to provide the question id when you guys file a bug report.  Example : ",
      image: IncorrectAnswers,
    },
    {
      title: "We are open for all contributions",
      description:
        "So if you open our github repo on issues (https://github.com/aldhanekaa/MySATPrep), you will see list of user suggestions / bug reports submitted by users through the website's form. Feel free to contribute to the project. We will review your PR and merge it if it's good. We will also give you credit for your contribution.",
      image: OpenSource,
    },
    {
      title: "Sign In With Google or Email",
      description: "Sign in to move your local data to the cloud.",
      image: FeatureAnnouncement,
    },
    {
      title: "Sync Data Across Devices",
      description: "Keep your progress in sync so it follows you everywhere.",
      image: SyncDataAcrossDevices,
    },
  ];

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };

  const handleDialogClose = () => {
    localStorage.setItem("new-update-tour", "true");
    setIsOpen(false);
  };

  useEffect(() => {
    // Check if the tour has been completed
    const tourCompleted = localStorage.getItem("new-update-tour-bugs-fixed");
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
          "data-[state=open]:animate-none data-[state=closed]:animate-none max-h-[80vh] overflow-y-auto",
        )}
      >
        <div className="flex flex-col md:flex-row w-full h-full">
          {/* Sidebar */}
          <div className="w-full md:w-1/3 p-6 border-r border-gray-200 dark:border-neutral-800">
            <div className="flex flex-col gap-3">
              <div className="flex justify-start">
                <Logo iconOnly />
              </div>
              <h2 className="text-lg font-medium">Welcome to MySATPrep!</h2>
              <p className="text-sm opacity-80">
                We just fixed some issues and bugs.
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
                        : "opacity-60 hover:opacity-100",
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
