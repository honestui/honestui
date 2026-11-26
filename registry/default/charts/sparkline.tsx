"use client";

import {
  buildChartCss,
  resolveColors,
  seriesPaint,
  withAlpha,
  withChartFont,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/default/ui/charts/chart";
import {
  escapeHtml,
  roundnessClass,
  tooltipVariantClass,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/default/ui/charts/tooltip";
import { dotStyle, type DotVariant } from "@/registry/default/ui/charts/dot";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type FC,
  type ReactNode,
} from "react";
import {
  GridComponent,
  MarkLineComponent,
  MarkPointComponent,
  TooltipComponent,
  type GridComponentOption,
  type MarkLineComponentOption,
  type MarkPointComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import {
  BarChart as BarChartModule,
  LineChart as LineChartModule,
  type BarSeriesOption,
  type LineSeriesOption,
} from "echarts/charts";
import { useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type { ChartConfig, DotVariant, TooltipRoundness, TooltipVariant };

echarts.use([
  LineChartModule,
  BarChartModule,
  GridComponent,
  MarkLineComponent,
  MarkPointComponent,
  TooltipComponent,
  CanvasRenderer,
]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = ComposeOption<
  | LineSeriesOption
  | BarSeriesOption
  | GridComponentOption
  | MarkLineComponentOption
  | MarkPointComponentOption
  | TooltipComponentOption
>;

const GRAY = "rgba(120, 120, 120, 1)";
const STROKE_WIDTH = 1;
const AREA_FILL_OPACITY = 0.16;

export type SparklineVariant = "line" | "area" | "bar";
export type SparklineCurve = "linear" | "smooth" | "step";
export type SparklineDotPoints = "last" | "extremes" | "last-and-extremes" | "all";
export type SparklineReference = number | "average" | "first" | "min" | "max";

export interface SparklineProps<TData extends Record<string, unknown>> {
  data: TData[];
  config: ChartConfig;
  /** The plotted value. Its `config` entry supplies the label and colors. */
  dataKey: keyof TData & string;
  /** Labels each point in the tooltip and accessible name, such as a date. */
  xDataKey?: keyof TData & string;
  variant?: SparklineVariant;
  curve?: SparklineCurve;
  strokeWidth?: number;
  /** Lower bound of the value scale. Lines default to the smallest value; bars to zero. */
  min?: number;
  /** Upper bound of the value scale. Defaults to the largest value. */
  max?: number;
  /** Draw a line across missing values instead of leaving a gap. */
  connectNulls?: boolean;
  className?: string;
  animation?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

export interface TooltipProps {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string, index: number) => string;
}

const Tooltip: FC<TooltipProps> = () => null;
Tooltip.displayName = "Sparkline.Tooltip";

export interface DotProps {
  /** Which points carry a dot. */
  points?: SparklineDotPoints;
  variant?: Exclude<DotVariant, "none">;
}

const Dot: FC<DotProps> = () => null;
Dot.displayName = "Sparkline.Dot";

export interface ReferenceLineProps {
  /** A fixed value, or a statistic of the data. */
  y?: SparklineReference;
}

const ReferenceLine: FC<ReferenceLineProps> = () => null;
ReferenceLine.displayName = "Sparkline.ReferenceLine";

type TooltipSlot = Required<Pick<TooltipProps, "variant" | "roundness">> &
  Omit<TooltipProps, "variant" | "roundness"> & { present: boolean };
type DotSlot = Required<DotProps> & { present: boolean };

function matchesSlot(type: unknown, slot: FC, name: string) {
  if (type === slot) return true;
  if (typeof type !== "function") return false;
  const candidate = (type as FC).displayName ?? type.name;
  return candidate === name || candidate === `Sparkline.${name}`;
}

function collectConfig(children: ReactNode) {
  let tooltip: TooltipSlot = { present: false, variant: "default", roundness: "lg" };
  let dot: DotSlot = { present: false, points: "last", variant: "border" };
  const references: SparklineReference[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (matchesSlot(child.type, Tooltip, "Tooltip")) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        valueFormatter: props.valueFormatter,
        labelFormatter: props.labelFormatter,
      };
    } else if (matchesSlot(child.type, Dot, "Dot")) {
      const props = child.props as DotProps;
      dot = { present: true, points: props.points ?? "last", variant: props.variant ?? "border" };
    } else if (matchesSlot(child.type, ReferenceLine, "ReferenceLine")) {
      references.push((child.props as ReferenceLineProps).y ?? "average");
    }
  });

  return { tooltip, dot, references };
}

function toNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function referenceValue(reference: SparklineReference, values: (number | null)[]): number | null {
  if (typeof reference === "number") return reference;
  const present = values.filter((value): value is number => value !== null);
  if (!present.length) return null;
  switch (reference) {
    case "first":
      return present[0];
    case "min":
      return Math.min(...present);
    case "max":
      return Math.max(...present);
    case "average":
    default:
      return present.reduce((sum, value) => sum + value, 0) / present.length;
  }
}

function dotIndices(points: SparklineDotPoints, values: (number | null)[]): Set<number> {
  const indices = new Set<number>();
  if (points === "all") {
    values.forEach((value, index) => value !== null && indices.add(index));
    return indices;
  }
  if (points === "last" || points === "last-and-extremes") {
    for (let index = values.length - 1; index >= 0; index--) {
      if (values[index] !== null) {
        indices.add(index);
        break;
      }
    }
  }
  if (points === "extremes" || points === "last-and-extremes") {
    let minIndex = -1;
    let maxIndex = -1;
    values.forEach((value, index) => {
      if (value === null) return;
      if (minIndex < 0 || value < (values[minIndex] as number)) minIndex = index;
      if (maxIndex < 0 || value > (values[maxIndex] as number)) maxIndex = index;
    });
    if (minIndex >= 0) indices.add(minIndex);
    if (maxIndex >= 0) indices.add(maxIndex);
  }
  return indices;
}

/**
 * The tooltip is appended to the document body so it can rise above a chart
 * only a few pixels tall. The chart's color variables are scoped to its
 * container, so the indicator takes the resolved color directly.
 */
function tooltipHtml(params: {
  label: string;
  seriesLabel: string;
  valueText: string;
  color: string;
  slot: TooltipSlot;
}) {
  const { label, seriesLabel, valueText, color, slot } = params;
  return `<div class="grid min-w-32 items-start gap-1.5 border border-border/50 px-2.5 py-1.5 text-xs shadow-xl ${roundnessClass[slot.roundness]} ${tooltipVariantClass[slot.variant]}">
      ${label ? `<div class="font-medium text-primary">${escapeHtml(label)}</div>` : ""}
      <div class="flex w-full items-center gap-2">
        <div class="h-2.5 w-2.5 shrink-0 rounded-[2px]" style="background:${color}"></div>
        <div class="flex flex-1 items-center justify-between gap-4 leading-none">
          <span class="text-muted-foreground">${escapeHtml(seriesLabel)}</span>
          <span class="text-foreground font-mono font-medium tabular-nums">${escapeHtml(valueText)}</span>
        </div>
      </div>
    </div>`;
}

function loadingOption(
  variant: SparklineVariant,
  tokens: ResolvedColors["tokens"],
  strokeWidth: number,
): EChartsOption {
  const values = [5, 6, 5.5, 7, 6.5, 8, 7, 8.5, 8, 9.5, 9, 10];
  const color = withAlpha(tokens.foreground, 0.12);
  return {
    animation: false,
    grid: { left: 2, right: 2, top: 3, bottom: 3 },
    xAxis: { type: "category", show: false, boundaryGap: variant === "bar", data: values.map(String) },
    yAxis: { type: "value", show: false, min: variant === "bar" ? 0 : "dataMin", max: "dataMax" },
    tooltip: { show: false },
    series: [
      variant === "bar"
        ? {
            type: "bar",
            data: values,
            silent: true,
            barCategoryGap: "30%",
            itemStyle: { color, borderRadius: 1 },
          }
        : {
            type: "line",
            data: values,
            silent: true,
            symbol: "none",
            lineStyle: { color, width: strokeWidth },
            areaStyle: variant === "area" ? { color: withAlpha(tokens.foreground, 0.04) } : undefined,
          },
    ],
  };
}

type LiveState = { resolved: ResolvedColors | null; repush: () => void };

export function Sparkline<TData extends Record<string, unknown>>({
  data,
  config,
  dataKey,
  xDataKey,
  variant = "line",
  curve = "linear",
  strokeWidth = STROKE_WIDTH,
  min,
  max,
  connectNulls = false,
  className,
  animation = true,
  isLoading = false,
  ariaLabel,
  chartOptions,
  children,
}: SparklineProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const collected = collectConfig(children);
  const { dot } = collected;
  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);
  const values = useMemo(() => data.map((row) => toNumber(row[dataKey])), [data, dataKey]);
  const labels = useMemo(
    () => data.map((row, index) => (xDataKey ? String(row[xDataKey] ?? "") : String(index + 1))),
    [data, xDataKey],
  );
  const seriesLabel = String(config[dataKey]?.label ?? dataKey);
  // Slots are re-read from children on every render, so the references and
  // tooltip settings are rebuilt from their primitive parts. That keeps them
  // stable between renders and lets them be hook dependencies directly.
  const referenceKey = collected.references.map(String).join("|");
  const references = useMemo(
    (): SparklineReference[] =>
      referenceKey
        ? referenceKey.split("|").map((part) => {
            const numeric = Number(part);
            return Number.isNaN(numeric) ? (part as SparklineReference) : numeric;
          })
        : [],
    [referenceKey],
  );
  const {
    present: tooltipPresent,
    variant: tooltipVariant,
    roundness: tooltipRoundness,
    valueFormatter: tooltipValueFormatter,
    labelFormatter: tooltipLabelFormatter,
  } = collected.tooltip;
  const tooltip = useMemo(
    (): TooltipSlot => ({
      present: tooltipPresent,
      variant: tooltipVariant,
      roundness: tooltipRoundness,
      valueFormatter: tooltipValueFormatter,
      labelFormatter: tooltipLabelFormatter,
    }),
    [tooltipPresent, tooltipVariant, tooltipRoundness, tooltipValueFormatter, tooltipLabelFormatter],
  );

  const defaultAriaLabel = useMemo(() => {
    const present = values.filter((value): value is number => value !== null);
    if (!present.length) return `${seriesLabel} sparkline with no data`;
    const format = (value: number) => tooltip.valueFormatter?.(value) ?? value.toLocaleString();
    const first = present[0];
    const last = present[present.length - 1];
    const trend = last > first ? "up" : last < first ? "down" : "flat";
    return `${seriesLabel} sparkline, ${trend} from ${format(first)} to ${format(last)}, low ${format(
      Math.min(...present),
    )}, high ${format(Math.max(...present))}`;
  }, [values, seriesLabel, tooltip]);

  const liveRef = useRef<LiveState>({ resolved: null, repush: () => {} });

  const buildOption = useCallback((): EChartsOption => {
    const resolved = liveRef.current.resolved;
    if (!resolved) return {};
    if (isLoading) return loadingOption(variant, resolved.tokens, strokeWidth);

    const slots = resolved.series[dataKey] ?? [GRAY];
    const paint = seriesPaint(slots);
    const base = slots[0] ?? GRAY;
    const isBar = variant === "bar";
    const dots = dot.present && !isBar ? dotIndices(dot.points, values) : new Set<number>();
    const restingDot = dotStyle(dot.variant, paint, resolved.tokens.background);
    const hoverDot = dotStyle("border", paint, resolved.tokens.background);
    // The plot is inset just enough that strokes and dots at the edges stay whole.
    const dotExtent = (style: typeof restingDot) =>
      style.size / 2 + (style.itemStyle.borderWidth ?? 0) / 2 + 1;
    const pad = isBar
      ? 0
      : Math.ceil(Math.max(strokeWidth, dotExtent(hoverDot), dots.size ? dotExtent(restingDot) : 0));
    const hasNegative = values.some((value) => value !== null && value < 0);

    const markLine: MarkLineComponentOption | undefined = references.length
      ? {
          silent: true,
          symbol: "none",
          animation: false,
          label: { show: false },
          lineStyle: {
            color: withAlpha(resolved.tokens.mutedForeground, 0.7),
            width: 1,
            type: [3, 3] as [number, number],
          },
          data: references
            .map((reference) => referenceValue(reference, values))
            .filter((value): value is number => value !== null)
            .map((yAxis) => ({ yAxis })),
        }
      : undefined;

    const series: LineSeriesOption | BarSeriesOption = isBar
      ? {
          id: dataKey,
          name: seriesLabel,
          type: "bar",
          data: values.map((value) => value ?? "-"),
          barCategoryGap: "30%",
          itemStyle: { color: paint, borderRadius: 1 },
          emphasis: { focus: "self", itemStyle: { color: paint } },
          blur: { itemStyle: { opacity: 0.4 } },
          markLine,
        }
      : {
          id: dataKey,
          name: seriesLabel,
          type: "line",
          data: values.map((value) => value ?? "-"),
          connectNulls,
          smooth: curve === "smooth" ? 0.35 : false,
          step: curve === "step" ? "middle" : false,
          // Resting dots are mark points, so the series symbol stays free to
          // appear on whichever point the pointer is over.
          showSymbol: false,
          symbol: "circle",
          symbolSize: hoverDot.size,
          itemStyle: hoverDot.itemStyle,
          markPoint: dots.size
            ? {
                silent: true,
                animation: false,
                symbol: "circle",
                symbolSize: restingDot.size,
                itemStyle: restingDot.itemStyle as MarkPointComponentOption["itemStyle"],
                label: { show: false },
                data: [...dots].map((index) => ({ name: String(index), coord: [index, values[index] as number] })),
              }
            : undefined,
          lineStyle: { color: paint, width: strokeWidth, cap: "round", join: "round" },
          areaStyle:
            variant === "area"
              ? {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: withAlpha(base, AREA_FILL_OPACITY) },
                    { offset: 1, color: withAlpha(base, 0) },
                  ]),
                }
              : undefined,
          emphasis: { scale: 1, itemStyle: hoverDot.itemStyle },
          markLine,
          z: 2,
        };

    return {
      animation: animation && !shouldReduceMotion,
      animationDuration: 480,
      grid: { left: pad, right: pad, top: pad, bottom: isBar ? 0 : pad },
      xAxis: { type: "category", show: false, boundaryGap: isBar, data: labels },
      yAxis: {
        type: "value",
        show: false,
        min: min ?? (isBar ? (hasNegative ? "dataMin" : 0) : "dataMin"),
        max: max ?? "dataMax",
        scale: !isBar,
      },
      tooltip: {
        show: tooltip.present,
        trigger: "axis",
        confine: false,
        appendTo: () => document.body,
        backgroundColor: "transparent",
        borderWidth: 0,
        padding: 0,
        transitionDuration: 0,
        extraCssText: "box-shadow:none;z-index:50;",
        axisPointer: isBar
          ? { type: "none" }
          : {
              type: "line",
              lineStyle: {
                color: withAlpha(resolved.tokens.mutedForeground, 0.6),
                width: 1,
                type: [3, 3] as [number, number],
              },
            },
        position: (point, _params, _dom, _rect, size) => [
          point[0] - size.contentSize[0] / 2,
          -size.contentSize[1] - 6,
        ],
        formatter: (raw: unknown) => {
          const item = (Array.isArray(raw) ? raw[0] : raw) as { dataIndex?: number } | undefined;
          const index = item?.dataIndex ?? 0;
          const value = values[index];
          const label = labels[index] ?? "";
          return tooltipHtml({
            label: xDataKey ? (tooltip.labelFormatter?.(label, index) ?? label) : "",
            seriesLabel,
            valueText:
              value === null ? "No data" : (tooltip.valueFormatter?.(value) ?? value.toLocaleString()),
            color: base,
            slot: tooltip,
          });
        },
      },
      series: [series],
    };
  }, [
    isLoading,
    variant,
    strokeWidth,
    dataKey,
    seriesLabel,
    values,
    labels,
    xDataKey,
    dot.present,
    dot.points,
    dot.variant,
    references,
    connectNulls,
    curve,
    animation,
    shouldReduceMotion,
    min,
    max,
    tooltip,
  ]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const chart = echarts.init(mount);
    chartRef.current = chart;
    let resizeFrame = 0;
    const resizeObserver = new ResizeObserver(() => {
      if (mount.clientWidth === chart.getWidth() && mount.clientHeight === chart.getHeight()) return;
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        chart.resize({ animation: { duration: 0 } });
      });
    });
    resizeObserver.observe(mount);
    const themeObserver = new MutationObserver(() => liveRef.current.repush());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;
    liveRef.current.resolved = resolveColors(container, config, [dataKey]);
    const push = () => {
      const option = buildOption();
      const merged = withChartFont(chartOptions ? { ...option, ...chartOptions } : option, container);
      chart.setOption(merged as EChartsOption, { notMerge: true });
    };
    push();
    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, [dataKey]);
      push();
    };
  }, [buildOption, chartOptions, config, dataKey]);

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex text-xs ${className ?? ""}`}
      aria-busy={isLoading}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        className="relative h-full min-h-0 w-full min-w-0"
        role="img"
        aria-label={isLoading ? `${seriesLabel} sparkline, loading` : (ariaLabel ?? defaultAriaLabel)}
      >
        <div ref={mountRef} className="h-full min-h-0 w-full" />
      </div>
      {/* A pill would not fit a chart this small, so loading is announced only. */}
      {isLoading && (
        <span role="status" className="sr-only">
          Loading
        </span>
      )}
    </div>
  );
}

Sparkline.Tooltip = Tooltip;
Sparkline.Dot = Dot;
Sparkline.ReferenceLine = ReferenceLine;
