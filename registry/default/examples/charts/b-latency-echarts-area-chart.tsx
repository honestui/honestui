"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Scenario: Marathon finish percentiles
const SERIES = [
  { key: "p99", label: "P99", color: "#D41F12", latest: 204 },
  { key: "p95", label: "P95", color: "#F37A00", latest: 98 },
  { key: "p75", label: "P75", color: "#62C9D4", latest: 46 },
  { key: "p50", label: "P50", color: "#007292", latest: 21 },
] as const;

const chartData = [
  { time: "Race 13:06", p99: 209, p95: 102, p75: 49, p50: 22 },
  { time: "Race 13:07", p99: 218, p95: 105, p75: 51, p50: 23 },
  { time: "Race 13:08", p99: 201, p95: 99, p75: 48, p50: 22 },
  { time: "Race 13:09", p99: 213, p95: 104, p75: 52, p50: 24 },
  { time: "Race 13:10", p99: 228, p95: 110, p75: 50, p50: 23 },
  { time: "Race 13:11", p99: 208, p95: 101, p75: 49, p50: 22 },
  { time: "Race 13:12", p99: 199, p95: 98, p75: 47, p50: 21 },
  { time: "Race 13:13", p99: 220, p95: 107, p75: 51, p50: 23 },
  { time: "Race 13:14", p99: 233, p95: 112, p75: 53, p50: 24 },
  { time: "Race 13:15", p99: 215, p95: 103, p75: 50, p50: 23 },
  { time: "Race 13:16", p99: 224, p95: 108, p75: 52, p50: 24 },
  { time: "Race 13:17", p99: 239, p95: 115, p75: 54, p50: 26 },
  { time: "Race 13:18", p99: 256, p95: 124, p75: 58, p50: 26 },
  { time: "Race 13:19", p99: 309, p95: 145, p75: 63, p50: 27 },
  { time: "Race 13:20", p99: 340, p95: 158, p75: 68, p50: 28 },
  { time: "Race 13:21", p99: 321, p95: 150, p75: 64, p50: 27 },
  { time: "Race 13:22", p99: 274, p95: 131, p75: 59, p50: 26 },
  { time: "Race 13:23", p99: 240, p95: 117, p75: 54, p50: 24 },
  { time: "Race 13:24", p99: 223, p95: 108, p75: 51, p50: 23 },
  { time: "Race 13:25", p99: 214, p95: 104, p75: 50, p50: 23 },
  { time: "Race 13:26", p99: 206, p95: 100, p75: 49, p50: 22 },
  { time: "Race 13:27", p99: 221, p95: 107, p75: 51, p50: 23 },
  { time: "Race 13:28", p99: 230, p95: 111, p75: 52, p50: 24 },
  { time: "Race 13:29", p99: 212, p95: 102, p75: 50, p50: 22 },
  { time: "Race 13:30", p99: 204, p95: 99, p75: 48, p50: 22 },
  { time: "Race 13:31", p99: 218, p95: 105, p75: 51, p50: 23 },
  { time: "Race 13:32", p99: 232, p95: 112, p75: 53, p50: 24 },
  { time: "Race 13:33", p99: 220, p95: 107, p75: 51, p50: 23 },
  { time: "Race 13:34", p99: 226, p95: 109, p75: 51, p50: 23 },
];

const chartConfig = {
  p99: { label: "P99", colors: { light: ["#f87171"], dark: ["#D41F12"] } },
  p95: { label: "P95", colors: { light: ["#fbbf24"], dark: ["#F37A00"] } },
  p75: { label: "P75", colors: { light: ["#60a5fa"], dark: ["#62C9D4"] } },
  p50: { label: "P50", colors: { light: ["#93c5fd"], dark: ["#007292"] } },
} satisfies ChartConfig;

export function LatencyAreaChart() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="grid grid-cols-2 gap-y-2 sm:grid-cols-4 sm:gap-y-4">
        {SERIES.map(({ key, label, color, latest }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelected((prev) => (prev === key ? null : key))}
            className={cn(
              "border-border flex cursor-pointer flex-row items-center gap-1.5 px-3 text-left transition-opacity sm:flex-col sm:items-start sm:gap-1.5 sm:px-4 sm:first:pl-1 sm:[&:not(:first-child)]:border-l [&:nth-child(even)]:border-l",
              selected !== null && selected !== key && "opacity-40",
            )}
          >
            <div className="text-primary flex items-center gap-1.5 text-xs font-medium sm:gap-2">
              <span className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
              {label}
            </div>
            <span className="text-muted-foreground text-xs sm:hidden">–</span>
            <div className="leading-none">
              <span className="text-primary text-sm font-medium tracking-tight sm:text-xl">
                {latest}
              </span>
              <span className="text-muted-foreground ml-0.5 text-xs font-light sm:ml-1 sm:text-sm">
                ms
              </span>
            </div>
          </button>
        ))}
      </div>
      <AreaChart
        data={chartData}
        config={chartConfig}
        xDataKey="time"
        className="mt-4 min-h-0 w-full flex-1"
        curveType="linear"
        enableHoverHighlight
        selectedDataKey={selected}
        onSelectionChange={setSelected}
      >
        <AreaChart.Grid />
        <AreaChart.XAxis
          dataKey="time"
          label="Time (UTC)"
          tickFormatter={(value) => value.replace("Race ", "")}
        />
        <AreaChart.YAxis />
        <AreaChart.Tooltip />
        <AreaChart.Area dataKey="p50" variant="gradient" strokeVariant="solid" isClickable />
        <AreaChart.Area dataKey="p75" variant="gradient" strokeVariant="solid" isClickable />
        <AreaChart.Area dataKey="p95" variant="gradient" strokeVariant="solid" isClickable />
        <AreaChart.Area dataKey="p99" variant="gradient" strokeVariant="solid" isClickable />
      </AreaChart>
    </div>
  );
}
