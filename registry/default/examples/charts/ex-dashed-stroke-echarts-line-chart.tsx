"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Podcast audience
const data = [
  { month: "January", streams: 313, downloads: 138 },
  { month: "February", streams: 800, downloads: 367 },
  { month: "March", streams: 487, downloads: 229 },
  { month: "April", streams: 602, downloads: 309 },
  { month: "May", streams: 417, downloads: 256 },
  { month: "June", streams: 715, downloads: 329 },
  { month: "July", streams: 382, downloads: 181 },
  { month: "August", streams: 865, downloads: 421 },
  { month: "September", streams: 585, downloads: 291 },
  { month: "October", streams: 493, downloads: 291 },
  { month: "November", streams: 746, downloads: 377 },
  { month: "December", streams: 283, downloads: 120 },
];

const chartConfig = {
  streams: {
    label: "Streams",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  downloads: {
    label: "Downloads",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleLineChart() {
  return (
    <LineChart data={data} config={chartConfig} className="h-full w-full p-4">
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.YAxis dataKey="streams" />
      <LineChart.Legend isClickable />
      <LineChart.Tooltip />
      <LineChart.Line
        dataKey="streams"
        strokeVariant="dashed" // [!code highlight]
        isClickable
      >
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
      <LineChart.Line
        dataKey="downloads"
        strokeVariant="dashed" // [!code highlight]
        isClickable
      >
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
    </LineChart>
  );
}
