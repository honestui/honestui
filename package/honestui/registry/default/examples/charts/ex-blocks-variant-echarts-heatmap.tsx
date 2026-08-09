"use client";

import { Heatmap, type ChartConfig } from "@/registry/default/charts/heatmap";

// Scenario: Community garden watering
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const plots = ["Plot A", "Plot B", "Plot C", "Plot D", "Plot E"];

const data = plots.flatMap((plot, plotIndex) =>
  days.map((day, dayIndex) => ({
    plot,
    day,
    liters: (plotIndex * 4 + dayIndex * 2 + (plotIndex + dayIndex) ** 2) % 21,
  })),
);

const chartConfig = {
  liters: {
    label: "Water used",
    colors: {
      light: ["#f3f4f6", "#bbf7d0", "#4ade80", "#15803d"],
      dark: ["#27272a", "#14532d", "#22c55e", "#86efac"],
    },
  },
} satisfies ChartConfig;

export function BlocksHeatmap() {
  return (
    <Heatmap
      data={data}
      config={chartConfig}
      xDataKey="day"
      yDataKey="plot"
      valueDataKey="liters"
      className="h-full w-full p-4"
    >
      <Heatmap.XAxis />
      <Heatmap.YAxis />
      <Heatmap.Legend />
      <Heatmap.Tooltip />
      <Heatmap.Cells variant="blocks" levels={5} isClickable />
    </Heatmap>
  );
}
