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
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type { ChartConfig, LegendVariant, TooltipRoundness, TooltipVariant };

export type TrackerBlock<TData extends Record<string, unknown>> = {
  status: string | null;
  label: string;
  datum: TData;
  index: number;
};

export interface TrackerProps<TData extends Record<string, unknown>> {
  data: TData[];
  /** One entry per status. Each row's `statusKey` value names its entry. */
  config: ChartConfig;
  /** The status of each block, matching a `config` key. Unknown or empty statuses render as no data. */
  statusKey: keyof TData & string;
  /** The heading of each block's tooltip and accessible name, such as a date. */
  labelKey: keyof TData & string;
  /** An optional value shown beside the status in the tooltip, such as uptime. */
  valueKey?: keyof TData & string;
  valueFormatter?: (value: number) => string;
  /** Extra tooltip text for a block, such as an incident summary. */
  detailFormatter?: (datum: TData) => ReactNode;
  className?: string;
  /** Block height in pixels. */
  height?: number;
  /** Gap between blocks in pixels. */
  gap?: number;
  /** Block corner radius in pixels. */
  radius?: number;
  /** Text shown for a block without a known status. */
  emptyLabel?: string;
  tooltip?: boolean;
  tooltipVariant?: TooltipVariant;
  tooltipRoundness?: TooltipRoundness;
  showLegend?: boolean;
  legendVariant?: LegendVariant;
  onBlockClick?: (block: TrackerBlock<TData>) => void;
  animation?: boolean;
  isLoading?: boolean;
  loadingBlocks?: number;
  ariaLabel?: string;
}

type Active = { index: number; anchor: { x: number; y: number }; width: number };

