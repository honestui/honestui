"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Weekly active users by platform
const data = [
  { week: "Week 1", web: 4210, mobile: 2980 },
  { week: "Week 2", web: 4380, mobile: 3150 },
  { week: "Week 3", web: 4290, mobile: 3320 },
  { week: "Week 4", web: 4610, mobile: 3480 },
  { week: "Week 5", web: 4820, mobile: 3710 },
  { week: "Week 6", web: 4760, mobile: 3940 },
  { week: "Week 7", web: 5030, mobile: 4120 },
  { week: "Week 8", web: 5240, mobile: 4380 },
  { week: "Week 9", web: 5180, mobile: 4610 },
  { week: "Week 10", web: 5470, mobile: 4890 },
];

const chartConfig = {
  web: {
    label: "Web",
    colors: {
      light: ["#0e7490"],
      dark: ["#22b8cf"],
    },
  },
  mobile: {
    label: "Mobile",
    colors: {
      light: ["#e8590c"],
      dark: ["#ff8a3d"],
    },
  },
} satisfies ChartConfig;

export function ExampleAreaChart() {
  return (
    <AreaChart data={data} config={chartConfig} className="h-full w-full p-4" stackType="stacked">
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="week" tickFormatter={(value) => value.replace("Week ", "W")} />
      <AreaChart.YAxis dataKey="web" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area
        dataKey="web"
        variant="grainient"
        grainient={{ animate: true }} // [!code highlight]
        strokeVariant="solid"
        isClickable
      />
      <AreaChart.Area
        dataKey="mobile"
        variant="grainient"
        grainient={{ animate: true }} // [!code highlight]
        strokeVariant="solid"
        isClickable
      />
    </AreaChart>
  );
}
