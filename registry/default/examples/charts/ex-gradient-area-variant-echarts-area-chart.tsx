"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Cloud consumption
const data = [
  { month: "January", compute: 239, storage: 175 },
  { month: "February", compute: 581, storage: 444 },
  { month: "March", compute: 366, storage: 280 },
  { month: "April", compute: 450, storage: 372 },
  { month: "May", compute: 311, storage: 310 },
  { month: "June", compute: 522, storage: 401 },
  { month: "July", compute: 293, storage: 225 },
  { month: "August", compute: 634, storage: 508 },
  { month: "September", compute: 428, storage: 352 },
  { month: "October", compute: 368, storage: 351 },
  { month: "November", compute: 547, storage: 458 },
  { month: "December", compute: 228, storage: 152 },
];

const chartConfig = {
  compute: {
    label: "Compute",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  storage: {
    label: "Storage",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleAreaChart() {
  return (
    <AreaChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      stackType="stacked"
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.YAxis dataKey="compute" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area
        dataKey="compute"
        variant="gradient" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area
        dataKey="storage"
        variant="gradient" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
