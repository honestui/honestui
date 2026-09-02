"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

import { acquisitionByRange } from "@/lib/dashboard/data";
import {
  formatCompactNumber,
  formatNumber,
  formatPercent,
} from "@/lib/dashboard/format";
import { useDateRange } from "./date-range-context";

const chartConfig = {
  sessions: {
    label: "Sessions",
    colors: {
      light: ["var(--hui-color-viz-blue-9)"],
      dark: ["var(--hui-color-viz-blue-9)"],
    },
  },
} satisfies ChartConfig;

export function AcquisitionSection() {
  const { rangeKey } = useDateRange();
  const channels = acquisitionByRange[rangeKey];

  return (
    <section aria-label="Acquisition" className="flex min-w-0 flex-col">
      <h2 className="text-base font-semibold">Acquisition</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Sessions by channel over the selected period
      </p>

      <div className="mt-5 h-56 w-full">
        <BarChart
          data={channels}
          config={chartConfig}
          xDataKey="channel"
          layout="horizontal"
          ariaLabel="Sessions by acquisition channel"
          className="h-full w-full"
        >
          <BarChart.YAxis dataKey="channel" />
          <BarChart.XAxis
            tickFormatter={(value) => formatCompactNumber(Number(value))}
          />
          <BarChart.Tooltip />
          <BarChart.Bar dataKey="sessions" />
        </BarChart>
      </div>

      <div className="mt-4 border-t">
        <div
          aria-hidden
          className="grid grid-cols-[1fr_auto_auto] gap-x-6 pt-3 pb-1 text-xs text-muted-foreground"
        >
          <span>Channel</span>
          <span className="w-16 text-right">Conv. rate</span>
          <span className="w-20 text-right">Customers</span>
        </div>
        <ul className="text-sm">
          {channels.map((channel) => (
            <li
              key={channel.channel}
              className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-6 py-1.5"
            >
              <span className="truncate">{channel.channel}</span>
              <span className="w-16 text-right tabular-nums text-muted-foreground">
                {formatPercent(channel.conversionRate)}
              </span>
              <span className="w-20 text-right tabular-nums">
                {formatNumber(channel.customers)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
