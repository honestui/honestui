"use client";

import { BoxPlot, type BoxPlotValue, type ChartConfig } from "@/registry/default/charts/box-plot";

const data: { group: string; response: BoxPlotValue }[] = [
  { group: "A", response: [20, 35, 48, 63, 81] },
];

const chartConfig = {
  response: {
    label: "Response time",
    colors: { light: ["#2563eb"], dark: ["#60a5fa"] },
  },
} satisfies ChartConfig;

export function LoadingBoxPlot() {
  return (
    <BoxPlot
      data={data}
      config={chartConfig}
      xDataKey="group"
      className="h-full w-full p-4"
      isLoading
    >
      <BoxPlot.XAxis />
      <BoxPlot.YAxis />
      <BoxPlot.Box dataKey="response" />
    </BoxPlot>
  );
}
