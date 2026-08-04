"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

// Scenario: Conservation project planning
const data = [
  { project: "Wetland restoration", cost: 37, habitatGain: 101 },
  { project: "River cleanup", cost: 91, habitatGain: 106 },
  { project: "Forest corridor", cost: 71, habitatGain: 84 },
  { project: "Pollinator garden", cost: 33, habitatGain: 74 },
  { project: "Trail reroute", cost: 81, habitatGain: 44 },
  { project: "Nest boxes", cost: 26, habitatGain: 54 },
  { project: "Invasive removal", cost: 95, habitatGain: 28 },
  { project: "Prairie seeding", cost: 50, habitatGain: 91 },
  { project: "Stream monitoring", cost: 63, habitatGain: 67 },
];

const chartConfig = {
  cost: { label: "Cost" },
  habitatGain: { label: "Habitat gain" },
  initiatives: {
    label: "Projects",
    colors: { light: ["#d97706"], dark: ["#fbbf24"] },
  },
} satisfies ChartConfig;

export function QuadrantScatterChart() {
  return (
    <ScatterChart
      data={data}
      config={chartConfig}
      xDataKey="cost"
      yDataKey="habitatGain"
      pointNameDataKey="project"
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
