"use client";

import { BoxPlot, type BoxPlotValue, type ChartConfig } from "@/registry/default/charts/box-plot";

const chartData = [
  { service: "Auth", current: [38, 52, 64, 78, 106], previous: [44, 59, 73, 88, 121] },
  { service: "Search", current: [56, 72, 86, 103, 139], previous: [61, 79, 95, 116, 154] },
  { service: "Checkout", current: [47, 63, 76, 91, 126], previous: [52, 68, 84, 101, 137] },
  { service: "Catalog", current: [32, 45, 57, 70, 96], previous: [37, 51, 63, 77, 105] },
  { service: "Profile", current: [41, 56, 69, 84, 115], previous: [46, 62, 77, 93, 128] },
] satisfies { service: string; current: BoxPlotValue; previous: BoxPlotValue }[];

const chartConfig = {
  current: {
    label: "Current",
    colors: { light: ["#0d9488"], dark: ["#2dd4bf"] },
  },
  previous: {
    label: "Previous",
    colors: { light: ["#94a3b8"], dark: ["#64748b"] },
  },
} satisfies ChartConfig;

export function LatencyBoxPlot() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-primary text-base font-medium tracking-tight sm:text-lg">
            Service latency
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Five-number distribution by service
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-primary text-xl font-semibold tracking-tight sm:text-2xl">−14.2%</p>
          <p className="text-muted-foreground text-[11px]">median latency</p>
        </div>
      </div>

      <BoxPlot
        data={chartData}
        config={chartConfig}
        xDataKey="service"
        className="mt-2 min-h-0 w-full flex-1"
        ariaLabel="Current and previous service latency distributions in milliseconds"
      >
        <BoxPlot.Grid />
        <BoxPlot.XAxis hideDots />
        <BoxPlot.YAxis hideDots tickFormatter={(value) => `${value} ms`} />
        <BoxPlot.Legend align="right" isClickable />
        <BoxPlot.Tooltip variant="frosted-glass" valueFormatter={(value) => `${value} ms`} />
        <BoxPlot.Box dataKey="previous" isClickable />
        <BoxPlot.Box dataKey="current" isClickable />
      </BoxPlot>
    </div>
  );
}
