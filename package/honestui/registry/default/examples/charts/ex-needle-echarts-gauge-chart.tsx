"use client";

import { useState } from "react";

import { GaugeChart, type ChartConfig } from "@/registry/default/charts/gauge-chart";
import { Button } from "@/registry/default/ui/button";

// Scenario: CPU load on a build server, stepped by the buttons
const readings = [38, 61, 87, 52];

const chartConfig = {
  load: { label: "CPU load", colors: { light: ["#6b7280"], dark: ["#9ca3af"] } },
  normal: { label: "Normal", colors: { light: ["#10b981"], dark: ["#34d399"] } },
  busy: { label: "Busy", colors: { light: ["#f59e0b"], dark: ["#fbbf24"] } },
  saturated: { label: "Saturated", colors: { light: ["#ef4444"], dark: ["#f87171"] } },
} satisfies ChartConfig;

export function ExampleGaugeChart() {
  const [index, setIndex] = useState(0);

  return (
    <div className="flex h-full w-full flex-col p-4">
      <GaugeChart className="min-h-0 flex-1" value={readings[index]} dataKey="load" config={chartConfig}>
        <GaugeChart.Arc type="semi" thickness={10} />
        <GaugeChart.Bands
          bands={[
            { to: 60, dataKey: "normal" },
            { to: 85, dataKey: "busy" },
            { to: 100, dataKey: "saturated" },
          ]}
        />
        <GaugeChart.Ticks count={4} formatter={(value) => `${value}%`} />
        <GaugeChart.Needle />
        <GaugeChart.Center valueFormatter={(value) => `${value}%`} />
      </GaugeChart>
      <div className="flex justify-center">
        <Button size="sm" variant="outline" onClick={() => setIndex((index + 1) % readings.length)}>
          Next reading
        </Button>
      </div>
    </div>
  );
}
