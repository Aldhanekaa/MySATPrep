"use client";

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
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export default function StrokeMultipleRadarChart() {
  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>
          Radar Chart
          <Badge
            variant="outline"
            className="text-green-500 bg-green-500/10 border-none ml-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>5.2%</span>
          </Badge>
        </CardTitle>
        <CardDescription>
          Showing total visitors for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] w-[20rem]"
          id="BRO"
        >
          <RadarChart data={chartData} width={3000}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="month" />
            <PolarGrid strokeDasharray="3 3" />
            <Radar
              stroke="var(--color-desktop)"
              dataKey="desktop"
              fill="var(--color-desktop)"
              fillOpacity={0.1}
            />
            <Radar
              stroke="var(--color-mobile)"
              dataKey="mobile"
              fill="var(--color-mobile)"
              fillOpacity={0.1}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
