"use client";

import { CategoryBar, type ChartConfig } from "@/registry/default/charts/category-bar";

// Scenario: Survey responses as shares of the total
const data = [
  { answer: "promoter", responses: 412 },
  { answer: "passive", responses: 238 },
  { answer: "detractor", responses: 96 },
];

const chartConfig = {
  promoter: { label: "Promoters", colors: { light: ["#059669"], dark: ["#10b981"] } },
  passive: { label: "Passives", colors: { light: ["#a1a1aa"], dark: ["#71717a"] } },
  detractor: { label: "Detractors", colors: { light: ["#dc2626"], dark: ["#ef4444"] } },
} satisfies ChartConfig;

export function ExampleCategoryBarPercent() {
  return (
    <div className="grid w-full max-w-md gap-3 text-xs">
      <div className="flex items-baseline justify-between">
        <span className="text-foreground font-medium">Net Promoter Score</span>
        <span className="text-foreground font-mono text-base font-medium tabular-nums">+42</span>
      </div>
      <CategoryBar
        data={data}
        config={chartConfig}
        nameKey="answer"
        valueKey="responses"
        height={10}
        percent
        showLabels
        showLegend
        legendVariant="circle"
      />
    </div>
  );
}
