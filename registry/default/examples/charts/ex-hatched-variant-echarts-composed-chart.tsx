"use client";

import { ComposedChart, type ChartConfig } from "@/registry/default/charts/composed-chart";

// Scenario: Learning platform
const data = [
  { month: "January", sessions: 2631, completionRate: 1170 },
  { month: "February", sessions: 3634, completionRate: 1561 },
  { month: "March", sessions: 2591, completionRate: 1056 },
  { month: "April", sessions: 3904, completionRate: 1831 },
  { month: "May", sessions: 3375, completionRate: 1454 },
  { month: "June", sessions: 4874, completionRate: 2194 },
  { month: "July", sessions: 3831, completionRate: 1689 },
  { month: "August", sessions: 5144, completionRate: 2464 },
  { month: "September", sessions: 3685, completionRate: 1639 },
  { month: "October", sessions: 4254, completionRate: 1966 },
  { month: "November", sessions: 4513, completionRate: 2066 },
  { month: "December", sessions: 5702, completionRate: 2713 },
];

const chartConfig = {
  sessions: {
    label: "Sessions",
    colors: {
      light: ["#3b82f6"],
      dark: ["#6A5ACD"],
    },
  },
  completionRate: {
    label: "Completion rate",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

export function ExampleComposedChart() {
  return (
    <ComposedChart
      className="h-full w-full p-4"
      xDataKey="month"
      data={data}
      config={chartConfig}
    >
      <ComposedChart.Grid />
      <ComposedChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <ComposedChart.Legend isClickable />
      <ComposedChart.Tooltip />
      <ComposedChart.Bar
        dataKey="sessions"
        variant="hatched" // [!code highlight]
        isClickable
      />
      <ComposedChart.Line dataKey="completionRate" isClickable />
    </ComposedChart>
  );
}
