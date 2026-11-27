"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Trial-to-paid conversion rate by signup week, in percent (sample
// data). Two holiday weeks had few trials, so their rates rest on little.
const data = [
  { week: "Oct 6", rate: 11.8, trials: 342 },
  { week: "Oct 13", rate: 12.4, trials: 318 },
  { week: "Oct 20", rate: 12.1, trials: 355 },
  { week: "Oct 27", rate: 16.7, trials: 24 },
  { week: "Nov 3", rate: 12.9, trials: 331 },
  { week: "Nov 10", rate: 13.2, trials: 347 },
  { week: "Nov 17", rate: 8.3, trials: 36 },
  { week: "Nov 24", rate: 13.5, trials: 309 },
];

const chartConfig = {
  rate: {
    label: "Conversion",
    colors: { light: ["#be185d"], dark: ["#f472b6"] },
  },
} satisfies ChartConfig;

export function ExampleAreaChart() {
  return (
    <AreaChart data={data} config={chartConfig} className="h-full w-full p-4" xDataKey="week">
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="week" />
      <AreaChart.YAxis tickFormatter={(value) => `${value}%`} />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="rate" strokeVariant="solid" sampleSizeKey="trials" minSampleSize={50}>
        <AreaChart.Dot variant="border" />
      </AreaChart.Area>
    </AreaChart>
  );
}
