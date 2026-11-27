"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Daily storage written in gigabytes, stacked by region (sample
// data). The exporter was down from 7 to 9 November, so those days have no
// rows at all. On 13 November the US region did not report, so the EU layer
// stacked on it has no known height that day and is left out too; its own
// value still shows in the tooltip.
const data = [
  { date: "2026-11-01", us: 412, eu: 268 },
  { date: "2026-11-02", us: 428, eu: 274 },
  { date: "2026-11-03", us: 451, eu: 281 },
  { date: "2026-11-04", us: 437, eu: 290 },
  { date: "2026-11-05", us: 466, eu: 296 },
  { date: "2026-11-06", us: 459, eu: 288 },
  { date: "2026-11-10", us: 482, eu: 305 },
  { date: "2026-11-11", us: 476, eu: 311 },
  { date: "2026-11-12", us: 495, eu: 318 },
  { date: "2026-11-13", us: null, eu: 322 },
  { date: "2026-11-14", us: 509, eu: 326 },
  { date: "2026-11-15", us: 517, eu: 331 },
];

const chartConfig = {
  us: {
    label: "US",
    colors: { light: ["#0f766e"], dark: ["#2dd4bf"] },
  },
  eu: {
    label: "EU",
    colors: { light: ["#4f46e5"], dark: ["#818cf8"] },
  },
} satisfies ChartConfig;

const dayLabel = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export function ExampleAreaChart() {
  return (
    <AreaChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      stackType="stacked"
      xDataKey="date"
      gaps={{ interval: "day" }}
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="date" tickFormatter={dayLabel} />
      <AreaChart.YAxis />
      <AreaChart.Tooltip />
      <AreaChart.Legend />
      <AreaChart.Area dataKey="us" />
      <AreaChart.Area dataKey="eu" />
    </AreaChart>
  );
}
