"use client";

import { Heatmap, type ChartConfig } from "@/registry/default/charts/heatmap";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];

const data = weeks.flatMap((week, weekIndex) =>
  days.map((day, dayIndex) => ({
    week,
    day,
    commits: (weekIndex * 3 + dayIndex * 2 + (weekIndex + dayIndex) ** 2) % 18,
  })),
);

const chartConfig = {
  commits: {
    label: "Commits",
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
      yDataKey="week"
      valueDataKey="commits"
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
