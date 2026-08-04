"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";
import { cn } from "@/lib/utils";

// Scenario: Bread proofing schedule
const chartData = [
  { slot: "Mon 1", current: 16, previous: 38 },
  { slot: "Mon 2", current: 10, previous: 46 },
  { slot: "Mon 3", current: 20, previous: 41 },
  { slot: "Mon 4", current: 29, previous: 32 },
  { slot: "Tue 1", current: 34, previous: 27 },
  { slot: "Tue 2", current: 30, previous: 37 },
  { slot: "Tue 3", current: 21, previous: 50 },
  { slot: "Tue 4", current: 13, previous: 58 },
  { slot: "Wed 1", current: 18, previous: 52 },
  { slot: "Wed 2", current: 24, previous: 43 },
  { slot: "Wed 3", current: 17, previous: 49 },
  { slot: "Wed 4", current: 12, previous: 56 },
  { slot: "Thu 1", current: 19, previous: 48 },
  { slot: "Thu 2", current: 27, previous: 34 },
  { slot: "Thu 3", current: 22, previous: 29 },
  { slot: "Thu 4", current: 14, previous: 24 },
  { slot: "Fri 1", current: 23, previous: 31 },
  { slot: "Fri 2", current: 32, previous: 40 },
  { slot: "Fri 3", current: 38, previous: 47 },
  { slot: "Fri 4", current: 31, previous: 61 },
  { slot: "Sat 1", current: 26, previous: 54 },
  { slot: "Sat 2", current: 33, previous: 44 },
  { slot: "Sat 3", current: 40, previous: 39 },
  { slot: "Sat 4", current: 36, previous: 49 },
];

const chartConfig = {
  current: { label: "Baked", colors: { light: ["#171717"], dark: ["#fafafa"] } },
  previous: { label: "Pre-orders", colors: { light: ["#d4d4d4"], dark: ["#525252"] } },
} satisfies ChartConfig;

const LEGEND = [
  { key: "current", label: "Baked", swatch: "border-[#171717] dark:border-[#fafafa]" },
  { key: "previous", label: "Pre-orders", swatch: "border-[#d4d4d4] dark:border-[#525252]" },
];

const TOTAL = chartData.reduce((sum, { current }) => sum + current, 0);

export function ShipmentsLineChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <span className="text-primary text-sm font-medium tracking-tight">Loaves prepared</span>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-primary text-2xl font-semibold tracking-tight sm:text-3xl">
            {TOTAL}
          </span>
          <span className="text-xs font-medium text-emerald-500">+6.1%</span>
          <span className="text-muted-foreground text-xs">versus prior week</span>
        </div>
        <div className="flex items-center gap-3">
          {LEGEND.map(({ key, label, swatch }) => (
            <span
              key={key}
              className="text-muted-foreground flex items-center gap-1.5 text-[11px] sm:text-xs"
            >
              <span className={cn("size-2.5 shrink-0 rounded-full border-2", swatch)} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2 min-h-0 w-full flex-1">
        <LineChart
          data={chartData}
          config={chartConfig}
          xDataKey="slot"
          className="h-full w-full"
          curveType="linear"
        >
          <LineChart.Grid />
          <LineChart.YAxis />
          <LineChart.XAxis
            dataKey="slot"
            tickFormatter={(value) => (value.endsWith(" 1") ? value.slice(0, 3) : "")}
          />
          <LineChart.Tooltip />
          <LineChart.Line dataKey="previous" strokeVariant="dashed" strokeWidth={1.5} />
          <LineChart.Line dataKey="current" strokeVariant="solid" strokeWidth={1.5}>
            <LineChart.ActiveDot />
          </LineChart.Line>
        </LineChart>
      </div>
    </div>
  );
}
