"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Server health
const data = [
  { month: "January", cpu: 334, memory: 217 },
  { month: "February", cpu: 772, memory: 518 },
  { month: "March", cpu: 492, memory: 332 },
  { month: "April", cpu: 596, memory: 436 },
  { month: "May", cpu: 426, memory: 365 },
  { month: "June", cpu: 696, memory: 471 },
  { month: "July", cpu: 397, memory: 272 },
  { month: "August", cpu: 833, memory: 589 },
  { month: "September", cpu: 578, memory: 413 },
  { month: "October", cpu: 497, memory: 411 },
  { month: "November", cpu: 724, memory: 534 },
  { month: "December", cpu: 310, memory: 190 },
];

const chartConfig = {
  cpu: {
    label: "CPU",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  memory: {
    label: "Memory",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function LegendVerticalBarLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.Legend variant="vertical-bar" />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="cpu" />
      <LineChart.Line dataKey="memory" />
    </LineChart>
  );
}
