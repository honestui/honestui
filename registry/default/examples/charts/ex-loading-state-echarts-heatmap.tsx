"use client";

import { Heatmap, type ChartConfig } from "@/registry/default/charts/heatmap";

// Scenario: Classroom attendance
const chartConfig = {
  attendance: {
    label: "Attendance",
    colors: {
      light: ["#e0f2fe", "#0369a1"],
      dark: ["#082f49", "#38bdf8"],
    },
  },
} satisfies ChartConfig;

export function LoadingHeatmap() {
  return (
    <Heatmap
      data={[]}
      config={chartConfig}
      xDataKey="day"
      yDataKey="hour"
      valueDataKey="attendance"
      className="h-full w-full p-4"
      isLoading
    >
      <Heatmap.XAxis />
      <Heatmap.YAxis />
      <Heatmap.Legend />
      <Heatmap.Tooltip />
      <Heatmap.Cells />
    </Heatmap>
  );
}
