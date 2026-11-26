"use client";

import { RadialChart, type ChartConfig } from "@/registry/default/charts/radial-chart";

// Scenario: Visitors by browser this month
const data = [
  { browser: "chrome", visitors: 4280 },
  { browser: "safari", visitors: 2960 },
  { browser: "firefox", visitors: 1540 },
  { browser: "edge", visitors: 980 },
];

const chartConfig = {
  visitors: { label: "Visitors" },
  chrome: { label: "Chrome", colors: { light: ["#3b82f6"], dark: ["#60a5fa"] } },
  safari: { label: "Safari", colors: { light: ["#10b981"], dark: ["#34d399"] } },
  firefox: { label: "Firefox", colors: { light: ["#f59e0b"], dark: ["#fbbf24"] } },
  edge: { label: "Edge", colors: { light: ["#8b5cf6"], dark: ["#a78bfa"] } },
} satisfies ChartConfig;

export function ExampleRadialChart() {
  return (
    <RadialChart
      className="h-full w-full p-4"
      data={data}
      dataKey="visitors"
      nameKey="browser"
      config={chartConfig}
      innerRadius="38%"
    >
      <RadialChart.Bar isClickable />
      <RadialChart.Center label="Visitors" />
      <RadialChart.Legend isClickable />
      <RadialChart.Tooltip />
    </RadialChart>
  );
}
