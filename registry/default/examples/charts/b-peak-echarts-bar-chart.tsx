"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";
import { cn } from "@/lib/utils";

// Scenario: Clinic appointments
const chartData = [
  { week: "W01", booked: 142, walkIns: 82 },
  { week: "W02", booked: 182, walkIns: 101 },
  { week: "W03", booked: 158, walkIns: 73 },
  { week: "W04", booked: 221, walkIns: 120 },
  { week: "W05", booked: 195, walkIns: 93 },
  { week: "W06", booked: 256, walkIns: 185 },
  { week: "W07", booked: 231, walkIns: 107 },
  { week: "W08", booked: 319, walkIns: 175 },
  { week: "W09", booked: 271, walkIns: 124 },
  { week: "W10", booked: 218, walkIns: 98 },
  { week: "W11", booked: 245, walkIns: 114 },
  { week: "W12", booked: 192, walkIns: 88 },
];

const chartConfig = {
  booked: { label: "Booked", colors: { light: ["#7c3aed"], dark: ["#a78bfa"] } },
  walkIns: { label: "Walk-ins", colors: { light: ["#0891b2"], dark: ["#22d3ee"] } },
} satisfies ChartConfig;

const LEGEND = [
  { key: "booked", label: "Booked", swatch: "bg-[#7c3aed] dark:bg-[#a78bfa]" },
  { key: "walkIns", label: "Walk-ins", swatch: "bg-[#0891b2] dark:bg-[#22d3ee]" },
];

const PEAK = chartData.reduce(
  (best, row) => (row.booked + row.walkIns > best.booked + best.walkIns ? row : best),
  chartData[0],
);
const PEAK_TOTAL = PEAK.booked + PEAK.walkIns;

export function PeakBarChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Busiest week</span>
          <div className="flex items-baseline gap-2">
            <span className="text-primary text-2xl font-semibold tracking-tight sm:text-3xl">
              {PEAK_TOTAL}
            </span>
            <span className="text-muted-foreground text-sm">appointments in {PEAK.week}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5 pt-1">
          {LEGEND.map(({ key, label, swatch }) => (
            <span
              key={key}
              className="text-muted-foreground flex items-center gap-2 text-[11px] sm:text-xs"
            >
              <span className={cn("size-2.5 shrink-0 rounded-[3px]", swatch)} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 min-h-0 w-full flex-1">
        <BarChart
          data={chartData}
          config={chartConfig}
          xDataKey="week"
          className="h-full w-full"
          stackType="stacked"
          enableMaxValueHighlight
        >
          <BarChart.XAxis dataKey="week" hideDots />
          <BarChart.Tooltip />
          <BarChart.Bar dataKey="walkIns" radius={6} />
          <BarChart.Bar dataKey="booked" radius={6} />
        </BarChart>
      </div>
    </div>
  );
}
