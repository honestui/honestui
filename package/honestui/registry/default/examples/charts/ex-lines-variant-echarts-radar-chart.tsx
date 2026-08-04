"use client";

import { RadarChart, type ChartConfig } from "@/registry/default/charts/radar-chart";

// Scenario: Vehicle comparison
const data = [
  { skill: "Speed", modelA: 82, modelB: 76 },
  { skill: "Braking", modelA: 74, modelB: 84 },
  { skill: "Efficiency", modelA: 88, modelB: 69 },
  { skill: "Comfort", modelA: 71, modelB: 86 },
  { skill: "Range", modelA: 79, modelB: 73 },
  { skill: "Handling", modelA: 85, modelB: 78 },
];

const chartConfig = {
  modelA: {
    label: "Model A",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  modelB: {
    label: "Model B",
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
      <RadarChart.Legend />
      <RadarChart.Tooltip />
      <RadarChart.Radar
        dataKey="modelA"
        variant="lines" // [!code highlight]
      >
        <RadarChart.Dot variant="colored-border" />
        <RadarChart.ActiveDot variant="default" />
      </RadarChart.Radar>
      <RadarChart.Radar dataKey="modelB" variant="lines">
        <RadarChart.Dot variant="colored-border" />
        <RadarChart.ActiveDot variant="default" />
      </RadarChart.Radar>
    </RadarChart>
  );
}
