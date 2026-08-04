"use client";

import { ComposedChart, type ChartConfig } from "@/registry/default/charts/composed-chart";

// Scenario: Shipping economics
const data = [
  { month: "January", shipments: 2985, costPerParcel: 1010 },
  { month: "February", shipments: 4132, costPerParcel: 1353 },
  { month: "March", shipments: 2936, costPerParcel: 912 },
  { month: "April", shipments: 4438, costPerParcel: 1591 },
  { month: "May", shipments: 3837, costPerParcel: 1262 },
  { month: "June", shipments: 5552, costPerParcel: 1906 },
  { month: "July", shipments: 4356, costPerParcel: 1465 },
  { month: "August", shipments: 5858, costPerParcel: 2144 },
  { month: "September", shipments: 4192, costPerParcel: 1423 },
  { month: "October", shipments: 4842, costPerParcel: 1710 },
  { month: "November", shipments: 5137, costPerParcel: 1794 },
  { month: "December", shipments: 6497, costPerParcel: 2361 },
];

const chartConfig = {
  shipments: {
    label: "Shipments",
    colors: {
      light: ["#3b82f6"],
      dark: ["#6A5ACD"],
    },
  },
  costPerParcel: {
    label: "Cost per parcel",
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
      <ComposedChart.Bar dataKey="shipments" isClickable />
      <ComposedChart.Line
        dataKey="costPerParcel"
        curveType="bump" // [!code highlight]
        isClickable
      />
    </ComposedChart>
  );
}
