"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

const chartData = [
  { company: "Northstar", valuation: 1.2, growth: 84, revenue: 42 },
  { company: "Atlas", valuation: 2.8, growth: 68, revenue: 96 },
  { company: "Relay", valuation: 4.1, growth: 52, revenue: 154 },
  { company: "Beacon", valuation: 5.7, growth: 44, revenue: 216 },
  { company: "Orbit", valuation: 7.4, growth: 35, revenue: 305 },
  { company: "Summit", valuation: 9.1, growth: 28, revenue: 420 },
  { company: "Tempo", valuation: 3.4, growth: 77, revenue: 118 },
  { company: "Arc", valuation: 6.3, growth: 61, revenue: 247 },
];

const chartConfig = {
  valuation: { label: "Valuation" },
  growth: { label: "Growth" },
  revenue: { label: "Revenue" },
  market: {
    label: "Market",
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
          <p className="text-primary text-base font-medium tracking-tight sm:text-lg">Market map</p>
          <p className="text-muted-foreground mt-0.5 text-xs">Bubble area represents revenue</p>
        </div>
        <p className="text-muted-foreground text-xs">FY 2025</p>
      </div>

      <ScatterChart
        data={chartData}
        config={chartConfig}
        xDataKey="valuation"
        yDataKey="growth"
        pointNameDataKey="company"
        className="mt-2 min-h-0 w-full flex-1"
        ariaLabel="Company valuation and growth with revenue represented by bubble area"
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
