"use client";

import { BoxPlot, type BoxPlotValue, type ChartConfig } from "@/registry/default/charts/box-plot";

// Scenario: Warehouse fulfillment time
const data = [
  { warehouse: "Denver", picking: [49, 68, 83, 101, 139], packing: [56, 74, 88, 106, 147] },
  { warehouse: "Rotterdam", picking: [44, 61, 77, 92, 126], packing: [51, 67, 82, 98, 133] },
  { warehouse: "Singapore", picking: [60, 81, 98, 121, 166], packing: [68, 87, 106, 130, 177] },
  { warehouse: "Santiago", picking: [64, 84, 103, 124, 173], packing: [71, 94, 112, 137, 186] },
] satisfies { warehouse: string; picking: BoxPlotValue; packing: BoxPlotValue }[];

const chartConfig = {
  picking: {
    label: "Picking",
    colors: {
      light: ["#2563eb", "#60a5fa"],
      dark: ["#60a5fa", "#93c5fd"],
    },
  },
  packing: {
    label: "Packing",
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
      xDataKey="warehouse"
      className="h-full w-full p-4"
    >
      <BoxPlot.Grid />
      <BoxPlot.XAxis tickFormatter={(value) => value.replace("Denver", "N. America").replace("Santiago", "S. America")} />
      <BoxPlot.YAxis tickFormatter={(value) => `${value} ms`} />
      <BoxPlot.Legend isClickable />
      <BoxPlot.Tooltip valueFormatter={(value) => `${value} ms`} />
      <BoxPlot.Box dataKey="picking" variant="default" isClickable />
      <BoxPlot.Box dataKey="packing" variant="default" isClickable />
    </BoxPlot>
  );
}
