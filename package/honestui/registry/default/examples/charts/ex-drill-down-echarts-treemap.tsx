"use client";

import { Treemap, type ChartConfig, type TreemapNode } from "@/registry/default/charts/treemap";

// Scenario: Bundle size by package
const data: TreemapNode[] = [
  {
    name: "app",
    children: [
      { name: "routes", children: [{ name: "dashboard", value: 148 }, { name: "settings", value: 64 }, { name: "billing", value: 52 }] },
      { name: "components", children: [{ name: "charts", value: 96 }, { name: "forms", value: 58 }, { name: "tables", value: 41 }] },
      { name: "lib", value: 38 },
    ],
  },
  {
    name: "vendor",
    children: [
      { name: "react-dom", value: 132 },
      { name: "echarts", value: 318 },
      { name: "date-fns", value: 44 },
      { name: "zod", value: 57 },
    ],
  },
  {
    name: "assets",
    children: [
      { name: "fonts", value: 86 },
      { name: "icons", value: 34 },
    ],
  },
];

const chartConfig = {
  app: { label: "App code", colors: { light: ["#0891b2"], dark: ["#22d3ee"] } },
  vendor: { label: "Dependencies", colors: { light: ["#db2777"], dark: ["#f472b6"] } },
  assets: { label: "Assets", colors: { light: ["#65a30d"], dark: ["#a3e635"] } },
} satisfies ChartConfig;

const kb = (value: number) => `${value.toLocaleString()} kB`;

export function ExampleTreemap() {
  return (
    <Treemap data={data} config={chartConfig} className="h-full w-full p-4">
      <Treemap.Tooltip valueFormatter={kb} />
      <Treemap.Tiles isDrillable valueFormatter={kb} />
    </Treemap>
  );
}
