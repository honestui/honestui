"use client";

import { PieChart, type ChartConfig } from "@/registry/default/charts/pie-chart";

// Scenario: Inventory status
const data = [
  { category: "available", units: 410 },
  { category: "reserved", units: 225 },
  { category: "transit", units: 170 },
  { category: "inspection", units: 90 },
  { category: "damaged", units: 35 },
];

const chartConfig = {
  available: {
    label: "Available",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  reserved: {
    label: "Reserved",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  transit: {
    label: "In transit",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
  inspection: {
    label: "Inspection",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  damaged: {
    label: "Damaged",
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
      dataKey="units"
      nameKey="category"
      config={chartConfig}
      isLoading // [!code highlight]
    >
      <PieChart.Legend isClickable />
      <PieChart.Tooltip />
      <PieChart.Pie isClickable />
    </PieChart>
  );
}
