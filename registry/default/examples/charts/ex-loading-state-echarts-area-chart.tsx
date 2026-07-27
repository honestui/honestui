"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

const data: { month: string; desktop: number; mobile: number }[] = [];

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  mobile: {
    label: "Mobile",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
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
      <AreaChart.YAxis dataKey="desktop" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="desktop" variant="gradient" isClickable>
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area dataKey="mobile" variant="gradient" isClickable>
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
