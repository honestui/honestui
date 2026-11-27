"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Daily sign-ups (sample data). The tracker was down from 7 to 9
// November, so those days have no rows at all, and 13 November has no value.
const data = [
  { date: "2026-11-01", signups: 148 },
  { date: "2026-11-02", signups: 156 },
  { date: "2026-11-03", signups: 171 },
  { date: "2026-11-04", signups: 165 },
  { date: "2026-11-05", signups: 182 },
  { date: "2026-11-06", signups: 177 },
  { date: "2026-11-10", signups: 190 },
  { date: "2026-11-11", signups: 186 },
  { date: "2026-11-12", signups: 198 },
  { date: "2026-11-13", signups: null },
  { date: "2026-11-14", signups: 204 },
  { date: "2026-11-15", signups: 211 },
];

const chartConfig = {
  signups: {
    label: "Sign-ups",
    colors: { light: ["#0f766e"], dark: ["#2dd4bf"] },
  },
} satisfies ChartConfig;

const dayLabel = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export function ExampleLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="date"
      gaps={{ interval: "day" }}
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="date" tickFormatter={dayLabel} />
      <LineChart.YAxis />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="signups">
        <LineChart.Dot variant="border" />
      </LineChart.Line>
    </LineChart>
  );
}
