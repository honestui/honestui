"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

const chartData = [
  { cohort: "Jan 08", plan: "pro", activation: 82, retention: 74 },
  { cohort: "Jan 15", plan: "pro", activation: 88, retention: 79 },
  { cohort: "Jan 22", plan: "pro", activation: 76, retention: 71 },
  { cohort: "Jan 29", plan: "pro", activation: 91, retention: 83 },
  { cohort: "Feb 05", plan: "pro", activation: 85, retention: 76 },
  { cohort: "Jan 08", plan: "starter", activation: 58, retention: 46 },
  { cohort: "Jan 15", plan: "starter", activation: 64, retention: 51 },
  { cohort: "Jan 22", plan: "starter", activation: 71, retention: 55 },
  { cohort: "Jan 29", plan: "starter", activation: 67, retention: 49 },
  { cohort: "Feb 05", plan: "starter", activation: 73, retention: 58 },
];

const chartConfig = {
  activation: { label: "Activation" },
  retention: { label: "Week-8 retention" },
  pro: { label: "Pro", colors: { light: ["#0d9488"], dark: ["#2dd4bf"] } },
  starter: { label: "Starter", colors: { light: ["#d97706"], dark: ["#fbbf24"] } },
} satisfies ChartConfig;

export function RetentionScatterChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-primary text-base font-medium tracking-tight sm:text-lg">
            Activation vs retention
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">Weekly acquisition cohorts</p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-4 text-right sm:gap-6">
          <div>
            <p className="text-muted-foreground text-[10px] tracking-wide uppercase">Slope</p>
            <p className="text-primary text-lg font-semibold tabular-nums">+0.82</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] tracking-wide uppercase">Cohorts</p>
            <p className="text-primary text-lg font-semibold tabular-nums">10</p>
          </div>
        </div>
      </div>

      <ScatterChart
        data={chartData}
        config={chartConfig}
        xDataKey="activation"
        yDataKey="retention"
        groupDataKey="plan"
        pointNameDataKey="cohort"
        className="mt-2 min-h-0 w-full flex-1"
        ariaLabel="Activation and eight-week retention by plan and weekly cohort"
      >
        <ScatterChart.Grid />
        <ScatterChart.XAxis min={45} max={100} hideDots tickFormatter={(value) => `${value}%`} />
        <ScatterChart.YAxis min={35} max={90} hideDots tickFormatter={(value) => `${value}%`} />
        <ScatterChart.Legend align="right" isClickable />
        <ScatterChart.Tooltip
          variant="frosted-glass"
          xValueFormatter={(value) => `${value}%`}
          yValueFormatter={(value) => `${value}%`}
        />
        <ScatterChart.Scatter dataKey="starter" symbol="diamond" symbolSize={11} isClickable />
        <ScatterChart.Scatter dataKey="pro" symbolSize={12} isClickable />
      </ScatterChart>
    </div>
  );
}
