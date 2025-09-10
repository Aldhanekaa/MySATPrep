"use client";

import React, { useEffect, useMemo } from "react";
import { PracticeSession } from "@/types/session";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Target, Zap } from "lucide-react";
import { playSound } from "@/lib/playSound";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeading,
  CardTitle,
} from "@/components/ui/card-v2";
import {
  Chart,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/bar-chart";
import { Bar, BarChart, Rectangle, XAxis, YAxis } from "recharts";
import {
  primaryClassCdObjectData,
  skillCdsObjectData,
} from "@/static-data/domains";
import { cn } from "@/lib/utils";

const chartData = [
  {
    country: "United States",
    count: 45000,
    percentage: 45.0,
  },
  {
    country: "Canada",
    count: 34000,
    percentage: 18.0,
  },
  {
    country: "United Kingdom",
    count: 30000,
    percentage: 12.0,
  },
  {
    country: "Germany",
    count: 25000,
    percentage: 9.0,
  },
  {
    country: "Australia",
    count: 22000,
    percentage: 7.5,
  },
  {
    country: "France",
    count: 18000,
    percentage: 6.0,
  },
  {
    country: "Japan",
    count: 15000,
    percentage: 4.5,
  },
  {
    country: "Brazil",
    count: 13000,
    percentage: 5.0,
  },
  {
    country: "Indonesia",
    count: 10030,
    percentage: 6.0,
  },
];

const chartConfig = {
  correctAnswers: {
    label: "Count",
    color: "var(--chart-1)",
  },
  incorrectAnswers: {
    label: "Count",
    color: "var(--chart-2)",
  },
  summary: {
    label: "Correct Answers",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

interface PracticeRushCelebrationProps {
  sessionData: PracticeSession & {
    correctAnswers?: number;
    accuracyPercentage?: number;
  };
  onContinue: () => void;
  correctAnswerChoices: { [questionId: string]: Array<string> };
}

export default function PracticeRushCelebration({
  sessionData,
  onContinue,
  correctAnswerChoices,
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

  // Use actual XP received from session data, fallback to calculated value for backward compatibility
  const actualXPReceived = sessionData.totalXPReceived ?? 0;
  const fallbackXP = totalAnswered * 2 + correctAnswers * 3; // Legacy calculation
  const displayXP = actualXPReceived !== 0 ? actualXPReceived : fallbackXP;

  // Determine if XP was positive, negative, or neutral
  const xpChangeType =
    actualXPReceived > 0 ? "gained" : actualXPReceived < 0 ? "lost" : "neutral";

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

  const answeredQuestionsDataSummary = useMemo(() => {
    let skills: {
      [primaryClassCd: string]: {
        [skillCd: string]: {
          correctAnswers: number;
          incorrectAnswers: number;
        };
      };
    } = {};
    let domains: {
      [key: string]: {
        text: string;
        id: string;
        summary: Array<any>;
      };
    } = {};

    sessionData.practiceSelections.domains.forEach((domain) => {
      domains[domain.primaryClassCd] = {
        text: domain.text,
        id: domain.id,
        summary: [],
      };
    });

    // console.log("doma ins", domains);

    sessionData.answeredQuestionDetails.forEach((aq) => {
      const questionSelection = sessionData.questionAnswers[aq.questionId];
      // console.log("QUESTION SELECTION", questionSelection, aq);
      if (questionSelection && aq.plainQuestion) {
        if (!(aq.plainQuestion.primary_class_cd in skills)) {
          skills[aq.plainQuestion.primary_class_cd] = {};
        }

        if (
          !(
            aq.plainQuestion.skill_cd in
            skills[aq.plainQuestion.primary_class_cd]
          )
        ) {
          skills[aq.plainQuestion.primary_class_cd][aq.plainQuestion.skill_cd] =
            {
              correctAnswers: 0,
              incorrectAnswers: 0,
            };
        }

        let skillCdData =
          skills[aq.plainQuestion.primary_class_cd][aq.plainQuestion.skill_cd];

        if (correctAnswerChoices[aq.questionId].includes(questionSelection)) {
          skillCdData.correctAnswers += 1;
        } else {
          skillCdData.incorrectAnswers += 1;
        }

        // console.log("DOMAIN ", questionSelection);
      }
    });

    Object.keys(domains).forEach((domainKey) => {
      const domain = domains[domainKey];
      const domainSkills = skills[domainKey] || {};
      domain.summary = Object.keys(domainSkills).map((skillKey) => {
        const skillData = domainSkills[skillKey];
        return {
          text: skillKey,
          correctAnswers: skillData.correctAnswers,
          incorrectAnswers: skillData.incorrectAnswers,
          summary: `${skillData.correctAnswers} out of ${
            skillData.correctAnswers + skillData.incorrectAnswers
          }`,
        };
      });
    });

    // console.log("domains!!", domains);
    // console.log("skillCdsObjectData S", skillCdsObjectData);

    // console.log("SKILLS", skills);

    return domains;
  }, [sessionData]);

  console.log("HEY,", sessionData, answeredQuestionsDataSummary);
  return (
    <div className="min-h-screen pt-32  flex items-center justify-center p-4">
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
          {/* XP Gained/Lost / Questions Answered */}
          <div className="relative">
            <div
              className={`rounded-2xl py-4 px-2 text-center shadow-lg border-b-4 transform transition-all duration-200 hover:shadow-xl ${
                xpChangeType === "gained"
                  ? "bg-green-400 border-green-600 hover:border-green-700"
                  : xpChangeType === "lost"
                  ? "bg-red-400 border-red-600 hover:border-red-700"
                  : "bg-orange-400 border-orange-600 hover:border-orange-700"
              }`}
            >
              <div className="bg-white rounded-xl p-4 mx-2 mb-4">
                <div className="flex justify-center mb-3">
                  <div
                    className={`rounded-full p-2 ${
                      xpChangeType === "gained"
                        ? "bg-green-100"
                        : xpChangeType === "lost"
                        ? "bg-red-100"
                        : "bg-orange-100"
                    }`}
                  >
                    <Trophy
                      className={`h-8 w-8 ${
                        xpChangeType === "gained"
                          ? "text-green-500"
                          : xpChangeType === "lost"
                          ? "text-red-500"
                          : "text-orange-500"
                      }`}
                    />
                  </div>
                </div>
                <p
                  className={`text-3xl font-bold mb-1 ${
                    xpChangeType === "gained"
                      ? "text-green-700"
                      : xpChangeType === "lost"
                      ? "text-red-700"
                      : "text-orange-700"
                  }`}
                >
                  {xpChangeType === "gained"
                    ? "+"
                    : xpChangeType === "lost"
                    ? ""
                    : ""}
                  {Math.abs(displayXP)}
                </p>
                <p
                  className={`text-sm ${
                    xpChangeType === "gained"
                      ? "text-green-600"
                      : xpChangeType === "lost"
                      ? "text-red-600"
                      : "text-orange-600"
                  }`}
                >
                  {totalAnswered} questions answered
                </p>
              </div>
              <p className="text-sm font-bold text-white uppercase tracking-wide">
                XP{" "}
                {xpChangeType === "gained"
                  ? "GAINED"
                  : xpChangeType === "lost"
                  ? "LOST"
                  : "TOTAL"}
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
        <div className="relative space-y-10">
          <Card
            variant={"accent"}
            className={cn(
              "relative h-full rounded-3xl",
              "transition-all duration-300",
              "h-full w-full"
            )}
          >
            <CardHeader>
              <CardHeading className="py-2">
                <CardTitle>
                  <div className="text-lg  space-x-2 font-semibold text-gray-900 mb-4 flex items-start justify-center pt-5">
                    <Zap className="h-5 w-5 mt-2 text-yellow-500" />
                    <div>
                      <p> Your Practice Session Statistics</p>
                      <p className="text-sm font-normal">
                        Hover to see detailed summary
                      </p>
                    </div>
                  </div>
                </CardTitle>
              </CardHeading>
            </CardHeader>
            <CardContent className=" space-y-5 ">
              {Object.keys(answeredQuestionsDataSummary).map(
                (domainKey) =>
                  answeredQuestionsDataSummary[domainKey].summary.length >
                    0 && (
                    <div>
                      <p>{primaryClassCdObjectData[domainKey].text}</p>

                      <Chart
                        className="aspect-[20/12] sm:aspect-[17/5]"
                        config={chartConfig}
                      >
                        <BarChart
                          accessibilityLayer
                          data={answeredQuestionsDataSummary[domainKey].summary}
                          layout="vertical"
                          margin={{
                            left: 0,
                          }}
                        >
                          <XAxis type="number" dataKey="correctAnswers" hide />
                          <YAxis dataKey="text" type="category" hide />
                          <ChartTooltip
                            cursor={false}
                            content={
                              <ChartTooltipContent
                                indicator="dot"
                                labelKey="eee"
                                hideLabel
                                className=" w-[14rem] bg-white"
                              />
                            }
                          />
                          <Bar
                            dataKey="summary"
                            background={{
                              radius: 10,
                              fill: "var(--color-blue-300)",
                              opacity: 0.2,
                            }}
                            fill="var(--color-blue-400)"
                            radius={10}
                            shape={(props: any) => {
                              console.log("shape", props);

                              return (
                                <>
                                  <Rectangle
                                    {...props}
                                    width={
                                      (props.payload.correctAnswers /
                                        (props.payload.correctAnswers +
                                          props.payload.incorrectAnswers)) *
                                      props.background.width
                                    }
                                  />
                                  <text
                                    x={props.x + 25}
                                    y={
                                      props.y + props.background.height / 2 + 3
                                    }
                                    fill="var(--color-blue-900)"
                                    fontSize={12.5}
                                  >
                                    {
                                      skillCdsObjectData[props.payload.text]
                                        .text
                                    }
                                  </text>
                                  <text
                                    x={props.background.width - 10}
                                    y={
                                      props.y + props.background.height / 2 + 3
                                    }
                                    textAnchor="end"
                                    fill="var(--fg)"
                                  >
                                    {(props.payload.correctAnswers /
                                      (props.payload.correctAnswers +
                                        props.payload.incorrectAnswers)) *
                                      100}{" "}
                                    %
                                  </text>
                                </>
                              );
                            }}
                          />
                        </BarChart>
                      </Chart>
                    </div>
                  )
              )}
            </CardContent>
          </Card>

          <Card
            variant={"accent"}
            className={cn(
              "relative h-full rounded-3xl",
              "transition-all duration-300",
              "h-full w-full"
            )}
          >
            <CardHeader>
              <CardHeading>
                <h3 className="text-lg space-x-2 font-semibold text-gray-900 mb-4 flex items-center justify-center pt-5">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <p> Session Summary</p>
                </h3>
              </CardHeading>
            </CardHeader>
            <CardContent className="bg-white rounded-xl p-6 rounded-b-4xl overflow-hidden">
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
            </CardContent>
          </Card>
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
