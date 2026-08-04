"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Fundraising
const data = [
  { month: "January", pledged: 482, collected: 153 },
  { month: "February", pledged: 1209, collected: 389 },
  { month: "March", pledged: 732, collected: 247 },
  { month: "April", pledged: 900, collected: 329 },
  { month: "May", pledged: 638, collected: 275 },
  { month: "June", pledged: 1082, collected: 351 },
  { month: "July", pledged: 574, collected: 198 },
  { month: "August", pledged: 1296, collected: 446 },
  { month: "September", pledged: 891, collected: 311 },
  { month: "October", pledged: 748, collected: 311 },
  { month: "November", pledged: 1122, collected: 401 },
  { month: "December", pledged: 420, collected: 134 },
];

const chartConfig = {
  pledged: {
    label: "Pledged",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  collected: {
    label: "Collected",
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
      stackType="expanded" // [!code highlight]
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.YAxis dataKey="pledged" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="pledged" variant="gradient" isClickable>
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area dataKey="collected" variant="gradient" isClickable>
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
