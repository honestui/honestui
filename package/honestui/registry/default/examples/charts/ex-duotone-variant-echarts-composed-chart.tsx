"use client";

import { ComposedChart, type ChartConfig } from "@/registry/default/charts/composed-chart";

// Scenario: Restaurant service
const data = [
  { month: "January", covers: 4128, ticketTime: 1448 },
  { month: "February", covers: 5707, ticketTime: 1935 },
  { month: "March", covers: 4052, ticketTime: 1302 },
  { month: "April", covers: 6121, ticketTime: 2269 },
  { month: "May", covers: 5304, ticketTime: 1796 },
  { month: "June", covers: 7667, ticketTime: 2728 },
  { month: "July", covers: 6012, ticketTime: 2095 },
  { month: "August", covers: 8081, ticketTime: 3062 },
  { month: "September", covers: 5794, ticketTime: 2029 },
  { month: "October", covers: 6687, ticketTime: 2436 },
  { month: "November", covers: 7090, ticketTime: 2568 },
  { month: "December", covers: 8963, ticketTime: 3375 },
];

const chartConfig = {
  covers: {
    label: "Covers",
    colors: {
      light: ["#3b82f6"],
      dark: ["#6A5ACD"],
    },
  },
  ticketTime: {
    label: "Ticket time",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

export function ExampleComposedChart() {
  return (
    <ComposedChart
      className="h-full w-full p-4"
      xDataKey="month"
      data={data}
      config={chartConfig}
    >
      <ComposedChart.Grid />
      <ComposedChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <ComposedChart.Legend isClickable />
      <ComposedChart.Tooltip />
      <ComposedChart.Bar
        dataKey="covers"
        variant="duotone" // [!code highlight]
        isClickable
      />
      <ComposedChart.Line dataKey="ticketTime" isClickable />
    </ComposedChart>
  );
}
