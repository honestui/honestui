"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";
import { cn } from "@/lib/utils";

// Scenario: Renewable energy output
const chartData = [
  { month: "Jan", generated: 346, forecast: 608 },
  { month: "Feb", generated: 431, forecast: 557 },
  { month: "Mar", generated: 380, forecast: 623 },
  { month: "Apr", generated: 505, forecast: 522 },
  { month: "May", generated: 578, forecast: 442 },
  { month: "Jun", generated: 539, forecast: 490 },
  { month: "Jul", generated: 636, forecast: 413 },
  { month: "Aug", generated: 710, forecast: 351 },
  { month: "Sep", generated: 664, forecast: 397 },
  { month: "Oct", generated: 735, forecast: 315 },
  { month: "Nov", generated: 685, forecast: 367 },
  { month: "Dec", generated: 766, forecast: 291 },
];

const chartConfig = {
  generated: {
    label: "Generated",
    colors: {
      light: ["#f97316", "#ec4899"],
      dark: ["#fb923c", "#f472b6"],
    },
  },
  forecast: {
    label: "Forecast",
    colors: {
      light: ["#0891b2", "#7c3aed"],
      dark: ["#22d3ee", "#a78bfa"],
    },
  },
} satisfies ChartConfig;

const STATS = [
  {
    key: "month",
    label: "This month",
    value: "12,480 MWh",
    delta: "+8.4%",
    sub: "11,960 last month",
    swatch: "bg-[#f97316] dark:bg-[#fb923c]",
  },
  {
    key: "year",
    label: "This year",
    value: "164,320 MWh",
    delta: "+3.1%",
    sub: "158,740 last year",
    swatch: "bg-[#ec4899] dark:bg-[#f472b6]",
  },
];

const CITIES = [
  { city: "Coastal wind", amount: "84,210" },
  { city: "Desert solar", amount: "61,940" },
];

export function PayoutsLineChart() {
  return (
    <div className="flex h-full w-full flex-col px-3 pt-2 pb-1 sm:px-4 sm:pt-4 sm:pb-2">
      <div className="min-h-24 w-full flex-1 sm:min-h-0">
        <LineChart
          data={chartData}
          config={chartConfig}
          xDataKey="month"
          className="h-full w-full"
          curveType="monotone"
        >
          <LineChart.Grid />
          <LineChart.YAxis />
          <LineChart.Tooltip variant="frosted-glass" />
          <LineChart.Line dataKey="generated" strokeVariant="solid" strokeWidth={2} glowing>
            <LineChart.ActiveDot variant="ping" />
          </LineChart.Line>
          <LineChart.Line dataKey="forecast" strokeVariant="solid" strokeWidth={2} glowing>
            <LineChart.ActiveDot variant="ping" />
          </LineChart.Line>
        </LineChart>
      </div>

      <div className="mt-2 grid shrink-0 grid-cols-2 gap-3 sm:mt-3 sm:gap-4">
        {STATS.map(({ key, label, value, delta, sub, swatch }) => (
          <div key={key} className="flex flex-col gap-0.5">
            <span className="text-primary flex items-center gap-1.5 text-[10px] leading-3.5 font-medium sm:text-[11px] sm:leading-normal">
              <span className={cn("size-2 shrink-0 rounded-[3px]", swatch)} />
              {label}
            </span>
            <span className="text-primary text-xl leading-6 font-semibold tracking-tight sm:text-2xl sm:leading-8">
              {value}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] leading-3.5 sm:text-[11px] sm:leading-normal">
              <span className="font-medium text-emerald-500">{delta}</span>
              <span className="text-muted-foreground">{sub}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2 shrink-0 sm:mt-3">
        {CITIES.map(({ city, amount }, i) => (
          <div
            key={city}
            className={cn(
              "border-border flex items-center justify-between py-1 text-xs sm:py-1.5 sm:text-sm",
              i > 0 && "border-t",
            )}
          >
            <span className="text-muted-foreground">{city}</span>
            <span className="text-primary font-medium">{amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
