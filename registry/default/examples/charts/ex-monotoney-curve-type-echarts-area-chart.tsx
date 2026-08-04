"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Library circulation
const data = [
  { month: "January", borrowed: 266, returned: 232 },
  { month: "February", borrowed: 608, returned: 566 },
  { month: "March", borrowed: 393, returned: 360 },
  { month: "April", borrowed: 477, returned: 474 },
  { month: "May", borrowed: 338, returned: 394 },
  { month: "June", borrowed: 549, returned: 514 },
  { month: "July", borrowed: 320, returned: 293 },
  { month: "August", borrowed: 661, returned: 644 },
  { month: "September", borrowed: 455, returned: 448 },
  { month: "October", borrowed: 395, returned: 445 },
  { month: "November", borrowed: 574, returned: 586 },
  { month: "December", borrowed: 255, returned: 201 },
];

const chartConfig = {
  borrowed: {
    label: "Borrowed",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  returned: {
    label: "Returned",
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
      curveType="monotoneY" // [!code highlight]
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.YAxis dataKey="borrowed" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="borrowed" variant="gradient" isClickable>
        <AreaChart.Dot variant="default" />
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area dataKey="returned" variant="gradient" isClickable>
        <AreaChart.Dot variant="default" />
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
