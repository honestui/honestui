"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Fitness activity
const data = [
  { month: "January", cardio: 415, strength: 247 },
  { month: "February", cardio: 1045, strength: 647 },
  { month: "March", cardio: 634, strength: 398 },
  { month: "April", cardio: 781, strength: 533 },
  { month: "May", cardio: 549, strength: 436 },
  { month: "June", cardio: 935, strength: 586 },
  { month: "July", cardio: 497, strength: 319 },
  { month: "August", cardio: 1124, strength: 739 },
  { month: "September", cardio: 769, strength: 502 },
  { month: "October", cardio: 646, strength: 497 },
  { month: "November", cardio: 971, strength: 672 },
  { month: "December", cardio: 365, strength: 209 },
];

const chartConfig = {
  cardio: {
    label: "Cardio minutes",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  strength: {
    label: "Strength minutes",
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
      <AreaChart.YAxis dataKey="cardio" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area
        dataKey="cardio"
        variant="dotted" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area
        dataKey="strength"
        variant="dotted" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
