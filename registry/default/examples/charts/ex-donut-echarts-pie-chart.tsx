"use client";

import { PieChart, type ChartConfig } from "@/registry/default/charts/pie-chart";

// Scenario: Household budget
const data = [
  { category: "housing", amount: 38 },
  { category: "food", amount: 24 },
  { category: "transport", amount: 16 },
  { category: "health", amount: 12 },
  { category: "savings", amount: 10 },
];

const chartConfig = {
  housing: {
    label: "Housing",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  food: {
    label: "Food",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  transport: {
    label: "Transport",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
  health: {
    label: "Health",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  savings: {
    label: "Savings",
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
      dataKey="amount"
      nameKey="category"
      config={chartConfig}
    >
      <PieChart.Legend isClickable />
      <PieChart.Tooltip />
      <PieChart.Pie
        isClickable
        innerRadius={60} // [!code highlight]
      />
    </PieChart>
  );
}
