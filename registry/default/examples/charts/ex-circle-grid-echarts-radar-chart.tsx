"use client";

import { RadarChart, type ChartConfig } from "@/registry/default/charts/radar-chart";

// Scenario: Nutrition balance
const data = [
  { skill: "Protein", actual: 72, goal: 84 },
  { skill: "Carbs", actual: 66, goal: 78 },
  { skill: "Fiber", actual: 58, goal: 75 },
  { skill: "Vitamins", actual: 81, goal: 86 },
  { skill: "Hydration", actual: 69, goal: 82 },
  { skill: "Sodium", actual: 44, goal: 38 },
];

const chartConfig = {
  actual: {
    label: "Actual",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  goal: {
    label: "Goal",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

export function ExampleRadarChart() {
  return (
    <RadarChart data={data} config={chartConfig} className="h-full w-full p-4">
      <RadarChart.PolarGrid
        gridType="circle" // [!code highlight]
      />
      <RadarChart.PolarAngleAxis dataKey="skill" />
      <RadarChart.Legend />
      <RadarChart.Tooltip />
      <RadarChart.Radar dataKey="actual" variant="filled">
        <RadarChart.Dot variant="colored-border" />
        <RadarChart.ActiveDot variant="default" />
      </RadarChart.Radar>
      <RadarChart.Radar dataKey="goal" variant="filled">
        <RadarChart.Dot variant="colored-border" />
        <RadarChart.ActiveDot variant="default" />
      </RadarChart.Radar>
    </RadarChart>
  );
}
