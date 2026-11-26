"use client";

import { RadarChart, type ChartConfig } from "@/registry/default/charts/radar-chart";

// Scenario: Two laptops compared across review scores
const data = [
  { metric: "Performance", studio: 92, air: 74 },
  { metric: "Battery", studio: 68, air: 90 },
  { metric: "Display", studio: 88, air: 76 },
  { metric: "Portability", studio: 54, air: 94 },
  { metric: "Thermals", studio: 80, air: 62 },
  { metric: "Value", studio: 60, air: 84 },
];

const chartConfig = {
  studio: {
    label: "Studio 16",
    colors: { light: ["#3b82f6"], dark: ["#60a5fa"] },
  },
  air: {
    label: "Air 13",
    colors: { light: ["#10b981"], dark: ["#34d399"] },
  },
} satisfies ChartConfig;

export function ExampleRadarChart() {
  return (
    <RadarChart className="h-full w-full p-4" data={data} nameKey="metric" config={chartConfig} max={100}>
      <RadarChart.Grid />
      <RadarChart.Axis />
      <RadarChart.Legend isClickable />
      <RadarChart.Tooltip />
      <RadarChart.Radar dataKey="studio" />
      <RadarChart.Radar dataKey="air" />
    </RadarChart>
  );
}
