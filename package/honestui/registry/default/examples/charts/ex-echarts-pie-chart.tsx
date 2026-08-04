"use client";

import { PieChart, type ChartConfig } from "@/registry/default/charts/pie-chart";

// Scenario: Trail usage
const data = [
  { category: "hiking", visits: 320 },
  { category: "cycling", visits: 245 },
  { category: "running", visits: 190 },
  { category: "climbing", visits: 135 },
  { category: "picnics", visits: 85 },
];

const chartConfig = {
  hiking: {
    label: "Hiking",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  cycling: {
    label: "Cycling",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  running: {
    label: "Running",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
  climbing: {
    label: "Climbing",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  picnics: {
    label: "Picnics",
    colors: {
      light: ["#6b7280"],
      dark: ["#9ca3af"],
    },
  },
} satisfies ChartConfig;

export function ExamplePieChart() {
  return (
    <PieChart
      className="h-full w-full p-4"
      data={data}
      dataKey="visits"
      nameKey="category"
      config={chartConfig}
    >
      <PieChart.Legend isClickable />
      <PieChart.Tooltip />
      <PieChart.Pie isClickable />
    </PieChart>
  );
}
