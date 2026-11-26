"use client";

import {
  escapeHtml,
  tooltipIndicatorHtml,
  tooltipRow,
  tooltipShell,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/default/ui/charts/tooltip";
import {
  GridComponent,
  TooltipComponent,
  type GridComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type CSSProperties,
  type FC,
  type ReactNode,
} from "react";
import {
  buildChartCss,
  getColorsCount,
  resolveColors,
  withAlpha,
  withChartFont,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/default/ui/charts/chart";
import { LegendOverlay, type LegendVariant } from "@/registry/default/ui/charts/legend";
import { CustomChart, type CustomSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type { ChartConfig, LegendVariant, TooltipRoundness, TooltipVariant };

echarts.use([CustomChart, GridComponent, TooltipComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = ComposeOption<CustomSeriesOption | GridComponentOption | TooltipComponentOption>;

const GRAY = "rgba(120, 120, 120, 1)";
const REVEAL_DURATION = 600;
const ROW_STAGGER = 80;
// Qualitative bands run from darkest (poor) to lightest (good), as Stephen
// Few's bullet graph specification recommends, so they read in grayscale.
const BAND_ALPHAS = [0.22, 0.14, 0.08, 0.05, 0.03];
const LOADING_ROWS = 3;

export interface BulletChartProps<TData extends Record<string, unknown>> {
  /** One row per bullet. Each row is drawn on its own scale. */
  data: TData[];
  /** Labels and colors for the measure and target keys. */
  config: ChartConfig;
  /** The row title. */
  labelDataKey: keyof TData & string;
  /** An optional second line under the title, such as a unit. */
  descriptionDataKey?: keyof TData & string;
  /** The measure drawn as the bar. */
  valueDataKey: keyof TData & string;
  /** The comparative measure drawn as a tick. */
  targetDataKey?: keyof TData & string;
  /** A field that holds ascending range thresholds, such as `[150, 225, 300]`. */
  rangesDataKey?: keyof TData & string;
  /** A field for each row's scale maximum. Defaults to the largest of the ranges, value, and target. */
  maxDataKey?: keyof TData & string;
  /** Names for the ranges, from the first threshold up, shown in the tooltip. */
  rangeLabels?: string[];
  /** Width of the label column in pixels. */
  labelWidth?: number;
  className?: string;
  animation?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

export interface BulletMeasureProps {
  /** Bar thickness as a share of the range band, from 0 to 1. */
  thickness?: number;
  radius?: number;
}

const Measure: FC<BulletMeasureProps> = () => null;
Measure.displayName = "BulletChart.Measure";

export interface BulletTargetProps {
  /** Tick height as a share of the range band. */
  length?: number;
  width?: number;
}

const Target: FC<BulletTargetProps> = () => null;
Target.displayName = "BulletChart.Target";

const Ranges: FC = () => null;
Ranges.displayName = "BulletChart.Ranges";

export interface BulletAxisProps {
  /** Formats each row's tick labels. */
  tickFormatter?: (value: number, rowIndex: number) => string;
  /** About how many ticks each row shows. */
  tickCount?: number;
}

const Axis: FC<BulletAxisProps> = () => null;
Axis.displayName = "BulletChart.Axis";

export interface BulletTooltipProps {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  valueFormatter?: (value: number, rowIndex: number) => string;
}

const Tooltip: FC<BulletTooltipProps> = () => null;
Tooltip.displayName = "BulletChart.Tooltip";

export interface BulletLegendProps {
  variant?: LegendVariant;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "bottom";
}

const Legend: FC<BulletLegendProps> = () => null;
Legend.displayName = "BulletChart.Legend";

type Collected = {
  measure: { present: boolean; thickness: number; radius: number };
  target: { present: boolean; length: number; width: number };
  ranges: boolean;
  axis: { present: boolean; tickCount: number; tickFormatter?: BulletAxisProps["tickFormatter"] };
  tooltip: { present: boolean; variant: TooltipVariant; roundness: TooltipRoundness } & Pick<
    BulletTooltipProps,
    "valueFormatter"
  >;
  legend: { present: boolean } & Required<BulletLegendProps>;
};

function collectConfig(children: ReactNode): Collected {
  const c: Collected = {
    measure: { present: false, thickness: 0.36, radius: 1 },
    target: { present: false, length: 0.72, width: 2 },
    ranges: false,
    axis: { present: false, tickCount: 4 },
    tooltip: { present: false, variant: "default", roundness: "lg" },
    legend: { present: false, variant: "rounded-square", align: "right", verticalAlign: "top" },
  };
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Measure) {
      const p = child.props as BulletMeasureProps;
      c.measure = {
        present: true,
        thickness: Math.min(Math.max(p.thickness ?? 0.36, 0.05), 1),
        radius: p.radius ?? 1,
      };
    } else if (child.type === Target) {
      const p = child.props as BulletTargetProps;
      c.target = { present: true, length: Math.min(Math.max(p.length ?? 0.72, 0.1), 1.4), width: p.width ?? 2 };
    } else if (child.type === Ranges) {
      c.ranges = true;
    } else if (child.type === Axis) {
      const p = child.props as BulletAxisProps;
      c.axis = { present: true, tickCount: p.tickCount ?? 4, tickFormatter: p.tickFormatter };
    } else if (child.type === Tooltip) {
      const p = child.props as BulletTooltipProps;
      c.tooltip = {
        present: true,
        variant: p.variant ?? "default",
        roundness: p.roundness ?? "lg",
        valueFormatter: p.valueFormatter,
      };
    } else if (child.type === Legend) {
      const p = child.props as BulletLegendProps;
      c.legend = {
        present: true,
        variant: p.variant ?? "rounded-square",
        align: p.align ?? "right",
        verticalAlign: p.verticalAlign ?? "top",
      };
    }
  });
  return c;
}

/** One normalized bullet row. */
export type BulletRow = {
  label: string;
  description?: string;
  value: number;
  target: number | null;
  ranges: number[];
  max: number;
};

function niceStep(span: number, count: number): number {
  const raw = span / Math.max(count, 1);
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10;
  return nice * power;
}

function niceMax(value: number): number {
  if (!(value > 0)) return 1;
  const step = niceStep(value, 5);
  return Math.ceil(value / step) * step;
}

type RenderApi = {
  value: (dim: number) => number;
  coord: (value: [number, number]) => number[];
  size: (value: [number, number]) => number[];
};

type BuildContext = {
  rows: BulletRow[];
  config: ChartConfig;
  collected: Collected;
  resolved: ResolvedColors;
  labelWidth: number;
  isLoading: boolean;
  reveal: boolean;
  valueKey: string;
  targetKey?: string;
  rangeLabels?: string[];
};

function buildOption(ctx: BuildContext): EChartsOption {
  const { rows, collected, resolved, isLoading, labelWidth, config, valueKey, targetKey } = ctx;
  const { tokens } = resolved;
  const legendTop = collected.legend.present && collected.legend.verticalAlign === "top";
  const legendBottom = collected.legend.present && collected.legend.verticalAlign === "bottom";
  const measureColor = isLoading ? withAlpha(tokens.foreground, 0.16) : (resolved.series[valueKey]?.[0] ?? GRAY);
  const targetColor = isLoading
    ? withAlpha(tokens.foreground, 0.24)
    : targetKey && resolved.series[targetKey]
      ? resolved.series[targetKey][0]
      : tokens.foreground;
  const bandBase = tokens.foreground;
  const showAxis = collected.axis.present && !isLoading;
  const formatTick = collected.axis.tickFormatter;

  const grid: GridComponentOption = {
    left: labelWidth,
    right: 12,
    top: legendTop ? 40 : 8,
    bottom: legendBottom ? 36 : 8,
    outerBoundsMode: "none",
  };

  const series: CustomSeriesOption = {
    id: "bullets",
    type: "custom",
    data: rows.map((_, i) => [0, i]),
    encode: { x: 0, y: 1 },
    silent: isLoading,
    clip: false,
    renderItem: (_params, rawApi) => {
      const api = rawApi as unknown as RenderApi;
      const index = api.value(1);
      const row = rows[index];
      if (!row) return null;
      const band = api.size([0, 1])[1];
      const [x0, cy] = api.coord([0, index]);
      const [x1] = api.coord([1, index]);
      const span = Math.max(x1 - x0, 1);
      const scale = (v: number) => x0 + (Math.min(Math.max(v, 0), row.max) / row.max) * span;
      // Ticks need room under each row, so the band shrinks when they show.
      const rangeHeight = Math.min(band * (showAxis ? 0.42 : 0.6), 40);
      const top = cy - rangeHeight / 2 - (showAxis ? 6 : 0);
      const mid = top + rangeHeight / 2;
      const delay = ctx.reveal ? index * ROW_STAGGER : 0;
      const children: Record<string, unknown>[] = [];

      if (collected.ranges || isLoading) {
        const thresholds = row.ranges.length ? row.ranges : [row.max];
        let previous = 0;
        thresholds.forEach((threshold, i) => {
          const from = scale(previous);
          const to = scale(threshold);
          previous = threshold;
          if (to - from <= 0) return;
          const isFirst = i === 0;
          const isLast = i === thresholds.length - 1;
          children.push({
            type: "rect",
            shape: {
              x: from,
              y: top,
              width: to - from,
              height: rangeHeight,
              r: [isFirst ? 2 : 0, isLast ? 2 : 0, isLast ? 2 : 0, isFirst ? 2 : 0],
            },
            style: { fill: withAlpha(bandBase, BAND_ALPHAS[i] ?? BAND_ALPHAS[BAND_ALPHAS.length - 1]) },
          });
        });
      }

      if (collected.measure.present || isLoading) {
        const height = Math.max(rangeHeight * collected.measure.thickness, 2);
        const width = Math.max(scale(row.value) - x0, 0);
        children.push({
          type: "rect",
          shape: { x: x0, y: mid - height / 2, width, height, r: collected.measure.radius },
          style: { fill: measureColor },
          enterFrom: ctx.reveal ? { shape: { width: 0 } } : undefined,
          enterAnimation: { duration: REVEAL_DURATION, delay, easing: "cubicOut" },
        });
      }

      if ((collected.target.present || isLoading) && row.target != null) {
        const length = rangeHeight * collected.target.length;
        const x = scale(row.target);
        children.push({
          type: "rect",
          shape: {
            x: x - collected.target.width / 2,
            y: mid - length / 2,
            width: collected.target.width,
            height: length,
            r: collected.target.width / 2,
          },
          style: { fill: targetColor },
          enterFrom: ctx.reveal ? { style: { opacity: 0 } } : undefined,
          enterAnimation: { duration: REVEAL_DURATION, delay: delay + REVEAL_DURATION / 2 },
        });
      }

      if (showAxis) {
        const step = niceStep(row.max, collected.axis.tickCount);
        for (let t = 0; t <= row.max + step * 1e-6; t += step) {
          const x = scale(t);
          const text = formatTick ? formatTick(t, index) : t.toLocaleString();
          const isFirst = t === 0;
          const isLast = t + step > row.max + step * 1e-6;
          children.push({
            type: "circle",
            silent: true,
            shape: { cx: x, cy: top + rangeHeight + 5, r: 1 },
            style: { fill: withAlpha(tokens.mutedForeground, 0.6) },
          });
          children.push({
            type: "text",
            silent: true,
            style: {
              text,
              x,
              y: top + rangeHeight + 9,
              align: isFirst ? "left" : isLast ? "right" : "center",
              verticalAlign: "top",
              fill: tokens.mutedForeground,
              fontSize: 10,
            },
          });
        }
      }

      return { type: "group", children } as unknown as ReturnType<
        NonNullable<CustomSeriesOption["renderItem"]>
      >;
    },
  };

  const tooltipSlot = collected.tooltip;
  const format = tooltipSlot.valueFormatter ?? ((v: number) => v.toLocaleString());
  const indicator = (key: string | undefined) => {
    const item = key ? config[key] : undefined;
    return key ? tooltipIndicatorHtml(key, item ? getColorsCount(item) : 1) : '<div class="h-2.5 w-2.5 shrink-0"></div>';
  };
  const labelOf = (key: string | undefined, fallback: string) => {
    const label = key ? config[key]?.label : undefined;
    return typeof label === "string" ? label : fallback;
  };

  const tooltip: TooltipComponentOption = {
    show: tooltipSlot.present && !isLoading,
    trigger: "item",
    confine: true,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    extraCssText: "box-shadow:none;",
    formatter: (params: unknown) => {
      const index = (params as { dataIndex?: number }).dataIndex;
      const row = index == null ? undefined : rows[index];
      if (!row || index == null) return "";
      const body = [
        tooltipRow({
          indicatorHtml: indicator(valueKey),
          labelText: escapeHtml(labelOf(valueKey, "Value")),
          valueText: format(row.value, index),
          dimmed: "",
        }),
      ];
      if (row.target != null) {
        body.push(
          tooltipRow({
            indicatorHtml: indicator(targetKey),
            labelText: escapeHtml(labelOf(targetKey, "Target")),
            valueText: format(row.target, index),
            dimmed: "",
          }),
        );
        if (row.target !== 0) {
          body.push(
            tooltipRow({
              indicatorHtml: indicator(undefined),
              labelText: "Of target",
              valueText: `${Math.round((row.value / row.target) * 100)}%`,
              dimmed: "",
            }),
          );
        }
      }
      const bandIndex = row.ranges.findIndex((threshold) => row.value <= threshold);
      const bandLabel =
        ctx.rangeLabels && bandIndex >= 0 ? ctx.rangeLabels[bandIndex] : undefined;
      if (bandLabel) {
        body.push(
          tooltipRow({
            indicatorHtml: indicator(undefined),
            labelText: "Range",
            valueText: escapeHtml(bandLabel),
            dimmed: "",
          }),
        );
      }
      return tooltipShell({
        label: escapeHtml(row.label),
        body: body.join(""),
        roundness: tooltipSlot.roundness,
        variant: tooltipSlot.variant,
      });
    },
  };

  return {
    grid,
    xAxis: { type: "value", min: 0, max: 1, show: false },
    yAxis: {
      type: "category",
      inverse: true,
      data: rows.map((r) => r.label),
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisPointer: { show: false },
      axisLabel: {
        show: !isLoading,
        align: "left",
        margin: labelWidth - 8,
        width: labelWidth - 20,
        overflow: "truncate",
        formatter: (value: string, index: number) => {
          const description = rows[index]?.description;
          return description ? `{title|${value}}\n{sub|${description}}` : `{title|${value}}`;
        },
        rich: {
          title: { color: tokens.foreground, fontSize: 12, fontWeight: 500, lineHeight: 16 },
          sub: { color: tokens.mutedForeground, fontSize: 10, lineHeight: 14 },
        },
      },
    },
    tooltip,
    series: [series],
  };
}

type LiveState = { resolved: ResolvedColors | null; hasRevealed: boolean; repush: () => void };

export function BulletChart<TData extends Record<string, unknown>>({
  data,
  config,
  labelDataKey,
  descriptionDataKey,
  valueDataKey,
  targetDataKey,
  rangesDataKey,
  maxDataKey,
  rangeLabels,
  labelWidth = 128,
  className,
  animation = true,
  isLoading = false,
  ariaLabel,
  chartOptions,
  children,
}: BulletChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);
  const liveRef = useRef<LiveState>({ resolved: null, hasRevealed: false, repush: () => {} });
  const shouldReduceMotion = useReducedMotion();

  const collected = useMemo(() => collectConfig(children), [children]);
  const rows = useMemo<BulletRow[]>(() => {
    if (isLoading) {
      return Array.from({ length: LOADING_ROWS }, (_, i) => ({
        label: "",
        value: 52 + i * 9,
        target: 70 - i * 4,
        ranges: [45, 75, 100],
        max: 100,
      }));
    }
    return data.map((row) => {
      const rawRanges = rangesDataKey ? row[rangesDataKey] : undefined;
      const ranges = Array.isArray(rawRanges)
        ? rawRanges.map(Number).filter(Number.isFinite).sort((a, b) => a - b)
        : [];
      const value = Number(row[valueDataKey]) || 0;
      const rawTarget = targetDataKey ? row[targetDataKey] : undefined;
      const target = rawTarget === undefined || rawTarget === null ? null : Number(rawTarget);
      const explicitMax = maxDataKey ? Number(row[maxDataKey]) : NaN;
      const max = Number.isFinite(explicitMax) && explicitMax > 0
        ? explicitMax
        : ranges.length
          ? Math.max(ranges[ranges.length - 1], value, target ?? 0)
          : niceMax(Math.max(value, target ?? 0) * 1.1);
      const description = descriptionDataKey ? row[descriptionDataKey] : undefined;
      return {
        label: String(row[labelDataKey] ?? ""),
        description: description == null ? undefined : String(description),
        value,
        target: target !== null && Number.isFinite(target) ? target : null,
        ranges,
        max,
      };
    });
  }, [data, isLoading, labelDataKey, descriptionDataKey, valueDataKey, targetDataKey, rangesDataKey, maxDataKey]);

  const keys = useMemo(
    () => [valueDataKey as string, ...(targetDataKey ? [targetDataKey as string] : [])],
    [valueDataKey, targetDataKey],
  );
  const legendKeys = useMemo(() => keys.filter((key) => config[key]), [keys, config]);
  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  useEffect(() => {
    const mount = mountRef.current;
    const live = liveRef.current;
    if (!mount) return;
    const chart = echarts.init(mount);
    echartsRef.current = chart;
    const resizeObserver = new ResizeObserver(() => {
      if (mount.clientWidth === chart.getWidth() && mount.clientHeight === chart.getHeight()) return;
      chart.resize();
      liveRef.current.repush();
    });
    resizeObserver.observe(mount);
    const themeObserver = new MutationObserver(() => liveRef.current.repush());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart.dispose();
      echartsRef.current = null;
      live.hasRevealed = false;
    };
  }, []);

  const makeOption = useCallback(
    (reveal: boolean): EChartsOption => {
      const resolved = liveRef.current.resolved;
      if (!resolved) return {};
      return buildOption({
        rows,
        config,
        collected,
        resolved,
        labelWidth,
        isLoading,
        reveal,
        valueKey: valueDataKey,
        targetKey: targetDataKey,
        rangeLabels,
      });
    },
    [rows, config, collected, labelWidth, isLoading, valueDataKey, targetDataKey, rangeLabels],
  );

  useEffect(() => {
    const chart = echartsRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;
    const push = (withEntrance: boolean) => {
      const option = makeOption(withEntrance);
      const merged = withChartFont(chartOptions ? { ...option, ...chartOptions } : option, container);
      Object.assign(merged, { animation: withEntrance, animationDurationUpdate: 0 });
      chart.setOption(merged as EChartsOption, { notMerge: true });
    };
    liveRef.current.resolved = resolveColors(container, config, keys);
    if (isLoading) liveRef.current.hasRevealed = false;
    const reveal = !liveRef.current.hasRevealed && !isLoading;
    if (reveal) liveRef.current.hasRevealed = true;
    push(animation && reveal && !shouldReduceMotion);
    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, keys);
      push(false);
    };
  }, [makeOption, chartOptions, config, keys, isLoading, animation, shouldReduceMotion]);

  const legendSlot = collected.legend;
  const legendStyle: CSSProperties = {
    position: "absolute",
    left: 16,
    right: 16,
    pointerEvents: "auto",
    ...(legendSlot.verticalAlign === "top" ? { top: 12 } : { bottom: 12 }),
  };

  const defaultAriaLabel = isLoading
    ? "Bullet chart."
    : `Bullet chart with ${rows.length} measures. ${rows
        .map((row) =>
          row.target != null
            ? `${row.label}: ${row.value.toLocaleString()} against a target of ${row.target.toLocaleString()}.`
            : `${row.label}: ${row.value.toLocaleString()}.`,
        )
        .join(" ")}`;

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
      aria-busy={isLoading}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="relative min-h-0 w-full flex-1" role="img" aria-label={ariaLabel ?? defaultAriaLabel}>
        <div ref={mountRef} className="h-full min-h-0 w-full" />
      </div>
      {legendSlot.present && !isLoading && (
        <LegendOverlay
          seriesKeys={legendKeys}
          config={config}
          variant={legendSlot.variant}
          align={legendSlot.align}
          verticalAlign={legendSlot.verticalAlign}
          selectedKey={null}
          hoveredKey={null}
          isClickable={false}
          onToggle={() => {}}
          style={legendStyle}
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
    </div>
  );
}

BulletChart.Measure = Measure;
BulletChart.Target = Target;
BulletChart.Ranges = Ranges;
BulletChart.Axis = Axis;
BulletChart.Tooltip = Tooltip;
BulletChart.Legend = Legend;
