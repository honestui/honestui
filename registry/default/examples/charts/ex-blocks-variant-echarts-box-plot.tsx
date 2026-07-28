"use client";

import { BoxPlot, type BoxPlotValue, type ChartConfig } from "@/registry/default/charts/box-plot";

const data: { release: string; duration: BoxPlotValue }[] = [
  { release: "v2.1", duration: [7, 11, 14, 19, 27] },
  { release: "v2.2", duration: [8, 13, 17, 22, 31] },
  { release: "v2.3", duration: [6, 10, 13, 17, 24] },
  { release: "v2.4", duration: [9, 15, 20, 26, 35] },
  { release: "v2.5", duration: [5, 9, 12, 16, 22] },
  { release: "v2.6", duration: [6, 11, 15, 21, 29] },
];

const chartConfig = {
  duration: {
    label: "Build duration",
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
      xDataKey="release"
      className="h-full w-full p-4"
    >
      <BoxPlot.Grid />
      <BoxPlot.XAxis />
      <BoxPlot.YAxis tickFormatter={(value) => `${value}m`} />
      <BoxPlot.Legend />
      <BoxPlot.Tooltip valueFormatter={(value) => `${value} min`} />
      <BoxPlot.Box dataKey="duration" variant="blocks" isClickable />
    </BoxPlot>
  );
}
