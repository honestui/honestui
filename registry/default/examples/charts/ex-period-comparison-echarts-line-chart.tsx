"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Weekly signups compared with the same weeks last quarter
const data = [
  { week: "W1", signups: 412, previous: 365 },
  { week: "W2", signups: 438, previous: 381 },
  { week: "W3", signups: 401, previous: 398 },
  { week: "W4", signups: 476, previous: 402 },
  { week: "W5", signups: 512, previous: 431 },
  { week: "W6", signups: 498, previous: 455 },
  { week: "W7", signups: 545, previous: 447 },
  { week: "W8", signups: 581, previous: 470 },
  { week: "W9", signups: 566, previous: 489 },
  { week: "W10", signups: 604, previous: 502 },
  { week: "W11", signups: 631, previous: 520 },
  { week: "W12", signups: 662, previous: 534 },
];

const chartConfig = {
  signups: {
    label: "Signups",
    colors: { light: ["#7c3aed"], dark: ["#a78bfa"] },
  },
  previous: { label: "Last quarter" },
} satisfies ChartConfig;

export function ExamplePeriodComparisonLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      xDataKey="week"
      curveType="monotone"
      className="h-full w-full p-4"
    >
      <LineChart.Grid />
      <LineChart.XAxis />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="signups" compareDataKey="previous" /> {/* [!code highlight] */}
    </LineChart>
  );
}
