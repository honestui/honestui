"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Carbon accounting
const data = [
  { month: "January", scopeOne: 374, scopeTwo: 261 },
  { month: "February", scopeOne: 908, scopeTwo: 661 },
  { month: "March", scopeOne: 563, scopeTwo: 412 },
  { month: "April", scopeOne: 688, scopeTwo: 547 },
  { month: "May", scopeOne: 488, scopeTwo: 450 },
  { month: "June", scopeOne: 815, scopeTwo: 600 },
  { month: "July", scopeOne: 447, scopeTwo: 333 },
  { month: "August", scopeOne: 979, scopeTwo: 753 },
  { month: "September", scopeOne: 673, scopeTwo: 516 },
  { month: "October", scopeOne: 571, scopeTwo: 511 },
  { month: "November", scopeOne: 848, scopeTwo: 686 },
  { month: "December", scopeOne: 338, scopeTwo: 223 },
];

const chartConfig = {
  scopeOne: {
    label: "Scope 1",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  scopeTwo: {
    label: "Scope 2",
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
      <AreaChart.YAxis dataKey="scopeOne" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area
        dataKey="scopeOne"
        variant="hatched" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area
        dataKey="scopeTwo"
        variant="hatched" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
