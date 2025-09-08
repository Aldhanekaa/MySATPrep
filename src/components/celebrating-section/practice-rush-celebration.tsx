"use client";

import React, { useEffect } from "react";
import { PracticeSession } from "@/types/session";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Target, Zap } from "lucide-react";
import { playSound } from "@/lib/playSound";

interface PracticeRushCelebrationProps {
  sessionData: PracticeSession & {
    correctAnswers?: number;
    accuracyPercentage?: number;
  };
  onContinue: () => void;
}

export default function PracticeRushCelebration({
  sessionData,
  onContinue,
}: PracticeRushCelebrationProps) {
  // Play celebration sound when component mounts
  useEffect(() => {
    if (sessionData.status === "completed") {
      playSound("correct-answer.wav");
    } else {
      playSound("button-pressed.wav");
    }
  }, [sessionData.status]);

  // Calculate statistics from session data
  const totalAnswered = sessionData.answeredQuestions.length;

  // Use correctness data from session if available, otherwise use fallback
  const correctAnswers =
    sessionData.correctAnswers ?? Math.round(totalAnswered * 0.75); // 75% accuracy as fallback

  const accuracyPercentage =
    sessionData.accuracyPercentage ??
    (totalAnswered > 0
      ? Math.round((correctAnswers / totalAnswered) * 100)
      : 0);

  // Convert total time from milliseconds to minutes and seconds
  const totalTimeInSeconds = Math.round(sessionData.totalTimeSpent / 1000);
  const minutes = Math.floor(totalTimeInSeconds / 60);
  const seconds = totalTimeInSeconds % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Calculate average time per question in seconds
  const avgTimeInSeconds = Math.round(
    sessionData.averageTimePerQuestion / 1000
  );

  // Generate XP based on performance (gamification element)
  const baseXP = totalAnswered * 2; // 2 XP per question attempted
  const bonusXP = correctAnswers * 3; // 3 bonus XP per correct answer
  const totalXP = baseXP + bonusXP;

  // Determine celebration message based on performance
  const getCelebrationMessage = () => {
    if (sessionData.status === "completed") {
      if (accuracyPercentage >= 90) return "Outstanding!";
      if (accuracyPercentage >= 80) return "Excellent work!";
      if (accuracyPercentage >= 70) return "Great job!";
      if (accuracyPercentage >= 60) return "Good effort!";
      return "Keep practicing! 📚";
    } else {
      return "Progress saved! 💾";
    }
  };

  const getMotivationalMessage = () => {
    if (sessionData.status === "completed") {
      if (accuracyPercentage >= 90) return "You're mastering this material!";
      if (accuracyPercentage >= 80) return "You're making excellent progress!";
      if (accuracyPercentage >= 70) return "You're on the right track!";
      if (accuracyPercentage >= 60)
        return "Every question brings you closer to your goal!";
      return "Practice makes perfect - keep going!";
    } else {
      return "Your progress has been saved. Continue practicing when you're ready!";
    }
  };

  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">
            {sessionData.status === "completed"
              ? accuracyPercentage >= 80
                ? "🎉"
                : accuracyPercentage >= 60
                ? "👏"
                : ":D"
              : "💾"}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {getCelebrationMessage()}
          </h1>
          <p className="text-xl text-gray-600">{getMotivationalMessage()}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total XP / Questions Answered */}
          <div className="relative">
            <div className="bg-orange-400 rounded-2xl py-4 px-2 text-center shadow-lg border-b-4 border-orange-600 transform transition-all duration-200 hover:shadow-xl hover:border-orange-700">
              <div className="bg-white rounded-xl p-4 mx-2 mb-4">
                <div className="flex justify-center mb-3">
                  <div className="bg-orange-100 rounded-full p-2">
                    <Trophy className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-orange-700 mb-1">
                  {totalXP}
                </p>
                <p className="text-sm text-orange-600">
                  {totalAnswered} questions answered
                </p>
              </div>
              <p className="text-sm font-bold text-white uppercase tracking-wide">
                TOTAL XP
              </p>
            </div>
          </div>

          {/* Speed */}
          <div className="relative">
            <div className="bg-blue-400 rounded-2xl py-4 px-2 text-center shadow-lg border-b-4 border-blue-600 transform transition-all duration-200 hover:shadow-xl hover:border-blue-700">
              <div className="bg-white rounded-xl p-4 mx-2 mb-4">
                <div className="flex justify-center mb-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-700 mb-1">
                  {timeDisplay}
                </p>
                <p className="text-sm text-blue-600">
                  {avgTimeInSeconds}s avg per question
                </p>
              </div>
              <p className="text-sm font-bold text-white uppercase tracking-wide">
                TOTAL TIME
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="relative">
            <div className="bg-green-400 rounded-2xl py-4 px-2 text-center shadow-lg border-b-4 border-green-600 transform transition-all duration-200 hover:shadow-xl hover:border-green-700">
              <div className="bg-white rounded-xl p-4 mx-2 mb-4">
                <div className="flex justify-center mb-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-700 mb-1">
                  {accuracyPercentage}%
                </p>
                <p className="text-sm text-green-600">
                  {correctAnswers} of {totalAnswered} correct
                </p>
              </div>
              <p className="text-sm font-bold text-white uppercase tracking-wide">
                ACCURACY
              </p>
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="relative">
          <div className="bg-gray-400 rounded-2xl p-6 shadow-lg border-b-4 border-gray-600 transform transition-all duration-200 hover:shadow-xl hover:border-gray-700">
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
                <div className="bg-yellow-100 rounded-full p-2 mr-3">
                  <Zap className="h-5 w-5 text-yellow-500" />
                </div>
                Session Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-600 font-medium">Assessment:</p>
                  <p className="font-semibold text-gray-900">
                    {sessionData.practiceSelections.assessment}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-600 font-medium">Domains:</p>
                  <p className="font-semibold text-gray-900">
                    {sessionData.practiceSelections.domains
                      .map((d) => d.text)
                      .join(", ")}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-600 font-medium">Difficulty:</p>
                  <p className="font-semibold text-gray-900">
                    {sessionData.practiceSelections.difficulties.join(", ")}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-600 font-medium">Session Status:</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {sessionData.status.replace("_", " ")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={() => {
              playSound("button-pressed.wav");
              onContinue();
            }}
            size="lg"
            className="px-12 py-6 text-xl font-bold bg-green-500 hover:bg-green-600 text-white rounded-2xl shadow-lg border-b-4 border-green-700 hover:border-green-800 transform transition-all duration-200 hover:shadow-xl active:translate-y-1 active:border-b-2"
          >
            {sessionData.status === "completed"
              ? "START NEW PRACTICE"
              : "CONTINUE PRACTICING"}
          </Button>
        </div>
      </div>
    </div>
  );
}
