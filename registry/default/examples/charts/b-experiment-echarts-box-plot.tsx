"use client";

import { BoxPlot, type BoxPlotValue, type ChartConfig } from "@/registry/default/charts/box-plot";

// Scenario: Seed treatment field trial
const chartData = [
  { cohort: "Wheat", control: [2.8, 4.1, 5.2, 6.4, 8.1], treatment: [3.2, 4.8, 6.1, 7.4, 9.2] },
  { cohort: "Barley", control: [4.2, 5.6, 6.8, 8.1, 10.4], treatment: [4.7, 6.3, 7.7, 9.1, 11.6] },
  { cohort: "Oats", control: [2.4, 3.7, 4.8, 6.0, 7.8], treatment: [2.9, 4.3, 5.7, 6.9, 8.7] },
  { cohort: "Rye", control: [3.6, 4.9, 6.3, 7.6, 9.8], treatment: [4.1, 5.7, 7.1, 8.5, 10.7] },
] satisfies { cohort: string; control: BoxPlotValue; treatment: BoxPlotValue }[];

const chartConfig = {
  control: {
    label: "Untreated",
    colors: { light: ["#a1a1aa"], dark: ["#71717a"] },
  },
  treatment: {
    label: "Treated",
    colors: {
      light: ["#ede9fe", "#8b5cf6", "#5b21b6"],
      dark: ["#4c1d95", "#8b5cf6", "#c4b5fd"],
    },
  },
} satisfies ChartConfig;

export function ExperimentBoxPlot() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-primary text-base font-medium tracking-tight sm:text-lg">
            Checkout conversion
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">Field trial 84 · 10 weeks</p>
        </div>
        <div className="border-border bg-muted/40 flex items-center gap-2 rounded-md border px-2.5 py-1.5">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="text-primary text-xs font-medium">Treated plots +9.8%</span>
        </div>
      </div>

      <BoxPlot
        data={chartData}
        config={chartConfig}
        xDataKey="cohort"
        className="mt-2 min-h-0 w-full flex-1"
        ariaLabel="Untreated and treated crop-yield distributions by variety"
      >
        <BoxPlot.Grid />
        <BoxPlot.XAxis hideDots />
        <BoxPlot.YAxis min={0} max={12} hideDots tickFormatter={(value) => `${value}%`} />
        <BoxPlot.Legend isClickable />
        <BoxPlot.Tooltip valueFormatter={(value) => `${value.toFixed(1)}%`} />
        <BoxPlot.Box dataKey="control" isClickable />
        <BoxPlot.Box dataKey="treatment" variant="blocks" isClickable />
      </BoxPlot>
    </div>
  );
}
