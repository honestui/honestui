"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Rental utilization
const data = [
  { month: "January", reserved: 509, available: 166 },
  { month: "February", reserved: 1236, available: 395 },
  { month: "March", reserved: 759, available: 257 },
  { month: "April", reserved: 927, available: 337 },
  { month: "May", reserved: 665, available: 284 },
  { month: "June", reserved: 1109, available: 357 },
  { month: "July", reserved: 601, available: 209 },
  { month: "August", reserved: 1323, available: 449 },
  { month: "September", reserved: 918, available: 319 },
  { month: "October", reserved: 775, available: 319 },
  { month: "November", reserved: 1149, available: 405 },
  { month: "December", reserved: 447, available: 148 },
];

const chartConfig = {
  reserved: {
    label: "Reserved",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  available: {
    label: "Available",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function LegendRoundedSquareLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.Legend variant="rounded-square" />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="reserved" />
      <LineChart.Line dataKey="available" />
    </LineChart>
  );
}
