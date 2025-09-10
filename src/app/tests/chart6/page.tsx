"use client";

import {
  Chart,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/bar-chart";
import { Bar, BarChart, Rectangle, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card-v2";

const performanceData = [
  { dataCenter: "NY", uptime: 99.9, p: "e" },
  { dataCenter: "SF", uptime: 97.5, p: "e" },
  { dataCenter: "L", uptime: 95.3, p: "e" },
  { dataCenter: "T", uptime: 94.8, p: "e" },
  { dataCenter: "Syd", uptime: 99.9, p: "e" },
  { dataCenter: "S", uptime: 97.5, p: "e" },
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
              left: 0,
            }}
          >
            <XAxis type="number" dataKey="uptime" hide />
            <YAxis dataKey="dataCenter" type="category" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="uptime"
              background={{ radius: 10, fill: "var(--chart-1)", opacity: 0.2 }}
              fill="var(--color-uptime)"
              radius={10}
              shape={(props: any) => {
                console.log("shape", props);

                return (
                  <>
                    <Rectangle {...props} />
                    <text
                      x={props.x + 25}
                      y={props.y + props.background.height / 2 + 2.5}
                      fill="white"
                      fontSize={15}
                    >
                      {props.payload.dataCenter}
                    </text>
                    <text
                      x={props.background.width - 10}
                      y={props.y + 20}
                      textAnchor="end"
                      fill="var(--fg)"
                    >
                      {props.count} ({props.percentage}%)
                    </text>
                  </>
                );
              }}
            />
          </BarChart>
        </Chart>
      </CardContent>
    </Card>
  );
}
