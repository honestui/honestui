"use client";

import { Heatmap, type ChartConfig } from "@/registry/default/charts/heatmap";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const hours = ["8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM"];

const data = days.flatMap((day, dayIndex) =>
  hours.map((hour, hourIndex) => ({
    day,
    hour,
    requests: Math.round(
      18 +
        Math.sin((dayIndex + 1) * 1.4 + hourIndex * 0.8) * 12 +
        (dayIndex < 5 ? 18 : 3) +
        hourIndex * 6,
    ),
  })),
);

const chartConfig = {
  requests: {
    label: "Requests",
    colors: {
      light: ["#ecfdf5", "#a7f3d0", "#34d399", "#047857"],
      dark: ["#052e2b", "#065f52", "#10b981", "#6ee7b7"],
    },
  },
} satisfies ChartConfig;

export function ExampleHeatmap() {
  return (
    <Heatmap
      data={data}
      config={chartConfig}
      xDataKey="day"
      yDataKey="hour"
      valueDataKey="requests"
      className="h-full w-full p-4"
    >
      <Heatmap.Grid />
      <Heatmap.XAxis tickFormatter={(value) => value.slice(0, 3)} />
      <Heatmap.YAxis />
      <Heatmap.Legend minLabel="Quiet" maxLabel="Busy" />
      <Heatmap.Tooltip valueFormatter={(value) => `${value} req/min`} />
      <Heatmap.Cells variant="default" />
    </Heatmap>
  );
}
