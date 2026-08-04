"use client";

import { RadarChart, type ChartConfig } from "@/registry/default/charts/radar-chart";

// Scenario: Security posture
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
    <RadarChart
      data={[]} // if isLoading is true, pass empty array → i.e isLoading ? [] : data
      config={chartConfig}
      className="h-full w-full p-4"
      isLoading={true} // [!code highlight]
    >
      <RadarChart.PolarGrid />
      <RadarChart.PolarAngleAxis dataKey="skill" />
      <RadarChart.Legend />
      <RadarChart.Tooltip />
      <RadarChart.Radar dataKey="current" variant="filled" />
      <RadarChart.Radar dataKey="target" variant="filled" />
    </RadarChart>
  );
}
