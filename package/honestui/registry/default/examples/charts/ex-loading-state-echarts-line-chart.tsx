"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Delivery distance
const data: { month: string; urban: number; rural: number }[] = [];

const chartConfig = {
  urban: {
    label: "Urban",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  rural: {
    label: "Rural",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleLineChart() {
  return (
    <LineChart
      data={data} // if isLoading is true, pass empty array → i.e isLoading ? [] : data
      config={chartConfig}
      className="h-full w-full p-4"
      isLoading={true} // [!code highlight]
      curveType="bump"
    >
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.YAxis dataKey="urban" />
      <LineChart.Legend isClickable />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="urban" strokeVariant="solid" isClickable>
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
      <LineChart.Line dataKey="rural" strokeVariant="solid" isClickable>
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
    </LineChart>
  );
}
