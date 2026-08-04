"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: College endowment funds
const SERIES = [
  { key: "robinhood", label: "Sustainable fund", color: "#c3f000", pct: -4.41, delta: -2377.66 },
  { key: "coinbase", label: "Bond fund", color: "#2f6bff", pct: 1.15, delta: 617.22 },
] as const;

const chartData = [
  { date: "Dec 22", robinhood: 59847, coinbase: 59574 },
  { date: "Dec 23", robinhood: 60362, coinbase: 58919 },
  { date: "Dec 24", robinhood: 60784, coinbase: 58231 },
  { date: "Dec 25", robinhood: 60473, coinbase: 57587 },
  { date: "Dec 26", robinhood: 60007, coinbase: 56987 },
  { date: "Dec 27", robinhood: 59740, coinbase: 56499 },
  { date: "Dec 28", robinhood: 59407, coinbase: 56077 },
  { date: "Dec 29", robinhood: 59096, coinbase: 55722 },
  { date: "Dec 30", robinhood: 58919, coinbase: 55456 },
  { date: "Dec 31", robinhood: 58652, coinbase: 55234 },
  { date: "Jan 1", robinhood: 58497, coinbase: 55100 },
  { date: "Jan 2", robinhood: 58297, coinbase: 55056 },
  { date: "Jan 3", robinhood: 58186, coinbase: 55189 },
  { date: "Jan 4", robinhood: 58097, coinbase: 55478 },
  { date: "Jan 5", robinhood: 57986, coinbase: 55900 },
  { date: "Jan 6", robinhood: 57875, coinbase: 56410 },
  { date: "Jan 7", robinhood: 57809, coinbase: 56987 },
  { date: "Jan 8", robinhood: 57742, coinbase: 57609 },
  { date: "Jan 9", robinhood: 57676, coinbase: 58208 },
  { date: "Jan 10", robinhood: 57609, coinbase: 58786 },
  { date: "Jan 11", robinhood: 57565, coinbase: 59296 },
  { date: "Jan 12", robinhood: 57498, coinbase: 59696 },
  { date: "Jan 13", robinhood: 57431, coinbase: 59984 },
  { date: "Jan 14", robinhood: 57387, coinbase: 60162 },
  { date: "Jan 15", robinhood: 57320, coinbase: 60273 },
  { date: "Jan 16", robinhood: 57254, coinbase: 60295 },
  { date: "Jan 17", robinhood: 57207, coinbase: 60259 },
];

const chartConfig = {
  robinhood: { label: "Sustainable fund", colors: { light: ["#a6cc00"], dark: ["#c3f000"] } },
  coinbase: { label: "Bond fund", colors: { light: ["#2f6bff"], dark: ["#4c86ff"] } },
} satisfies ChartConfig;

const money = (value: number) =>
  Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PortfolioAreaChart() {
  return (
    <div className="flex h-full w-full flex-col pt-4">
      <div className="grid grid-cols-2 gap-x-8 px-4">
        {SERIES.map(({ key, label, color, pct, delta }) => (
          <div key={key} className="flex flex-col gap-1">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span
                className="size-3 shrink-0 rounded-full border-2"
                style={{ borderColor: color }}
              />
              {label}
            </div>
            <div className="text-primary text-2xl font-semibold tracking-tight sm:text-3xl">
              {pct > 0 ? "+" : "−"}
              {Math.abs(pct).toFixed(2)}%
            </div>
            <div className={delta < 0 ? "text-rose-500" : "text-emerald-500"}>
              {delta < 0 ? "−" : "+"}${money(delta)}
            </div>
          </div>
        ))}
      </div>

      <AreaChart
        data={chartData}
        config={chartConfig}
        xDataKey="date"
        className="mt-4 min-h-0 w-full flex-1"
        curveType="step"
        enableHoverReveal
        chartOptions={{
          grid: { left: 0, right: 0, top: 16, bottom: 0 },
          yAxis: { type: "value", show: false, scale: true, boundaryGap: ["12%", "16%"] },
        }}
      >
        <AreaChart.Tooltip variant="frosted-glass" />
        <AreaChart.Area dataKey="robinhood" variant="dotted" strokeVariant="solid">
          <AreaChart.ActiveDot variant="ping" />
        </AreaChart.Area>
        <AreaChart.Area dataKey="coinbase" variant="dotted" strokeVariant="solid">
          <AreaChart.ActiveDot variant="ping" />
        </AreaChart.Area>
      </AreaChart>
    </div>
  );
}
