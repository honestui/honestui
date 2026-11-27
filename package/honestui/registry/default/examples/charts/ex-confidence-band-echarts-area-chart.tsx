"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Daily active users in thousands with a five-day forecast (sample
// data). The model supplies a 50% and a 90% interval; the last recorded day
// anchors both bands so they open from a known value.
const data = [
  { day: "Nov 16", users: 48.2, status: "measured" },
  { day: "Nov 17", users: 51.6, status: "measured" },
  { day: "Nov 18", users: 50.1, status: "measured" },
  { day: "Nov 19", users: 53.4, status: "measured" },
  { day: "Nov 20", users: 55.0, status: "measured", low50: 55.0, high50: 55.0, low90: 55.0, high90: 55.0 },
  { day: "Nov 21", users: 49.8, status: "forecast", low50: 47.9, high50: 51.6, low90: 45.1, high90: 54.4 },
  { day: "Nov 22", users: 47.3, status: "forecast", low50: 44.8, high50: 49.9, low90: 41.2, high90: 53.6 },
  { day: "Nov 23", users: 54.1, status: "forecast", low50: 51.0, high50: 57.3, low90: 46.5, high90: 61.9 },
  { day: "Nov 24", users: 56.0, status: "forecast", low50: 52.4, high50: 59.7, low90: 47.2, high90: 64.8 },
  { day: "Nov 25", users: 55.2, status: "forecast", low50: 51.1, high50: 59.4, low90: 45.3, high90: 65.2 },
];

const chartConfig = {
  users: {
    label: "Active users (k)",
    colors: { light: ["#7c3aed"], dark: ["#a78bfa"] },
  },
} satisfies ChartConfig;

export function ExampleAreaChart() {
  return (
    <AreaChart data={data} config={chartConfig} className="h-full w-full p-4" xDataKey="day">
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="day" />
      <AreaChart.YAxis />
      <AreaChart.Tooltip />
      <AreaChart.Band dataKey="users" lowerKey="low90" upperKey="high90" label="90% interval" />
      <AreaChart.Band dataKey="users" lowerKey="low50" upperKey="high50" label="50% interval" />
      <AreaChart.Area dataKey="users" statusKey="status" />
    </AreaChart>
  );
}
