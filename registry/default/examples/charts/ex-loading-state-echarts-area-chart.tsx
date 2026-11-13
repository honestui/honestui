"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Weather forecast
const data: { month: string; observed: number; forecast: number }[] = [];

const chartConfig = {
  observed: {
    label: "Observed rainfall",
    colors: {
      light: ["#2563eb"],
      dark: ["#3b82f6"],
    },
  },
  forecast: {
    label: "Forecast rainfall",
    colors: {
      light: ["#ea580c"],
      dark: ["#ea580c"],
    },
  },
} satisfies ChartConfig;

export function ExampleAreaChart() {
  return (
    <AreaChart
      data={data} // if isLoading is true, pass empty array → i.e isLoading ? [] : data
      config={chartConfig}
      className="h-full w-full p-4"
      isLoading={true} // [!code highlight]
      stackType="stacked"
      curveType="bump"
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.YAxis dataKey="observed" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="observed" variant="gradient" isClickable>
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area dataKey="forecast" variant="gradient" isClickable>
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
