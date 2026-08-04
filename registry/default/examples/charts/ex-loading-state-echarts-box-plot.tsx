"use client";

import { BoxPlot, type BoxPlotValue, type ChartConfig } from "@/registry/default/charts/box-plot";

// Scenario: Lab sample turnaround
const data: { lab: string; turnaround: BoxPlotValue }[] = [
  { lab: "Pathology", turnaround: [23, 41, 56, 74, 95] },
];

const chartConfig = {
  turnaround: {
    label: "Turnaround",
    colors: { light: ["#2563eb"], dark: ["#60a5fa"] },
  },
} satisfies ChartConfig;

export function LoadingBoxPlot() {
  return (
    <BoxPlot
      data={data}
      config={chartConfig}
      xDataKey="lab"
      className="h-full w-full p-4"
      isLoading
    >
      <BoxPlot.XAxis />
      <BoxPlot.YAxis />
      <BoxPlot.Box dataKey="turnaround" />
    </BoxPlot>
  );
}
