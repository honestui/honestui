"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Farmers market
const data = [
  { month: "January", produce: 241 },
  { month: "February", produce: 379 },
  { month: "March", produce: 318 },
  { month: "April", produce: 260 },
  { month: "May", produce: 266 },
  { month: "June", produce: 282 },
];

const chartConfig = {
  produce: {
    label: "Produce sales",
    colors: {
      light: ["#2563eb"],
      dark: ["#3b82f6"],
    },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      layout="horizontal" // [!code highlight]
    >
      <BarChart.Grid />
      <BarChart.YAxis
        dataKey="month"
        tickFormatter={(value) => value.substring(0, 3)} // [!code highlight]
      />
      <BarChart.Legend />
      <BarChart.Tooltip />
      <BarChart.Bar dataKey="produce" variant="default" />
    </BarChart>
  );
}
