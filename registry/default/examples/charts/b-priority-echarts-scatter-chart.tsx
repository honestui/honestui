"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

const chartData = [
  { project: "Onboarding", effort: 28, impact: 89, confidence: 92 },
  { project: "Team billing", effort: 72, impact: 86, confidence: 76 },
  { project: "Saved views", effort: 39, impact: 73, confidence: 84 },
  { project: "Search v2", effort: 64, impact: 68, confidence: 71 },
  { project: "Bulk actions", effort: 43, impact: 55, confidence: 65 },
  { project: "Theme builder", effort: 77, impact: 37, confidence: 58 },
  { project: "CSV presets", effort: 24, impact: 42, confidence: 88 },
  { project: "Legacy cleanup", effort: 83, impact: 22, confidence: 95 },
];

const chartConfig = {
  effort: { label: "Effort" },
  impact: { label: "Impact" },
  confidence: { label: "Confidence" },
  roadmap: {
    label: "Roadmap",
    colors: {
      light: ["#fef3c7", "#d97706"],
      dark: ["#78350f", "#fbbf24"],
    },
  },
} satisfies ChartConfig;

export function PriorityScatterChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-primary text-base font-medium tracking-tight sm:text-lg">
            Roadmap priority
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Bubble area represents confidence
          </p>
        </div>
        <span className="border-border bg-muted/40 text-primary rounded-md border px-2.5 py-1.5 text-xs font-medium">
          8 candidates
        </span>
      </div>

      <ScatterChart
        data={chartData}
        config={chartConfig}
        xDataKey="effort"
        yDataKey="impact"
        pointNameDataKey="project"
        className="mt-2 min-h-0 w-full flex-1"
        ariaLabel="Roadmap initiatives by effort, impact, and confidence"
      >
        <ScatterChart.XAxis min={0} max={100} hideDots />
        <ScatterChart.YAxis min={0} max={100} hideDots />
        <ScatterChart.Quadrants
          xSplit={50}
          ySplit={50}
          labels={{
            topLeft: "Do now",
            topRight: "Plan",
            bottomLeft: "Opportunistic",
            bottomRight: "Defer",
          }}
        />
        <ScatterChart.Tooltip sizeValueFormatter={(value) => `${value}%`} />
        <ScatterChart.Scatter
          dataKey="roadmap"
          variant="bubble"
          sizeDataKey="confidence"
          minSize={11}
          maxSize={28}
          isClickable
        />
      </ScatterChart>
    </div>
  );
}
