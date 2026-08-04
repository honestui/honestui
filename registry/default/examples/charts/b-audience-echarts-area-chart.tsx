"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Bike rental demand
const chartData = [
  { month: "Jan", rentals: 3308 },
  { month: "Feb", rentals: 3463 },
  { month: "Mar", rentals: 3841 },
  { month: "Apr", rentals: 3752 },
  { month: "May", rentals: 4129 },
  { month: "Jun", rentals: 4640 },
  { month: "Jul", rentals: 5062 },
];

const chartConfig = {
  rentals: {
    label: "Bike rentals",
    colors: {
      light: ["#10b981", "#0ea5e9", "#8b5cf6"],
      dark: ["#34d399", "#38bdf8", "#a78bfa"],
    },
  },
} satisfies ChartConfig;

const TOTAL = chartData.reduce((sum, { rentals }) => sum + rentals, 0);

export function AudienceAreaChart() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-start justify-between gap-4 px-4 pt-4">
        <div className="flex flex-col gap-1">
          <span className="text-primary text-base font-medium tracking-tight sm:text-lg">
            Bike rentals
          </span>
          <span className="text-muted-foreground max-w-[26ch] text-xs leading-snug">
            Monthly trips across all docking stations
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-primary text-2xl font-semibold tracking-tight sm:text-4xl">
            {TOTAL.toLocaleString("en-US")}
          </span>
          <span className="text-muted-foreground text-xs">Total rentals</span>
        </div>
      </div>

      <div className="relative mt-2 min-h-0 w-full flex-1">
        <AreaChart
          data={chartData}
          config={chartConfig}
          xDataKey="month"
          className="h-full w-full"
          curveType="monotone"
          chartOptions={{
            grid: { left: 0, right: 0, top: 16, bottom: 0, outerBoundsMode: "none" },
            yAxis: { type: "value", show: false, scale: true, boundaryGap: ["16%", "20%"] },
          }}
        >
          <AreaChart.Tooltip variant="frosted-glass" />
          <AreaChart.Area
            dataKey="rentals"
            variant="gradient"
            strokeVariant="solid"
            strokeWidth={2.5}
          >
            <AreaChart.ActiveDot variant="ping" />
          </AreaChart.Area>
        </AreaChart>

        <div className="text-muted-foreground pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-4 pb-3 text-[10px] sm:text-xs">
          {chartData.map(({ month }) => (
            <span key={month}>{month}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
