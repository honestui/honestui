"use client";

import { TrendingDown, TrendingUp } from "honestui/icons";

import { cn } from "@/lib/utils";
import { metricsByRange } from "@/lib/dashboard/data";
import { useDateRange } from "./date-range-context";

/**
 * The four headline metrics. Sentiment drives color, not the sign — a falling
 * churn rate renders as good news.
 */
export function MetricOverview() {
  const { rangeKey, range } = useDateRange();
  const metrics = metricsByRange[rangeKey];

  return (
    <section aria-label="Key metrics">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:divide-x lg:divide-border">
        {metrics.map((metric) => {
          const falling = metric.change.startsWith("-");
          const TrendIcon = falling ? TrendingDown : TrendingUp;

          return (
            <div key={metric.id} className="min-w-0 lg:px-6 lg:first:pl-0 lg:last:pr-0">
              <dt className="text-sm text-muted-foreground">{metric.label}</dt>
              <dd className="mt-1.5">
                <span className="text-2xl font-semibold tracking-tight tabular-nums">
                  {metric.value}
                </span>
                <span className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-xs">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-medium tabular-nums",
                      metric.sentiment === "positive"
                        ? "text-[var(--hui-color-foreground-success-primary)]"
                        : "text-[var(--hui-color-foreground-danger-primary)]",
                    )}
                  >
                    <TrendIcon aria-hidden className="size-3.5" />
                    {metric.change}
                  </span>
                  <span className="text-muted-foreground">
                    vs. {range.comparisonLabel}
                  </span>
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