export function Tracker<TData extends Record<string, unknown>>({
  data,
  config,
  statusKey,
  labelKey,
  valueKey,
  valueFormatter,
  detailFormatter,
  className,
  height = 32,
  gap = 2,
  radius = 2,
  emptyLabel = "No data",
  tooltip = true,
  tooltipVariant = "default",
  tooltipRoundness = "lg",
  showLegend = false,
  legendVariant = "rounded-square",
  onBlockClick,
  animation = true,
  isLoading = false,
  loadingBlocks = 45,
  ariaLabel,
}: TrackerProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shouldReduceMotion = useReducedMotion();
  const animate = animation && !shouldReduceMotion && data.length <= 400;
  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);
  const [active, setActive] = useState<Active | null>(null);
  const [focusIndex, setFocusIndex] = useState(Math.max(0, data.length - 1));
  const rovingIndex = Math.min(focusIndex, Math.max(0, data.length - 1));

  const blocks = useMemo(
    () =>
      data.map((datum, index) => {
        const raw = datum[statusKey];
        const status = raw != null && String(raw) in config ? String(raw) : null;
        return { status, label: String(datum[labelKey] ?? ""), datum, index };
      }),
    [data, config, statusKey, labelKey],
  );

  const statusLabel = useCallback(
    (status: string | null) => (status ? String(config[status]?.label ?? status) : emptyLabel),
    [config, emptyLabel],
  );
  const format = (value: number) => valueFormatter?.(value) ?? value.toLocaleString();

  const show = (index: number) => {
    const container = containerRef.current;
    const block = blockRefs.current[index];
    if (!container || !block || !tooltip) return;
    const outer = container.getBoundingClientRect();
    const rect = block.getBoundingClientRect();
    setActive({
      index,
      anchor: { x: rect.left - outer.left + rect.width / 2, y: rect.top - outer.top },
      width: outer.width,
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const last = blocks.length - 1;
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? Math.min(index + 1, last)
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? Math.max(index - 1, 0)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) {
      if ((event.key === "Enter" || event.key === " ") && onBlockClick) {
        event.preventDefault();
        onBlockClick(blocks[index]);
      }
      return;
    }
    event.preventDefault();
    setFocusIndex(next);
    blockRefs.current[next]?.focus();
  };

  // Statuses in config order, for the legend.
  const statusKeys = useMemo(() => Object.keys(config), [config]);
  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const block of blocks) {
      const key = block.status ?? "";
      result[key] = (result[key] ?? 0) + 1;
    }
    return result;
  }, [blocks]);
  const defaultAriaLabel = `Status tracker, ${blocks.length} periods: ${statusKeys
    .filter((key) => counts[key])
    .map((key) => `${counts[key]} ${statusLabel(key)}`)
    .concat(counts[""] ? [`${counts[""]} ${emptyLabel}`] : [])
    .join(", ")}`;

  const activeBlock = active ? blocks[active.index] : null;
  const activeValue =
    activeBlock && valueKey != null ? Number(activeBlock.datum[valueKey]) : Number.NaN;

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col gap-3 text-xs ${className ?? ""}`}
      aria-busy={isLoading}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {isLoading ? (
        <div aria-hidden className="flex w-full" style={{ height, gap }}>
          {Array.from({ length: loadingBlocks }, (_, index) => (
            <div
              key={index}
              className="min-w-0 flex-1"
              style={{
                borderRadius: radius,
                background: `color-mix(in oklab, var(--color-foreground) 6%, transparent)`,
              }}
            />
          ))}
        </div>
      ) : (
        <div
          role="list"
          aria-label={ariaLabel ?? defaultAriaLabel}
          className="flex w-full"
          style={{ height, gap }}
          onPointerLeave={() => setActive(null)}
        >
          {blocks.map((block) => {
            const colorsCount = block.status ? getColorsCount(config[block.status] ?? {}) : 1;
            const value = valueKey != null ? Number(block.datum[valueKey]) : Number.NaN;
            const name = `${block.label}: ${statusLabel(block.status)}${
              Number.isFinite(value) ? `, ${format(value)}` : ""
            }`;
            return (
              <motion.div
                key={block.index}
                ref={(node) => {
                  blockRefs.current[block.index] = node;
                }}
                role="listitem"
                aria-label={name}
                tabIndex={block.index === rovingIndex ? 0 : -1}
                className={`min-w-0 flex-1 origin-bottom outline-none transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${
                  onBlockClick ? "cursor-pointer" : ""
                }`}
                style={{
                  borderRadius: radius,
                  background: block.status
                    ? indicatorBackground(block.status, colorsCount)
                    : "color-mix(in oklab, var(--color-foreground) 10%, transparent)",
                }}
                initial={animate ? { opacity: 0, scaleY: 0.4 } : false}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{
                  duration: 0.32,
                  ease: [0.22, 1, 0.36, 1],
                  delay: animate ? Math.min(block.index * 0.006, 0.36) : 0,
                }}
                onPointerEnter={() => show(block.index)}
                onFocus={() => {
                  setFocusIndex(block.index);
                  show(block.index);
                }}
                onBlur={() => setActive(null)}
                onKeyDown={(event) => onKeyDown(event, block.index)}
                onClick={onBlockClick ? () => onBlockClick(block) : undefined}
              />
            );
          })}
        </div>
      )}
      {showLegend && !isLoading && (
        <LegendOverlay
          seriesKeys={statusKeys}
          config={config}
          variant={legendVariant}
          align="left"
          verticalAlign="bottom"
          selectedKey={null}
          hoveredKey={activeBlock?.status ?? null}
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
        {activeBlock && (
          <ChartTooltipCard label={activeBlock.label} variant={tooltipVariant} roundness={tooltipRoundness}>
            {activeBlock.status ? (
              <ChartTooltipItem
                dataKey={activeBlock.status}
                colorsCount={getColorsCount(config[activeBlock.status] ?? {})}
                label={statusLabel(activeBlock.status)}
                value={Number.isFinite(activeValue) ? format(activeValue) : undefined}
                detail={detailFormatter?.(activeBlock.datum) ?? undefined}
              />
            ) : (
              <div className="text-muted-foreground leading-none">{emptyLabel}</div>
            )}
          </ChartTooltipCard>
        )}
      </FloatingChartTooltip>
    </div>
  );
}
