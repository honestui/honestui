"use client";

import { BoxPlot, type BoxPlotValue, type ChartConfig } from "@/registry/default/charts/box-plot";

// Scenario: Kitchen ticket times
const chartData = [
  { team: "Grill", duration: [1.8, 2.7, 3.4, 4.3, 5.8] },
  { team: "Bar", duration: [2.2, 3.1, 4.0, 5.1, 6.7] },
  { team: "Pantry", duration: [2.5, 3.6, 4.5, 5.8, 7.4] },
  { team: "Pastry", duration: [3.0, 4.1, 5.2, 6.4, 8.1] },
  { team: "Expo", duration: [1.6, 2.4, 3.1, 3.9, 5.2] },
  { team: "Prep", duration: [2.0, 2.9, 3.7, 4.8, 6.1] },
] satisfies { team: string; duration: BoxPlotValue }[];

const chartConfig = {
  duration: {
    label: "Ticket time",
    colors: {
      light: ["#fef3c7", "#fbbf24", "#d97706", "#92400e"],
      dark: ["#78350f", "#d97706", "#fbbf24", "#fde68a"],
    },
  },
} satisfies ChartConfig;

export function CycleBoxPlot() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="grid grid-cols-[1fr_auto_auto] items-end gap-x-5">
        <div>
          <p className="text-primary text-base font-medium tracking-tight sm:text-lg">
            Release cycle time
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">Last 30 dinner services · minutes</p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-muted-foreground text-[10px] tracking-wide uppercase">Median</p>
          <p className="text-primary text-lg font-semibold tabular-nums">12.6m</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-[10px] tracking-wide uppercase">Target</p>
          <p className="text-primary text-lg font-semibold tabular-nums">≤ 15m</p>
        </div>
      </div>

      <BoxPlot
        data={chartData}
        config={chartConfig}
        xDataKey="team"
        className="mt-2 min-h-0 w-full flex-1"
        ariaLabel="Kitchen ticket-time distributions by station in minutes"
      >
        <BoxPlot.Grid />
        <BoxPlot.XAxis hideDots />
        <BoxPlot.YAxis min={0} hideDots tickFormatter={(value) => `${value}d`} />
        <BoxPlot.Tooltip valueFormatter={(value) => `${value.toFixed(1)} days`} />
        <BoxPlot.Box dataKey="duration" variant="blocks" isClickable />
      </BoxPlot>
    </div>
  );
}
