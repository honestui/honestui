"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Wildlife survey
const data = [
  { month: "January", sightings: 367, tagged: 160 },
  { month: "February", sightings: 854, tagged: 363 },
  { month: "March", sightings: 541, tagged: 242 },
  { month: "April", sightings: 656, tagged: 313 },
  { month: "May", sightings: 471, tagged: 268 },
  { month: "June", sightings: 769, tagged: 329 },
  { month: "July", sightings: 436, tagged: 199 },
  { month: "August", sightings: 919, tagged: 413 },
  { month: "September", sightings: 639, tagged: 298 },
  { month: "October", sightings: 547, tagged: 298 },
  { month: "November", sightings: 800, tagged: 372 },
  { month: "December", sightings: 337, tagged: 144 },
];

const chartConfig = {
  sightings: {
    label: "Sightings",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  tagged: {
    label: "Tagged",
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
      stackType="stacked" // [!code highlight]
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.YAxis dataKey="sightings" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="sightings" variant="gradient" isClickable>
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area dataKey="tagged" variant="gradient" isClickable>
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
