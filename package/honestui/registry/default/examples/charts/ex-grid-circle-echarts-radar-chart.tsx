"use client";

import { RadarChart, type ChartConfig } from "@/registry/default/charts/radar-chart";

// Scenario: Weekly focus hours by area
const data = [
  { area: "Deep work", hours: 18 },
  { area: "Meetings", hours: 9 },
  { area: "Reviews", hours: 6 },
  { area: "Planning", hours: 4 },
  { area: "Support", hours: 7 },
  { area: "Learning", hours: 5 },
  { area: "Admin", hours: 3 },
];

const chartConfig = {
  hours: {
    label: "Hours",
    colors: { light: ["#8b5cf6"], dark: ["#a78bfa"] },
  },
} satisfies ChartConfig;

export function ExampleRadarChart() {
  return (
    <RadarChart className="h-full w-full p-4" data={data} nameKey="area" config={chartConfig}>
      <RadarChart.Grid
        shape="circle" // [!code highlight]
        variant="filled" // [!code highlight]
      />
      <RadarChart.Axis showValues />
      <RadarChart.Tooltip valueFormatter={(value) => `${value} h`} />
      <RadarChart.Radar dataKey="hours" dot="border" />
    </RadarChart>
  );
}
