"use client";

import { useEffect, useState } from "react";
import { Heatmap, type ChartConfig } from "@/registry/default/charts/heatmap";

import { retentionCohorts } from "@/lib/dashboard/data";
import { formatPercent } from "@/lib/dashboard/format";

const chartConfig = {
  retention: {
    label: "Retention",
    colors: {
      light: [
        "var(--hui-color-viz-iris-6)",
        "var(--hui-color-viz-iris-8)",
        "var(--hui-color-viz-iris-9)",
        "var(--hui-color-viz-iris-11)",
      ],
      dark: [
        "var(--hui-color-viz-iris-6)",
        "var(--hui-color-viz-iris-8)",
        "var(--hui-color-viz-iris-9)",
        "var(--hui-color-viz-iris-11)",
      ],
    },
  },
} satisfies ChartConfig;

export function RetentionSection() {
  // In-cell percentages get cramped on phones; the tooltip still carries the
  // exact values there.
  const [showValues, setShowValues] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const apply = () => setShowValues(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return (
    <section aria-label="Retention">
      <h2 className="text-base font-semibold">Retention</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Percentage of each signup cohort still active in subsequent weeks.
      </p>

      <div className="mt-5 h-80 w-full">
        <Heatmap
          data={retentionCohorts}
          config={chartConfig}
          xDataKey="week"
          yDataKey="cohort"
          valueDataKey="retention"
          min={50}
          max={100}
          ariaLabel="Weekly retention by signup cohort, week zero through week eight"
          className="h-full w-full"
        >
          <Heatmap.XAxis />
          <Heatmap.YAxis inverse />
          <Heatmap.Legend
            minLabel="50%"
            maxLabel="100%"
            valueFormatter={(value) => formatPercent(value, 0)}
          />
          <Heatmap.Tooltip
            valueFormatter={(value) => `${formatPercent(value)} retained`}
          />
          <Heatmap.Cells
            showValues={showValues}
            valueFormatter={(value) => formatPercent(value, 0)}
          />
        </Heatmap>
      </div>
    </section>
  );
}
