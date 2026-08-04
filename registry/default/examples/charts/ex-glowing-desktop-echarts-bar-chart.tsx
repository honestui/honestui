"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Classroom outcomes
const data = [
  { month: "January", passed: 239, needsSupport: 136 },
  { month: "February", passed: 581, needsSupport: 339 },
  { month: "March", passed: 366, needsSupport: 218 },
  { month: "April", passed: 450, needsSupport: 289 },
  { month: "May", passed: 311, needsSupport: 244 },
  { month: "June", passed: 522, needsSupport: 305 },
  { month: "July", passed: 293, needsSupport: 175 },
  { month: "August", passed: 634, needsSupport: 388 },
  { month: "September", passed: 428, needsSupport: 274 },
  { month: "October", passed: 368, needsSupport: 274 },
  { month: "November", passed: 547, needsSupport: 348 },
  { month: "December", passed: 228, needsSupport: 120 },
];

const chartConfig = {
  passed: {
    label: "Passed",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  needsSupport: {
    label: "Needs support",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart data={data} config={chartConfig} className="h-full w-full p-4">
      <BarChart.Grid />
      <BarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <BarChart.Legend isClickable />
      <BarChart.Tooltip />
      <BarChart.Bar
        dataKey="passed"
        variant="default"
        glowing // [!code highlight]
        isClickable
      />
      <BarChart.Bar dataKey="needsSupport" variant="default" isClickable />
    </BarChart>
  );
}
