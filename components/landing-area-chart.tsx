"use client"

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart"

// Sample data. The card that renders this chart labels it as such.
const chartData = [
  { month: "Jan", rentals: 3308 },
  { month: "Feb", rentals: 3463 },
  { month: "Mar", rentals: 3841 },
  { month: "Apr", rentals: 3752 },
  { month: "May", rentals: 4129 },
  { month: "Jun", rentals: 4640 },
  { month: "Jul", rentals: 5062 },
]

const chartConfig = {
  rentals: {
    label: "Bike rentals",
    colors: {
      // One hue: the line is a single series, so it gets a single color.
      light: ["#3b5bdb", "#3b5bdb", "#3b5bdb"],
      dark: ["#748ffc", "#748ffc", "#748ffc"],
    },
  },
} satisfies ChartConfig

export default function LandingAreaChart() {
  return (
    <div className="flex size-full flex-col">
      <div className="min-h-0 flex-1">
        <AreaChart
          data={chartData}
          config={chartConfig}
          xDataKey="month"
          className="size-full"
          curveType="monotone"
          chartOptions={{
            grid: { left: 0, right: 0, top: 8, bottom: 0, outerBoundsMode: "none" },
            yAxis: { type: "value", show: false, scale: true, boundaryGap: ["16%", "20%"] },
          }}
        >
          <AreaChart.Tooltip variant="frosted-glass" />
          <AreaChart.Area
            dataKey="rentals"
            variant="gradient"
            strokeVariant="solid"
            strokeWidth={2.5}
          >
            <AreaChart.ActiveDot variant="ping" />
          </AreaChart.Area>
        </AreaChart>
      </div>
      <div
        aria-hidden="true"
        className="mt-2 flex justify-between text-xs text-[var(--hui-color-foreground-base-secondary)]"
      >
        {chartData.map(({ month }) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  )
}
