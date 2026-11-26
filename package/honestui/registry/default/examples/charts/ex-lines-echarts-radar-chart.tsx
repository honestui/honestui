"use client";

import { RadarChart, type ChartConfig } from "@/registry/default/charts/radar-chart";

// Scenario: Candidate skills against the role's target profile
const data = [
  { skill: "System design", target: 4, candidate: 5 },
  { skill: "Testing", target: 4, candidate: 3 },
  { skill: "Communication", target: 5, candidate: 4 },
  { skill: "Ownership", target: 4, candidate: 5 },
  { skill: "Mentoring", target: 3, candidate: 2 },
];

const chartConfig = {
  target: {
    label: "Role target",
    colors: { light: ["#6b7280"], dark: ["#9ca3af"] },
  },
  candidate: {
    label: "Candidate",
    colors: { light: ["#f59e0b"], dark: ["#fbbf24"] },
  },
} satisfies ChartConfig;

export function ExampleRadarChart() {
  return (
    <RadarChart className="h-full w-full p-4" data={data} nameKey="skill" config={chartConfig} max={5}>
      <RadarChart.Grid rings={5} />
      <RadarChart.Axis />
      <RadarChart.Legend />
      <RadarChart.Tooltip valueFormatter={(value) => `${value} / 5`} />
      <RadarChart.Radar
        dataKey="target"
        variant="lines" // [!code highlight]
        dashed // [!code highlight]
      />
      <RadarChart.Radar dataKey="candidate" dot="default" />
    </RadarChart>
  );
}
