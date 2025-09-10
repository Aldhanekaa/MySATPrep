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

import { Bar, BarChart, Rectangle, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

import { Badge } from "@/components/ui/badge";
import {
  BadgeQuestionMark,
  Code2,
  FolderOpen,
  Plus,
  Rocket,
  TrendingUp,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useRouter } from "next/navigation";
import { Chart } from "@/components/ui/bar-chart";

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
    color: "var(--color-blue-300)",
  },
  incorrectPercentage: {
    label: "Incorrect",
    color: "var(--color-red-300)",
  },

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

interface SummaryData {
  correctAnswers: number;
  incorrectAnswers: number;
}
export default function SummaryCharts({
  selectedAssessment,
}: {
  selectedAssessment: AssessmentWorkspace | undefined;
}) {
  const router = useRouter();
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

      // console.log(primaryClassCdObjectData);
      // console.log(skillCdsObjectData);
      // console.log("finalData", finalData);

      // console.log("stats", selectedStats);
    }

    for (const [subject, primaryClassCds] of Object.entries(finalData)) {
      //   console.log(`${subject} ${JSON.stringify(primaryClassCds)}`);

      for (const [primaryClassCd, skillData] of Object.entries(
        primaryClassCds
      )) {
        // console.log(
        //   "skillCdsObjectData",
        //   primaryClassCdObjectData,
        //   primaryClassCd
        // );
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

    // console.log("finalDataReturn", finalDataReturn);

    return finalDataReturn;
  }, [selectedAssessment]);

  const answeredQuestionsDataSummary = useMemo(() => {
    let skills: {
      [subject: string]: {
        [primaryClassCd: string]: {
          [skillCd: string]: {
            correctAnswers: number;
            incorrectAnswers: number;
          };
        };
      };
    } = {};
    let finalData: {
      [subject: string]: {
        [primaryClassCd: string]: Array<{
          correctAnswers: number;
          incorrectAnswers: number;
          text: string;
          summary: string;
        }>;
      };
    } = {};

    const stats = getPracticeStatistics();
    const selectedStats = selectedAssessment
      ? stats[selectedAssessment.name]
      : null;

    if (selectedStats && "statistics" in selectedStats) {
      console.log("selectedStats", selectedStats);
      const statisticsData = selectedStats["statistics"];

      for (const [primaryClassCd, skillCds_Data] of Object.entries(
        statisticsData
      )) {
        // console.log("primaryClassCd", primaryClassCd, primaryClassCdObjectData);

        if (primaryClassCd in primaryClassCdObjectData) {
          const primaryData = primaryClassCdObjectData[primaryClassCd];

          if (!(primaryData.subject in skills)) {
            skills[primaryData.subject] = {};
          }

          if (
            primaryData.subject in skills &&
            !(primaryClassCd in skills[primaryData.subject])
          ) {
            skills[primaryData.subject][primaryClassCd] = {};
          }

          // console.log("skills", skills);

          for (const [classCd, questions] of Object.entries(skillCds_Data)) {
            if (!(classCd in skills[primaryData.subject][primaryClassCd])) {
              skills[primaryData.subject][primaryClassCd][classCd] = {
                correctAnswers: 0,
                incorrectAnswers: 0,
              };
            }

            for (const question in questions) {
              const questionData = questions[question];

              if (questionData.isCorrect) {
                skills[primaryData.subject][primaryClassCd][
                  classCd
                ].correctAnswers += 1;
              } else {
                skills[primaryData.subject][primaryClassCd][
                  classCd
                ].incorrectAnswers += 1;
              }
            }
          }
        }
      }

      console.log("skills", skills);

      for (const [subject, skillData] of Object.entries(skills)) {
        finalData[subject] = {};
        for (const [primaryClassCd, classData] of Object.entries(skillData)) {
          finalData[subject][primaryClassCd] = [];
          for (const [classCd, questionData] of Object.entries(classData)) {
            finalData[subject][primaryClassCd] =
              finalData[subject][primaryClassCd] || [];
            finalData[subject][primaryClassCd].push({
              correctAnswers: questionData.correctAnswers,
              incorrectAnswers: questionData.incorrectAnswers,
              summary: `${questionData.correctAnswers} out of ${
                questionData.incorrectAnswers + questionData.correctAnswers
              }`,
              text: classCd,
            });
          }
        }
      }

      console.log("finalData", finalData);

      return finalData;
    }

    return undefined;
  }, [selectedAssessment]);

  // console.log("SUMMARY DATA", summaryData, chartData);
  return (
    <div className=" space-y-5">
      <div className="grid grid-cols-2 gap-6">
        <Card className=" col-span-2 xl:col-span-1">
          <CardHeader className="items-center pb-4">
            <CardTitle>Reading & Writing</CardTitle>
            <CardDescription>
              Your Reading & Writing Skills Breakdown (In Percentage)
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            {summaryData["R&W"].length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px] w-full max-w-full"
                id="BRO"
              >
                <RadarChart
                  data={summaryData["R&W"]}
                  dataKey={"correctPercantage"}
                  width={100}
                >
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        formatter={(value, name, item, index) => (
                          <>
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                              style={
                                {
                                  "--color-bg": `${
                                    chartConfig[
                                      name as keyof typeof chartConfig
                                    ]?.color
                                  }`,
                                } as React.CSSProperties
                              }
                            />
                            {chartConfig[name as keyof typeof chartConfig]
                              ?.label || name}
                            <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                              {Math.round(value as number)}
                              <span className="text-muted-foreground font-normal">
                                %
                              </span>
                            </div>
                          </>
                        )}
                      />
                    }
                  />
                  <PolarAngleAxis
                    dataKey="text"
                    axisLineType="polygon"
                    tick={({ x, y, textAnchor, value, index, ...props }) => {
                      const data = summaryData["R&W"][index];
                      return (
                        <text
                          x={x}
                          y={index === 0 ? y - 10 : y}
                          textAnchor={textAnchor}
                          fontSize={13}
                          fontWeight={500}
                          {...props}
                        >
                          <tspan>{data.correctAnswers}</tspan>
                          <tspan className="fill-muted-foreground">/</tspan>
                          <tspan>
                            {data.incorrectAnswers + data.correctAnswers}
                          </tspan>
                          <tspan
                            x={x}
                            dy={"1rem"}
                            fontSize={12}
                            className="fill-muted-foreground"
                          >
                            {data.text}
                          </tspan>
                        </text>
                      );
                    }}
                  />
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
                  <ChartLegend
                    className="mt-8"
                    content={<ChartLegendContent />}
                  />
                </RadarChart>
              </ChartContainer>
            ) : (
              <EmptyState
                theme={"light"}
                className=" border-0"
                title="No Data Available"
                description="Start practice to view your reading & writing skills."
                icons={[
                  <FolderOpen key="p1" className="h-6 w-6" />,
                  <BadgeQuestionMark key="p2" className="h-6 w-6" />,
                  <Rocket key="p3" className="h-6 w-6" />,
                ]}
                action={{
                  label: "Start Practice",
                  onClick: () => {
                    router.push("/practice");
                  },
                }}
              />
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
          <CardContent className="pb-5">
            {summaryData["Math"].length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px] w-full max-w-full"
                id="BRO"
              >
                <RadarChart
                  data={summaryData["Math"]}
                  dataKey={"correctPercantage"}
                  width={100}
                >
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        formatter={(value, name, item, index) => (
                          <>
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                              style={
                                {
                                  "--color-bg": `${
                                    chartConfig[
                                      name as keyof typeof chartConfig
                                    ]?.color
                                  }`,
                                } as React.CSSProperties
                              }
                            />
                            {chartConfig[name as keyof typeof chartConfig]
                              ?.label || name}
                            <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                              {Math.round(value as number)}
                              <span className="text-muted-foreground font-normal">
                                %
                              </span>
                            </div>
                          </>
                        )}
                      />
                    }
                  />
                  <PolarAngleAxis
                    dataKey="text"
                    axisLineType="polygon"
                    tick={({ x, y, textAnchor, value, index, ...props }) => {
                      const data = summaryData["Math"][index];
                      return (
                        <text
                          x={x}
                          y={index === 0 ? y - 10 : y}
                          textAnchor={textAnchor}
                          fontSize={13}
                          fontWeight={500}
                          {...props}
                        >
                          <tspan>{data.correctAnswers}</tspan>
                          <tspan className="fill-muted-foreground">/</tspan>
                          <tspan>
                            {data.incorrectAnswers + data.correctAnswers}
                          </tspan>
                          <tspan
                            x={x}
                            dy={"1rem"}
                            fontSize={12}
                            className="fill-muted-foreground"
                          >
                            {data.text}
                          </tspan>
                        </text>
                      );
                    }}
                  />
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
                  <ChartLegend
                    className="mt-8"
                    content={<ChartLegendContent />}
                  />
                </RadarChart>
              </ChartContainer>
            ) : (
              <EmptyState
                theme={"light"}
                className=" border-0"
                title="No Data Available"
                description="Start practice to view your maths skills."
                icons={[
                  <FolderOpen key="p1" className="h-6 w-6" />,
                  <BadgeQuestionMark key="p2" className="h-6 w-6" />,
                  <Rocket key="p3" className="h-6 w-6" />,
                ]}
                action={{
                  label: "Start Practice",
                  onClick: () => {
                    router.push("/practice");
                  },
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className=" col-span-2 xl:col-span-1">
          <CardHeader className="items-start pb-4">
            <CardTitle>Skills Insights</CardTitle>
            <CardDescription>
              View your performance across different skills in different topics.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-5 space-y-10">
            {answeredQuestionsDataSummary &&
              Object.entries(answeredQuestionsDataSummary).map(
                ([subject, primaryClassCds]) => (
                  <div>
                    <h4 className="text-xl">{subject}</h4>
                    <div className="space-y-3">
                      {Object.entries(primaryClassCds).map(
                        ([primaryClassKey, skillCds]) => (
                          <div key={primaryClassKey}>
                            <h5 className="text-lg">
                              {primaryClassCdObjectData[primaryClassKey].text}
                            </h5>

                            <ChartContainer
                              key={primaryClassKey}
                              className={` ${
                                skillCds.length == 5
                                  ? "aspect-[50/8]"
                                  : skillCds.length > 3 && skillCds.length < 5
                                  ? "aspect-[50/5]"
                                  : skillCds.length <= 3
                                  ? "aspect-[50/4]"
                                  : "aspect-[50/1]"
                              }`}
                              config={chartConfig}
                            >
                              <BarChart
                                accessibilityLayer
                                data={skillCds}
                                layout="vertical"
                                margin={{
                                  left: 0,
                                }}
                                // barSize={200}
                                // maxBarSize={50}
                                // barGap={32}
                                // barCategoryGap={"4%"}
                                // width={23}
                              >
                                <XAxis
                                  type="number"
                                  dataKey="correctAnswers"
                                  hide
                                />
                                <YAxis
                                  dataKey="text"
                                  type="category"
                                  tickLine={false}
                                  tickMargin={10}
                                  axisLine={false}
                                  hide
                                />
                                <ChartTooltip
                                  cursor={false}
                                  content={
                                    <ChartTooltipContent
                                      indicator="dashed"
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
                                    // console.log("shape", props);

                                    return (
                                      <>
                                        <Rectangle
                                          {...props}
                                          width={
                                            (props.payload.correctAnswers /
                                              (props.payload.correctAnswers +
                                                props.payload
                                                  .incorrectAnswers)) *
                                            props.background.width
                                          }
                                          // height={12s}
                                        />
                                        <text
                                          x={props.x + 25}
                                          y={
                                            props.y +
                                            props.background.height / 2 +
                                            3
                                          }
                                          fill="var(--color-blue-900)"
                                          fontSize={12.5}
                                        >
                                          {
                                            skillCdsObjectData[
                                              props.payload.text
                                            ].text
                                          }
                                        </text>
                                        <text
                                          x={props.background.width - 10}
                                          y={
                                            props.y +
                                            props.background.height / 2 +
                                            3
                                          }
                                          textAnchor="end"
                                          fill="var(--fg)"
                                        >
                                          {Math.round(
                                            (props.payload.correctAnswers /
                                              (props.payload.correctAnswers +
                                                props.payload
                                                  .incorrectAnswers)) *
                                              100
                                          )}{" "}
                                          %
                                        </text>
                                      </>
                                    );
                                  }}
                                />
                              </BarChart>
                            </ChartContainer>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
