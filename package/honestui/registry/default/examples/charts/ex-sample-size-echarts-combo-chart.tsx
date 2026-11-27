"use client";

import { ComboChart, type ChartConfig } from "@/registry/default/charts/combo-chart";

// Scenario: Weekly support satisfaction and first response time (sample data).
// Each bar shows how many surveys stand behind it; holiday weeks drew few.
const data = [
  { week: "Oct 27", csat: 91, surveys: 184, response: 2.4 },
  { week: "Nov 3", csat: 89, surveys: 203, response: 2.7 },
  { week: "Nov 10", csat: 92, surveys: 176, response: 2.2 },
  { week: "Nov 17", csat: 90, surveys: 198, response: 2.5 },
  { week: "Nov 24", csat: 97, surveys: 14, response: 1.6 },
  { week: "Dec 1", csat: 88, surveys: 211, response: 3.1 },
  { week: "Dec 8", csat: 91, surveys: 189, response: 2.6 },
  { week: "Dec 15", csat: 79, surveys: 19, response: 3.4 },
];

const chartConfig = {
  csat: {
    label: "Satisfied",
    colors: { light: ["#0d9488"], dark: ["#2dd4bf"] },
  },
  response: {
    label: "First response",
    colors: { light: ["#c2410c"], dark: ["#fb923c"] },
  },
} satisfies ChartConfig;

export function ExampleComboChart() {
  return (
    <ComboChart data={data} config={chartConfig} xDataKey="week" className="h-full w-full p-4">
      <ComboChart.Grid />
      <ComboChart.XAxis />
      <ComboChart.YAxis yAxisId="left" tickFormatter={(value) => `${value}%`} />
      <ComboChart.YAxis yAxisId="right" tickFormatter={(value) => `${value} h`} />
      <ComboChart.Legend />
      <ComboChart.Tooltip
        valueFormatter={(value, key) => (key === "csat" ? `${value}%` : `${value} h`)}
      />
      <ComboChart.Bar dataKey="csat" sampleSizeKey="surveys" minSampleSize={30} />
      <ComboChart.Line dataKey="response" yAxisId="right">
        <ComboChart.Dot variant="border" />
      </ComboChart.Line>
    </ComboChart>
  );
}
