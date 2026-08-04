"use client";

import { PieChart, type ChartConfig } from "@/registry/default/charts/pie-chart";

// Scenario: Shipment destinations
const data = [
  { category: "north", parcels: 275 },
  { category: "south", parcels: 230 },
  { category: "east", parcels: 195 },
  { category: "west", parcels: 160 },
  { category: "central", parcels: 115 },
];

const chartConfig = {
  north: {
    label: "North",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  south: {
    label: "South",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  east: {
    label: "East",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
  west: {
    label: "West",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  central: {
    label: "Central",
    colors: {
      light: ["#6b7280"],
      dark: ["#9ca3af"],
    },
  },
} satisfies ChartConfig;

export function ExamplePieChart() {
  return (
    <PieChart
      className="h-full w-full p-4"
      data={data}
      dataKey="parcels"
      nameKey="category"
      config={chartConfig}
    >
      <PieChart.Legend isClickable />
      <PieChart.Tooltip />
      <PieChart.Pie innerRadius={60} paddingAngle={-25} cornerRadius={99} />
    </PieChart>
  );
}
