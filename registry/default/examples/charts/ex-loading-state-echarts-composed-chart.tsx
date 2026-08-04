"use client";

import { ComposedChart, type ChartConfig } from "@/registry/default/charts/composed-chart";

// Scenario: Fundraising efficiency
const data = [
  { month: "January", donations: 3393, averageGift: 1462 },
  { month: "February", donations: 4684, averageGift: 1949 },
  { month: "March", donations: 3335, averageGift: 1316 },
  { month: "April", donations: 5026, averageGift: 2283 },
  { month: "May", donations: 4353, averageGift: 1810 },
  { month: "June", donations: 6284, averageGift: 2742 },
];

const chartConfig = {
  donations: {
    label: "Donations",
    colors: {
      light: ["#3b82f6"],
      dark: ["#6A5ACD"],
    },
  },
  averageGift: {
    label: "Average gift",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

export function ExampleComposedChart() {
  return (
    <ComposedChart
      isLoading // [!code highlight]
      className="h-full w-full p-4"
      xDataKey="month"
      data={data}
      config={chartConfig}
    >
      <ComposedChart.Grid />
      <ComposedChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <ComposedChart.Legend />
      <ComposedChart.Tooltip />
      <ComposedChart.Bar dataKey="donations" />
      <ComposedChart.Line dataKey="averageGift" />
    </ComposedChart>
  );
}
