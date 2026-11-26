"use client";

import {
  buildChartCss,
  getColorsCount,
  indicatorBackground,
  type ChartConfig,
} from "@/registry/default/ui/charts/chart";
import { LegendOverlay, type LegendVariant } from "@/registry/default/ui/charts/legend";
import {
  ChartTooltipCard,
  ChartTooltipItem,
  FloatingChartTooltip,
} from "@/registry/default/ui/charts/tooltip-card";
import type { TooltipRoundness, TooltipVariant } from "@/registry/default/ui/charts/tooltip";
import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo, useRef, useState, type ReactNode } from "react";

export type { ChartConfig, LegendVariant, TooltipRoundness, TooltipVariant };

export interface CategoryBarMarker {
  /** Position on the same scale as the summed values. */
  value: number;
  /** Shown in the marker's tooltip and accessible name. */
  label?: ReactNode;
}

export interface CategoryBarProps<TData extends Record<string, unknown>> {
  data: TData[];
  /** One entry per segment. Each row's `nameKey` value names its entry. */
  config: ChartConfig;
  nameKey: keyof TData & string;
  valueKey: keyof TData & string;
  className?: string;
  /** Bar height in pixels. */
  height?: number;
  /** Gap between segments in pixels. */
  gap?: number;
  marker?: CategoryBarMarker;
  /** Show cumulative values under each segment boundary. */
  showLabels?: boolean;
  /** Show percentages instead of values in labels and tooltips. */
  percent?: boolean;
  /** Formats segment values in tooltips and the accessible name. */
  valueFormatter?: (value: number) => string;
  /**
   * Formats positions on the scale: boundary labels and the marker. Defaults
   * to `valueFormatter`. Use it when the scale has an origin other than zero.
   */
  labelFormatter?: (value: number) => string;
  tooltip?: boolean;
  tooltipVariant?: TooltipVariant;
  tooltipRoundness?: TooltipRoundness;
  showLegend?: boolean;
  legendVariant?: LegendVariant;
  animation?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
}

type Segment = {
  key: string;
  label: string;
  value: number;
  start: number;
  share: number;
  colorsCount: number;
};

type Active =
  | { kind: "segment"; index: number; anchor: { x: number; y: number }; width: number }
  | { kind: "marker"; anchor: { x: number; y: number }; width: number };

/** Cumulative boundary labels, dropping any that would collide with a neighbour. */
function boundaryLabels(segments: Segment[], total: number, minGap: number) {
  const ticks = [0, ...segments.map((segment) => segment.start + segment.value)];
  const kept: number[] = [];
  for (const tick of ticks) {
    const position = total > 0 ? tick / total : 0;
    const previous = kept.length ? kept[kept.length - 1] / total : -1;
    if (position - previous >= minGap) kept.push(tick);
  }
  // The total always shows; it replaces a neighbour that sits too close.
  const last = ticks[ticks.length - 1];
  if (kept[kept.length - 1] !== last) {
    if (kept.length > 1) kept.pop();
    kept.push(last);
  }
  return kept;
}

