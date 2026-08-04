"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Kitchen throughput
const data = [
  { month: "January", orders: 334, completed: 275 },
  { month: "February", orders: 772, completed: 675 },
  { month: "March", orders: 492, completed: 426 },
  { month: "April", orders: 596, completed: 561 },
  { month: "May", orders: 426, completed: 464 },
  { month: "June", orders: 696, completed: 614 },
  { month: "July", orders: 397, completed: 347 },
  { month: "August", orders: 833, completed: 767 },
  { month: "September", orders: 578, completed: 530 },
  { month: "October", orders: 497, completed: 525 },
  { month: "November", orders: 724, completed: 700 },
  { month: "December", orders: 310, completed: 237 },
];

const chartConfig = {
  orders: {
    label: "Orders",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  completed: {
    label: "Completed",
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
      <AreaChart.YAxis dataKey="orders" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area
        dataKey="orders"
        variant="gradient"
        strokeVariant="solid" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area
        dataKey="completed"
        variant="gradient"
        strokeVariant="solid" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
