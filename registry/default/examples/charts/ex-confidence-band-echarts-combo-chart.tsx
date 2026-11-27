"use client";

import { ComboChart, type ChartConfig } from "@/registry/default/charts/combo-chart";

// Scenario: Units sold each month and the demand forecast, with its 80%
// interval for the months still ahead (sample data). Past months have no
// interval, so the band starts where the forecast looks forward.
const data = [
  { month: "May", sold: 1180, forecast: 1150 },
  { month: "Jun", sold: 1265, forecast: 1240 },
  { month: "Jul", sold: 1310, forecast: 1320 },
  { month: "Aug", sold: 1402, forecast: 1380 },
  { month: "Sep", sold: 1355, forecast: 1395, low: 1395, high: 1395 },
  { month: "Oct", sold: null, forecast: 1450, low: 1330, high: 1575 },
  { month: "Nov", sold: null, forecast: 1530, low: 1360, high: 1710 },
  { month: "Dec", sold: null, forecast: 1640, low: 1410, high: 1880 },
];

const chartConfig = {
  sold: {
    label: "Units sold",
    colors: { light: ["#64748b"], dark: ["#94a3b8"] },
  },
  forecast: {
    label: "Forecast",
    colors: { light: ["#7c3aed"], dark: ["#a78bfa"] },
  },
} satisfies ChartConfig;

export function ExampleComboChart() {
  return (
    <ComboChart data={data} config={chartConfig} xDataKey="month" className="h-full w-full p-4">
      <ComboChart.Grid />
      <ComboChart.XAxis />
      <ComboChart.YAxis tickFormatter={(value) => value.toLocaleString()} />
      <ComboChart.Legend />
      <ComboChart.Tooltip valueFormatter={(value) => value.toLocaleString()} />
      <ComboChart.Bar dataKey="sold" />
      <ComboChart.Band dataKey="forecast" lowerKey="low" upperKey="high" label="80% interval" />
      <ComboChart.Line dataKey="forecast" strokeVariant="dashed" curveType="linear">
        <ComboChart.Dot variant="border" />
      </ComboChart.Line>
    </ComboChart>
  );
}
