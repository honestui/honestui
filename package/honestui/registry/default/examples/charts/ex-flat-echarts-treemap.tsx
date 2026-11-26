"use client";

import { Treemap, type ChartConfig, type TreemapNode } from "@/registry/default/charts/treemap";

// Scenario: Support tickets by topic
const data: TreemapNode[] = [
  { name: "billing", value: 412 },
  { name: "login", value: 287 },
  { name: "exports", value: 164 },
  { name: "integrations", value: 133 },
  { name: "mobile", value: 92 },
  { name: "other", value: 58 },
];

const chartConfig = {
  billing: { label: "Billing", colors: { light: ["#1d4ed8"], dark: ["#60a5fa"] } },
  login: { label: "Login", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
  exports: { label: "Exports", colors: { light: ["#3b82f6"], dark: ["#2563eb"] } },
  integrations: { label: "Integrations", colors: { light: ["#60a5fa"], dark: ["#1d4ed8"] } },
  mobile: { label: "Mobile", colors: { light: ["#93c5fd"], dark: ["#1e40af"] } },
  other: { label: "Other", colors: { light: ["#cbd5e1"], dark: ["#334155"] } },
} satisfies ChartConfig;

export function ExampleTreemap() {
  return (
    <Treemap data={data} config={chartConfig} className="h-full w-full p-4">
      <Treemap.Tooltip valueFormatter={(value) => `${value} tickets`} />
      <Treemap.Tiles radius={4} gap={3} />
    </Treemap>
  );
}
