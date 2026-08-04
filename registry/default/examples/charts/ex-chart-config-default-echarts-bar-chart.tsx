"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Customer support
const data = [
  { month: "January", resolved: 280, escalated: 122 },
  { month: "February", resolved: 718, escalated: 325 },
  { month: "March", resolved: 438, escalated: 204 },
  { month: "April", resolved: 542, escalated: 275 },
  { month: "May", resolved: 372, escalated: 230 },
  { month: "June", resolved: 642, escalated: 291 },
  { month: "July", resolved: 343, escalated: 161 },
  { month: "August", resolved: 779, escalated: 374 },
  { month: "September", resolved: 524, escalated: 260 },
  { month: "October", resolved: 443, escalated: 260 },
  { month: "November", resolved: 670, escalated: 334 },
  { month: "December", resolved: 256, escalated: 106 },
];

const chartConfig = {
  resolved: {
    label: "Resolved", // [!code highlight]
    colors: {
      light: ["#047857"], // [!code highlight]
      dark: ["#10b981"], // [!code highlight]
    },
  },
  escalated: {
    label: "Escalated", // [!code highlight]
    colors: {
      light: ["#be123c"], // [!code highlight]
      dark: ["#f43f5e"], // [!code highlight]
    },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart data={data} config={chartConfig} className="h-full w-full p-4">
      <BarChart.Grid />
      <BarChart.XAxis dataKey="month" tickFormatter={(value: string) => value.substring(0, 3)} />
      <BarChart.Legend />
      <BarChart.Tooltip defaultIndex={4} />
      <BarChart.Bar dataKey="resolved" variant="default" />
      <BarChart.Bar dataKey="escalated" variant="default" />
    </BarChart>
  );
}
