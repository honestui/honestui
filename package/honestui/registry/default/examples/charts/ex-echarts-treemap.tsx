"use client";

import { Treemap, type ChartConfig, type TreemapNode } from "@/registry/default/charts/treemap";

// Scenario: Cloud spend by service
const data: TreemapNode[] = [
  {
    name: "compute",
    children: [
      { name: "Web servers", value: 18400 },
      { name: "Background jobs", value: 9200 },
      { name: "Build runners", value: 6100 },
      { name: "Preview envs", value: 3300 },
    ],
  },
  {
    name: "storage",
    children: [
      { name: "Object storage", value: 11200 },
      { name: "Backups", value: 4800 },
      { name: "Logs", value: 3900 },
    ],
  },
  {
    name: "database",
    children: [
      { name: "Primary", value: 12600 },
      { name: "Read replicas", value: 5400 },
      { name: "Analytics", value: 4100 },
    ],
  },
  {
    name: "network",
    children: [
      { name: "Egress", value: 6900 },
      { name: "CDN", value: 3600 },
    ],
  },
];

const chartConfig = {
  compute: { label: "Compute", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
  storage: { label: "Storage", colors: { light: ["#059669"], dark: ["#10b981"] } },
  database: { label: "Database", colors: { light: ["#d97706"], dark: ["#f59e0b"] } },
  network: { label: "Network", colors: { light: ["#7c3aed"], dark: ["#8b5cf6"] } },
} satisfies ChartConfig;

const usd = (value: number) => `$${value.toLocaleString()}`;

export function ExampleTreemap() {
  return (
    <Treemap data={data} config={chartConfig} className="h-full w-full p-4">
      <Treemap.Legend />
      <Treemap.Tooltip valueFormatter={usd} />
      <Treemap.Tiles valueFormatter={usd} />
    </Treemap>
  );
}
