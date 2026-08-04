"use client";

import { PieChart, type ChartConfig } from "@/registry/default/charts/pie-chart";

// Scenario: Habitat recovery survey
const DOT_COUNT = 40;
const SECTORS = DOT_COUNT * 2;

const STATS = [
  { id: "support", value: 62, caption: "Wetland habitat restored this season." },
  { id: "forecast", value: 38, caption: "Wildlife corridors now connected." },
] as const;

const FILLED = { light: ["#E43861"], dark: ["#E43861"] };
const TRACK = { light: ["#d4d4d4"], dark: ["#3f3f3f"] };
const GAP = { light: ["transparent"], dark: ["transparent"] };

const dotsFor = (value: number) => Math.round((DOT_COUNT * value) / 100);

const chartData = (id: string) =>
  Array.from({ length: SECTORS }, (_, i) => ({ dot: `${id}-${i}`, value: 1 }));

const chartConfig = (id: string, value: number): ChartConfig =>
  Object.fromEntries(
    Array.from({ length: SECTORS }, (_, i) => {
      const colors = i % 2 ? GAP : i / 2 < dotsFor(value) ? FILLED : TRACK;
      return [`${id}-${i}`, { label: "", colors }];
    }),
  );

export function ProgressRingsPieChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
            Field survey
          </span>
          <span className="text-primary text-base leading-tight font-medium tracking-tight sm:text-xl">
            Habitat recovery priorities
          </span>
        </div>
        <span className="text-muted-foreground shrink-0 text-[10px] sm:text-xs">
          860 field observations
        </span>
      </div>

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-4">
        {STATS.map(({ id, value, caption }) => (
          <div key={id} className="relative min-h-0">
            <PieChart
              data={chartData(id)}
              config={chartConfig(id, value)}
              dataKey="value"
              nameKey="dot"
              className="h-full w-full"
            >
              <PieChart.Pie
                innerRadius="85%"
                outerRadius="92%"
                paddingAngle={0}
                cornerRadius={6}
                startAngle={90}
                endAngle={-270}
              />
            </PieChart>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[radial-gradient(circle_closest-side,rgba(0,0,0,0.04)_0_79%,transparent_79%)] px-[25%] text-center dark:bg-[radial-gradient(circle_closest-side,rgba(255,255,255,0.05)_0_79%,transparent_79%)]">
              <span className="text-primary text-2xl leading-none font-medium tracking-tight sm:text-4xl">
                {value}%
              </span>
              <span className="text-muted-foreground text-[10px] leading-snug text-balance sm:text-xs">
                {caption}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
