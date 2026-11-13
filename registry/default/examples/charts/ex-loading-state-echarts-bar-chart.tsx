"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Emergency dispatch
const data: { month: string; medical: number; fire: number }[] = [];

const chartConfig = {
  medical: {
    label: "Medical",
    colors: {
      light: ["#2563eb"],
      dark: ["#3b82f6"],
    },
  },
  fire: {
    label: "Fire",
    colors: {
      light: ["#ea580c"],
      dark: ["#ea580c"],
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
      <BarChart.Bar dataKey="medical" variant="default" />
      <BarChart.Bar dataKey="fire" variant="default" />
    </BarChart>
  );
}
