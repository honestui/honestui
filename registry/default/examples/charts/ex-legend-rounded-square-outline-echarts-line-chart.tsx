"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Donation cadence
const data = [
  { month: "January", oneTime: 266, recurring: 183 },
  { month: "February", oneTime: 608, recurring: 436 },
  { month: "March", oneTime: 393, recurring: 282 },
  { month: "April", oneTime: 477, recurring: 370 },
  { month: "May", oneTime: 338, recurring: 311 },
  { month: "June", oneTime: 549, recurring: 395 },
  { month: "July", oneTime: 320, recurring: 230 },
  { month: "August", oneTime: 661, recurring: 496 },
  { month: "September", oneTime: 455, recurring: 351 },
  { month: "October", oneTime: 395, recurring: 350 },
  { month: "November", oneTime: 574, recurring: 448 },
  { month: "December", oneTime: 255, recurring: 162 },
];

const chartConfig = {
  oneTime: {
    label: "One-time",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  recurring: {
    label: "Recurring",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function LegendRoundedSquareOutlineLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.Legend variant="rounded-square-outline" />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="oneTime" />
      <LineChart.Line dataKey="recurring" />
    </LineChart>
  );
}
