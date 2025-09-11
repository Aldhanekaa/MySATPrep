"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { playSound } from "@/lib/playSound";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { VocabsData } from "@/types/vocabulary";

// Import practice components
import VocabsQuizPractice from "./quiz";
import VocabsVocabQuizPractice from "./vocab-quiz";
import VocabsDefinePractice from "./define";
import VocabsFillinTheBlankPractice from "./fill-in-the-blank";
import VocabsFormaSentencePractice from "./form-a-sentence";
import VocabsMatchPractice from "./vocabs-match";
import Link from "next/link";

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function VocabsPracticePage_Main() {
  // Use the useLocalStorage hook
  const [vocabsData, setVocabsData] = useLocalStorage<VocabsData>(
    "vocabsData",
    {
      learntVocabs: [],
      userSentences: {},
    }
  );

  const [selectedMethod, setSelectedMethod] = useState("");
  const [isStarted, setIsStarted] = useState(false);

  const practiceMethodsS = [
    {
      value: "definition-quiz",
      label: "Definition Quiz",
      description: "Multiple choice questions with definitions",
      icon: "🧠",
      disabled: false,
    },
    {
      value: "vocab-quiz",
      label: "Vocab Quiz",
      description: "Multiple choice questions with vocabulary words",
      icon: "❓",
      disabled: false,
    },
    {
      value: "vocabs-match",
      label: "Vocabs Match",
      description:
        "Match vocabulary words with their definitions. Learn more words as you play.",
      icon: "🧩",
      disabled: false,
    },
    {
      value: "fill-blank",
      label: "Fill in the Blank",
      description: "Complete sentences with vocabulary words",
      icon: "✏️",
      disabled: false,
    },
    {
      value: "define",
      label: "Define",
      description: "Write definitions for vocabulary words",
      icon: "📝",
      disabled: false,
      aiPowered: true,
    },
    {
      value: "sentence",
      label: "Form a Sentence",
      description: "Create sentences using vocabulary words",
      icon: "💬",
      disabled: false,
      aiPowered: true,
    },
  ];

  const handleStartPractice = () => {
    console.log("Starting practice with method:", selectedMethod);
    playSound("button-pressed.wav");
    setIsStarted(true);
  };

  const handleBackToSelection = () => {
    playSound("button-pressed.wav");
    setIsStarted(false);
    setSelectedMethod("");
  };

  // Render practice component based on selected method
  const renderPracticeComponent = () => {
    switch (selectedMethod) {
      case "definition-quiz":
        return (
          <VocabsQuizPractice
            onBackToPracticeSelection={handleBackToSelection}
          />
        );
      case "vocab-quiz":
        return (
          <VocabsVocabQuizPractice
            onBackToPracticeSelection={handleBackToSelection}
          />
        );
      case "define":
        return (
          <VocabsDefinePractice
            onBackToPracticeSelection={handleBackToSelection}
          />
        );
      case "fill-blank":
        return (
          <VocabsFillinTheBlankPractice
            onBackToPracticeSelection={handleBackToSelection}
          />
        );
      case "sentence":
        return (
          <VocabsFormaSentencePractice
            onBackToPracticeSelection={handleBackToSelection}
          />
        );
      case "vocabs-match":
        return (
          <VocabsMatchPractice
            onBackToPracticeSelection={handleBackToSelection}
          />
        );

      default:
        return null;
    }
  };

  // If no vocabularies have been learned, show empty state
  if (vocabsData.learntVocabs.length == 0) {
    return (
      <div className="w-full flex flex-col min-h-[85vh] py-20 items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Empty state illustration */}
            <div className="text-8xl mb-6">📚</div>

            {/* Empty state content */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900">
                No Vocabularies to Practice
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                You haven't learned any vocabularies yet! Start by learning new
                vocabularies through flashcards. You have to learn at least 5
                words to unlock practice features.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <Link href={"/dashboard/vocabs/learn"}>
                <Button
                  variant="default"
                  className="group hover:cursor-pointer text-lg px-8 py-6 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold shadow-[0_4px_0_0_theme(colors.blue.600),0_8px_20px_theme(colors.blue.500/0.25)] hover:shadow-[0_6px_0_0_theme(colors.blue.700),0_10px_25px_theme(colors.blue.500/0.3)] active:shadow-[0_2px_0_0_theme(colors.blue.600),0_4px_10px_theme(colors.blue.500/0.2)] active:translate-y-0.5 transform transition-all duration-150"
                >
                  Learn
                  <div className="text-white size-5 ml-2">
                    <ArrowRight className="size-5" />
                  </div>
                </Button>
              </Link>
              <Link href={"/dashboard/vocabs/"}>
                <Button
                  variant="outline"
                  className="text-lg px-8 py-6 rounded-2xl font-bold shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.25)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.3)] hover:bg-gray-50 active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.2)] active:translate-y-0.5 transform transition-all duration-150 dark:shadow-[0_4px_0_0_theme(colors.gray.600),0_8px_20px_theme(colors.gray.700/0.25)] dark:hover:shadow-[0_6px_0_0_theme(colors.gray.500),0_10px_25px_theme(colors.gray.700/0.3)] dark:hover:bg-gray-800"
                >
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            {/* Helpful tip */}
            <div className="mt-12 p-6 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="text-2xl">💡</div>
                <div className="text-left">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Getting Started Tip
                  </h3>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Visit the vocabulary browser to discover SAT words, learn
                    their meanings, and add them to your practice list. Once
                    you've learned some vocabularies, you can return here to
                    practice with different methods!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (vocabsData.learntVocabs.length < 5) {
    return (
      <div className="w-full flex flex-col min-h-[85vh] py-20 items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Empty state illustration */}
            <div className="text-8xl mb-6">📚</div>

            {/* Empty state content */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900">
                You should learn atleast 5 words to start practicing
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Learn more vocabularies through flashcards to unlock practice
                features and enhance your learning experience.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <Link href={"/dashboard/vocabs/learn"}>
                <Button
                  variant="default"
                  className="group hover:cursor-pointer text-lg px-8 py-6 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold shadow-[0_4px_0_0_theme(colors.blue.600),0_8px_20px_theme(colors.blue.500/0.25)] hover:shadow-[0_6px_0_0_theme(colors.blue.700),0_10px_25px_theme(colors.blue.500/0.3)] active:shadow-[0_2px_0_0_theme(colors.blue.600),0_4px_10px_theme(colors.blue.500/0.2)] active:translate-y-0.5 transform transition-all duration-150"
                >
                  Learn
                  <div className="text-white size-5 ml-2">
                    <ArrowRight className="size-5" />
                  </div>
                </Button>
              </Link>
              <Link href={"/dashboard/vocabs/"}>
                <Button
                  variant="outline"
                  className="text-lg px-8 py-6 rounded-2xl font-bold shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.25)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.3)] hover:bg-gray-50 active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.2)] active:translate-y-0.5 transform transition-all duration-150 dark:shadow-[0_4px_0_0_theme(colors.gray.600),0_8px_20px_theme(colors.gray.700/0.25)] dark:hover:shadow-[0_6px_0_0_theme(colors.gray.500),0_10px_25px_theme(colors.gray.700/0.3)] dark:hover:bg-gray-800"
                >
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            {/* Helpful tip */}
            <div className="mt-12 p-6 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="text-2xl">💡</div>
                <div className="text-left">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Getting Started Tip
                  </h3>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Visit the vocabulary browser to discover SAT words, learn
                    their meanings, and add them to your practice list. Once
                    you've learned some vocabularies, you can return here to
                    practice with different methods!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // If practice has started, render the selected practice component
  if (isStarted && selectedMethod) {
    return (
      <div className="w-full">
        {/* Back button */}
        <div className="flex justify-start mb-4">
          <Button
            variant="outline"
            className="text-lg px-6 py-3 rounded-2xl font-bold shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.25)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.3)] hover:bg-gray-50 active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.2)] active:translate-y-0.5 transform transition-all duration-150 dark:shadow-[0_4px_0_0_theme(colors.gray.600),0_8px_20px_theme(colors.gray.700/0.25)] dark:hover:shadow-[0_6px_0_0_theme(colors.gray.500),0_10px_25px_theme(colors.gray.700/0.3)] dark:hover:bg-gray-800"
            onClick={() => {
              playSound("button-pressed.wav");
              handleBackToSelection();
            }}
          >
            ← Back to SAT Vocab Practice
          </Button>
        </div>
        {/* the selected practice component */}
        {renderPracticeComponent()}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-[85vh] py-20 items-center justify-center">
      <div className="space-y-4 max-w-4xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={cardVariants}>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-black mb-4">
                SAT Vocabulary Practice
              </h1>
              <p className="text-xl text-gray-600">
                Choose your preferred practice method
              </p>
            </div>

            <RadioGroup
              className="w-full grid grid-cols-1 md:grid-cols-2 gap-8"
              value={selectedMethod}
              onValueChange={(value) => {
                playSound("tap-radio.wav");
                setSelectedMethod(value);
              }}
            >
              {practiceMethodsS.map((method) => (
                <label
                  key={method.value}
                  className="w-full px-6 py-8 relative flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-input text-center shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.15)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.2)] outline-offset-2 transition-all duration-150 has-[[data-disabled]]:cursor-not-allowed has-[[data-state=checked]]:border-blue-500 has-[[data-state=checked]]:bg-blue-50 has-[[data-state=checked]]:shadow-[0_4px_0_0_theme(colors.blue.500),0_8px_20px_theme(colors.blue.500/0.25)] has-[[data-disabled]]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70 active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.15)] active:translate-y-0.5 has-[[data-state=checked]]:active:shadow-[0_2px_0_0_theme(colors.blue.500),0_4px_10px_theme(colors.blue.500/0.2)]"
                  onMouseEnter={() => playSound("on-hover.wav")}
                  onClick={() => playSound("tap-radio.wav")}
                >
                  <RadioGroupItem
                    id={method.value}
                    value={method.value}
                    className="sr-only after:absolute after:inset-0"
                    disabled={method.disabled}
                  />
                  {method.aiPowered && (
                    <div className="absolute top-3 right-3 bg-blue-500  text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      ✨ AI Powered
                    </div>
                  )}
                  <div className="text-6xl mb-3">{method.icon}</div>
                  <p className="text-2xl font-bold leading-none text-foreground">
                    {method.label}
                  </p>
                  <p className="text-base text-gray-600 px-3">
                    {method.description}
                  </p>
                </label>
              ))}
            </RadioGroup>
          </motion.div>

          {selectedMethod && (
            <motion.div
              variants={cardVariants}
              className="mt-12 sticky bottom-6 shadow-accent shadow-xl"
            >
              <Button
                variant="default"
                className="group hover:cursor-pointer w-full text-xl py-8 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold shadow-[0_4px_0_0_theme(colors.blue.600),0_8px_20px_theme(colors.blue.500/0.25)] hover:shadow-[0_6px_0_0_theme(colors.blue.700),0_10px_25px_theme(colors.blue.500/0.3)] active:shadow-[0_2px_0_0_theme(colors.blue.600),0_4px_10px_theme(colors.blue.500/0.2)] active:translate-y-0.5 transform transition-all duration-150"
                onClick={handleStartPractice}
              >
                Start{" "}
                {
                  practiceMethodsS.find((m) => m.value === selectedMethod)
                    ?.label
                }{" "}
                Practice
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
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
