"use client";

import { PieChart, type ChartConfig } from "@/registry/default/charts/pie-chart";

// Scenario: Course enrollment
const data = [
  { category: "science", students: 264 },
  { category: "arts", students: 218 },
  { category: "business", students: 176 },
  { category: "language", students: 132 },
  { category: "music", students: 88 },
];

const chartConfig = {
  science: {
    label: "Science",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  arts: {
    label: "Arts",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  business: {
    label: "Business",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
  language: {
    label: "Languages",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  music: {
    label: "Music",
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
      dataKey="students"
      nameKey="category"
      config={chartConfig}
    >
      <PieChart.Legend isClickable />
      <PieChart.Tooltip />
      <PieChart.Pie
        isClickable
        innerRadius={30} // [!code highlight]
        paddingAngle={4} // [!code highlight]
        cornerRadius={8} // [!code highlight]
      />
    </PieChart>
  );
}
