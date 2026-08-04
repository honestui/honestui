"use client";

import { PieChart, type ChartConfig } from "@/registry/default/charts/pie-chart";
import { cn } from "@/lib/utils";

// Scenario: Soil health score
const MAX = 1000;
const SCORE = 734;
const START_ANGLE = 210;

const chartData = [
  { band: "atrisk", label: "Depleted", from: 0, value: 450, bar: "bg-[#e11d48] dark:bg-[#fb7185]" },
  { band: "fair", label: "Recovering", from: 450, value: 200, bar: "bg-[#f59e0b] dark:bg-[#fbbf24]" },
  { band: "good", label: "Healthy", from: 650, value: 170, bar: "bg-[#84cc16] dark:bg-[#a3e635]" },
  {
    band: "excellent",
    label: "Thriving",
    from: 820,
    value: 180,
    bar: "bg-[#059669] dark:bg-[#34d399]",
  },
];

const chartConfig = {
  atrisk: { label: "Depleted", colors: { light: ["#e11d48"], dark: ["#fb7185"] } },
  fair: { label: "Recovering", colors: { light: ["#f59e0b"], dark: ["#fbbf24"] } },
  good: { label: "Healthy", colors: { light: ["#84cc16"], dark: ["#a3e635"] } },
  excellent: { label: "Thriving", colors: { light: ["#059669"], dark: ["#34d399"] } },
} satisfies ChartConfig;

const BAND = [...chartData].reverse().find(({ from }) => SCORE >= from) ?? chartData[0];

export function ReliabilityScorePieChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <span className="text-primary text-base font-medium tracking-tight sm:text-lg">
        Soil health
      </span>

      <div className="relative mx-auto mt-1 aspect-square w-full max-w-50 shrink-0">
        <PieChart
          data={[...chartData].reverse()}
          config={chartConfig}
          dataKey="value"
          nameKey="band"
          className="h-full w-full"
        >
          <PieChart.Pie
            innerRadius="74%"
            outerRadius="94%"
            paddingAngle={6}
            cornerRadius={10}
            startAngle={-30}
            endAngle={START_ANGLE}
          />
        </PieChart>

        <svg
          viewBox="0 0 100 100"
          className="text-muted-foreground/50 pointer-events-none absolute inset-0"
          aria-hidden
        >
          <path
            d="M 23.15 65.5 A 31 31 0 1 1 76.85 65.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="0.1 5"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-primary text-3xl font-semibold tracking-tight sm:text-4xl">
            {SCORE}
          </span>
        </div>
      </div>

      <div className="-mt-6 text-center">
        <p className="text-primary text-xs font-medium sm:text-sm">
          Soil condition is {BAND.label.toLowerCase()}
        </p>
        <p className="text-muted-foreground text-[10px] sm:text-xs">Sampled 18 Jul 2026</p>
      </div>

      <div className="mt-auto shrink-0 pt-2">
        <div className="text-muted-foreground flex text-[10px]">
          {chartData.map(({ band, from, value }) => (
            <span key={band} style={{ flexGrow: value, flexBasis: 0 }}>
              {from}
            </span>
          ))}
          <span>{MAX}</span>
        </div>
        <div className="mt-1 flex gap-1">
          {chartData.map(({ band, bar, value }) => (
            <span
              key={band}
              className={cn("h-1.5 rounded-full", bar)}
              style={{ flexGrow: value, flexBasis: 0 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
