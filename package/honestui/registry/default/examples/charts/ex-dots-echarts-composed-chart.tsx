"use client";

import { ComposedChart, type ChartConfig } from "@/registry/default/charts/composed-chart";

// Scenario: Energy market
const data = [
  { month: "January", megawatts: 3747, spotPrice: 1302 },
  { month: "February", megawatts: 5182, spotPrice: 1741 },
  { month: "March", megawatts: 3680, spotPrice: 1172 },
  { month: "April", megawatts: 5560, spotPrice: 2043 },
  { month: "May", megawatts: 4815, spotPrice: 1618 },
  { month: "June", megawatts: 6962, spotPrice: 2454 },
  { month: "July", megawatts: 5460, spotPrice: 1885 },
  { month: "August", megawatts: 7340, spotPrice: 2756 },
  { month: "September", megawatts: 5260, spotPrice: 1827 },
  { month: "October", megawatts: 6072, spotPrice: 2194 },
  { month: "November", megawatts: 6439, spotPrice: 2310 },
  { month: "December", megawatts: 8141, spotPrice: 3037 },
];

const chartConfig = {
  megawatts: {
    label: "Megawatts",
    colors: {
      light: ["#3b82f6"],
      dark: ["#6A5ACD"],
    },
  },
  spotPrice: {
    label: "Spot price",
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
      <ComposedChart.Bar dataKey="megawatts" isClickable />
      <ComposedChart.Line dataKey="spotPrice" isClickable>
        <ComposedChart.Dot variant="default" />
        <ComposedChart.ActiveDot variant="border" />
      </ComposedChart.Line>
    </ComposedChart>
  );
}
