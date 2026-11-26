"use client";

import { ComboChart, type ChartConfig } from "@/registry/default/charts/combo-chart";

// Scenario: Online store revenue and conversion rate
const data = [
  { month: "January", revenue: 18400, conversion: 2.1 },
  { month: "February", revenue: 21250, conversion: 2.4 },
  { month: "March", revenue: 19870, conversion: 2.2 },
  { month: "April", revenue: 24630, conversion: 2.7 },
  { month: "May", revenue: 27110, conversion: 2.9 },
  { month: "June", revenue: 25480, conversion: 2.6 },
  { month: "July", revenue: 29960, conversion: 3.1 },
  { month: "August", revenue: 31420, conversion: 3.3 },
  { month: "September", revenue: 28750, conversion: 3.0 },
  { month: "October", revenue: 33180, conversion: 3.4 },
  { month: "November", revenue: 39640, conversion: 3.9 },
  { month: "December", revenue: 42870, conversion: 4.2 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    colors: { light: ["#2563eb"], dark: ["#3b82f6"] },
  },
  conversion: {
    label: "Conversion rate",
    colors: { light: ["#ea580c"], dark: ["#f97316"] },
  },
} satisfies ChartConfig;

export function ExampleComboChart() {
  return (
    <ComboChart data={data} config={chartConfig} xDataKey="month" className="h-full w-full p-4">
      <ComboChart.Grid />
      <ComboChart.XAxis tickFormatter={(value) => value.slice(0, 3)} />
      <ComboChart.YAxis yAxisId="left" tickFormatter={(value) => `$${value / 1000}k`} />
      <ComboChart.YAxis yAxisId="right" tickFormatter={(value) => `${value}%`} />
      <ComboChart.Legend isClickable />
      <ComboChart.Tooltip
        valueFormatter={(value, key) =>
          key === "conversion" ? `${value.toFixed(1)}%` : `$${value.toLocaleString()}`
        }
      />
      <ComboChart.Bar dataKey="revenue" isClickable />
      <ComboChart.Line dataKey="conversion" yAxisId="right" isClickable>
        <ComboChart.Dot variant="border" />
      </ComboChart.Line>
    </ComboChart>
  );
}
