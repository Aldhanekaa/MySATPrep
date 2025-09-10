"use client";

import {
  Chart,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/bar-chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card-v2";

const performanceData = [
  { dataCenter: "NY", uptime: 99.9 },
  { dataCenter: "SF", uptime: 97.5 },
  { dataCenter: "L", uptime: 95.3 },
  { dataCenter: "T", uptime: 94.8 },
  { dataCenter: "Syd", uptime: 99.9 },
  { dataCenter: "S", uptime: 97.5 },
];

const chartConfig = {
  uptime: {
    label: "Uptime (%)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export default function Component() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic by Country</CardTitle>
        <CardDescription>Since Aug 17, 2014</CardDescription>
      </CardHeader>
      <CardContent>
        <Chart className="aspect-[20/12] sm:aspect-[17/5]" config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={performanceData}
            layout="vertical"
            margin={{
              left: -20,
            }}
          >
            <XAxis type="number" dataKey="uptime" hide />
            <YAxis
              dataKey="dataCenter"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="uptime"
              background={{ radius: 50, fill: "var(--chart-1)", opacity: 0.2 }}
              fill="var(--color-uptime)"
              radius={50}
            />
          </BarChart>
        </Chart>
      </CardContent>
    </Card>
  );
}
