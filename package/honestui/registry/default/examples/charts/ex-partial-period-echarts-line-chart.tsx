"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Monthly revenue in thousands of dollars (sample data).
// November is 26 days in, so its total is still coming in.
const data = [
  { month: "Jun", revenue: 412 },
  { month: "Jul", revenue: 438 },
  { month: "Aug", revenue: 425 },
  { month: "Sep", revenue: 451 },
  { month: "Oct", revenue: 468 },
  { month: "Nov", revenue: 397 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    colors: { light: ["#2563eb"], dark: ["#60a5fa"] },
  },
} satisfies ChartConfig;

export function ExampleLineChart() {
  return (
    <LineChart data={data} config={chartConfig} className="h-full w-full p-4" xDataKey="month">
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" />
      <LineChart.YAxis tickFormatter={(value) => `$${value}k`} />
      <LineChart.Tooltip />
      <LineChart.PartialPeriod x="Nov" label="Month to date" progress={26 / 30} />
      <LineChart.Line dataKey="revenue">
        <LineChart.Dot variant="border" />
        <LineChart.ActiveDot variant="colored-border" />
      </LineChart.Line>
    </LineChart>
  );
}
