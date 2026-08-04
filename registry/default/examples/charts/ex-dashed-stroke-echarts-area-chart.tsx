"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Crop yield
const data = [
  { month: "January", wheat: 347, barley: 204 },
  { month: "February", wheat: 881, barley: 538 },
  { month: "March", wheat: 536, barley: 332 },
  { month: "April", wheat: 661, barley: 446 },
  { month: "May", wheat: 461, barley: 366 },
  { month: "June", wheat: 788, barley: 486 },
  { month: "July", wheat: 420, barley: 265 },
  { month: "August", wheat: 952, barley: 616 },
  { month: "September", wheat: 646, barley: 420 },
  { month: "October", wheat: 544, barley: 417 },
  { month: "November", wheat: 821, barley: 558 },
  { month: "December", wheat: 311, barley: 173 },
];

const chartConfig = {
  wheat: {
    label: "Wheat",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  barley: {
    label: "Barley",
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
      <AreaChart.YAxis dataKey="wheat" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area
        dataKey="wheat"
        variant="gradient"
        strokeVariant="dashed" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area
        dataKey="barley"
        variant="gradient"
        strokeVariant="dashed" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
