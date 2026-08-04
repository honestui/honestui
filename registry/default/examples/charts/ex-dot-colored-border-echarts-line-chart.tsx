"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Response latency
const data = [
  { month: "January", api: 381, web: 172 },
  { month: "February", api: 963, web: 449 },
  { month: "March", api: 585, web: 279 },
  { month: "April", api: 721, web: 375 },
  { month: "May", api: 505, web: 310 },
  { month: "June", api: 862, web: 405 },
  { month: "July", api: 459, web: 223 },
  { month: "August", api: 1038, web: 514 },
  { month: "September", api: 707, web: 354 },
  { month: "October", api: 595, web: 352 },
  { month: "November", api: 896, web: 463 },
  { month: "December", api: 338, web: 148 },
];

const chartConfig = {
  api: {
    label: "API",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  web: {
    label: "Web",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function DotColoredBorderLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="api">
        <LineChart.Dot variant="colored-border" />
      </LineChart.Line>
      <LineChart.Line dataKey="web">
        <LineChart.Dot variant="colored-border" />
      </LineChart.Line>
    </LineChart>
  );
}
