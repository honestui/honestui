"use client";

import { RadarChart, type ChartConfig } from "@/registry/default/charts/radar-chart";

const chartConfig = {
  score: {
    label: "Score",
    colors: { light: ["#3b82f6"], dark: ["#60a5fa"] },
  },
} satisfies ChartConfig;

export function ExampleRadarChart() {
  return (
    <RadarChart
      className="h-full w-full p-4"
      data={[]}
      nameKey="metric"
      config={chartConfig}
      isLoading // [!code highlight]
    >
      <RadarChart.Grid />
      <RadarChart.Radar dataKey="score" />
    </RadarChart>
  );
}
