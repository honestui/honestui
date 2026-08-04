"use client";

import { PieChart, type ChartConfig } from "@/registry/default/charts/pie-chart";

// Scenario: Support request reasons
const data = [
  { category: "billing", tickets: 184 },
  { category: "setup", tickets: 156 },
  { category: "bugs", tickets: 121 },
  { category: "requests", tickets: 98 },
  { category: "feedback", tickets: 64 },
];

const chartConfig = {
  billing: {
    label: "Billing",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  setup: {
    label: "Setup",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  bugs: {
    label: "Bugs",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
  requests: {
    label: "Feature requests",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  feedback: {
    label: "Feedback",
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
      dataKey="tickets"
      nameKey="category"
      config={chartConfig}
    >
      <PieChart.Legend isClickable />
      <PieChart.Tooltip />
      <PieChart.Pie isClickable innerRadius={30} paddingAngle={4} cornerRadius={8}>
        <PieChart.Label // [!code highlight]
        />
      </PieChart.Pie>
    </PieChart>
  );
}
