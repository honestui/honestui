"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

// Scenario: Emergency preparedness plan
const chartData = [
  { project: "Backup generators", effort: 31, impact: 99, confidence: 102 },
  { project: "Flood barriers", effort: 80, impact: 95, confidence: 84 },
  { project: "Radio network", effort: 43, impact: 81, confidence: 93 },
  { project: "Shelter supplies", effort: 71, impact: 75, confidence: 79 },
  { project: "Evacuation signs", effort: 48, impact: 61, confidence: 72 },
  { project: "Volunteer training", effort: 85, impact: 41, confidence: 64 },
  { project: "Water storage", effort: 27, impact: 47, confidence: 98 },
  { project: "Siren replacement", effort: 92, impact: 24, confidence: 105 },
];

const chartConfig = {
  effort: { label: "Cost" },
  impact: { label: "Readiness gain" },
  confidence: { label: "Feasibility" },
  roadmap: {
    label: "Preparedness",
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
            Emergency readiness
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
        ariaLabel="Preparedness projects by cost, readiness gain, and feasibility"
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
