"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

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
      <LineChart.YAxis dataKey="desktop" />
      <LineChart.Legend isClickable />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="desktop" strokeVariant="solid" isClickable>
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
      <LineChart.Line dataKey="mobile" strokeVariant="solid" isClickable>
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
    </LineChart>
  );
}
