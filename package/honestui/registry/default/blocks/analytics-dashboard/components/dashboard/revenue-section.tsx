"use client";

import { useState } from "react";
import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

import { Toggle, ToggleGroup } from "@/components/ui/toggle-group";
import { getRevenueSeries, revenueMetricOptions } from "@/lib/dashboard/data";
import { formatCompactCurrency } from "@/lib/dashboard/format";
import type { RevenueMetricKey } from "@/lib/dashboard/types";
import { ChartEmptyState } from "./chart-states";
import { useDateRange } from "./date-range-context";

const chartConfig = {
  current: {
    label: "This period",
    colors: {
      light: ["var(--hui-color-viz-iris-9)"],
      dark: ["var(--hui-color-viz-iris-9)"],
    },
  },
  // The comparison series reads as a reference line, so it uses the muted
  // foreground token instead of a second data color.
  previous: {
    label: "Previous period",
    colors: {
      light: ["var(--hui-color-foreground-base-tertiary)"],
      dark: ["var(--hui-color-foreground-base-tertiary)"],
    },
  },
} satisfies ChartConfig;

export function RevenueSection() {
  const { rangeKey, range } = useDateRange();
  const [metric, setMetric] = useState<RevenueMetricKey>("revenue");

  const series = getRevenueSeries(rangeKey, metric);
  const metricLabel =
    revenueMetricOptions.find((option) => option.key === metric)?.label ??
    "Revenue";

  return (
    <section aria-label="Revenue">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 className="text-base font-semibold">Revenue</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Recurring revenue over the selected period
          </p>
        </div>
        <ToggleGroup
          aria-label="Revenue metric"
          value={[metric]}
          onValueChange={(groupValue: unknown[]) => {
            const next = groupValue[0];
            if (typeof next === "string") {
              setMetric(next as RevenueMetricKey);
            }
          }}
        >
          {revenueMetricOptions.map((option) => (
            <Toggle
              key={option.key}
              value={option.key}
              className="px-1"
              aria-label={option.label}
            >
              <span className="px-2">{option.label}</span>
            </Toggle>
          ))}
        </ToggleGroup>
      </div>

      <div className="mt-5 h-72 w-full sm:h-80">
        {series.length === 0 ? (
          <ChartEmptyState />
        ) : (
          <AreaChart
            data={series}
            config={chartConfig}
            xDataKey="label"
            curveType="monotone"
            ariaLabel={`${metricLabel} for the ${range.label.toLowerCase()} compared with the ${range.comparisonLabel}`}
            className="h-full w-full"
          >
            <AreaChart.Grid />
            <AreaChart.XAxis dataKey="label" />
            <AreaChart.YAxis
              tickFormatter={(value) => formatCompactCurrency(value)}
            />
            <AreaChart.Tooltip />
            <AreaChart.Legend align="right" verticalAlign="top" />
            <AreaChart.Area
              dataKey="previous"
              variant="none"
              strokeVariant="dashed"
            />
            <AreaChart.Area
              dataKey="current"
              variant="gradient"
              strokeVariant="solid"
            />
          </AreaChart>
        )}
      </div>
    </section>
  );
}
