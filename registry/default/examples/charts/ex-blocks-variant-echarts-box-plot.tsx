"use client";

import { BoxPlot, type BoxPlotValue, type ChartConfig } from "@/registry/default/charts/box-plot";

// Scenario: Film rendering time
const data: { scene: string; renderTime: BoxPlotValue }[] = [
  { scene: "Scene 1", renderTime: [8, 13, 16, 22, 32] },
  { scene: "Scene 2", renderTime: [9, 15, 20, 26, 36] },
  { scene: "Scene 4", renderTime: [7, 12, 15, 20, 28] },
  { scene: "Scene 5", renderTime: [11, 18, 23, 30, 41] },
  { scene: "Scene 6", renderTime: [6, 11, 14, 19, 26] },
  { scene: "Scene 7", renderTime: [7, 13, 18, 25, 34] },
];

const chartConfig = {
  renderTime: {
    label: "Build renderTime",
    colors: {
      light: ["#d1fae5", "#6ee7b7", "#10b981", "#047857"],
      dark: ["#064e3b", "#059669", "#34d399", "#a7f3d0"],
    },
  },
} satisfies ChartConfig;

export function BlocksBoxPlot() {
  return (
    <BoxPlot
      data={data}
      config={chartConfig}
      xDataKey="scene"
      className="h-full w-full p-4"
    >
      <BoxPlot.Grid />
      <BoxPlot.XAxis />
      <BoxPlot.YAxis tickFormatter={(value) => `${value}m`} />
      <BoxPlot.Legend />
      <BoxPlot.Tooltip valueFormatter={(value) => `${value} min`} />
      <BoxPlot.Box dataKey="renderTime" variant="blocks" isClickable />
    </BoxPlot>
  );
}
