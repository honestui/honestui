"use client";

import { ComposedChart, type ChartConfig } from "@/registry/default/charts/composed-chart";

// Scenario: Commerce performance
const data = [
  { month: "January", orders: 2604, conversion: 864 },
  { month: "February", orders: 3607, conversion: 1159 },
  { month: "March", orders: 2564, conversion: 782 },
  { month: "April", orders: 3877, conversion: 1365 },
  { month: "May", orders: 3348, conversion: 1084 },
  { month: "June", orders: 4847, conversion: 1632 },
  { month: "July", orders: 3804, conversion: 1255 },
  { month: "August", orders: 5117, conversion: 1838 },
  { month: "September", orders: 3658, conversion: 1221 },
  { month: "October", orders: 4227, conversion: 1468 },
  { month: "November", orders: 4486, conversion: 1536 },
  { month: "December", orders: 5675, conversion: 2023 },
];

const chartConfig = {
  orders: {
    label: "Orders",
    colors: {
      light: ["#3b82f6"],
      dark: ["#6A5ACD"],
    },
  },
  conversion: {
    label: "Conversion rate",
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
      <ComposedChart.Bar dataKey="orders" isClickable />
      <ComposedChart.Line
        dataKey="conversion"
        strokeVariant="animated-dashed" // [!code highlight]
        isClickable
      />
    </ComposedChart>
  );
}
