"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Search quality
const data = [
  { month: "January", relevant: 300, irrelevant: 200 },
  { month: "February", relevant: 690, irrelevant: 477 },
  { month: "March", relevant: 443, irrelevant: 307 },
  { month: "April", relevant: 537, irrelevant: 403 },
  { month: "May", relevant: 382, irrelevant: 338 },
  { month: "June", relevant: 623, irrelevant: 433 },
  { month: "July", relevant: 359, irrelevant: 251 },
  { month: "August", relevant: 747, irrelevant: 542 },
  { month: "September", relevant: 516, irrelevant: 382 },
  { month: "October", relevant: 446, irrelevant: 380 },
  { month: "November", relevant: 649, irrelevant: 491 },
  { month: "December", relevant: 282, irrelevant: 176 },
];

const chartConfig = {
  relevant: {
    label: "Relevant",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  irrelevant: {
    label: "Irrelevant",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function LegendSquareLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.Legend variant="square" />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="relevant" />
      <LineChart.Line dataKey="irrelevant" />
    </LineChart>
  );
}
