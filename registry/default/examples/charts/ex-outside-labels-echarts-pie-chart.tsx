"use client";

import { PieChart, type ChartConfig } from "@/registry/default/charts/pie-chart";

// Scenario: Music listening
const data = [
  { category: "jazz", hours: 142 },
  { category: "electronic", hours: 128 },
  { category: "classical", hours: 105 },
  { category: "hipHop", hours: 92 },
  { category: "folk", hours: 68 },
];

const chartConfig = {
  jazz: {
    label: "Jazz",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  electronic: {
    label: "Electronic",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  classical: {
    label: "Classical",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
  hipHop: {
    label: "Hip-hop",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  folk: {
    label: "Folk",
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
      dataKey="hours"
      nameKey="category"
      config={chartConfig}
    >
      <PieChart.Tooltip />
      <PieChart.Pie outerRadius="65%" paddingAngle={2} cornerRadius={4}>
        <PieChart.Label
          position="outside" // [!code highlight]
        />
      </PieChart.Pie>
    </PieChart>
  );
}
