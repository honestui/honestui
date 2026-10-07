"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Weekly active users by platform (sample data).
// Week 9 is still being counted, weeks 10 to 12 are a forecast with bounds,
// and the mobile counter was offline in week 5.
const data = [
  { week: "W1", web: 4120, webStatus: "measured", mobile: 2310, mobileStatus: "measured" },
  { week: "W2", web: 4280, webStatus: "measured", mobile: 2440, mobileStatus: "measured" },
  { week: "W3", web: 4190, webStatus: "measured", mobile: 2610, mobileStatus: "measured" },
  { week: "W4", web: 4460, webStatus: "measured", mobile: 2790, mobileStatus: "measured" },
  { week: "W5", web: 4530, webStatus: "measured", mobile: null, mobileStatus: "missing" },
  { week: "W6", web: 4610, webStatus: "measured", mobile: 3020, mobileStatus: "measured" },
  { week: "W7", web: 4720, webStatus: "measured", mobile: 3180, mobileStatus: "measured" },
  { week: "W8", web: 4690, webStatus: "measured", mobile: 3260, mobileStatus: "measured" },
  { week: "W9", web: 3140, webStatus: "provisional", mobile: 2090, mobileStatus: "provisional" },
  {
    week: "W10",
    web: 4810,
    webStatus: "forecast",
    webLow: 4560,
    webHigh: 5050,
    mobile: 3420,
    mobileStatus: "forecast",
    mobileLow: 3200,
    mobileHigh: 3650,
  },
  {
    week: "W11",
    web: 4880,
    webStatus: "forecast",
    webLow: 4540,
    webHigh: 5230,
    mobile: 3530,
    mobileStatus: "forecast",
    mobileLow: 3230,
    mobileHigh: 3840,
  },
  {
    week: "W12",
    web: 4950,
    webStatus: "forecast",
    webLow: 4510,
    webHigh: 5400,
    mobile: 3650,
    mobileStatus: "forecast",
    mobileLow: 3260,
    mobileHigh: 4050,
  },
];

const chartConfig = {
  web: {
    label: "Web",
    colors: {
      light: ["#1d4ed8"],
      dark: ["#60a5fa"],
    },
  },
  mobile: {
    label: "Mobile",
    colors: {
      light: ["#b45309"],
      dark: ["#fbbf24"],
    },
  },
} satisfies ChartConfig;

export function ExampleAreaChart() {
  return (
    <AreaChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="week"
      ariaLabel="Sample weekly active users for web and mobile. Weeks 1 to 8 are measured, week 9 is provisional, weeks 10 to 12 are forecast, and mobile is missing in week 5."
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="week" />
      <AreaChart.YAxis />
      <AreaChart.Legend />
      <AreaChart.Tooltip />
      <AreaChart.Area
        dataKey="web"
        variant="gradient"
        statusKey="webStatus" // [!code highlight]
        lowerKey="webLow" // [!code highlight]
        upperKey="webHigh" // [!code highlight]
      />
      <AreaChart.Area
        dataKey="mobile"
        variant="gradient"
        statusKey="mobileStatus" // [!code highlight]
        lowerKey="mobileLow" // [!code highlight]
        upperKey="mobileHigh" // [!code highlight]
      />
    </AreaChart>
  );
}
