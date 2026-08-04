"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

// Scenario: Language learning outcomes
const chartData = [
  { cohort: "Jan 08", plan: "guided", practice: 91, fluency: 82 },
  { cohort: "Jan 15", plan: "guided", practice: 98, fluency: 88 },
  { cohort: "Jan 22", plan: "guided", practice: 84, fluency: 79 },
  { cohort: "Jan 29", plan: "guided", practice: 101, fluency: 92 },
  { cohort: "Feb 05", plan: "guided", practice: 94, fluency: 84 },
  { cohort: "Jan 08", plan: "selfPaced", practice: 64, fluency: 51 },
  { cohort: "Jan 15", plan: "selfPaced", practice: 71, fluency: 57 },
  { cohort: "Jan 22", plan: "selfPaced", practice: 79, fluency: 61 },
  { cohort: "Jan 29", plan: "selfPaced", practice: 74, fluency: 54 },
  { cohort: "Feb 05", plan: "selfPaced", practice: 81, fluency: 64 },
];

const chartConfig = {
  practice: { label: "Practice frequency" },
  fluency: { label: "Week-8 fluency" },
  guided: { label: "Guided", colors: { light: ["#0d9488"], dark: ["#2dd4bf"] } },
  selfPaced: { label: "Self-paced", colors: { light: ["#d97706"], dark: ["#fbbf24"] } },
} satisfies ChartConfig;

export function RetentionScatterChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-primary text-base font-medium tracking-tight sm:text-lg">
            Practice frequency vs fluency
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">Monthly learner cohorts</p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-4 text-right sm:gap-6">
          <div>
            <p className="text-muted-foreground text-[10px] tracking-wide uppercase">Correlation</p>
            <p className="text-primary text-lg font-semibold tabular-nums">+0.74</p>
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
        xDataKey="practice"
        yDataKey="fluency"
        groupDataKey="plan"
        pointNameDataKey="cohort"
        className="mt-2 min-h-0 w-full flex-1"
        ariaLabel="Practice frequency and eight-week fluency by plan and weekly cohort"
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
        <ScatterChart.Scatter dataKey="selfPaced" symbol="diamond" symbolSize={11} isClickable />
        <ScatterChart.Scatter dataKey="guided" symbolSize={12} isClickable />
      </ScatterChart>
    </div>
  );
}
