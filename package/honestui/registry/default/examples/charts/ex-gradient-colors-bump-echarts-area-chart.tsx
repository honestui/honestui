"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Parcel volume
const data = [
  { month: "January", scheduled: 273, delivered: 196 },
  { month: "February", scheduled: 663, delivered: 498 },
  { month: "March", scheduled: 416, delivered: 313 },
  { month: "April", scheduled: 510, delivered: 416 },
  { month: "May", scheduled: 355, delivered: 345 },
  { month: "June", scheduled: 596, delivered: 451 },
  { month: "July", scheduled: 332, delivered: 252 },
  { month: "August", scheduled: 720, delivered: 569 },
  { month: "September", scheduled: 489, delivered: 393 },
  { month: "October", scheduled: 419, delivered: 391 },
  { month: "November", scheduled: 622, delivered: 515 },
  { month: "December", scheduled: 255, delivered: 170 },
];

const chartConfig = {
  scheduled: {
    label: "Scheduled",
    colors: {
      light: ["red", "orange", "rosybrown", "purple", "blue"], // [!code highlight]
      dark: ["red", "orange", "rosybrown", "purple", "blue"], // [!code highlight]
    },
  },
  delivered: {
    label: "Delivered",
    colors: {
      light: ["gray"],
      dark: ["gray"],
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
      curveType="bump"
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="scheduled" variant="gradient" isClickable>
        <AreaChart.Dot variant="colored-border" />
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area dataKey="delivered" variant="gradient" isClickable>
        <AreaChart.Dot variant="colored-border" />
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
