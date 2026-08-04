"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Hiring funnel
const data = [
  { month: "January", applicants: 307, interviews: 218 },
  { month: "February", applicants: 745, interviews: 552 },
  { month: "March", applicants: 465, interviews: 346 },
  { month: "April", applicants: 569, interviews: 460 },
  { month: "May", applicants: 399, interviews: 380 },
  { month: "June", applicants: 669, interviews: 500 },
  { month: "July", applicants: 370, interviews: 279 },
  { month: "August", applicants: 806, interviews: 630 },
  { month: "September", applicants: 551, interviews: 434 },
  { month: "October", applicants: 470, interviews: 431 },
  { month: "November", applicants: 697, interviews: 572 },
  { month: "December", applicants: 283, interviews: 187 },
];

const chartConfig = {
  applicants: {
    label: "Applicants",
    colors: {
      light: ["red", "orange", "rosybrown", "purple", "blue"], // [!code highlight]
      dark: ["red", "orange", "rosybrown", "purple", "blue"], // [!code highlight]
    },
  },
  interviews: {
    label: "Interviews",
    colors: {
      light: ["gray"],
      dark: ["gray"],
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
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="applicants" variant="gradient" isClickable>
        <AreaChart.Dot variant="colored-border" />
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area dataKey="interviews" variant="gradient" isClickable>
        <AreaChart.Dot variant="colored-border" />
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
