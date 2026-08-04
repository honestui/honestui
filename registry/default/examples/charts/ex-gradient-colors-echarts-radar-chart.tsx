"use client";

import { RadarChart, type ChartConfig } from "@/registry/default/charts/radar-chart";

// Scenario: City service ratings
const data = [
  { skill: "Transit", rating: 73, benchmark: 68 },
  { skill: "Parks", rating: 86, benchmark: 74 },
  { skill: "Safety", rating: 64, benchmark: 71 },
  { skill: "Housing", rating: 52, benchmark: 66 },
  { skill: "Waste", rating: 79, benchmark: 72 },
  { skill: "Libraries", rating: 88, benchmark: 76 },
];

const chartConfig = {
  rating: {
    label: "Resident rating",
    colors: {
      light: ["#6366f1", "#a855f7", "#ec4899"], // Indigo -> Purple -> Pink // [!code highlight]
      dark: ["red", "orange", "pink"], // [!code highlight]
    },
  },
  benchmark: {
    label: "Peer benchmark",
    colors: {
      light: ["#14b8a6", "#06b6d4", "#3b82f6"], // Teal -> Cyan -> Blue // [!code highlight]
      dark: ["#2dd4bf", "#22d3ee", "#60a5fa"], // [!code highlight]
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
      <RadarChart.Radar dataKey="rating" variant="filled">
        <RadarChart.Dot variant="colored-border" />
        <RadarChart.ActiveDot variant="default" />
      </RadarChart.Radar>
      <RadarChart.Radar dataKey="benchmark" variant="filled">
        <RadarChart.Dot variant="colored-border" />
        <RadarChart.ActiveDot variant="default" />
      </RadarChart.Radar>
    </RadarChart>
  );
}
