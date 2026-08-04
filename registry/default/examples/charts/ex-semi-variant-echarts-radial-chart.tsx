"use client";

import { RadialChart, type ChartConfig } from "@/registry/default/charts/radial-chart";

// Scenario: Wellness goals
const data = [
  { category: "movement", completion: 88 },
  { category: "sleep", completion: 72 },
  { category: "hydration", completion: 66 },
  { category: "mindfulness", completion: 51 },
  { category: "recovery", completion: 43 },
];

const chartConfig = {
  movement: {
    label: "Movement",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  sleep: {
    label: "Sleep",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  hydration: {
    label: "Hydration",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
  mindfulness: {
    label: "Mindfulness",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  recovery: {
    label: "Recovery",
    colors: {
      light: ["#6b7280"],
      dark: ["#9ca3af"],
    },
  },
} satisfies ChartConfig;

export function ExampleRadialChart() {
  return (
    <RadialChart
      className="h-full w-full p-4"
      data={data}
      nameKey="category"
      config={chartConfig}
      variant="semi" // [!code highlight]
    >
      <RadialChart.Legend />
      <RadialChart.Tooltip />
      <RadialChart.RadialBar dataKey="completion" />
    </RadialChart>
  );
}
