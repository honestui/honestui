"use client";

import { RadarChart, type ChartConfig } from "@/registry/default/charts/radar-chart";

// Scenario: Team capabilities
const data = [
  { skill: "Research", current: 68, target: 82 },
  { skill: "Design", current: 76, target: 88 },
  { skill: "Engineering", current: 84, target: 91 },
  { skill: "Quality", current: 61, target: 79 },
  { skill: "Marketing", current: 57, target: 74 },
  { skill: "Sales", current: 64, target: 80 },
];

const chartConfig = {
  current: {
    label: "Current",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  target: {
    label: "Target",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

export function ExampleRadarChart() {
  return (
    <RadarChart data={data} config={chartConfig} className="h-full w-full p-4">
      <RadarChart.PolarGrid />
      <RadarChart.PolarAngleAxis dataKey="skill" />
      <RadarChart.Legend isClickable />
      <RadarChart.Tooltip />
      <RadarChart.Radar
        dataKey="current"
        variant="filled" // [!code highlight]
        isClickable
      >
        <RadarChart.Dot variant="colored-border" />
        <RadarChart.ActiveDot variant="default" />
      </RadarChart.Radar>
      <RadarChart.Radar dataKey="target" variant="filled" isClickable>
        <RadarChart.Dot variant="colored-border" />
        <RadarChart.ActiveDot variant="default" />
      </RadarChart.Radar>
    </RadarChart>
  );
}
