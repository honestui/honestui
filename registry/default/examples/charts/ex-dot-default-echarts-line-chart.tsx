"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Trail traffic
const data = [
  { month: "January", hikers: 415, cyclists: 189 },
  { month: "February", hikers: 1045, cyclists: 490 },
  { month: "March", hikers: 634, cyclists: 304 },
  { month: "April", hikers: 781, cyclists: 408 },
  { month: "May", hikers: 549, cyclists: 337 },
  { month: "June", hikers: 935, cyclists: 443 },
  { month: "July", hikers: 497, cyclists: 244 },
  { month: "August", hikers: 1124, cyclists: 561 },
  { month: "September", hikers: 769, cyclists: 385 },
  { month: "October", hikers: 646, cyclists: 383 },
  { month: "November", hikers: 971, cyclists: 506 },
  { month: "December", hikers: 365, cyclists: 162 },
];

const chartConfig = {
  hikers: {
    label: "Hikers",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  cyclists: {
    label: "Cyclists",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function DotDefaultLineChart() {
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
      <LineChart.Line dataKey="hikers">
        <LineChart.Dot variant="default" />
      </LineChart.Line>
      <LineChart.Line dataKey="cyclists">
        <LineChart.Dot variant="default" />
      </LineChart.Line>
    </LineChart>
  );
}
