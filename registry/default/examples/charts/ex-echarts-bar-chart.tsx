"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Election turnout
const data = [
  { month: "January", earlyVotes: 449, dayOfVotes: 102 },
  { month: "February", earlyVotes: 1127, dayOfVotes: 257 },
  { month: "March", earlyVotes: 683, dayOfVotes: 167 },
  { month: "April", earlyVotes: 840, dayOfVotes: 223 },
  { month: "May", earlyVotes: 594, dayOfVotes: 190 },
  { month: "June", earlyVotes: 1008, dayOfVotes: 230 },
  { month: "July", earlyVotes: 536, dayOfVotes: 133 },
  { month: "August", earlyVotes: 1210, dayOfVotes: 295 },
  { month: "September", earlyVotes: 830, dayOfVotes: 211 },
  { month: "October", earlyVotes: 697, dayOfVotes: 213 },
  { month: "November", earlyVotes: 1047, dayOfVotes: 261 },
  { month: "December", earlyVotes: 393, dayOfVotes: 93 },
];

const chartConfig = {
  earlyVotes: {
    label: "Early votes",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  dayOfVotes: {
    label: "Election-day votes",
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
      xDataKey="month"
    >
      <BarChart.Grid />
      <BarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <BarChart.Brush formatLabel={(value) => String(value).substring(0, 3)} />
      <BarChart.Legend isClickable />
      <BarChart.Tooltip />
      <BarChart.Bar dataKey="earlyVotes" variant="default" isClickable />
      <BarChart.Bar dataKey="dayOfVotes" variant="default" isClickable />
    </BarChart>
  );
}
