"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

// Scenario: National park comparison
const chartData = [
  { company: "Acadia", valuation: 1.33, growth: 93, revenue: 47 },
  { company: "Olympic", valuation: 3.11, growth: 75, revenue: 107 },
  { company: "Zion", valuation: 4.55, growth: 58, revenue: 171 },
  { company: "Everglades", valuation: 6.33, growth: 49, revenue: 240 },
  { company: "Denali", valuation: 8.21, growth: 39, revenue: 339 },
  { company: "Yosemite", valuation: 10.1, growth: 31, revenue: 466 },
  { company: "Badlands", valuation: 3.77, growth: 85, revenue: 131 },
  { company: "Arches", valuation: 6.99, growth: 68, revenue: 274 },
];

const chartConfig = {
  valuation: { label: "Annual funding" },
  growth: { label: "Visitor growth" },
  revenue: { label: "Acreage" },
  market: {
    label: "Parks",
    colors: {
      light: ["#ccfbf1", "#0f766e"],
      dark: ["#134e4a", "#5eead4"],
    },
  },
} satisfies ChartConfig;

export function MarketMapScatterChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-primary text-base font-medium tracking-tight sm:text-lg">National parks</p>
          <p className="text-muted-foreground mt-0.5 text-xs">Bubble area represents acreage</p>
        </div>
        <p className="text-muted-foreground text-xs">2026 season</p>
      </div>

      <ScatterChart
        data={chartData}
        config={chartConfig}
        xDataKey="valuation"
        yDataKey="growth"
        pointNameDataKey="company"
        className="mt-2 min-h-0 w-full flex-1"
        ariaLabel="Park funding and visitor growth with acreage represented by bubble area"
      >
        <ScatterChart.Grid />
        <ScatterChart.XAxis hideDots tickFormatter={(value) => `$${value}b`} />
        <ScatterChart.YAxis hideDots tickFormatter={(value) => `${value}%`} />
        <ScatterChart.Tooltip
          xValueFormatter={(value) => `$${value.toFixed(1)}b`}
          yValueFormatter={(value) => `${value}%`}
          sizeValueFormatter={(value) => `$${value}m`}
        />
        <ScatterChart.Scatter
          dataKey="market"
          variant="bubble"
          sizeDataKey="revenue"
          minSize={14}
          maxSize={58}
          isClickable
        />
      </ScatterChart>
    </div>
  );
}
