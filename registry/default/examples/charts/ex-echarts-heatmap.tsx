"use client";

import { Heatmap, type ChartConfig } from "@/registry/default/charts/heatmap";

// Scenario: Café order volume
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const hours = ["8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM"];

const data = days.flatMap((day, dayIndex) =>
  hours.map((hour, hourIndex) => ({
    day,
    hour,
    orders: Math.round(
      21 +
        Math.sin((dayIndex + 1) * 1.6 + hourIndex * 0.9) * 14 +
        (dayIndex < 6 ? 21 : 4) +
        hourIndex * 7,
    ),
  })),
);

const chartConfig = {
  orders: {
    label: "Orders",
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
      valueDataKey="orders"
      className="h-full w-full p-4"
    >
      <Heatmap.Grid />
      <Heatmap.XAxis tickFormatter={(value) => value.slice(0, 3)} />
      <Heatmap.YAxis />
      <Heatmap.Legend minLabel="Slow" maxLabel="Rush" />
      <Heatmap.Tooltip valueFormatter={(value) => `${value} orders/hr`} />
      <Heatmap.Cells variant="default" />
    </Heatmap>
  );
}
