"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

const data = [
  { initiative: "Self-serve onboarding", effort: 32, impact: 86 },
  { initiative: "Billing migration", effort: 78, impact: 91 },
  { initiative: "Search redesign", effort: 61, impact: 72 },
  { initiative: "Export presets", effort: 28, impact: 63 },
  { initiative: "Theme editor", effort: 69, impact: 38 },
  { initiative: "Keyboard shortcuts", effort: 22, impact: 46 },
  { initiative: "Legacy cleanup", effort: 81, impact: 24 },
  { initiative: "Saved filters", effort: 43, impact: 78 },
  { initiative: "Audit trail", effort: 54, impact: 57 },
];

const chartConfig = {
  effort: { label: "Effort" },
  impact: { label: "Impact" },
  initiatives: {
    label: "Initiatives",
    colors: { light: ["#d97706"], dark: ["#fbbf24"] },
  },
} satisfies ChartConfig;

export function QuadrantScatterChart() {
  return (
    <ScatterChart
      data={data}
      config={chartConfig}
      xDataKey="effort"
      yDataKey="impact"
      pointNameDataKey="initiative"
      className="h-full w-full p-4"
    >
      <ScatterChart.XAxis min={0} max={100} label="Effort" hideDots />
      <ScatterChart.YAxis min={0} max={100} label="Impact" hideDots />
      <ScatterChart.Quadrants
        xSplit={50}
        ySplit={50}
        labels={{
          topLeft: "Quick wins",
          topRight: "Strategic",
          bottomLeft: "Fill-ins",
          bottomRight: "Reconsider",
        }}
      />
      <ScatterChart.Tooltip
        xValueFormatter={(value) => `${value}/100`}
        yValueFormatter={(value) => `${value}/100`}
      />
      <ScatterChart.Scatter dataKey="initiatives" symbolSize={12} isClickable />
    </ScatterChart>
  );
}
