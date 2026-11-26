"use client";

import { CategoryBar, type ChartConfig } from "@/registry/default/charts/category-bar";

// Scenario: A credit score on banded ranges, with the applicant marked
const bands = [
  { band: "poor", width: 280 },
  { band: "fair", width: 90 },
  { band: "good", width: 70 },
  { band: "veryGood", width: 60 },
  { band: "excellent", width: 50 },
];

const chartConfig = {
  poor: { label: "Poor", colors: { light: ["#ef4444"], dark: ["#ef4444"] } },
  fair: { label: "Fair", colors: { light: ["#f97316"], dark: ["#f97316"] } },
  good: { label: "Good", colors: { light: ["#eab308"], dark: ["#eab308"] } },
  veryGood: { label: "Very good", colors: { light: ["#84cc16"], dark: ["#84cc16"] } },
  excellent: { label: "Excellent", colors: { light: ["#10b981"], dark: ["#10b981"] } },
} satisfies ChartConfig;

// Bands start at 300, so values are offset to that origin.
const ORIGIN = 300;
const score = 742;

export function ExampleCategoryBarMarker() {
  return (
    <div className="grid w-full max-w-md gap-3 text-xs">
      <div className="flex items-baseline justify-between">
        <span className="text-foreground font-medium">Credit score</span>
        <span className="text-foreground font-mono text-base font-medium tabular-nums">{score}</span>
      </div>
      <CategoryBar
        data={bands}
        config={chartConfig}
        nameKey="band"
        valueKey="width"
        height={6}
        marker={{ value: score - ORIGIN, label: "Your score" }}
        showLabels
        valueFormatter={(value) => `${value} pts`}
        labelFormatter={(value) => String(Math.round(value + ORIGIN))}
      />
    </div>
  );
}
