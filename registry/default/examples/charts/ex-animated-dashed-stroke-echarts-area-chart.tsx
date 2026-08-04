"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Renewable generation
const data = [
  { month: "January", solar: 212, wind: 118 },
  { month: "February", solar: 554, wind: 321 },
  { month: "March", solar: 339, wind: 200 },
  { month: "April", solar: 423, wind: 271 },
  { month: "May", solar: 284, wind: 226 },
  { month: "June", solar: 495, wind: 287 },
  { month: "July", solar: 266, wind: 157 },
  { month: "August", solar: 607, wind: 371 },
  { month: "September", solar: 401, wind: 256 },
  { month: "October", solar: 341, wind: 256 },
  { month: "November", solar: 520, wind: 330 },
  { month: "December", solar: 201, wind: 102 },
];

const chartConfig = {
  solar: {
    label: "Solar",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  wind: {
    label: "Wind",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleAreaChart() {
  return (
    <AreaChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      stackType="stacked"
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.YAxis dataKey="solar" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area
        dataKey="solar"
        variant="gradient"
        strokeVariant="animated-dashed" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area
        dataKey="wind"
        variant="gradient"
        strokeVariant="animated-dashed" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
