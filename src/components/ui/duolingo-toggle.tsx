"use client";

import React from "react";
import { playSound } from "@/lib/playSound";

interface DuolingoToggleProps {
  isEnabled: boolean;
  onToggle: (value: boolean) => void;
  title: string;
  description: string;
  enabledDescription: string;
  disabledDescription: string;
  color?: "blue" | "green" | "purple" | "orange";
  enabledIcon?: React.ReactNode;
  disabledIcon?: React.ReactNode;
}

export function DuolingoToggle({
  isEnabled,
  onToggle,
  title,
  description,
  enabledDescription,
  disabledDescription,
  color = "blue",
  enabledIcon,
  disabledIcon,
}: DuolingoToggleProps) {
  const colorClasses = {
    blue: {
      enabled:
        "border-blue-500 bg-blue-50 shadow-[0_4px_0_0_theme(colors.blue.500),0_8px_20px_theme(colors.blue.500/0.25)]",
      disabled:
        "border-gray-300 bg-white shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.15)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.2)]",
      toggle: "bg-blue-500",
      icon: "bg-blue-500 text-white",
    },
    green: {
      enabled:
        "border-green-500 bg-green-50 shadow-[0_4px_0_0_theme(colors.green.500),0_8px_20px_theme(colors.green.500/0.25)]",
      disabled:
        "border-gray-300 bg-white shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.15)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.2)]",
      toggle: "bg-green-500",
      icon: "bg-green-500 text-white",
    },
    purple: {
      enabled:
        "border-purple-500 bg-purple-50 shadow-[0_4px_0_0_theme(colors.purple.500),0_8px_20px_theme(colors.purple.500/0.25)]",
      disabled:
        "border-gray-300 bg-white shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.15)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.2)]",
      toggle: "bg-purple-500",
      icon: "bg-purple-500 text-white",
    },
    orange: {
      enabled:
        "border-orange-500 bg-orange-50 shadow-[0_4px_0_0_theme(colors.orange.500),0_8px_20px_theme(colors.orange.500/0.25)]",
      disabled:
        "border-gray-300 bg-white shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.15)] hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.2)]",
      toggle: "bg-orange-500",
      icon: "bg-orange-500 text-white",
    },
  };

  const currentColors = colorClasses[color];

  const handleToggle = () => {
    const newValue = !isEnabled;
    if (newValue) {
      playSound("tap-checkbox-checked.wav");
    } else {
      playSound("tap-checkbox-unchecked.wav");
    }
    onToggle(newValue);
  };

  const defaultEnabledIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );

  const defaultDisabledIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className="flex justify-center">
      <div
        className={`relative flex items-center gap-4 rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
          isEnabled ? currentColors.enabled : currentColors.disabled
        } active:shadow-[0_2px_0_0_theme(colors.gray.300),0_4px_10px_theme(colors.gray.300/0.15)] active:translate-y-0.5`}
        onClick={handleToggle}
      >
        {/* Duolingo-style toggle switch */}
        <div
          className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
            isEnabled ? currentColors.toggle : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 transform shadow-sm ${
              isEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </div>

        <div className="flex flex-col">
          <span className="text-lg font-semibold text-gray-900">{title}</span>
          <span className="text-sm text-gray-600">
            {isEnabled ? enabledDescription : disabledDescription}
          </span>
        </div>

        {/* Duolingo-style icon */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            isEnabled ? currentColors.icon : "bg-gray-200 text-gray-500"
          }`}
        >
          {isEnabled
            ? enabledIcon || defaultEnabledIcon
            : disabledIcon || defaultDisabledIcon}
        </div>
      </div>
    </div>
  );
}
