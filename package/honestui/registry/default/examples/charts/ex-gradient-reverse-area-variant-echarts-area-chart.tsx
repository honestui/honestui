"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Housing activity
const data = [
  { month: "January", listings: 340, offers: 240 },
  { month: "February", listings: 827, offers: 607 },
  { month: "March", listings: 514, offers: 379 },
  { month: "April", listings: 629, offers: 503 },
  { month: "May", listings: 444, offers: 415 },
  { month: "June", listings: 742, offers: 550 },
  { month: "July", listings: 409, offers: 306 },
  { month: "August", listings: 892, offers: 692 },
  { month: "September", listings: 612, offers: 475 },
  { month: "October", listings: 520, offers: 471 },
  { month: "November", listings: 773, offers: 629 },
  { month: "December", listings: 310, offers: 205 },
];

const chartConfig = {
  listings: {
    label: "Listings",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  offers: {
    label: "Offers",
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
      <AreaChart.YAxis dataKey="listings" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area
        dataKey="listings"
        variant="gradient-reverse" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area
        dataKey="offers"
        variant="gradient-reverse" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
