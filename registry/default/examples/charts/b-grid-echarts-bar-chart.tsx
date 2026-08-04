"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Metro departures
const chartData = [
  { hour: "00:00", departures: 47 },
  { hour: "01:00", departures: 31 },
  { hour: "02:00", departures: 21 },
  { hour: "03:00", departures: 16 },
  { hour: "04:00", departures: 13 },
  { hour: "05:00", departures: 20 },
  { hour: "06:00", departures: 38 },
  { hour: "07:00", departures: 73 },
  { hour: "08:00", departures: 109 },
  { hour: "09:00", departures: 138 },
  { hour: "10:00", departures: 163 },
  { hour: "11:00", departures: 181 },
  { hour: "12:00", departures: 175 },
  { hour: "13:00", departures: 190 },
  { hour: "14:00", departures: 206 },
  { hour: "15:00", departures: 193 },
  { hour: "16:00", departures: 169 },
  { hour: "17:00", departures: 153 },
  { hour: "18:00", departures: 132 },
  { hour: "19:00", departures: 107 },
  { hour: "20:00", departures: 93 },
  { hour: "21:00", departures: 79 },
  { hour: "22:00", departures: 64 },
  { hour: "23:00", departures: 52 },
];

const chartConfig = {
  departures: {
    label: "Departures",
    colors: {
      light: ["#18181b"],
      dark: ["#FFFFFF"],
    },
  },
} satisfies ChartConfig;

const TOTAL = chartData.reduce((sum, { departures }) => sum + departures, 0);
const PEAK = chartData.reduce(
  (max, row) => (row.departures > max.departures ? row : max),
  chartData[0],
);

export function GridBarChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[Σ] Total"}</span>
            <span className="text-primary font-mono text-3xl tracking-tighter">
              {TOTAL.toLocaleString()}
            </span>
          </div>
          <hr className="mx-4 h-full border-l border-dashed" />
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[⬆] Peak"}</span>
            <span className="text-primary font-mono text-3xl tracking-tighter">{PEAK.hour}</span>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-1">
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// CELL: "}
            <span className="text-primary">24H</span>
          </span>
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// TYPE: "}
            <span className="text-primary">METRO</span>
          </span>
        </div>
      </div>

      <hr className="my-4 border-t border-dashed" />

      <div className="min-h-0 w-full flex-1">
        <BarChart
          data={chartData}
          config={chartConfig}
          xDataKey="hour"
          className="h-full w-full"
          barCategoryGap={14}
        >
          <BarChart.XAxis dataKey="hour" hideDots />
          <BarChart.Tooltip />
          <BarChart.Bar dataKey="departures" variant="blocks" />
        </BarChart>
      </div>
    </div>
  );
}