export function CategoryBar<TData extends Record<string, unknown>>({
  data,
  config,
  nameKey,
  valueKey,
  className,
  height = 8,
  gap = 2,
  marker,
  showLabels = false,
  percent = false,
  valueFormatter,
  labelFormatter,
  tooltip = true,
  tooltipVariant = "default",
  tooltipRoundness = "lg",
  showLegend = false,
  legendVariant = "rounded-square",
  animation = true,
  isLoading = false,
  ariaLabel,
}: CategoryBarProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const animate = animation && !shouldReduceMotion;
  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);
  const [active, setActive] = useState<Active | null>(null);

  const { segments, total } = useMemo(() => {
    let running = 0;
    const list: Segment[] = [];
    for (const datum of data) {
      const key = String(datum[nameKey] ?? "");
      const value = Math.max(0, Number(datum[valueKey]) || 0);
      list.push({
        key,
        label: String(config[key]?.label ?? key),
        value,
        start: running,
        share: 0,
        colorsCount: getColorsCount(config[key] ?? {}),
      });
      running += value;
    }
    for (const segment of list) segment.share = running > 0 ? segment.value / running : 0;
    return { segments: list, total: running };
  }, [data, config, nameKey, valueKey]);

  const formatValue = (value: number) => valueFormatter?.(value) ?? value.toLocaleString();
  const formatShare = (share: number) =>
    `${(share * 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
  const formatPosition = (value: number) =>
    percent
      ? formatShare(total > 0 ? value / total : 0)
      : (labelFormatter?.(value) ?? formatValue(value));
  const markerPosition =
    marker && total > 0 ? Math.min(Math.max(marker.value / total, 0), 1) : null;

  const defaultAriaLabel = `${segments
    .map((segment) => `${segment.label} ${formatValue(segment.value)} (${formatShare(segment.share)})`)
    .join(", ")}${
    marker ? `. Marker at ${formatPosition(marker.value)}${marker.label ? `, ${String(marker.label)}` : ""}` : ""
  }`;

  const anchorFor = (x: number) => {
    const container = containerRef.current;
    const bar = barRef.current;
    if (!container || !bar) return null;
    const outer = container.getBoundingClientRect();
    const rect = bar.getBoundingClientRect();
    return {
      anchor: { x: rect.left - outer.left + rect.width * x, y: rect.top - outer.top - (marker ? 4 : 0) },
      width: outer.width,
    };
  };

  const showSegment = (index: number) => {
    if (!tooltip) return;
    const segment = segments[index];
    const at = anchorFor(total > 0 ? (segment.start + segment.value / 2) / total : 0);
    if (at) setActive({ kind: "segment", index, ...at });
  };
  const showMarker = () => {
    if (!tooltip || markerPosition === null) return;
    const at = anchorFor(markerPosition);
    if (at) setActive({ kind: "marker", ...at });
  };

  const labels = showLabels ? boundaryLabels(segments, total, 0.1) : [];
  const activeSegment = active?.kind === "segment" ? segments[active.index] : null;

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col gap-3 text-xs ${className ?? ""}`}
      aria-busy={isLoading}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="relative" style={{ paddingTop: marker ? 4 : 0, paddingBottom: marker ? 4 : 0 }}>
        <div
          ref={barRef}
          role="img"
          aria-label={isLoading ? "Loading" : (ariaLabel ?? defaultAriaLabel)}
          className="relative flex w-full"
          style={{ height, gap }}
          onPointerLeave={() => setActive(null)}
        >
          {isLoading ? (
            <div className="bg-foreground/5 w-full rounded-full" />
          ) : (
            segments.map((segment, index) =>
              segment.value > 0 ? (
                <motion.div
                  key={`${segment.key}-${index}`}
                  className="h-full min-w-0 origin-left rounded-[1px] transition-opacity first:rounded-l-full last:rounded-r-full hover:opacity-70"
                  style={{
                    flexGrow: segment.value,
                    flexBasis: 0,
                    background: indicatorBackground(segment.key, segment.colorsCount),
                  }}
                  initial={animate ? { opacity: 0, scaleX: 0.6 } : false}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{
                    duration: 0.48,
                    ease: [0.22, 1, 0.36, 1],
                    delay: animate ? Math.min(index * 0.04, 0.24) : 0,
                  }}
                  onPointerEnter={() => showSegment(index)}
                />
              ) : null,
            )
          )}
        </div>
        {markerPosition !== null && !isLoading && (
          <div
            aria-hidden
            className="absolute top-0 bottom-0 flex w-3 -translate-x-1/2 cursor-default justify-center"
            style={{ left: `${markerPosition * 100}%` }}
            onPointerEnter={showMarker}
            onPointerLeave={() => setActive(null)}
          >
            <div className="bg-foreground ring-background h-full w-1 rounded-full ring-2" />
          </div>
        )}
      </div>
      {labels.length > 0 && !isLoading && (
        <div aria-hidden className="text-muted-foreground relative h-3 font-mono text-[10px] tabular-nums">
          {labels.map((tick, index) => {
            const position = total > 0 ? tick / total : 0;
            const isFirst = index === 0;
            const isLast = index === labels.length - 1;
            return (
              <span
                key={tick}
                className="absolute top-0 leading-none whitespace-nowrap"
                style={{
                  left: isLast ? undefined : `${position * 100}%`,
                  right: isLast ? 0 : undefined,
                  transform: isFirst || isLast ? undefined : "translateX(-50%)",
                }}
              >
                {formatPosition(tick)}
              </span>
            );
          })}
        </div>
      )}
      {showLegend && !isLoading && (
        <LegendOverlay
          seriesKeys={segments.map((segment) => segment.key)}
          config={config}
          variant={legendVariant}
          align="left"
          verticalAlign="bottom"
          selectedKey={null}
          hoveredKey={activeSegment?.key ?? null}
          isClickable={false}
          onToggle={() => {}}
          style={{}}
        />
      )}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <motion.div
            role="status"
            aria-live="polite"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-primary bg-background flex items-center justify-center gap-2 rounded-md border px-2 py-0.5 text-sm"
          >
            <div
              aria-hidden
              className={`border-border border-t-primary h-3 w-3 rounded-full border ${shouldReduceMotion ? "" : "animate-spin"}`}
            />
            <span>Loading</span>
          </motion.div>
        </div>
      )}
      <FloatingChartTooltip anchor={active?.anchor ?? null} containerWidth={active?.width ?? 0}>
        {activeSegment && (
          <ChartTooltipCard variant={tooltipVariant} roundness={tooltipRoundness}>
            <ChartTooltipItem
              dataKey={activeSegment.key}
              colorsCount={activeSegment.colorsCount}
              label={activeSegment.label}
              value={percent ? formatShare(activeSegment.share) : formatValue(activeSegment.value)}
              // With a custom scale, the segment's range on that scale says more than its share.
              detail={
                labelFormatter && !percent
                  ? `${formatPosition(activeSegment.start)}–${formatPosition(activeSegment.start + activeSegment.value)}`
                  : percent
                    ? formatValue(activeSegment.value)
                    : formatShare(activeSegment.share)
              }
            />
          </ChartTooltipCard>
        )}
        {active?.kind === "marker" && marker && (
          <ChartTooltipCard variant={tooltipVariant} roundness={tooltipRoundness}>
            <div className="flex items-center justify-between gap-4 leading-none">
              <span className="text-muted-foreground">{marker.label ?? "Marker"}</span>
              <span className="text-foreground font-mono font-medium tabular-nums">
                {formatPosition(marker.value)}
              </span>
            </div>
          </ChartTooltipCard>
        )}
      </FloatingChartTooltip>
    </div>
  );
}
