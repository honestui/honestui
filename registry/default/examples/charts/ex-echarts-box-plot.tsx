"use client";

import { BoxPlot, type BoxPlotValue, type ChartConfig } from "@/registry/default/charts/box-plot";

const data = [
  { region: "North America", api: [42, 58, 71, 86, 119], web: [48, 63, 75, 91, 126] },
  { region: "Europe", api: [38, 52, 66, 79, 108], web: [44, 57, 70, 84, 114] },
  { region: "Asia Pacific", api: [51, 69, 84, 103, 142], web: [58, 74, 91, 111, 151] },
  { region: "South America", api: [55, 72, 88, 106, 148], web: [61, 80, 96, 117, 159] },
] satisfies { region: string; api: BoxPlotValue; web: BoxPlotValue }[];

const chartConfig = {
  api: {
    label: "API",
    colors: {
      light: ["#2563eb", "#60a5fa"],
      dark: ["#60a5fa", "#93c5fd"],
    },
  },
  web: {
    label: "Web",
    colors: {
      light: ["#059669", "#6ee7b7"],
      dark: ["#34d399", "#a7f3d0"],
    },
  },
} satisfies ChartConfig;

export function ExampleBoxPlot() {
  return (
    <BoxPlot
      data={data}
      config={chartConfig}
      xDataKey="region"
      className="h-full w-full p-4"
    >
      <BoxPlot.Grid />
      <BoxPlot.XAxis tickFormatter={(value) => value.replace("North America", "N. America").replace("South America", "S. America")} />
      <BoxPlot.YAxis tickFormatter={(value) => `${value} ms`} />
      <BoxPlot.Legend isClickable />
      <BoxPlot.Tooltip valueFormatter={(value) => `${value} ms`} />
      <BoxPlot.Box dataKey="api" variant="default" isClickable />
      <BoxPlot.Box dataKey="web" variant="default" isClickable />
    </BoxPlot>
  );
}
