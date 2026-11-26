"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Daily storefront visits this month against the same days last month
const visits = [3120, 3340, 3290, 3510, 3880, 4210, 4050, 3620, 3710, 3990, 4280, 4620, 4890, 4710];
const lastMonth = [2980, 3050, 3110, 3240, 3420, 3650, 3580, 3310, 3390, 3520, 3700, 3910, 4020, 3960];

const data = visits.map((value, i) => ({
  day: `Day ${i + 1}`,
  visits: value,
  lastMonth: lastMonth[i],
}));

const chartConfig = {
  visits: {
    label: "Visits",
    colors: { light: ["#2563eb"], dark: ["#3b82f6"] },
  },
  lastMonth: { label: "Last month" },
} satisfies ChartConfig;

export function ExamplePeriodComparisonAreaChart() {
  return (
    <AreaChart
      data={data}
      config={chartConfig}
      xDataKey="day"
      curveType="monotone"
      className="h-full w-full p-4"
    >
      <AreaChart.Grid />
      <AreaChart.XAxis tickFormatter={(value) => value.replace("Day ", "")} />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="visits" variant="gradient" compareDataKey="lastMonth" /> {/* [!code highlight] */}
    </AreaChart>
  );
}
