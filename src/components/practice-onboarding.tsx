"use client";

import React, { useId, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { domains } from "@/static-data/domains";

interface PracticeOnboardingProps {
  onComplete: (selections: {
    practiceType: string;
    assessment: string;
    subject: string;
    domains: Array<{
      id: string;
      text: string;
      primaryClassCd: string;
    }>;
    skills: Array<{
      id: string;
      text: string;
      skill_cd: string;
    }>;
    difficulties: string[];
  }) => void;
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
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    []
  );

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
      });
    }
  };

  const handleBack = () => {
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
        // If deselecting domain, remove all its skills from selected skills
        const domain = getSubjectDomains().find((d) => d.id === domainId);
        const domainSkillIds = domain?.skill?.map((skill) => skill.id) || [];
        setSelectedSkills((prevSkills) =>
          prevSkills.filter((skillId) => !domainSkillIds.includes(skillId))
        );
        return prev.filter((id) => id !== domainId);
      } else {
        // If selecting domain, add all its skills to selected skills
        const domain = getSubjectDomains().find((d) => d.id === domainId);
        const domainSkillIds = domain?.skill?.map((skill) => skill.id) || [];
        setSelectedSkills((prevSkills) => [...prevSkills, ...domainSkillIds]);
        return [...prev, domainId];
      }
    });
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  const selectAllSkills = () => {
    const allSkillIds = getSubjectDomains()
      .filter((domain) => selectedDomains.includes(domain.id))
      .flatMap((domain) => domain.skill || [])
      .map((skill) => skill.id);
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
    <div className="w-full flex flex-col min-h-screen py-60 items-center justify-center">
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
          className="space-y-4 max-w-3xl mx-auto mt-14"
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
                  onValueChange={setSelectedValue}
                >
                  {items.map((item) => (
                    <label
                      key={`${id}-${item.value}`}
                      className="w-full px-4 py-6 relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-disabled]]:cursor-not-allowed  has-[[data-state=checked]]:border-blue-500/50 has-[[data-state=checked]]:bg-blue-500/10 has-[[data-disabled]]:opacity-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70"
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
                    className="group hover:cursor-pointer w-full text-lg py-6 mt-10"
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
                  onValueChange={setSelectedAssessment}
                >
                  {assessmentItems.map((item) => (
                    <label
                      key={`${id}-assessment-${item.value}`}
                      className="w-full px-4 py-6 relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-disabled]]:cursor-not-allowed  has-[[data-state=checked]]:border-blue-500/50 has-[[data-state=checked]]:bg-blue-500/10 has-[[data-disabled]]:opacity-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70"
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
                  className="group w-full hover:cursor-pointer  text-lg py-6"
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
                  className=" text-lg w-full py-6"
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
                  onValueChange={setSelectedSubject}
                >
                  {subjectItems.map((item) => (
                    <label
                      key={`${id}-subject-${item.value}`}
                      className="w-full px-4 py-6 relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-disabled]]:cursor-not-allowed  has-[[data-state=checked]]:border-blue-500/50 has-[[data-state=checked]]:bg-blue-500/10 has-[[data-disabled]]:opacity-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70"
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
                  className="group w-full hover:cursor-pointer  text-lg py-6"
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
                  className=" text-lg w-full py-6"
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
                        className="px-4 py-2"
                      >
                        Select All Skills
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllSkills}
                        className="px-4 py-2"
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
                      {[
                        { value: "Easy", label: "Easy" },
                        { value: "Medium", label: "Medium" },
                        { value: "Hard", label: "Hard" },
                      ].map((difficulty) => (
                        <div
                          key={`${id}-difficulty-${difficulty.value}`}
                          className="relative flex flex-col items-start gap-4 rounded-lg border border-input p-3 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring"
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`${id}-difficulty-${difficulty.value}`}
                              checked={selectedDifficulties.includes(
                                difficulty.value
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDifficulties((prev) => [
                                    ...prev,
                                    difficulty.value,
                                  ]);
                                } else {
                                  setSelectedDifficulties((prev) =>
                                    prev.filter((d) => d !== difficulty.value)
                                  );
                                }
                              }}
                              className="after:absolute after:inset-0"
                            />
                            <Label
                              htmlFor={`${id}-difficulty-${difficulty.value}`}
                            >
                              {difficulty.label}
                            </Label>
                          </div>
                        </div>
                      ))}
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
                  className="group w-full hover:cursor-pointer text-lg py-6"
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
                  className=" text-lg w-full py-6"
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
