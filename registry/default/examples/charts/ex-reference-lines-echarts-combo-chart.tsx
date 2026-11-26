"use client";

import { ComboChart, type ChartConfig } from "@/registry/default/charts/combo-chart";

// Scenario: Monthly revenue against last year, with a target and a sale period
const data = [
  { month: "Jan", revenue: 18400, lastYear: 16100, conversion: 2.1, lastYearConversion: 1.9 },
  { month: "Feb", revenue: 21250, lastYear: 17800, conversion: 2.4, lastYearConversion: 2.0 },
  { month: "Mar", revenue: 19870, lastYear: 19200, conversion: 2.2, lastYearConversion: 2.2 },
  { month: "Apr", revenue: 24630, lastYear: 20450, conversion: 2.7, lastYearConversion: 2.3 },
  { month: "May", revenue: 27110, lastYear: 22900, conversion: 2.9, lastYearConversion: 2.5 },
  { month: "Jun", revenue: 25480, lastYear: 24100, conversion: 2.6, lastYearConversion: 2.6 },
  { month: "Jul", revenue: 29960, lastYear: 23700, conversion: 3.1, lastYearConversion: 2.4 },
  { month: "Aug", revenue: 31420, lastYear: 26300, conversion: 3.3, lastYearConversion: 2.7 },
];

const chartConfig = {
  revenue: { label: "Revenue", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
  lastYear: { label: "Last year" },
  conversion: { label: "Conversion rate", colors: { light: ["#ea580c"], dark: ["#f97316"] } },
  lastYearConversion: { label: "Last year" },
} satisfies ChartConfig;

export function ExampleReferenceLinesComboChart() {
  return (
    <ComboChart data={data} config={chartConfig} xDataKey="month" className="h-full w-full p-4">
      <ComboChart.Grid />
      <ComboChart.XAxis />
      <ComboChart.YAxis yAxisId="left" tickFormatter={(value) => `$${value / 1000}k`} />
      <ComboChart.YAxis yAxisId="right" tickFormatter={(value) => `${value}%`} />
      <ComboChart.Legend />
      <ComboChart.Tooltip
        valueFormatter={(value, key) =>
          key.toLowerCase().includes("conversion") ? `${value.toFixed(1)}%` : `$${value.toLocaleString()}`
        }
      />
      <ComboChart.ReferenceArea x1="Jul" x2="Aug" label="Summer sale" /> {/* [!code highlight] */}
      <ComboChart.ReferenceLine y={28000} label="Target $28k" /> {/* [!code highlight] */}
      <ComboChart.Bar dataKey="revenue" compareDataKey="lastYear" /> {/* [!code highlight] */}
      <ComboChart.Line dataKey="conversion" yAxisId="right" compareDataKey="lastYearConversion"> {/* [!code highlight] */}
        <ComboChart.Dot variant="border" />
      </ComboChart.Line>
    </ComboChart>
  );
}
