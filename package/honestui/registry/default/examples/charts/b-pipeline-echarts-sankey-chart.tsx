"use client";

import { SankeyChart, type ChartConfig } from "@/registry/default/charts/sankey-chart";

// Scenario: Food bank distribution
const chartData = {
  nodes: [
    { name: "Grocers" },
    { name: "Farms" },
    { name: "Donations" },
    { name: "CommunityDrives" },
    { name: "Warehouse" },
    { name: "FoodBanks" },
    { name: "Schools" },
    { name: "Shelters" },
    { name: "EmergencyStock" },
  ],
  links: [
    { source: 0, target: 4, value: 62960 },
    { source: 1, target: 4, value: 92440 },
    { source: 2, target: 4, value: 29920 },
    { source: 3, target: 4, value: 56680 },
    { source: 4, target: 5, value: 105280 },
    { source: 4, target: 6, value: 18360 },
    { source: 4, target: 7, value: 24940 },
    { source: 4, target: 8, value: 93420 },
  ],
};

const chartConfig = {
  Grocers: { label: "Grocers", colors: { light: ["#1d4ed8"], dark: ["#3b82f6"] } },
  Farms: { label: "Farms", colors: { light: ["#2563eb"], dark: ["#60a5fa"] } },
  Donations: { label: "Donations", colors: { light: ["#4338ca"], dark: ["#6366f1"] } },
  CommunityDrives: { label: "Community drives", colors: { light: ["#4f46e5"], dark: ["#818cf8"] } },
  // The hub is a waist, not a category: no label, and a mid tone so the bands
  // read blue -> violet -> red straight across instead of fading out at centre.
  Warehouse: { label: "", colors: { light: ["#6d28d9"], dark: ["#8b5cf6"] } },
  FoodBanks: { label: "Food banks", colors: { light: ["#be123c"], dark: ["#f43f5e"] } },
  Schools: { label: "Schools", colors: { light: ["#c2410c"], dark: ["#fb923c"] } },
  Shelters: { label: "Shelters", colors: { light: ["#9f1239"], dark: ["#fb7185"] } },
  EmergencyStock: { label: "Emergency stock", colors: { light: ["#b91c1c"], dark: ["#ef4444"] } },
} satisfies ChartConfig;

const TOTAL = chartData.links
  .filter((link) => link.target === 4)
  .reduce((sum, link) => sum + link.value, 0);

export function PipelineSankeyChart() {
  return (
    <div className="relative h-full w-full p-4">
      <SankeyChart
        data={chartData}
        config={chartConfig}
        className="h-full w-full"
        nodeWidth={10}
        nodePadding={18}
        linkCurvature={0.55}
      >
        <SankeyChart.Tooltip variant="frosted-glass" />
        <SankeyChart.Link variant="gradient" />
        <SankeyChart.Node radius={5}>
          <SankeyChart.NodeLabel
            position="outside"
            showValues
            valueFormatter={(value) => `$${value.toLocaleString("en-US")}`}
          />
        </SankeyChart.Node>
      </SankeyChart>

      <div className="pointer-events-none absolute inset-0 flex items-stretch justify-center">
        <div className="flex h-full flex-col items-center justify-center bg-[linear-gradient(to_right,transparent_0%,var(--background)_32%,var(--background)_68%,transparent_100%)] px-14">
          <span className="text-muted-foreground text-[11px] sm:text-xs">Food collected</span>
          <span className="text-primary text-2xl leading-none font-semibold tracking-tight sm:text-4xl">
            ${TOTAL.toLocaleString("en-US")}
          </span>
          <span className="text-muted-foreground mt-1 text-[11px] sm:text-xs">
            4 sources &middot; 4 destinations
          </span>
        </div>
      </div>
    </div>
  );
}
