"use client";

import { RadarChart, type ChartConfig } from "@/registry/default/charts/radar-chart";

const data = [
  { skill: "JavaScript", desktop: 186, mobile: 80 },
  { skill: "TypeScript", desktop: 305, mobile: 200 },
  { skill: "React", desktop: 237, mobile: 120 },
  { skill: "Node.js", desktop: 173, mobile: 190 },
  { skill: "CSS", desktop: 209, mobile: 130 },
  { skill: "Python", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  mobile: {
    label: "Mobile",
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
        dataKey="desktop"
        variant="filled" // [!code highlight]
        isClickable
      >
        <RadarChart.Dot variant="colored-border" />
        <RadarChart.ActiveDot variant="default" />
      </RadarChart.Radar>
      <RadarChart.Radar dataKey="mobile" variant="filled" isClickable>
        <RadarChart.Dot variant="colored-border" />
        <RadarChart.ActiveDot variant="default" />
      </RadarChart.Radar>
    </RadarChart>
  );
}
