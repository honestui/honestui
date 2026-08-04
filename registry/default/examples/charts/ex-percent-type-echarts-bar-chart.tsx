"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Conference attendance
const data = [
  { month: "January", inPerson: 266, virtual: 183 },
  { month: "February", inPerson: 608, virtual: 436 },
  { month: "March", inPerson: 393, virtual: 282 },
  { month: "April", inPerson: 477, virtual: 370 },
  { month: "May", inPerson: 338, virtual: 311 },
  { month: "June", inPerson: 549, virtual: 395 },
  { month: "July", inPerson: 320, virtual: 230 },
  { month: "August", inPerson: 661, virtual: 496 },
  { month: "September", inPerson: 455, virtual: 351 },
  { month: "October", inPerson: 395, virtual: 350 },
  { month: "November", inPerson: 574, virtual: 448 },
  { month: "December", inPerson: 255, virtual: 162 },
];

const chartConfig = {
  inPerson: {
    label: "In person",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  virtual: {
    label: "Virtual",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      stackType="percent" // [!code highlight]
    >
      <BarChart.Grid />
      <BarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <BarChart.Legend isClickable />
      <BarChart.Tooltip />
      <BarChart.Bar dataKey="inPerson" variant="default" isClickable />
      <BarChart.Bar dataKey="virtual" variant="default" isClickable />
    </BarChart>
  );
}
