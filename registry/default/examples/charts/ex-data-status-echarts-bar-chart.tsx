"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Quarterly orders by channel (sample data).
// Q2 retail was estimated after a point-of-sale outage, wholesale was not
// reported in Q3, Q4 is still open, and next year's Q1 is a forecast with bounds.
const data = [
  { quarter: "Q1", retail: 1840, retailStatus: "measured", wholesale: 1210, wholesaleStatus: "measured" },
  {
    quarter: "Q2",
    retail: 1960,
    retailStatus: "estimated",
    retailLow: 1820,
    retailHigh: 2100,
    wholesale: 1340,
    wholesaleStatus: "measured",
  },
  { quarter: "Q3", retail: 2110, retailStatus: "measured", wholesale: null, wholesaleStatus: "missing" },
  { quarter: "Q4", retail: 940, retailStatus: "provisional", wholesale: 610, wholesaleStatus: "provisional" },
  {
    quarter: "Q1 next",
    retail: 2050,
    retailStatus: "forecast",
    retailLow: 1790,
    retailHigh: 2310,
    wholesale: 1420,
    wholesaleStatus: "forecast",
    wholesaleLow: 1230,
    wholesaleHigh: 1610,
  },
];

const chartConfig = {
  retail: {
    label: "Retail",
    colors: {
      light: ["#1d4ed8"],
      dark: ["#60a5fa"],
    },
  },
  wholesale: {
    label: "Wholesale",
    colors: {
      light: ["#b45309"],
      dark: ["#fbbf24"],
    },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="quarter"
      ariaLabel="Sample quarterly orders for retail and wholesale. Retail is estimated in Q2, wholesale is missing in Q3, Q4 is provisional, and Q1 of next year is forecast."
    >
      <BarChart.Grid />
      <BarChart.XAxis dataKey="quarter" />
      <BarChart.YAxis />
      <BarChart.Legend />
      <BarChart.Tooltip />
      <BarChart.Bar
        dataKey="retail"
        statusKey="retailStatus" // [!code highlight]
        lowerKey="retailLow" // [!code highlight]
        upperKey="retailHigh" // [!code highlight]
      />
      <BarChart.Bar
        dataKey="wholesale"
        statusKey="wholesaleStatus" // [!code highlight]
        lowerKey="wholesaleLow" // [!code highlight]
        upperKey="wholesaleHigh" // [!code highlight]
      />
    </BarChart>
  );
}
