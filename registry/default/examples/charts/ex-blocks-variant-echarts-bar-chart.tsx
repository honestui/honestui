"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Warehouse throughput
const data = [
  { month: "January", received: 212 },
  { month: "February", received: 554 },
  { month: "March", received: 339 },
  { month: "April", received: 423 },
  { month: "May", received: 284 },
  { month: "June", received: 495 },
  { month: "July", received: 266 },
  { month: "August", received: 607 },
  { month: "September", received: 401 },
  { month: "October", received: 341 },
  { month: "November", received: 520 },
  { month: "December", received: 201 },
];

const chartConfig = {
  received: {
    label: "Received",
    colors: {
      light: ["#0a0a0a"],
      dark: ["#fafafa"],
    },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      barCategoryGap={32}
    >
      <BarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <BarChart.Tooltip />
      <BarChart.Bar
        dataKey="received"
        variant="blocks" // [!code highlight]
      />
    </BarChart>
  );
}
