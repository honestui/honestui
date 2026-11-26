"use client";

import { WaterfallChart, type ChartConfig } from "@/registry/default/charts/waterfall-chart";

// Scenario: Monthly active users, from start of month to end of month
const data = [
  { change: "Start", users: 48200, total: true },
  { change: "New sign-ups", users: 6350 },
  { change: "Reactivated", users: 1820 },
  { change: "Churned", users: -4170 },
  { change: "Dormant", users: -2240 },
  { change: "End", total: true },
];

const chartConfig = {
  increase: { label: "Gained", colors: { light: ["#0d9488"], dark: ["#2dd4bf"] } },
  decrease: { label: "Lost", colors: { light: ["#e11d48"], dark: ["#fb7185"] } },
  total: { label: "Active users", colors: { light: ["#334155"], dark: ["#cbd5e1"] } },
} satisfies ChartConfig;

const compact = (value: number) =>
  value.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function ExampleValuesWaterfallChart() {
  return (
    <WaterfallChart
      data={data}
      config={chartConfig}
      xDataKey="change"
      valueDataKey="users"
      totalDataKey="total"
      className="h-full w-full p-4"
    >
      <WaterfallChart.Grid />
      <WaterfallChart.XAxis />
      <WaterfallChart.Tooltip valueFormatter={(value) => value.toLocaleString()} />
      <WaterfallChart.Bars
        showValues
        radius={4}
        width={0.5}
        valueFormatter={(value, kind) =>
          kind === "total" ? compact(value) : `${value > 0 ? "+" : "−"}${compact(Math.abs(value))}`
        }
      />
    </WaterfallChart>
  );
}
