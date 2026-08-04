"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Archive digitization
const chartData = [
  { month: "Jan '24", scans: 380 },
  { month: "Feb '24", scans: 972 },
  { month: "Mar '24", scans: 568 },
  { month: "Apr '24", scans: 698 },
  { month: "May '24", scans: 508 },
  { month: "Jun '24", scans: 867 },
  { month: "Jul '24", scans: 437 },
  { month: "Aug '24", scans: 1027 },
  { month: "Sep '24", scans: 718 },
  { month: "Oct '24", scans: 591 },
  { month: "Nov '24", scans: 891 },
  { month: "Dec '24", scans: 301 },
  { month: "Jan '25", scans: 431 },
  { month: "Feb '25", scans: 1012 },
  { month: "Mar '25", scans: 626 },
  { month: "Apr '25", scans: 745 },
  { month: "May '25", scans: 554 },
  { month: "Jun '25", scans: 930 },
  { month: "Jul '25", scans: 474 },
  { month: "Aug '25", scans: 1074 },
  { month: "Sep '25", scans: 779 },
  { month: "Oct '25", scans: 649 },
  { month: "Nov '25", scans: 956 },
  { month: "Dec '25", scans: 349 },
];

const chartConfig = {
  scans: {
    label: "Scans",
    colors: {
      light: ["#18181b"],
      dark: ["#fafafa"],
    },
  },
} satisfies ChartConfig;

const TOTAL = chartData.reduce((sum, { scans }) => sum + scans, 0);
const TOP = chartData.reduce((max, row) => (row.scans > max.scans ? row : max), chartData[0]);

export function MonospaceBarChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[↗] Total Scans"}</span>
            <span className="text-primary font-mono text-3xl">
              <span className="text-muted-foreground text-sm font-normal">pages</span>
              <span className="tracking-tighter">{TOTAL.toLocaleString()}</span>
            </span>
          </div>
          <hr className="mx-4 h-full border-l border-dashed" />
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[⬆] Busiest Month"}</span>
            <span className="text-primary font-mono text-3xl tracking-tighter">{TOP.month}</span>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-1">
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// X-AXIS: "}
            <span className="text-primary">MONTHS</span>
          </span>
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// Y-AXIS: "}
            <span className="text-primary">CHECKOUTS</span>
          </span>
        </div>
      </div>

      <hr className="my-4 border-t border-dashed" />

      <div className="min-h-0 w-full flex-1">
        <BarChart
          data={chartData}
          config={chartConfig}
          xDataKey="month"
          className="h-full w-full"
        >
          <BarChart.XAxis
            dataKey="month"
            tickFormatter={(value) => value.slice(0, 3)}
            hideDots
          />
          <BarChart.Bar dataKey="scans" variant="expandable" />
        </BarChart>
      </div>
    </div>
  );
}
