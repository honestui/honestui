"use client";

import { ComposedChart, type ChartConfig } from "@/registry/default/charts/composed-chart";

// Scenario: Manufacturing quality
const data = [
  { month: "January", units: 4890, defectRate: 1740 },
  { month: "February", units: 6757, defectRate: 2323 },
  { month: "March", units: 4796, defectRate: 1562 },
  { month: "April", units: 7243, defectRate: 2721 },
  { month: "May", units: 6282, defectRate: 2152 },
  { month: "June", units: 9077, defectRate: 3276 },
  { month: "July", units: 7116, defectRate: 2515 },
  { month: "August", units: 9563, defectRate: 3674 },
  { month: "September", units: 6862, defectRate: 2433 },
  { month: "October", units: 7917, defectRate: 2920 },
  { month: "November", units: 8392, defectRate: 3084 },
  { month: "December", units: 10607, defectRate: 4051 },
];

const chartConfig = {
  units: {
    label: "Units",
    colors: {
      light: ["#3b82f6"],
      dark: ["#6A5ACD"],
    },
  },
  defectRate: {
    label: "Defect rate",
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
        dataKey="units"
        glow // [!code highlight]
        isClickable
      />
      <ComposedChart.Line
        dataKey="defectRate"
        glow // [!code highlight]
        isClickable
      />
    </ComposedChart>
  );
}
