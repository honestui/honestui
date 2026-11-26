"use client";

import {
  roundnessClass,
  tooltipVariantClass,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/default/ui/charts/tooltip";
import { indicatorBackground } from "@/registry/default/ui/charts/chart";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * The chart tooltip as React markup, for charts drawn with DOM elements
 * instead of a canvas. The classes mirror `tooltipShell` and `tooltipRow`, so
 * a Tracker or Bar List tooltip is indistinguishable from an ECharts one.
 */
export function ChartTooltipCard({
  label,
  children,
  roundness = "lg",
  variant = "default",
}: {
  label?: ReactNode;
  children: ReactNode;
  roundness?: TooltipRoundness;
  variant?: TooltipVariant;
}) {
  return (
    <div
      className={`grid min-w-32 items-start gap-1.5 border border-border/50 px-2.5 py-1.5 text-xs shadow-xl ${roundnessClass[roundness]} ${tooltipVariantClass[variant]}`}
    >
      {label != null && <div className="text-primary font-medium">{label}</div>}
      <div className="grid gap-1.5">{children}</div>
    </div>
  );
}

export function ChartTooltipItem({
  dataKey,
  colorsCount = 1,
  label,
  value,
  detail,
}: {
  dataKey: string;
  colorsCount?: number;
  label: ReactNode;
  value?: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <div
        aria-hidden
        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
        style={{ background: indicatorBackground(dataKey, colorsCount) }}
      />
      <div className="flex flex-1 items-center justify-between gap-4 leading-none">
        <span className="text-muted-foreground">{label}</span>
        {value != null && (
          <span className="text-foreground font-mono font-medium tabular-nums">{value}</span>
        )}
      </div>
      {detail != null && (
        <div className="text-muted-foreground basis-full pl-[18px] leading-none">{detail}</div>
      )}
    </div>
  );
}

/**
 * Places a tooltip above an anchor point inside a positioned container. Like
 * the ECharts tooltip with `confine`, it is shifted horizontally so it never
 * spills past the container's edges.
 */
export function FloatingChartTooltip({
  anchor,
  containerWidth,
  children,
}: {
  /** Center x and top y of the hovered mark, relative to the container. */
  anchor: { x: number; y: number } | null;
  containerWidth: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const next = ref.current.offsetWidth;
    if (next !== width) setWidth(next);
  }, [anchor, children, width]);

  if (!anchor) return null;
  const left =
    containerWidth > width
      ? Math.min(Math.max(anchor.x - width / 2, 0), containerWidth - width)
      : anchor.x - width / 2;

  return (
    <div
      ref={ref}
      role="presentation"
      className="pointer-events-none absolute z-30 w-max"
      style={{
        left,
        top: anchor.y,
        transform: "translateY(calc(-100% - 8px))",
        visibility: width ? "visible" : "hidden",
      }}
    >
      {children}
    </div>
  );
}
