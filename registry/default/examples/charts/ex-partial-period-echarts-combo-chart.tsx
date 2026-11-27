"use client";

import { ComboChart, type ChartConfig } from "@/registry/default/charts/combo-chart";

// Scenario: Monthly orders and average order value for an online store
// (sample data). November is still open, so its bar is hatched and the line
// dashed instead of reading as a sudden drop.
const data = [
  { month: "Jun", orders: 4120, aov: 58.4 },
  { month: "Jul", orders: 4385, aov: 57.9 },
  { month: "Aug", orders: 4610, aov: 59.2 },
  { month: "Sep", orders: 4290, aov: 60.1 },
  { month: "Oct", orders: 4870, aov: 61.3 },
  { month: "Nov", orders: 3940, aov: 62.0 },
];

const chartConfig = {
  orders: {
    label: "Orders",
    colors: { light: ["#2563eb"], dark: ["#60a5fa"] },
  },
  aov: {
    label: "Average order value",
    colors: { light: ["#ea580c"], dark: ["#fb923c"] },
  },
} satisfies ChartConfig;

export function ExampleComboChart() {
  return (
    <ComboChart data={data} config={chartConfig} xDataKey="month" className="h-full w-full p-4">
      <ComboChart.Grid />
      <ComboChart.XAxis />
      <ComboChart.YAxis yAxisId="left" tickFormatter={(value) => `${value / 1000}k`} />
      <ComboChart.YAxis yAxisId="right" tickFormatter={(value) => `$${value}`} />
      <ComboChart.Legend />
      <ComboChart.Tooltip
        valueFormatter={(value, key) =>
          key === "aov" ? `$${value.toFixed(2)}` : value.toLocaleString()
        }
      />
      <ComboChart.PartialPeriod x="Nov" label="Month to date" progress={26 / 30} />
      <ComboChart.Bar dataKey="orders" />
      <ComboChart.Line dataKey="aov" yAxisId="right">
        <ComboChart.Dot variant="border" />
      </ComboChart.Line>
    </ComboChart>
  );
}
