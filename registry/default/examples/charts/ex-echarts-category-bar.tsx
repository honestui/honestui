"use client";

import { CategoryBar, type ChartConfig } from "@/registry/default/charts/category-bar";

// Scenario: Storage used by file type, out of a 100 GB plan
const data = [
  { type: "video", gigabytes: 38.4 },
  { type: "photos", gigabytes: 21.7 },
  { type: "documents", gigabytes: 9.2 },
  { type: "other", gigabytes: 4.1 },
  { type: "free", gigabytes: 26.6 },
];

const chartConfig = {
  video: { label: "Video", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
  photos: { label: "Photos", colors: { light: ["#0d9488"], dark: ["#14b8a6"] } },
  documents: { label: "Documents", colors: { light: ["#d97706"], dark: ["#f59e0b"] } },
  other: { label: "Other", colors: { light: ["#7c3aed"], dark: ["#8b5cf6"] } },
  free: { label: "Available", colors: { light: ["#e5e7eb"], dark: ["#3f3f46"] } },
} satisfies ChartConfig;

export function ExampleCategoryBar() {
  return (
    <div className="grid w-full max-w-md gap-3 text-xs">
      <div className="flex items-baseline justify-between">
        <span className="text-foreground font-medium">Storage</span>
        <span className="text-muted-foreground">
          <span className="text-foreground font-mono tabular-nums">73.4 GB</span> of 100 GB
        </span>
      </div>
      <CategoryBar
        data={data}
        config={chartConfig}
        nameKey="type"
        valueKey="gigabytes"
        valueFormatter={(value) => `${value.toFixed(1)} GB`}
        showLegend
      />
    </div>
  );
}
