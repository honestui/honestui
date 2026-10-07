"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Monthly revenue in thousands of dollars (sample data).
// October is still open, and November and December are a forecast with bounds.
const data = [
  { month: "January", revenue: 312, status: "measured" },
  { month: "February", revenue: 298, status: "measured" },
  { month: "March", revenue: 341, status: "measured" },
  { month: "April", revenue: 356, status: "measured" },
  { month: "May", revenue: 349, status: "measured" },
  { month: "June", revenue: 384, status: "measured" },
  { month: "July", revenue: 402, status: "measured" },
  { month: "August", revenue: 391, status: "measured" },
  { month: "September", revenue: 428, status: "measured" },
  { month: "October", revenue: 187, status: "provisional" },
  { month: "November", revenue: 436, status: "forecast", low: 398, high: 471 },
  { month: "December", revenue: 452, status: "forecast", low: 392, high: 509 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    colors: {
      light: ["#1d4ed8"],
      dark: ["#60a5fa"],
    },
  },
} satisfies ChartConfig;

export function ExampleLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
      ariaLabel="Sample monthly revenue. January to September are measured, October is provisional, and November and December are forecast."
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.YAxis />
      <LineChart.Tooltip />
      <LineChart.Line
        dataKey="revenue"
        statusKey="status" // [!code highlight]
        lowerKey="low" // [!code highlight]
        upperKey="high" // [!code highlight]
      >
        <LineChart.Dot variant="border" />
        <LineChart.ActiveDot variant="colored-border" />
      </LineChart.Line>
    </LineChart>
  );
}
