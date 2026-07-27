"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

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

export function ExampleBarChart() {
  return (
    <BarChart
      data={data} // if isLoading is true, pass empty array → i.e isLoading ? [] : data
      config={chartConfig}
      className="h-full w-full p-4"
      isLoading={true} // [!code highlight]
    >
      <BarChart.Grid />
      <BarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <BarChart.Legend />
      <BarChart.Tooltip />
      <BarChart.Bar dataKey="desktop" variant="default" />
      <BarChart.Bar dataKey="mobile" variant="default" />
    </BarChart>
  );
}
