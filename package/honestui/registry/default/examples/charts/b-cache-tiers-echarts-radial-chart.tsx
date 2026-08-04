"use client";

import { RadialChart, type ChartConfig } from "@/registry/default/charts/radial-chart";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Scenario: Reservoir water sources
const TOTAL = 1000;

const TIERS = [
  {
    name: "memory",
    label: "Mountain runoff",
    count: 610,
    swatch: "bg-[#dc2626] dark:bg-[#ef4444]",
  },
  {
    name: "regional",
    label: "River intake",
    count: 240,
    swatch: "bg-[#d97706] dark:bg-[#f59e0b]",
  },
  {
    name: "overflow",
    label: "Reclaimed water",
    count: 100,
    swatch: "bg-[#2563eb] dark:bg-[#3b82f6]",
  },
  {
    name: "origin",
    label: "Groundwater",
    count: 50,
    swatch: "bg-[#0f172a] dark:bg-white",
  },
];

const STATS = [
  { name: "warm", label: "Households supplied", value: 12480 },
  { name: "revalidated", label: "Quality tests", value: 1840 },
  { name: "evictions", label: "Leak repairs", value: 286 },
  { name: "purges", label: "Service alerts", value: 43 },
];

const chartConfig = {
  memory: { label: "Mountain runoff", colors: { light: ["#dc2626"], dark: ["#ef4444"] } },
  regional: { label: "River intake", colors: { light: ["#d97706"], dark: ["#f59e0b"] } },
  overflow: { label: "Reclaimed water", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
  origin: { label: "Groundwater", colors: { light: ["#0f172a"], dark: ["#ffffff"] } },
} satisfies ChartConfig;

const chartData = [...TIERS]
  .reverse()
  .map(({ name, count }) => ({ name, share: (count / TOTAL) * 100 }));

const count = (value: number) => value.toLocaleString("en-US");

function useCompactRings() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return compact;
}

export function CacheTiersRadialChart() {
  const compact = useCompactRings();

  return (
    <div className="flex h-full w-full flex-col gap-2 p-3 sm:gap-3 sm:p-4">
      <div className="flex min-h-0 flex-1 gap-3 sm:gap-4">
        <div className="relative min-h-0 flex-1 sm:-mb-10">
          <RadialChart
            data={chartData}
            config={chartConfig}
            nameKey="name"
            variant="semi"
            max={100}
            innerRadius="38%"
            outerRadius="96%"
            className="h-full w-full"
          >
            <RadialChart.RadialBar
              dataKey="share"
              barSize={compact ? 7 : 13}
              cornerRadius={compact ? 4 : 7}
            />
          </RadialChart>
        </div>

        <div className="grid shrink-0 grid-cols-2 content-center gap-x-4 gap-y-5 sm:w-[40%] sm:max-w-64">
          {STATS.map(({ name, label, value }) => (
            <div key={name} className="flex flex-col gap-1">
              <span className="text-muted-foreground truncate text-xs sm:text-sm">{label}</span>
              <span className="text-primary text-lg leading-none font-medium tabular-nums sm:text-xl">
                {count(value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-2 border-t pt-2 sm:grid-cols-4 sm:gap-y-3 sm:pt-3">
        {TIERS.map(({ name, label, count: hits, swatch }) => (
          <div key={name} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className={cn("size-2.5 shrink-0 rounded-[3px]", swatch)} />
              <span className="text-primary truncate text-xs">{label}</span>
            </div>
            <span className="text-muted-foreground text-xs tabular-nums">
              {count(hits)}/{count(TOTAL)} ({Math.round((hits / TOTAL) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
