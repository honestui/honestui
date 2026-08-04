"use client";

import { RadialChart, type ChartConfig } from "@/registry/default/charts/radial-chart";

// Scenario: Engineering coverage
const data = [
  { category: "frontend", coverage: 86 },
  { category: "backend", coverage: 74 },
  { category: "data", coverage: 63 },
  { category: "devops", coverage: 55 },
  { category: "security", coverage: 42 },
];

const chartConfig = {
  frontend: {
    label: "Frontend",
    colors: {
      light: ["#ff6b6b", "#feca57", "#48dbfb"], // Coral -> Gold -> Electric Blue // [!code highlight]
      dark: ["#ff7979", "#ffeaa7", "#74b9ff"], // [!code highlight]
    },
  },
  backend: {
    label: "Backend",
    colors: {
      light: ["#a29bfe", "#fd79a8", "#fdcb6e"], // Lavender -> Pink -> Sunflower // [!code highlight]
      dark: ["#b8b5ff", "#ff9ff3", "#ffeaa7"], // [!code highlight]
    },
  },
  data: {
    label: "Data",
    colors: {
      light: ["#00d2d3", "#54a0ff", "#5f27cd"], // Turquoise -> Blue -> Purple // [!code highlight]
      dark: ["#01e2e3", "#74b9ff", "#7c3aed"], // [!code highlight]
    },
  },
  devops: {
    label: "DevOps",
    colors: {
      light: ["#ff9f43", "#ee5a24", "#b71540"], // Tangerine -> Vermillion -> Wine // [!code highlight]
      dark: ["#ffbe76", "#f0932b", "#e74c3c"], // [!code highlight]
    },
  },
  security: {
    label: "Security",
    colors: {
      light: ["#1dd1a1", "#10ac84", "#01a3a4"], // Mint -> Jungle -> Teal // [!code highlight]
      dark: ["#55efc4", "#00b894", "#00cec9"], // [!code highlight]
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
    >
      <RadialChart.Legend />
      <RadialChart.Tooltip />
      <RadialChart.RadialBar dataKey="coverage" />
    </RadialChart>
  );
}
