"use client";

import { useState } from "react";
import { BarList, type ChartConfig } from "@/registry/default/charts/bar-list";

// Scenario: Filter a dashboard by referrer
const data = [
  { source: "Google", visits: 4820 },
  { source: "Direct", visits: 3310 },
  { source: "GitHub", visits: 1984 },
  { source: "Newsletter", visits: 1236 },
  { source: "Hacker News", visits: 918 },
  { source: "LinkedIn", visits: 402 },
];

const chartConfig = {
  visits: {
    label: "Visits",
    colors: {
      light: ["#0d9488"],
      dark: ["#14b8a6"],
    },
  },
} satisfies ChartConfig;

export function ExampleBarListSelectable() {
  const [selected, setSelected] = useState<string | null>("GitHub");
  const total = data.reduce((sum, row) => sum + row.visits, 0);
  const shown = selected ? (data.find((row) => row.source === selected)?.visits ?? 0) : total;

  return (
    <div className="grid w-full max-w-md gap-3 text-xs">
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground">{selected ? `Visits from ${selected}` : "All visits"}</span>
        <span className="text-foreground font-mono text-base font-medium tabular-nums">
          {shown.toLocaleString()}
        </span>
      </div>
      <BarList
        data={data}
        config={chartConfig}
        nameKey="source"
        valueKey="visits"
        selectedName={selected}
        onValueChange={(item) => setSelected((current) => (current === item.name ? null : item.name))}
        ariaLabel="Visits by referrer. Choose a referrer to filter."
      />
    </div>
  );
}
