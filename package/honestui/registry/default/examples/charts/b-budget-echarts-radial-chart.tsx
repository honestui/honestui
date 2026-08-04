"use client";

import { RadialChart, type ChartConfig } from "@/registry/default/charts/radial-chart";
import { cn } from "@/lib/utils";

// Scenario: Festival budget
const chartData = [
  {
    name: "payroll",
    label: "Artists",
    value: 38,
    amount: 760000,
    swatch: "bg-[#d97706] dark:bg-[#fbbf24]",
  },
  {
    name: "infrastructure",
    label: "Venue",
    value: 24,
    amount: 480000,
    swatch: "bg-[#2563eb] dark:bg-[#60a5fa]",
  },
  {
    name: "marketing",
    label: "Promotion",
    value: 18,
    amount: 360000,
    swatch: "bg-[#e11d48] dark:bg-[#fb7185]",
  },
  {
    name: "tooling",
    label: "Production",
    value: 12,
    amount: 240000,
    swatch: "bg-[#475569] dark:bg-[#94a3b8]",
  },
  {
    name: "support",
    label: "Security",
    value: 8,
    amount: 160000,
    swatch: "bg-[#0d9488] dark:bg-[#2dd4bf]",
  },
];

const chartConfig = {
  payroll: { label: "Artists", colors: { light: ["#d97706"], dark: ["#fbbf24"] } },
  infrastructure: { label: "Venue", colors: { light: ["#2563eb"], dark: ["#60a5fa"] } },
  marketing: { label: "Promotion", colors: { light: ["#e11d48"], dark: ["#fb7185"] } },
  tooling: { label: "Production", colors: { light: ["#475569"], dark: ["#94a3b8"] } },
  support: { label: "Security", colors: { light: ["#0d9488"], dark: ["#2dd4bf"] } },
} satisfies ChartConfig;

const TOTAL = chartData.reduce((sum, { amount }) => sum + amount, 0);

const money = (value: number) => value.toLocaleString("en-US");

export function BudgetRadialChart() {
  return (
    <div className="flex h-full w-full flex-col gap-6 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-primary text-base font-medium tracking-tight sm:text-lg">
          Festival budget
        </span>
        <span className="text-muted-foreground text-xs">${money(TOTAL)}</span>
      </div>

      <div className="grid shrink-0 grid-cols-5 gap-2">
        {chartData.map((row) => (
          <div key={row.name} className="flex flex-col items-center gap-1">
            <div className="aspect-square w-full max-w-14">
              <RadialChart
                data={[row]}
                config={chartConfig}
                nameKey="name"
                max={100}
                innerRadius="66%"
                outerRadius="100%"
                className="h-full w-full"
              >
                <RadialChart.RadialBar dataKey="value" barSize={8} cornerRadius={6} />
              </RadialChart>
            </div>
            <span className="text-muted-foreground w-full truncate text-center text-[10px] sm:text-[11px]">
              {row.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {chartData.map(({ name, label, value, amount, swatch }) => (
          <div
            key={name}
            className="odd:bg-muted/30 flex flex-1 items-center gap-2 rounded-md px-3"
          >
            <span className={cn("size-2.5 shrink-0 rounded-[3px]", swatch)} />
            <span className="text-primary text-xs font-medium tabular-nums">{value}%</span>
            <span className="text-muted-foreground truncate text-xs">{label}</span>
            <span className="text-primary ml-auto text-xs font-medium">${money(amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
