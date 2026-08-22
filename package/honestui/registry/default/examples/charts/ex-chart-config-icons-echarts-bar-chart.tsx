"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";
import { CircleCheck, Search } from "honestui/icons";

// Scenario: Incident outcomes
const data = [
  { month: "January", fixed: 313, investigating: 138 },
  { month: "February", fixed: 800, investigating: 367 },
  { month: "March", fixed: 487, investigating: 229 },
  { month: "April", fixed: 602, investigating: 309 },
  { month: "May", fixed: 417, investigating: 256 },
  { month: "June", fixed: 715, investigating: 329 },
  { month: "July", fixed: 382, investigating: 181 },
  { month: "August", fixed: 865, investigating: 421 },
  { month: "September", fixed: 585, investigating: 291 },
  { month: "October", fixed: 493, investigating: 291 },
  { month: "November", fixed: 746, investigating: 377 },
  { month: "December", fixed: 283, investigating: 120 },
];

const chartConfig = {
  fixed: {
    label: "Fixed",
    icon: CircleCheck, // [!code highlight]
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  investigating: {
    label: "Investigating",
    icon: Search, // [!code highlight]
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart data={data} config={chartConfig} className="h-full w-full p-4">
      <BarChart.Grid />
      <BarChart.XAxis dataKey="month" tickFormatter={(value: string) => value.substring(0, 3)} />
      <BarChart.Legend />
      <BarChart.Tooltip defaultIndex={4} />
      <BarChart.Bar dataKey="fixed" variant="default" />
      <BarChart.Bar dataKey="investigating" variant="default" />
    </BarChart>
  );
}
