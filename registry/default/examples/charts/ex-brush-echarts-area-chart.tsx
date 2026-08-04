"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Museum attendance
const data = [
  { date: "June 1", members: 296, guests: 152 },
  { date: "June 2", members: 346, guests: 178 },
  { date: "June 3", members: 381, guests: 203 },
  { date: "June 4", members: 381, guests: 198 },
  { date: "June 5", members: 374, guests: 225 },
  { date: "June 6", members: 225, guests: 113 },
  { date: "June 7", members: 212, guests: 106 },
  { date: "June 8", members: 415, guests: 215 },
  { date: "June 9", members: 413, guests: 238 },
  { date: "June 10", members: 449, guests: 255 },
  { date: "June 11", members: 448, guests: 221 },
  { date: "June 12", members: 491, guests: 249 },
  { date: "June 13", members: 252, guests: 148 },
  { date: "June 14", members: 240, guests: 141 },
  { date: "June 15", members: 496, guests: 277 },
  { date: "June 16", members: 534, guests: 264 },
  { date: "June 17", members: 491, guests: 262 },
  { date: "June 18", members: 533, guests: 290 },
  { date: "June 19", members: 560, guests: 305 },
  { date: "June 20", members: 321, guests: 182 },
  { date: "June 21", members: 270, guests: 141 },
  { date: "June 22", members: 560, guests: 296 },
  { date: "June 23", members: 602, guests: 317 },
  { date: "June 24", members: 603, guests: 316 },
  { date: "June 25", members: 602, guests: 344 },
  { date: "June 26", members: 630, guests: 326 },
  { date: "June 27", members: 345, guests: 178 },
  { date: "June 28", members: 340, guests: 177 },
  { date: "June 29", members: 629, guests: 356 },
  { date: "June 30", members: 671, guests: 376 },
];

const chartConfig = {
  members: {
    label: "Members",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  guests: {
    label: "Guests",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleBrushAreaChart() {
  return (
    <AreaChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      curveType="monotone"
      xDataKey="date"
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="date" tickFormatter={(value) => value.split(" ")[1]} />
      <AreaChart.Brush
        height={56} // [!code highlight]
        formatLabel={(value) => String(value)} // [!code highlight]
      />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="members" variant="gradient" isClickable />
      <AreaChart.Area dataKey="guests" variant="gradient" isClickable />
    </AreaChart>
  );
}
