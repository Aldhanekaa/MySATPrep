"use client";
import { AssessmentWorkspace } from "@/app/dashboard/types";
import { getPracticeStatistics } from "@/lib/practiceStatistics";
import {
  primaryClassCdObjectData,
  skillCdsObjectData,
} from "@/static-data/domains";
import { useMemo } from "react";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/radar-chart";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

const chartData = [
  { month: "January", desktop: 80, mobile: 20 },
  { month: "February", desktop: 80, mobile: 20 },
  { month: "March", desktop: 80, mobile: 20 },
  { month: "April", desktop: 80, mobile: 20 },
  { month: "May", desktop: 80, mobile: 20 },
  { month: "June", desktop: 100, mobile: 50 },
  { month: "July", desktop: 80, mobile: 80 },
  { month: "August", desktop: 80, mobile: 20 },
  { month: "September", desktop: 80, mobile: 20 },
  { month: "October", desktop: 80, mobile: 20 },
  { month: "November", desktop: 80, mobile: 20 },
  { month: "December", desktop: 80, mobile: 20 },
];

const chartConfig = {
  correctPercantage: {
    label: "Correct",
    color: "var(--chart-1)",
  },
  incorrectPercentage: {
    label: "Incorrect",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

interface SummaryData {
  correctAnswers: number;
  incorrectAnswers: number;
}
export default function SummaryCharts({
  selectedAssessment,
}: {
  selectedAssessment: AssessmentWorkspace | undefined;
}) {
  const summaryData = useMemo(() => {
    const finalData: {
      [key: string]: { [primaryClassCd: string]: SummaryData };
    } = {
      Math: {},
      "R&W": {},
    };
    const finalDataReturn: {
      [key: string]: Array<
        SummaryData & {
          text: string;
          correctPercantage: number;
          incorrectPercentage: number;
        }
      >;
    } = {
      Math: [],
      "R&W": [],
    };

    const stats = getPracticeStatistics();
    const selectedStats = selectedAssessment
      ? stats[selectedAssessment.name]
      : null;

    if (selectedStats && "statistics" in selectedStats) {
      const statisticsData = selectedStats["statistics"];

      for (const [primaryClassCd, skillCds_Data] of Object.entries(
        statisticsData
      )) {
        for (const [classCd, questions] of Object.entries(skillCds_Data)) {
          for (const question in questions) {
            // console.log(
            //   `${primaryClassCd}.${classCd}: ${question} ${
            //     questions[question]
            //   } ${
            //     primaryClassCdObjectData[primaryClassCd].subject
            //   } | ${JSON.stringify(primaryClassCdObjectData[primaryClassCd])}`
            // );

            if (
              primaryClassCd in
                finalData[primaryClassCdObjectData[primaryClassCd].subject] ===
              false
            ) {
              finalData[primaryClassCdObjectData[primaryClassCd].subject][
                primaryClassCd
              ] = {
                correctAnswers: 0,
                incorrectAnswers: 0,
              };
            }

            if (questions[question].isCorrect) {
              finalData[primaryClassCdObjectData[primaryClassCd].subject][
                primaryClassCd
              ].correctAnswers += 1;
            } else {
              finalData[primaryClassCdObjectData[primaryClassCd].subject][
                primaryClassCd
              ].incorrectAnswers += 1;
            }
          }
          //   console.log(`${primaryClassCd}.${classCd}: ${questions}`);
        }
      }

      console.log(primaryClassCdObjectData);
      console.log(skillCdsObjectData);
      console.log("finalData", finalData);

      console.log("stats", selectedStats);
    }

    for (const [subject, primaryClassCds] of Object.entries(finalData)) {
      //   console.log(`${subject} ${JSON.stringify(primaryClassCds)}`);

      for (const [primaryClassCd, skillData] of Object.entries(
        primaryClassCds
      )) {
        console.log(
          "skillCdsObjectData",
          primaryClassCdObjectData,
          primaryClassCd
        );
        finalDataReturn[subject].push({
          text:
            primaryClassCdObjectData[primaryClassCd]?.text || primaryClassCd,
          ...skillData,
          correctPercantage:
            (skillData.correctAnswers /
              (skillData.correctAnswers + skillData.incorrectAnswers)) *
              100 || 0,
          incorrectPercentage:
            (skillData.incorrectAnswers /
              (skillData.correctAnswers + skillData.incorrectAnswers)) *
              100 || 0,
        });
      }
    }

    console.log("finalDataReturn", finalDataReturn);

    return finalDataReturn;
  }, [selectedAssessment]);

  console.log("SUMMARY DATA", summaryData, chartData);
  return (
    <div>
      <div className="grid grid-cols-2 gap-6">
        <Card className=" col-span-2 xl:col-span-1">
          <CardHeader className="items-center pb-4">
            <CardTitle>Reading & Writing</CardTitle>
            <CardDescription>
              Your Reading & Writing Skills Breakdown (In Percentage)
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            {summaryData["R&W"].length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px] w-[30rem]"
                id="BRO"
              >
                <RadarChart
                  data={summaryData["R&W"]}
                  dataKey={"correctPercantage"}
                  width={3000}
                >
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <PolarAngleAxis dataKey="text" axisLineType="polygon" />
                  <PolarGrid strokeDasharray="3 3" />
                  <Radar
                    stroke="var(--color-blue-300)"
                    dataKey="correctPercantage"
                    fill="var(--color-blue-300)"
                    fillOpacity={0.1}
                  />
                  <Radar
                    stroke="var(--color-red-300)"
                    dataKey="incorrectPercentage"
                    fill="var(--color-red-300)"
                    fillOpacity={0.1}
                  />
                </RadarChart>
              </ChartContainer>
            ) : (
              <div>Start Practice to See the Data</div>
            )}
          </CardContent>
        </Card>
        <Card className=" col-span-2 xl:col-span-1">
          <CardHeader className="items-center pb-4">
            <CardTitle>Maths</CardTitle>
            <CardDescription>
              Your Maths Skills Breakdown (In Percentage)
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            {summaryData["Math"].length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px] w-[30rem]"
                id="BRO"
              >
                <RadarChart
                  data={summaryData["Math"]}
                  dataKey={"correctPercantage"}
                  width={3000}
                >
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <PolarAngleAxis dataKey="text" axisLineType="polygon" />
                  <PolarGrid strokeDasharray="3 3" />
                  <Radar
                    stroke="var(--color-blue-300)"
                    dataKey="correctPercantage"
                    fill="var(--color-blue-300)"
                    fillOpacity={0.1}
                  />
                  <Radar
                    stroke="var(--color-red-300)"
                    dataKey="incorrectPercentage"
                    fill="var(--color-red-300)"
                    fillOpacity={0.1}
                  />
                </RadarChart>
              </ChartContainer>
            ) : (
              <div>Start Practice to See the Data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
