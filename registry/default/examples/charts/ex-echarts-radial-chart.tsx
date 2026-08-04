"use client";

import { RadialChart, type ChartConfig } from "@/registry/default/charts/radial-chart";

// Scenario: Project milestones
const data = [
  { category: "research", progress: 92 },
  { category: "design", progress: 78 },
  { category: "build", progress: 64 },
  { category: "testing", progress: 48 },
  { category: "launch", progress: 31 },
];

const chartConfig = {
  research: {
    label: "Research",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  design: {
    label: "Design",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  build: {
    label: "Build",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
  testing: {
    label: "Testing",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  launch: {
    label: "Launch",
    colors: {
      light: ["#6b7280"],
      dark: ["#9ca3af"],
    },
  },
} satisfies ChartConfig;

export function ExampleRadialChart() {
  return (
    <RadialChart
      className="h-full w-full p-4"
      data={data}
      nameKey="category"
      config={chartConfig}
      variant="full" // [!code highlight]
    >
      <RadialChart.Legend isClickable />
      <RadialChart.Tooltip />
      <RadialChart.RadialBar dataKey="progress" isClickable />
    </RadialChart>
  );
}
