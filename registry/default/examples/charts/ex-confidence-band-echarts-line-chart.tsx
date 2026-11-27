"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Weekly support tickets with a four-week forecast (sample data).
// The model supplies a 50% and an 80% interval for each future week; the last
// recorded week anchors both bands so they open from a known value.
const data = [
  { week: "W1", tickets: 182, status: "measured" },
  { week: "W2", tickets: 194, status: "measured" },
  { week: "W3", tickets: 176, status: "measured" },
  { week: "W4", tickets: 201, status: "measured" },
  { week: "W5", tickets: 213, status: "measured" },
  { week: "W6", tickets: 208, status: "measured", low50: 208, high50: 208, low80: 208, high80: 208 },
  { week: "W7", tickets: 219, status: "forecast", low50: 209, high50: 230, low80: 196, high80: 244 },
  { week: "W8", tickets: 226, status: "forecast", low50: 212, high50: 241, low80: 194, high80: 259 },
  { week: "W9", tickets: 231, status: "forecast", low50: 213, high50: 250, low80: 190, high80: 274 },
  { week: "W10", tickets: 237, status: "forecast", low50: 215, high50: 260, low80: 186, high80: 289 },
];

const chartConfig = {
  tickets: {
    label: "Tickets",
    colors: { light: ["#7c3aed"], dark: ["#a78bfa"] },
  },
} satisfies ChartConfig;

export function ExampleLineChart() {
  return (
    <LineChart data={data} config={chartConfig} className="h-full w-full p-4" xDataKey="week">
      <LineChart.Grid />
      <LineChart.XAxis dataKey="week" />
      <LineChart.YAxis />
      <LineChart.Tooltip />
      <LineChart.Band dataKey="tickets" lowerKey="low80" upperKey="high80" label="80% interval" />
      <LineChart.Band dataKey="tickets" lowerKey="low50" upperKey="high50" label="50% interval" />
      <LineChart.Line dataKey="tickets" statusKey="status" />
    </LineChart>
  );
}
