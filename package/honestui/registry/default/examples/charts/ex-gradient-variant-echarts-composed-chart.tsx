"use client";

import { ComposedChart, type ChartConfig } from "@/registry/default/charts/composed-chart";

// Scenario: Real estate
const data = [
  { month: "January", showings: 5652, offerRate: 1024 },
  { month: "February", showings: 7807, offerRate: 1367 },
  { month: "March", showings: 5540, offerRate: 926 },
  { month: "April", showings: 8365, offerRate: 1605 },
  { month: "May", showings: 7260, offerRate: 1276 },
  { month: "June", showings: 10487, offerRate: 1920 },
  { month: "July", showings: 8220, offerRate: 1479 },
  { month: "August", showings: 11045, offerRate: 2158 },
  { month: "September", showings: 7930, offerRate: 1437 },
  { month: "October", showings: 9147, offerRate: 1724 },
  { month: "November", showings: 9694, offerRate: 1808 },
  { month: "December", showings: 12251, offerRate: 2375 },
];

const chartConfig = {
  showings: {
    label: "Showings",
    colors: {
      light: ["#3b82f6"],
      dark: ["#6A5ACD"],
    },
  },
  offerRate: {
    label: "Offer rate",
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
        dataKey="showings"
        variant="gradient" // [!code highlight]
        isClickable
      />
      <ComposedChart.Line dataKey="offerRate" isClickable />
    </ComposedChart>
  );
}
