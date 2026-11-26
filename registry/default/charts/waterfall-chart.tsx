"use client";

import {
  tooltipBaseOption,
  tooltipIndicatorHtml,
  tooltipRow,
  tooltipShell,
  type TooltipPosition,
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
  flattenColor,
  getColorsCount,
  resolveColors,
  withAlpha,
  withChartFont,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/default/ui/charts/chart";
import { LegendOverlay, type LegendVariant } from "@/registry/default/ui/charts/legend";
import {
  buildReferenceSeries,
  collectReferences,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  referenceColorKeys,
  type ReferenceSlots,
} from "@/registry/default/ui/charts/reference";
import { joinChartSync } from "@/registry/default/ui/charts/sync";
import { CustomChart, type CustomSeriesOption, type LineSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type { ChartConfig, LegendVariant, TooltipPosition, TooltipRoundness, TooltipVariant };

echarts.use([CustomChart, GridComponent, TooltipComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = ComposeOption<
  CustomSeriesOption | LineSeriesOption | GridComponentOption | TooltipComponentOption
>;
type ArrayItem<T> = T extends readonly (infer U)[] ? U : T;
type XAxisOption = ArrayItem<NonNullable<EChartsOption["xAxis"]>>;
type YAxisOption = ArrayItem<NonNullable<EChartsOption["yAxis"]>>;

const GRAY = "rgba(120, 120, 120, 1)";
const POINTER_STROKE_WIDTH = 0.8;
const REVEAL_DURATION = 420;
const BAR_STAGGER = 60;
const LOADING_SHAPE = [60, 18, -12, 24, -20, 14, 84];

/** Config keys the waterfall reads its three colors from. */
export const WATERFALL_KEYS = ["increase", "decrease", "total"] as const;
export type WaterfallKind = (typeof WATERFALL_KEYS)[number];

export interface WaterfallChartProps<TData extends Record<string, unknown>> {
  /** One row per step, in order. */
  data: TData[];
  /** Labels and colors for `increase`, `decrease`, and `total`. */
  config: ChartConfig;
  /** The step name shown on the category axis. */
  xDataKey: keyof TData & string;
  /** The change each step contributes. On a total row, an optional value that sets the running total. */
  valueDataKey: keyof TData & string;
  /**
   * A boolean field that marks total and subtotal rows. A total row spans from
   * zero to the running total. With a numeric value it resets the running
   * total to that value, for an opening balance.
   */
  totalDataKey?: keyof TData & string;
  className?: string;
  animation?: boolean;
  isLoading?: boolean;
  /** Charts that share a `syncId` show their crosshair and tooltip at the same step. */
  syncId?: string;
  ariaLabel?: string;
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

export interface WaterfallBarsProps {
  radius?: number;
  /** Bar width as a share of each category, from 0 to 1. */
  width?: number;
  /** Draws dashed connectors between the end of one bar and the start of the next. */
  connectors?: boolean;
  /** Prints each step's change above or below its bar. */
  showValues?: boolean;
  valueFormatter?: (value: number, kind: WaterfallKind) => string;
}

const Bars: FC<WaterfallBarsProps> = () => null;
Bars.displayName = "WaterfallChart.Bars";

export interface WaterfallXAxisProps {
  tickFormatter?: (value: string, index: number) => string;
  label?: string;
  hideDots?: boolean;
}

const XAxis: FC<WaterfallXAxisProps> = () => null;
XAxis.displayName = "WaterfallChart.XAxis";

export interface WaterfallYAxisProps {
  tickFormatter?: (value: number, index: number) => string;
  label?: string;
  hideDots?: boolean;
}

const YAxis: FC<WaterfallYAxisProps> = () => null;
YAxis.displayName = "WaterfallChart.YAxis";

const Grid: FC = () => null;
Grid.displayName = "WaterfallChart.Grid";

export interface WaterfallTooltipProps {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  position?: TooltipPosition;
  cursor?: boolean;
  defaultIndex?: number;
  valueFormatter?: (value: number) => string;
}

const Tooltip: FC<WaterfallTooltipProps> = () => null;
Tooltip.displayName = "WaterfallChart.Tooltip";

export interface WaterfallLegendProps {
  variant?: LegendVariant;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
}

const Legend: FC<WaterfallLegendProps> = () => null;
Legend.displayName = "WaterfallChart.Legend";

/** One computed step of the waterfall. */
export type WaterfallStep = {
  index: number;
  label: string;
  kind: WaterfallKind;
  /** The change this step contributes; for totals, the running total. */
  value: number;
  start: number;
  end: number;
  runningTotal: number;
};

/**
 * Turns ordered deltas into floating bars. Exported so a nearby table or
 * summary can show exactly what the chart draws.
 */
export function computeWaterfall(
  data: Record<string, unknown>[],
  xKey: string,
  valueKey: string,
  totalKey?: string,
): WaterfallStep[] {
  let running = 0;
  return data.map((row, index) => {
    const raw = row[valueKey];
    const numeric = raw === null || raw === undefined || raw === "" ? null : Number(raw);
    const label = String(row[xKey] ?? "");
    if (totalKey && row[totalKey]) {
      if (numeric !== null && Number.isFinite(numeric)) running = numeric;
      return { index, label, kind: "total", value: running, start: 0, end: running, runningTotal: running };
    }
    const delta = numeric !== null && Number.isFinite(numeric) ? numeric : 0;
    const start = running;
    running += delta;
    return {
      index,
      label,
      kind: delta < 0 ? "decrease" : "increase",
      value: delta,
      start,
      end: running,
      runningTotal: running,
    };
  });
}

type BarsSlot = Required<Omit<WaterfallBarsProps, "valueFormatter">> & {
  valueFormatter?: WaterfallBarsProps["valueFormatter"];
};
type Collected = {
  bars: BarsSlot;
  xAxis: { present: boolean } & WaterfallXAxisProps;
  yAxis: { present: boolean } & WaterfallYAxisProps;
  showGrid: boolean;
  tooltip: { present: boolean } & Required<
    Pick<WaterfallTooltipProps, "variant" | "roundness" | "position" | "cursor">
  > &
    Pick<WaterfallTooltipProps, "defaultIndex" | "valueFormatter">;
  legend: { present: boolean } & Required<WaterfallLegendProps>;
};

function collectConfig(children: ReactNode): Collected {
  const collected: Collected = {
    bars: { radius: 2, width: 0.6, connectors: true, showValues: false },
    xAxis: { present: false },
    yAxis: { present: false },
    showGrid: false,
    tooltip: {
      present: false,
      variant: "default",
      roundness: "lg",
      position: "variable",
      cursor: false,
    },
    legend: { present: false, variant: "rounded-square", align: "right", verticalAlign: "top" },
  };
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Bars) {
      const p = child.props as WaterfallBarsProps;
      collected.bars = {
        radius: p.radius ?? 2,
        width: Math.min(Math.max(p.width ?? 0.6, 0.05), 1),
        connectors: p.connectors ?? true,
        showValues: p.showValues ?? false,
        valueFormatter: p.valueFormatter,
      };
    } else if (child.type === XAxis) {
      collected.xAxis = { present: true, ...(child.props as WaterfallXAxisProps) };
    } else if (child.type === YAxis) {
      collected.yAxis = { present: true, ...(child.props as WaterfallYAxisProps) };
    } else if (child.type === Grid) {
      collected.showGrid = true;
    } else if (child.type === Tooltip) {
      const p = child.props as WaterfallTooltipProps;
      collected.tooltip = {
        present: true,
        variant: p.variant ?? "default",
        roundness: p.roundness ?? "lg",
        position: p.position ?? "variable",
        cursor: p.cursor ?? false,
        defaultIndex: p.defaultIndex,
        valueFormatter: p.valueFormatter,
      };
    } else if (child.type === Legend) {
      const p = child.props as WaterfallLegendProps;
      collected.legend = {
        present: true,
        variant: p.variant ?? "rounded-square",
        align: p.align ?? "right",
        verticalAlign: p.verticalAlign ?? "top",
      };
    }
  });
  return collected;
}

function signed(value: number, format: (value: number) => string): string {
  if (value > 0) return `+${format(value)}`;
  if (value < 0) return `−${format(Math.abs(value))}`;
  return format(0);
}

type BuildContext = {
  steps: WaterfallStep[];
  config: ChartConfig;
  collected: Collected;
  resolved: ResolvedColors;
  isLoading: boolean;
  reveal: boolean;
  /** Approximate category width in pixels, for wrapping labels. */
  bandWidth: number;
  references: ReferenceSlots | null;
};

type RenderApi = {
  value: (dim: number) => number;
  coord: (value: [number, number]) => number[];
  size: (value: [number, number]) => number[];
};

function buildOption(ctx: BuildContext): EChartsOption {
  const { steps, collected, resolved, isLoading, config } = ctx;
  const { tokens } = resolved;
  const labelColor = tokens.mutedForeground;
  const tickDot = flattenColor(tokens.border, tokens.background);
  const legendTop = collected.legend.present && collected.legend.verticalAlign === "top";
  const legendBottom = collected.legend.present && collected.legend.verticalAlign === "bottom";
  const barsSlot = collected.bars;

  const rows: WaterfallStep[] = isLoading
    ? computeWaterfall(
        LOADING_SHAPE.map((value, i) => ({ step: String(i), value, total: i === 0 || i === 6 })),
        "step",
        "value",
        "total",
      )
    : steps;

  const colorOf = (kind: WaterfallKind) =>
    isLoading ? withAlpha(tokens.foreground, 0.06) : (resolved.series[kind]?.[0] ?? GRAY);
  const connectorColor = isLoading ? "transparent" : tokens.mutedForeground;
  const formatBar = barsSlot.valueFormatter;
  const labelFor = (step: WaterfallStep) =>
    formatBar
      ? formatBar(step.value, step.kind)
      : step.kind === "total"
        ? step.value.toLocaleString()
        : signed(step.value, (v) => v.toLocaleString());

  const xFormat = collected.xAxis.tickFormatter;
  const yFormat = collected.yAxis.tickFormatter;

  const xAxis: XAxisOption = {
    type: "category",
    data: rows.map((s) => s.label),
    name: isLoading ? undefined : collected.xAxis.label,
    nameLocation: "middle",
    nameGap: 30,
    nameTextStyle: { color: labelColor, fontSize: 10 },
    axisLine: { show: false },
    axisTick: {
      show: !isLoading && collected.xAxis.present && !collected.xAxis.hideDots,
      alignWithLabel: true,
      length: 0.5,
      lineStyle: { color: tickDot, width: 3, cap: "round" },
    },
    splitLine: { show: false },
    axisLabel: {
      show: !isLoading && collected.xAxis.present,
      color: labelColor,
      fontSize: 10,
      margin: 8,
      // Every step is named, so labels wrap to their band instead of
      // dropping out when they collide.
      interval: 0,
      width: Math.max(ctx.bandWidth - 6, 24),
      overflow: "break",
      lineHeight: 12,
      formatter: xFormat ? (value: string, index: number) => xFormat(value, index) : undefined,
    },
  };

  const yAxis: YAxisOption = {
    type: "value",
    show: collected.yAxis.present || collected.showGrid,
    name: isLoading ? undefined : collected.yAxis.label,
    nameLocation: "middle",
    nameGap: 38,
    nameTextStyle: { color: labelColor, fontSize: 10 },
    axisLine: { show: false },
    axisTick: {
      show: collected.yAxis.present && !isLoading && !collected.yAxis.hideDots,
      length: 0.5,
      lineStyle: { color: tickDot, width: 3, cap: "round" },
    },
    splitLine: {
      show: collected.showGrid && !isLoading,
      lineStyle: { color: tokens.border, type: [3, 3], width: 1 },
    },
    axisLabel: {
      show: collected.yAxis.present && !isLoading,
      color: labelColor,
      fontSize: 10,
      margin: 8,
      formatter: yFormat ? (value: number, index: number) => yFormat(value, index) : undefined,
    },
  };

  const grid: GridComponentOption = {
    left: 8,
    right: 8,
    top: (legendTop ? 42 : 16) + (barsSlot.showValues ? 8 : 0),
    bottom: 8 + (legendBottom ? 34 : 0),
  };

  const series: CustomSeriesOption = {
    id: "waterfall",
    type: "custom",
    data: rows.map((s) => [s.index, s.start, s.end]),
    // Both ends count toward the value axis extent, so floating bars that
    // cross zero still fit.
    encode: { x: 0, y: [1, 2], tooltip: [2] },
    silent: isLoading,
    clip: true,
    renderItem: (params, rawApi) => {
      const api = rawApi as unknown as RenderApi;
      const index = api.value(0);
      const step = rows[index];
      if (!step) return null;
      const band = api.size([1, 0])[0];
      const width = Math.max(band * barsSlot.width, 1);
      const [cx, startY] = api.coord([index, step.start]);
      const [, endY] = api.coord([index, step.end]);
      const top = Math.min(startY, endY);
      const height = Math.max(Math.abs(endY - startY), 1);
      const r = Math.min(barsSlot.radius, width / 2, height / 2);
      const color = colorOf(step.kind);
      const delay = ctx.reveal ? index * BAR_STAGGER : 0;

      const children: Record<string, unknown>[] = [
        {
          type: "rect",
          shape: { x: cx - width / 2, y: top, width, height, r },
          style: { fill: color },
          enterFrom: ctx.reveal ? { style: { opacity: 0 }, y: 6 } : undefined,
          enterAnimation: { duration: REVEAL_DURATION, delay, easing: "cubicOut" },
          emphasisDisabled: true,
        },
      ];

      const next = rows[index + 1];
      if (barsSlot.connectors && next) {
        // The connector carries the running total over to where the next bar
        // starts, the level a total bar would reach.
        const [nextX, levelY] = api.coord([index + 1, step.end]);
        children.push({
          type: "line",
          shape: { x1: cx + width / 2, y1: levelY, x2: nextX - width / 2, y2: levelY },
          style: { stroke: connectorColor, lineWidth: 1, lineDash: [2, 2], opacity: 0.6 },
          silent: true,
          enterFrom: ctx.reveal ? { style: { opacity: 0 } } : undefined,
          enterAnimation: { duration: REVEAL_DURATION, delay: delay + REVEAL_DURATION / 2 },
        });
      }

      if (barsSlot.showValues && !isLoading) {
        const above = step.kind === "decrease" ? false : step.end >= 0;
        children.push({
          type: "text",
          silent: true,
          style: {
            text: labelFor(step),
            x: cx,
            y: above ? top - 4 : top + height + 4,
            align: "center",
            verticalAlign: above ? "bottom" : "top",
            fill: tokens.foreground,
            font: "500 10px var(--font-mono, ui-monospace, monospace)",
          },
          enterFrom: ctx.reveal ? { style: { opacity: 0 } } : undefined,
          enterAnimation: { duration: REVEAL_DURATION, delay: delay + REVEAL_DURATION / 2 },
        });
      }

      void params;
      return { type: "group", children } as unknown as ReturnType<
        NonNullable<CustomSeriesOption["renderItem"]>
      >;
    },
  };

  const tooltipSlot = collected.tooltip;
  const format = tooltipSlot.valueFormatter ?? ((v: number) => v.toLocaleString());
  const tooltip: TooltipComponentOption = {
    ...tooltipBaseOption({
      present: tooltipSlot.present && !isLoading,
      cursor: tooltipSlot.cursor,
      tokens,
      position: tooltipSlot.position,
      axisPointerColor: tokens.border,
      strokeWidth: POINTER_STROKE_WIDTH,
    }),
    formatter: (params: unknown) => {
      const first = (Array.isArray(params) ? params[0] : params) as { dataIndex?: number } | undefined;
      const step = typeof first?.dataIndex === "number" ? rows[first.dataIndex] : undefined;
      if (!step) return "";
      const item = config[step.kind];
      const kindLabel = typeof item?.label === "string" ? item.label : step.kind;
      const indicator = tooltipIndicatorHtml(step.kind, item ? getColorsCount(item) : 1);
      const body =
        step.kind === "total"
          ? tooltipRow({ indicatorHtml: indicator, labelText: kindLabel, valueText: format(step.value), dimmed: "" })
          : tooltipRow({
              indicatorHtml: indicator,
              labelText: kindLabel,
              valueText: signed(step.value, format),
              dimmed: "",
            }) +
            tooltipRow({
              indicatorHtml: '<div class="h-2.5 w-2.5 shrink-0"></div>',
              labelText: "Running total",
              valueText: format(step.runningTotal),
              dimmed: "",
            });
      return tooltipShell({
        label: step.label,
        body,
        roundness: tooltipSlot.roundness,
        variant: tooltipSlot.variant,
      });
    },
  };

  const reference = isLoading
    ? null
    : buildReferenceSeries({ refs: ctx.references, resolved, valueAxes: { x: false, y: true } });

  return { grid, xAxis, yAxis, tooltip, series: reference ? [series, reference] : [series] };
}

type LiveState = {
  resolved: ResolvedColors | null;
  hasRevealed: boolean;
  categories: string[];
  repush: () => void;
};

export function WaterfallChart<TData extends Record<string, unknown>>({
  data,
  config,
  xDataKey,
  valueDataKey,
  totalDataKey,
  className,
  animation = true,
  isLoading = false,
  syncId,
  ariaLabel,
  chartOptions,
  children,
}: WaterfallChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);
  const liveRef = useRef<LiveState>({
    resolved: null,
    hasRevealed: false,
    categories: [],
    repush: () => {},
  });
  const shouldReduceMotion = useReducedMotion();

  const collected = useMemo(() => collectConfig(children), [children]);
  const steps = useMemo(
    () => computeWaterfall(data, xDataKey, valueDataKey, totalDataKey),
    [data, xDataKey, valueDataKey, totalDataKey],
  );
  const references = useMemo(() => collectReferences(children), [children]);
  const keys = useMemo(
    () => [...WATERFALL_KEYS, ...referenceColorKeys(references, config)],
    [references, config],
  );
  const legendKeys = useMemo(
    () => WATERFALL_KEYS.filter((key) => config[key] && steps.some((s) => s.kind === key)),
    [config, steps],
  );
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
    const leaveSync = syncId
      ? joinChartSync({
          syncId,
          chart,
          categories: () => liveRef.current.categories,
          categoryAxis: () => "x",
        })
      : null;
    return () => {
      leaveSync?.();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart.dispose();
      echartsRef.current = null;
      live.hasRevealed = false;
    };
  }, [syncId]);

  const makeOption = useCallback(
    (reveal: boolean): EChartsOption => {
      const resolved = liveRef.current.resolved;
      if (!resolved) return {};
      const width = echartsRef.current?.getWidth() ?? 0;
      // The y-axis labels take roughly 48px of the plot.
      const bandWidth = steps.length ? (width - 16 - 48) / steps.length : 80;
      liveRef.current.categories = steps.map((step) => step.label);
      return buildOption({
        steps,
        config,
        collected,
        resolved,
        isLoading,
        reveal,
        bandWidth,
        references,
      });
    },
    [steps, config, collected, isLoading, references],
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

  const tooltipSlot = collected.tooltip;
  useEffect(() => {
    const chart = echartsRef.current;
    const index = tooltipSlot.defaultIndex;
    if (!chart || isLoading || !tooltipSlot.present || index == null) return;
    const timer = setTimeout(() => {
      chart.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: index });
    }, 300);
    return () => clearTimeout(timer);
  }, [tooltipSlot.present, tooltipSlot.defaultIndex, isLoading, steps.length]);

  const legendSlot = collected.legend;
  const legendStyle: CSSProperties = {
    position: "absolute",
    left: 16,
    right: 16,
    pointerEvents: "auto",
    ...(legendSlot.verticalAlign === "top"
      ? { top: 12 }
      : legendSlot.verticalAlign === "bottom"
        ? { bottom: 12 }
        : { top: "50%", transform: "translateY(-50%)" }),
  };

  const final = steps[steps.length - 1];
  const defaultAriaLabel = final
    ? `Waterfall chart of ${String(valueDataKey)} across ${steps.length} steps, from ${steps[0].label} to ${final.label}, ending at ${final.runningTotal.toLocaleString()}.`
    : "Waterfall chart with no data.";

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

WaterfallChart.Bars = Bars;
WaterfallChart.XAxis = XAxis;
WaterfallChart.YAxis = YAxis;
WaterfallChart.Grid = Grid;
WaterfallChart.Tooltip = Tooltip;
WaterfallChart.Legend = Legend;
WaterfallChart.ReferenceLine = ReferenceLine;
WaterfallChart.ReferenceArea = ReferenceArea;
WaterfallChart.ReferenceDot = ReferenceDot;
