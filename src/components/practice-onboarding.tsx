"use client";

import React, { useId, useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { domains } from "@/static-data/domains";
import { PracticeSelections } from "@/types/session";
import { QuestionDifficulty } from "@/types/question";
import { playSound } from "@/lib/playSound";

interface PracticeOnboardingProps {
  onComplete: (selections: PracticeSelections) => void;
}

export default function PracticeOnboarding({
  onComplete,
}: PracticeOnboardingProps) {
  const id = useId();
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [step, setStep] = useState<number>(1);
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<
    QuestionDifficulty[]
  >([]);
  const [randomize, setRandomize] = useState<boolean>(true);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const items = [
    {
      value: "rush",
      label: "Practice Rush",
      description:
        "Practice with endless problems from Collegeboard's question bank!",
    },
    {
      value: "full-length",
      label: "Full Length Practice",
      description:
        "Take a full length practice with problems from Collegeboard's question bank.",
      disabled: true,
    },
  ];

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
      description: "Practice SAT Math problems",
    },
    {
      value: "reading-writing",
      label: "Reading & Writing",
      description: "Practice SAT Reading and Writing problems",
    },
  ];

  const handleContinue = () => {
    playSound("navigation_forward-selection-minimal.wav");

    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else {
      // Handle final submission - map selected skill IDs to full skill objects
      const selectedSkillObjects = getSubjectDomains()
        .flatMap((domain) => domain.skill || [])
        .filter((skill) => selectedSkills.includes(skill.id))
        .map((skill) => ({
          id: skill.id,
          text: skill.text,
          skill_cd: skill.skill_cd,
        }));

      // Map selected domain IDs to full domain objects
      const selectedDomainObjects = getSubjectDomains()
        .filter((domain) => selectedDomains.includes(domain.id))
        .map((domain) => ({
          id: domain.id,
          text: domain.text,
          primaryClassCd: domain.primaryClassCd,
        }));

      onComplete({
        practiceType: selectedValue,
        assessment: selectedAssessment,
        subject: selectedSubject,
        domains: selectedDomainObjects,
        skills: selectedSkillObjects,
        difficulties: selectedDifficulties,
        randomize: randomize,
      });
    }
  };

  const handleBack = () => {
    playSound("navigation_backward-selection-minimal.wav");

    if (step === 4) {
      setStep(3);
      setSelectedDomains([]);
      setSelectedSkills([]);
      setSelectedDifficulties([]);
    } else if (step === 3) {
      setStep(2);
      setSelectedSubject("");
    } else if (step === 2) {
      setStep(1);
      setSelectedAssessment("");
    }
  };

  const toggleDomain = (domainId: string) => {
    setSelectedDomains((prev) => {
      const isCurrentlySelected = prev.includes(domainId);

      if (isCurrentlySelected) {
        playSound("tap-checkbox-unchecked.wav");
        // If deselecting domain, remove all its skills from selected skills
        const domain = getSubjectDomains().find((d) => d.id === domainId);
        const domainSkillIds = domain?.skill?.map((skill) => skill.id) || [];
        setSelectedSkills((prevSkills) =>
          prevSkills.filter((skillId) => !domainSkillIds.includes(skillId))
        );
        return prev.filter((id) => id !== domainId);
      } else {
        playSound("tap-checkbox-checked.wav");
        // If selecting domain, add all its skills to selected skills
        const domain = getSubjectDomains().find((d) => d.id === domainId);
        const domainSkillIds = domain?.skill?.map((skill) => skill.id) || [];
        setSelectedSkills((prevSkills) => [...prevSkills, ...domainSkillIds]);
        return [...prev, domainId];
      }
    });
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) => {
      const isCurrentlySelected = prev.includes(skillId);
      if (isCurrentlySelected) {
        playSound("tap-checkbox-unchecked.wav");
        return prev.filter((id) => id !== skillId);
      } else {
        playSound("tap-checkbox-checked.wav");
        return [...prev, skillId];
      }
    });
  };

  const selectAllSkills = () => {
    // Get all skill IDs from all domains (not just selected ones)
    const allSkillIds = getSubjectDomains()
      .flatMap((domain) => domain.skill || [])
      .map((skill) => skill.id);

    // Also select all domains that have skills
    const domainsWithSkills = getSubjectDomains()
      .filter((domain) => domain.skill && domain.skill.length > 0)
      .map((domain) => domain.id);

    setSelectedDomains(domainsWithSkills);
    setSelectedSkills(allSkillIds);
  };

  const clearAllSkills = () => {
    setSelectedSkills([]);
  };

  const getSubjectDomains = () => {
    if (selectedSubject === "math") {
      return domains.Math;
    } else if (selectedSubject === "reading-writing") {
      return domains["R&W"];
    }
    return [];
  };

  const hasSkillsFromSelectedDomains = () => {
    return selectedDomains.some((domainId) => {
      const domain = getSubjectDomains().find((d) => d.id === domainId);
      const domainSkillIds = domain?.skill?.map((skill) => skill.id) || [];
      return domainSkillIds.some((skillId) => selectedSkills.includes(skillId));
    });
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

  return (
    <div className="w-full flex flex-col min-h-[85vh] py-60 items-center justify-center">
      <motion.h1
        className="text-4xl font-bold"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        key={step} // This ensures re-animation when step changes
      >
        {step === 1
          ? "Choose Your Practice Method"
          : step === 2
          ? "Choose Assessment"
          : step === 3
          ? "Choose Subject"
          : "Choose Domains, Skills & Difficulty"}
      </motion.h1>

      <AnimatePresence mode="wait">
        <motion.fieldset
          key={step}
          className="space-y-4 max-w-3xl mx-auto mt-8 "
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 ? (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={cardVariants}>
                <RadioGroup
                  className="w-full grid grid-cols-2 gap-8 "
                  value={selectedValue}
                  onValueChange={(value) => {
                    playSound("tap-radio.wav");
                    setSelectedValue(value);
                  }}
                >
                  {items.map((item) => (
                    <label
                      key={`${id}-${item.value}`}
                      className="w-full px-4 py-6 relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-input text-center shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.15)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.2)] outline-offset-2 transition-all duration-150 has-[[data-disabled]]:cursor-not-allowed has-[[data-state=checked]]:border-blue-500 has-[[data-state=checked]]:bg-blue-50 has-[[data-state=checked]]:shadow-[0_4px_0_0_theme(colors.blue.500),0_8px_20px_theme(colors.blue.500/0.25)] has-[[data-disabled]]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70 active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.15)] active:translate-y-0.5 has-[[data-state=checked]]:active:shadow-[0_2px_0_0_theme(colors.blue.500),0_4px_10px_theme(colors.blue.500/0.2)]"
                    >
                      <RadioGroupItem
                        id={`${id}-${item.value}`}
                        value={item.value}
                        className="sr-only after:absolute after:inset-0"
                        disabled={item.disabled}
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
              {selectedValue && (
                <motion.div variants={cardVariants}>
                  <Button
                    variant="default"
                    className="group hover:cursor-pointer w-full text-lg py-6 mt-10 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold shadow-[0_4px_0_0_theme(colors.blue.600),0_8px_20px_theme(colors.blue.500/0.25)] hover:shadow-[0_6px_0_0_theme(colors.blue.700),0_10px_25px_theme(colors.blue.500/0.3)] active:shadow-[0_2px_0_0_theme(colors.blue.600),0_4px_10px_theme(colors.blue.500/0.2)] active:translate-y-0.5 transform transition-all duration-150"
                    onClick={handleContinue}
                  >
                    Continue
                    <div className=" text-white   size-6 overflow-hidden rounded-full duration-500">
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
          ) : step === 2 ? (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={cardVariants}>
                <RadioGroup
                  className="w-full grid grid-cols-3 gap-6"
                  value={selectedAssessment}
                  onValueChange={(value) => {
                    playSound("tap-radio.wav");
                    setSelectedAssessment(value);
                  }}
                >
                  {assessmentItems.map((item) => (
                    <label
                      key={`${id}-assessment-${item.value}`}
                      className="w-full px-4 py-6 relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-input text-center shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.15)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.2)] outline-offset-2 transition-all duration-150 has-[[data-disabled]]:cursor-not-allowed has-[[data-state=checked]]:border-blue-500 has-[[data-state=checked]]:bg-blue-50 has-[[data-state=checked]]:shadow-[0_4px_0_0_theme(colors.blue.500),0_8px_20px_theme(colors.blue.500/0.25)] has-[[data-disabled]]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70 active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.15)] active:translate-y-0.5 has-[[data-state=checked]]:active:shadow-[0_2px_0_0_theme(colors.blue.500),0_4px_10px_theme(colors.blue.500/0.2)]"
                    >
                      <RadioGroupItem
                        id={`${id}-assessment-${item.value}`}
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
                  disabled={!selectedAssessment}
                >
                  Choose Subject
                  <div className=" text-white   size-6 overflow-hidden rounded-full duration-500">
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
                <Button
                  variant="outline"
                  className="text-lg w-full py-6 rounded-2xl font-bold shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.25)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.3)] hover:bg-gray-50 active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.2)] active:translate-y-0.5 transform transition-all duration-150 dark:shadow-[0_4px_0_0_theme(colors.gray.600),0_8px_20px_theme(colors.gray.700/0.25)] dark:hover:shadow-[0_6px_0_0_theme(colors.gray.500),0_10px_25px_theme(colors.gray.700/0.3)] dark:hover:bg-gray-800 cursor-pointer"
                  onClick={handleBack}
                >
                  Back
                </Button>
              </motion.div>
            </motion.div>
          ) : step === 3 ? (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={cardVariants}>
                <RadioGroup
                  className="w-full grid grid-cols-2 gap-8 "
                  value={selectedSubject}
                  onValueChange={(value) => {
                    playSound("tap-radio.wav");
                    setSelectedSubject(value);
                  }}
                >
                  {subjectItems.map((item) => (
                    <label
                      key={`${id}-subject-${item.value}`}
                      className="w-full px-4 py-6 relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-input text-center shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.15)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.2)] outline-offset-2 transition-all duration-150 has-[[data-disabled]]:cursor-not-allowed has-[[data-state=checked]]:border-blue-500 has-[[data-state=checked]]:bg-blue-50 has-[[data-state=checked]]:shadow-[0_4px_0_0_theme(colors.blue.500),0_8px_20px_theme(colors.blue.500/0.25)] has-[[data-disabled]]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70 active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.15)] active:translate-y-0.5 has-[[data-state=checked]]:active:shadow-[0_2px_0_0_theme(colors.blue.500),0_4px_10px_theme(colors.blue.500/0.2)]"
                    >
                      <RadioGroupItem
                        id={`${id}-subject-${item.value}`}
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
                  disabled={!selectedSubject}
                >
                  Choose Domains, Skills & Difficulty
                  <div className=" text-white   size-6 overflow-hidden rounded-full duration-500">
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
                <Button
                  variant="outline"
                  className="text-lg w-full py-6 rounded-2xl font-bold shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.25)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.3)] hover:bg-gray-50 active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.2)] active:translate-y-0.5 transform transition-all duration-150 dark:shadow-[0_4px_0_0_theme(colors.gray.600),0_8px_20px_theme(colors.gray.700/0.25)] dark:hover:shadow-[0_6px_0_0_theme(colors.gray.500),0_10px_25px_theme(colors.gray.700/0.3)] dark:hover:bg-gray-800 cursor-pointer"
                  onClick={handleBack}
                >
                  Back
                </Button>
              </motion.div>
            </motion.div>
          ) : step === 4 ? (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={cardVariants}>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-gray-600 mb-4">
                      Select domains and then choose specific skills within each
                      domain. You must select at least one skill to continue.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={selectAllSkills}
                        className="px-4 py-2 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold shadow-[0_3px_0_0_theme(colors.blue.600),0_6px_15px_theme(colors.blue.500/0.25)] hover:shadow-[0_4px_0_0_theme(colors.blue.700),0_8px_20px_theme(colors.blue.500/0.3)] active:shadow-[0_1px_0_0_theme(colors.blue.600),0_3px_8px_theme(colors.blue.500/0.2)] active:translate-y-0.5 transform transition-all duration-150 cursor-pointer"
                      >
                        Select All Skills
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllSkills}
                        className="px-4 py-2 rounded-2xl font-bold shadow-[0_3px_0_0_theme(colors.gray.300),0_6px_15px_theme(colors.gray.300/0.25)] hover:shadow-[0_4px_0_0_theme(colors.gray.400),0_8px_20px_theme(colors.gray.300/0.3)] hover:bg-gray-50 active:shadow-[0_1px_0_0_theme(colors.gray.300),0_3px_8px_theme(colors.gray.300/0.2)] active:translate-y-0.5 transform transition-all duration-150 dark:shadow-[0_3px_0_0_theme(colors.gray.600),0_6px_15px_theme(colors.gray.700/0.25)] dark:hover:shadow-[0_4px_0_0_theme(colors.gray.500),0_8px_20px_theme(colors.gray.700/0.3)] dark:hover:bg-gray-800 cursor-pointer"
                      >
                        Clear All Skills
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {getSubjectDomains().map((domain) => (
                      <div
                        key={`${id}-${domain.id}`}
                        className={`cursor-pointer relative p-6 rounded-2xl border-2 transition-all duration-200 ${
                          selectedDomains.includes(domain.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white"
                        }`}
                        onClick={() => toggleDomain(domain.id)}
                      >
                        {/* Domain Header */}
                        <div>
                          {/* Checkmark indicator */}
                          <div className="absolute top-4 right-4">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                selectedDomains.includes(domain.id)
                                  ? "bg-blue-500"
                                  : "border-2 border-gray-300 bg-white"
                              }`}
                            >
                              {selectedDomains.includes(domain.id) && (
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                          </div>

                          {/* Icon */}
                          <div className="mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-2xl">
                                {domain.primaryClassCd === "H"
                                  ? "📊"
                                  : domain.primaryClassCd === "P"
                                  ? "🧮"
                                  : domain.primaryClassCd === "Q"
                                  ? "📈"
                                  : domain.primaryClassCd === "S"
                                  ? "📐"
                                  : domain.primaryClassCd === "INI"
                                  ? "💡"
                                  : domain.primaryClassCd === "CAS"
                                  ? "🏗️"
                                  : domain.primaryClassCd === "EOI"
                                  ? "✍️"
                                  : domain.primaryClassCd === "SEC"
                                  ? "📝"
                                  : "📚"}
                              </span>
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-semibold mb-3 text-gray-900">
                            {domain.text}
                          </h3>
                        </div>

                        {/* Skills Section - Only show when domain is selected */}
                        {selectedDomains.includes(domain.id) && (
                          <div
                            className="mt-4 pt-4 border-t border-gray-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              Select Skills:
                            </h4>
                            <div className="space-y-2">
                              {domain.skill?.map((skill) => (
                                <div
                                  key={skill.id}
                                  className={`p-3 rounded-lg relative border cursor-pointer transition-all duration-200 ${
                                    selectedSkills.includes(skill.id)
                                      ? "border-blue-400 bg-blue-100"
                                      : "border-gray-200 hover:border-blue-300 bg-white"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSkill(skill.id);
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">
                                        {skill.text}
                                      </p>
                                    </div>
                                    <div
                                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                        selectedSkills.includes(skill.id)
                                          ? "bg-blue-500 border-blue-500"
                                          : "border-gray-300"
                                      }`}
                                    >
                                      {selectedSkills.includes(skill.id) && (
                                        <svg
                                          className="w-3 h-3 text-white"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )) || []}
                            </div>
                          </div>
                        )}

                        {/* Skills preview when domain not selected */}
                        {!selectedDomains.includes(domain.id) && (
                          <div className="space-y-1">
                            {domain.skill?.slice(0, 3).map((skill, index) => (
                              <div
                                key={index}
                                className="flex items-center text-sm text-gray-600"
                              >
                                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                                {skill.text}
                              </div>
                            ))}
                            {(domain.skill?.length || 0) > 3 && (
                              <div className="text-sm text-gray-500 mt-2">
                                +{(domain.skill?.length || 0) - 3} more skills
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Difficulty Selection Section */}
                  <div className="space-y-4">
                    {selectedDomains.length > 0 &&
                      !hasSkillsFromSelectedDomains() && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                          <p className="text-amber-800 text-sm font-medium">
                            Please select at least one skill from your chosen
                            domains before proceeding.
                          </p>
                        </div>
                      )}
                    <h2 className="text-xl font-semibold text-gray-900 text-center">
                      Select Difficulty Levels
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(
                        [
                          { value: "E" as QuestionDifficulty, label: "Easy" },
                          { value: "M" as QuestionDifficulty, label: "Medium" },
                          { value: "H" as QuestionDifficulty, label: "Hard" },
                        ] as const
                      ).map((difficulty) => (
                        <div
                          key={`${id}-difficulty-${difficulty.value}`}
                          className={`relative flex flex-col items-start gap-4 rounded-2xl border-2 p-4 cursor-pointer transition-all duration-150 ${
                            selectedDifficulties.includes(difficulty.value)
                              ? "border-blue-500 bg-blue-50 shadow-[0_4px_0_0_theme(colors.blue.500),0_8px_20px_theme(colors.blue.500/0.25)]"
                              : "border-gray-300 bg-white shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.15)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.2)]"
                          } active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.15)] active:translate-y-0.5 has-[[data-state=checked]]:active:shadow-[0_2px_0_0_theme(colors.blue.500),0_4px_10px_theme(colors.blue.500/0.2)]`}
                          onClick={() => {
                            const isChecked = selectedDifficulties.includes(
                              difficulty.value
                            );
                            if (isChecked) {
                              playSound("tap-checkbox-unchecked.wav");
                              setSelectedDifficulties((prev) =>
                                prev.filter((d) => d !== difficulty.value)
                              );
                            } else {
                              playSound("tap-checkbox-checked.wav");
                              setSelectedDifficulties((prev) => [
                                ...prev,
                                difficulty.value,
                              ]);
                            }
                          }}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-150 ${
                                selectedDifficulties.includes(difficulty.value)
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {selectedDifficulties.includes(
                                difficulty.value
                              ) && (
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <span className="text-lg font-semibold cursor-pointer flex-1">
                              {difficulty.label}
                            </span>
                          </div>
                          {/* Hidden checkbox for accessibility */}
                          <Checkbox
                            id={`${id}-difficulty-${difficulty.value}`}
                            checked={selectedDifficulties.includes(
                              difficulty.value
                            )}
                            onChange={() => {}} // Prevent default behavior
                            className="sr-only"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Question Order Selection */}
                  <div className="space-y-4 mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 text-center">
                      Question Order
                    </h2>
                    <div className="flex justify-center">
                      <div
                        className={`relative flex items-center gap-4 rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          randomize
                            ? "border-blue-500 bg-blue-50 shadow-[0_4px_0_0_theme(colors.blue.500),0_8px_20px_theme(colors.blue.500/0.25)]"
                            : "border-gray-300 bg-white shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.15)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.2)]"
                        } active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.15)] active:translate-y-0.5`}
                        onClick={() => {
                          const newValue = !randomize;
                          if (newValue) {
                            playSound("tap-checkbox-checked.wav");
                          } else {
                            playSound("tap-checkbox-unchecked.wav");
                          }
                          setRandomize(newValue);
                        }}
                      >
                        {/* Duolingo-style toggle switch */}
                        <div
                          className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                            randomize ? "bg-blue-500" : "bg-gray-300"
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 transform shadow-sm ${
                              randomize ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </div>

                        <div className="flex flex-col">
                          <span className="text-lg font-semibold text-gray-900">
                            Randomize Questions
                          </span>
                          <span className="text-sm text-gray-600">
                            {randomize
                              ? "Questions will appear in random order"
                              : "Questions will appear in their original order"}
                          </span>
                        </div>

                        {/* Duolingo-style icon */}
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                            randomize
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {randomize ? (
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                variants={cardVariants}
                className="grid grid-cols-1 w-full gap-4 mt-10"
              >
                <Button
                  variant="default"
                  className="group w-full hover:cursor-pointer text-lg py-6 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold shadow-[0_4px_0_0_theme(colors.blue.600),0_8px_20px_theme(colors.blue.500/0.25)] hover:shadow-[0_6px_0_0_theme(colors.blue.700),0_10px_25px_theme(colors.blue.500/0.3)] active:shadow-[0_2px_0_0_theme(colors.blue.600),0_4px_10px_theme(colors.blue.500/0.2)] active:translate-y-0.5 transform transition-all duration-150 cursor-pointer"
                  onClick={handleContinue}
                  disabled={
                    selectedDomains.length === 0 ||
                    selectedDifficulties.length === 0 ||
                    !hasSkillsFromSelectedDomains()
                  }
                >
                  Start Practice
                  <div className=" text-white   size-6 overflow-hidden rounded-full duration-500">
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
                <Button
                  variant="outline"
                  className="text-lg w-full py-6 rounded-2xl font-bold shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.25)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.3)] hover:bg-gray-50 active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.2)] active:translate-y-0.5 transform transition-all duration-150 dark:shadow-[0_4px_0_0_theme(colors.gray.600),0_8px_20px_theme(colors.gray.700/0.25)] dark:hover:shadow-[0_6px_0_0_theme(colors.gray.500),0_10px_25px_theme(colors.gray.700/0.3)] dark:hover:bg-gray-800 cursor-pointer"
                  onClick={handleBack}
                >
                  Back
                </Button>
              </motion.div>
            </motion.div>
          ) : // Step 3 handled above
          null}
        </motion.fieldset>
      </AnimatePresence>
    </div>
  );
}
