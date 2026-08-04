"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Retail demand
const data = [
  { month: "January", online: 442, stores: 167 },
  { month: "February", online: 1072, stores: 403 },
  { month: "March", online: 661, stores: 261 },
  { month: "April", online: 808, stores: 343 },
  { month: "May", online: 576, stores: 289 },
  { month: "June", online: 962, stores: 365 },
  { month: "July", online: 524, stores: 212 },
  { month: "August", online: 1151, stores: 460 },
  { month: "September", online: 796, stores: 325 },
  { month: "October", online: 673, stores: 325 },
  { month: "November", online: 998, stores: 415 },
  { month: "December", online: 392, stores: 148 },
];

const chartConfig = {
  online: {
    label: "Online orders",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  stores: {
    label: "Store orders",
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
      enableHoverReveal // [!code highlight]
      stackType="stacked"
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.Legend />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="online" variant="gradient">
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area dataKey="stores" variant="gradient">
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
