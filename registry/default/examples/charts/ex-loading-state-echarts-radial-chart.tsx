"use client";

import { RadialChart, type ChartConfig } from "@/registry/default/charts/radial-chart";

// Scenario: Fleet availability
const data = [
  { category: "available", vehicles: 118 },
  { category: "service", vehicles: 84 },
  { category: "maintenance", vehicles: 26 },
  { category: "charging", vehicles: 19 },
  { category: "retired", vehicles: 7 },
];

const chartConfig = {
  available: {
    label: "Available",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  service: {
    label: "In service",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  maintenance: {
    label: "Maintenance",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
  charging: {
    label: "Charging",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  retired: {
    label: "Retired",
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
      isLoading // [!code highlight]
    >
      <RadialChart.Legend />
      <RadialChart.Tooltip />
      <RadialChart.RadialBar dataKey="vehicles" />
    </RadialChart>
  );
}
