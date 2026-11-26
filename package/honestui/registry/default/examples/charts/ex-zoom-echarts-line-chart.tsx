"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Daily active users across a quarter
const data = Array.from({ length: 90 }, (_, i) => ({
  day: `Day ${i + 1}`,
  users: Math.round(4200 + i * 18 + Math.sin(i / 3.2) * 380 + Math.cos(i / 1.7) * 140),
}));

const chartConfig = {
  users: {
    label: "Active users",
    colors: { light: ["#0d9488"], dark: ["#2dd4bf"] },
  },
} satisfies ChartConfig;

export function ExampleZoomLineChart() {
  return (
    <LineChart data={data} config={chartConfig} xDataKey="day" className="h-full w-full p-4">
      <LineChart.Grid />
      <LineChart.XAxis tickFormatter={(value) => value.replace("Day ", "")} />
      <LineChart.Tooltip />
      <LineChart.Zoom /> {/* [!code highlight] */}
      <LineChart.Line dataKey="users" />
    </LineChart>
  );
}
