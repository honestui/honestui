"use client";

import { Heatmap, type ChartConfig } from "@/registry/default/charts/heatmap";

// Scenario: Café orders per hour across one week (sample data).
// Saturday is today and still open, Sunday is a forecast, the till was offline
// on Wednesday afternoon, and Thursday morning was rebuilt from paper receipts.
const data = [
  { day: "Monday", hour: "8 AM", orders: 38, status: "measured" },
  { day: "Monday", hour: "12 PM", orders: 64, status: "measured" },
  { day: "Monday", hour: "4 PM", orders: 41, status: "measured" },
  { day: "Tuesday", hour: "8 AM", orders: 42, status: "measured" },
  { day: "Tuesday", hour: "12 PM", orders: 71, status: "measured" },
  { day: "Tuesday", hour: "4 PM", orders: 39, status: "measured" },
  { day: "Wednesday", hour: "8 AM", orders: 45, status: "measured" },
  { day: "Wednesday", hour: "12 PM", orders: 68, status: "measured" },
  { day: "Wednesday", hour: "4 PM", orders: null, status: "missing" },
  { day: "Thursday", hour: "8 AM", orders: 40, status: "estimated", low: 34, high: 46 },
  { day: "Thursday", hour: "12 PM", orders: 74, status: "measured" },
  { day: "Thursday", hour: "4 PM", orders: 47, status: "measured" },
  { day: "Friday", hour: "8 AM", orders: 51, status: "measured" },
  { day: "Friday", hour: "12 PM", orders: 83, status: "measured" },
  { day: "Friday", hour: "4 PM", orders: 58, status: "measured" },
  { day: "Saturday", hour: "8 AM", orders: 33, status: "measured" },
  { day: "Saturday", hour: "12 PM", orders: 52, status: "provisional" },
  { day: "Saturday", hour: "4 PM", orders: 12, status: "provisional" },
  { day: "Sunday", hour: "8 AM", orders: 24, status: "forecast", low: 18, high: 31 },
  { day: "Sunday", hour: "12 PM", orders: 57, status: "forecast", low: 46, high: 69 },
  { day: "Sunday", hour: "4 PM", orders: 35, status: "forecast", low: 27, high: 44 },
];

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
      statusKey="status" // [!code highlight]
      lowerKey="low" // [!code highlight]
      upperKey="high" // [!code highlight]
      className="h-full w-full p-4"
      ariaLabel="Sample café orders per hour for one week. Wednesday 4 PM is missing, Thursday 8 AM is estimated, Saturday from noon is provisional, and Sunday is forecast."
    >
      <Heatmap.XAxis tickFormatter={(value) => value.slice(0, 3)} />
      <Heatmap.YAxis />
      <Heatmap.Tooltip valueFormatter={(value) => `${value} orders/hr`} />
      <Heatmap.Cells variant="default" showValues />
    </Heatmap>
  );
}
