"use client";

import {
  resolveTooltipPosition,
  tooltipIndicatorHtml,
  tooltipRow,
  tooltipShell,
  type TooltipPosition,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/default/ui/charts/tooltip";
import {
  buildChartCss,
  getColorsCount,
  resolveColors,
  withAlpha,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/default/ui/charts/chart";
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
  TooltipComponent,
  VisualMapContinuousComponent,
  VisualMapPiecewiseComponent,
  type GridComponentOption,
  type TooltipComponentOption,
  type VisualMapComponentOption,
} from "echarts/components";
import { HeatmapChart as HeatmapChartModule, type HeatmapSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type { ChartConfig, TooltipPosition, TooltipRoundness, TooltipVariant };

echarts.use([
  HeatmapChartModule,
  GridComponent,
  TooltipComponent,
  VisualMapContinuousComponent,
  VisualMapPiecewiseComponent,
  CanvasRenderer,
]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = ComposeOption<
  HeatmapSeriesOption | GridComponentOption | TooltipComponentOption | VisualMapComponentOption
>;
type ArrayItem<T> = T extends readonly (infer U)[] ? U : T;
type XAxisOption = ArrayItem<NonNullable<EChartsOption["xAxis"]>>;
type YAxisOption = ArrayItem<NonNullable<EChartsOption["yAxis"]>>;

const GRAY = "rgba(120, 120, 120, 1)";
const DEFAULT_LEVELS = 5;

export type HeatmapVariant = "default" | "blocks";

export type HeatmapCell<TData extends Record<string, unknown>> = {
  x: string;
  y: string;
  value: number;
  datum: TData;
  index: number;
};

export interface HeatmapProps<TData extends Record<string, unknown>> {
  data: TData[];
  config: ChartConfig;
  xDataKey: keyof TData & string;
  yDataKey: keyof TData & string;
  valueDataKey: keyof TData & string;
  className?: string;
  min?: number;
  max?: number;
  animation?: boolean;
  isLoading?: boolean;
  loadingColumns?: number;
  loadingRows?: number;
  ariaLabel?: string;
  onCellClick?: (cell: HeatmapCell<TData>) => void;
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

export interface CellsProps {
  variant?: HeatmapVariant;
  radius?: number;
  gap?: number;
  levels?: number;
  isClickable?: boolean;
  showValues?: boolean;
  valueFormatter?: (value: number) => string;
  progressive?: number;
  progressiveThreshold?: number;
}

const Cells: FC<CellsProps> = () => null;
Cells.displayName = "Heatmap.Cells";

export interface AxisProps {
  tickFormatter?: (value: string, index: number) => string;
  label?: string;
  hide?: boolean;
}

const XAxis: FC<AxisProps> = () => null;
XAxis.displayName = "Heatmap.XAxis";

export interface YAxisProps extends AxisProps {
  inverse?: boolean;
}

const YAxis: FC<YAxisProps> = () => null;
YAxis.displayName = "Heatmap.YAxis";

const Grid: FC = () => null;
Grid.displayName = "Heatmap.Grid";

export interface TooltipProps {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  position?: TooltipPosition;
  valueFormatter?: (value: number) => string;
  defaultIndex?: number;
}

const Tooltip: FC<TooltipProps> = () => null;
Tooltip.displayName = "Heatmap.Tooltip";

export interface LegendProps {
  align?: "left" | "center" | "right";
  orient?: "horizontal" | "vertical";
  verticalAlign?: "top" | "middle" | "bottom";
  calculable?: boolean;
  realtime?: boolean;
  minLabel?: string;
  maxLabel?: string;
  valueFormatter?: (value: number) => string;
}

const Legend: FC<LegendProps> = () => null;
Legend.displayName = "Heatmap.Legend";

type CellsSlot = Required<
  Pick<CellsProps, "variant" | "radius" | "gap" | "levels" | "isClickable" | "showValues">
> &
  Pick<CellsProps, "valueFormatter" | "progressive" | "progressiveThreshold">;
type AxisSlot = Required<Pick<AxisProps, "hide">> & Omit<AxisProps, "hide"> & { present: boolean };
type YAxisSlot = AxisSlot & { inverse: boolean };
type TooltipSlot = Required<Pick<TooltipProps, "variant" | "roundness" | "position">> &
  Omit<TooltipProps, "variant" | "roundness" | "position"> & { present: boolean };
type LegendSlot = Required<
  Pick<LegendProps, "align" | "orient" | "verticalAlign" | "calculable" | "realtime">
> &
  Omit<LegendProps, "align" | "orient" | "verticalAlign" | "calculable" | "realtime"> & {
  present: boolean;
};

function matchesSlot(type: unknown, slot: FC, name: string) {
  if (type === slot) return true;
  if (typeof type !== "function") return false;

  const candidate = (type as FC).displayName ?? type.name;
  return candidate === name || candidate === `Heatmap.${name}`;
}

function collectConfig(children: ReactNode) {
  let cells: CellsSlot = {
    variant: "default",
    radius: 2,
    gap: 2,
    levels: DEFAULT_LEVELS,
    isClickable: false,
    showValues: false,
  };
  let xAxis: AxisSlot = { present: false, hide: false };
  let yAxis: YAxisSlot = { present: false, hide: false, inverse: true };
  let grid = false;
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
    position: "variable",
  };
  let legend: LegendSlot = {
    present: false,
    align: "center",
    orient: "horizontal",
    verticalAlign: "middle",
    calculable: false,
    realtime: false,
  };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (matchesSlot(child.type, Cells, "Cells")) {
      const props = child.props as CellsProps;
      const variant = props.variant ?? "default";
      cells = {
        variant,
        radius: props.radius ?? (variant === "blocks" ? 1 : 2),
        gap: props.gap ?? (variant === "blocks" ? 4 : 2),
        levels: Math.max(2, Math.round(props.levels ?? DEFAULT_LEVELS)),
        isClickable: props.isClickable ?? false,
        showValues: props.showValues ?? false,
        valueFormatter: props.valueFormatter,
        progressive: props.progressive,
        progressiveThreshold: props.progressiveThreshold,
      };
    } else if (matchesSlot(child.type, XAxis, "XAxis")) {
      const props = child.props as AxisProps;
      xAxis = { present: true, hide: props.hide ?? false, ...props };
    } else if (matchesSlot(child.type, YAxis, "YAxis")) {
      const props = child.props as YAxisProps;
      yAxis = { present: true, hide: props.hide ?? false, inverse: props.inverse ?? true, ...props };
    } else if (matchesSlot(child.type, Grid, "Grid")) {
      grid = true;
    } else if (matchesSlot(child.type, Tooltip, "Tooltip")) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        position: props.position ?? "variable",
        valueFormatter: props.valueFormatter,
        defaultIndex: props.defaultIndex,
      };
    } else if (matchesSlot(child.type, Legend, "Legend")) {
      const props = child.props as LegendProps;
      legend = {
        present: true,
        align: props.align ?? "center",
        orient: props.orient ?? "horizontal",
        verticalAlign: props.verticalAlign ?? "middle",
        calculable: props.calculable ?? false,
        realtime: props.realtime ?? false,
        ...props,
      };
    }
  });

  return { cells, xAxis, yAxis, grid, tooltip, legend };
}

function uniqueValues<TData extends Record<string, unknown>>(data: TData[], key: keyof TData & string) {
  return Array.from(new Set(data.map((row) => String(row[key]))));
}

function valueRange<TData extends Record<string, unknown>>(
  data: TData[],
  valueDataKey: keyof TData & string,
  min?: number,
  max?: number,
) {
  const values = data.map((row) => Number(row[valueDataKey])).filter(Number.isFinite);
  const resolvedMin = min ?? (values.length ? Math.min(...values) : 0);
  const resolvedMax = max ?? (values.length ? Math.max(...values) : 1);
  return resolvedMin === resolvedMax
    ? { min: Math.min(0, resolvedMin), max: resolvedMax || 1 }
    : { min: resolvedMin, max: resolvedMax };
}

function heatPalette(resolved: ResolvedColors, key: string) {
  const slots = resolved.series[key] ?? [GRAY];
  if (slots.length > 1) return slots;
  const base = slots[0] ?? GRAY;
  return [withAlpha(base, 0.08), withAlpha(base, 0.25), withAlpha(base, 0.48), withAlpha(base, 0.72), base];
}

function buildAxis(
  data: string[],
  slot: AxisSlot,
  tokens: ResolvedColors["tokens"],
  axis: "x" | "y",
  inverse = false,
) {
  return {
    type: "category",
    data,
    inverse: axis === "y" ? inverse : undefined,
    name: slot.present && !slot.hide ? slot.label : undefined,
    nameLocation: "middle",
    nameGap: axis === "x" ? 28 : 48,
    nameTextStyle: { color: tokens.mutedForeground, fontSize: 10 },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: {
      show: slot.present && !slot.hide,
      color: tokens.mutedForeground,
      fontSize: 10,
      margin: 8,
      formatter: slot.tickFormatter
        ? (value: string, index: number) => slot.tickFormatter?.(value, index) ?? value
        : undefined,
    },
  };
}

function createTooltipFormatter(params: {
  data: Record<string, unknown>[];
  config: ChartConfig;
  valueDataKey: string;
  xCategories: string[];
  yCategories: string[];
  slot: TooltipSlot;
}) {
  const { data, config, valueDataKey, xCategories, yCategories, slot } = params;
  return (raw: unknown) => {
    const p = raw as { dataIndex?: number; value?: [number, number, number] };
    const index = p.dataIndex ?? 0;
    const datum = data[index];
    const value = Number(p.value?.[2] ?? datum?.[valueDataKey] ?? 0);
    const x = xCategories[p.value?.[0] ?? 0] ?? "";
    const y = yCategories[p.value?.[1] ?? 0] ?? "";
    const item = config[valueDataKey];
    const label = typeof item?.label === "string" ? item.label : valueDataKey;
    const valueText = slot.valueFormatter?.(value) ?? value.toLocaleString();
    const body = tooltipRow({
      indicatorHtml: tooltipIndicatorHtml(valueDataKey, item ? getColorsCount(item) : 1),
      labelText: label,
      valueText,
      dimmed: "",
    });
    return tooltipShell({
      label: [y, x].filter(Boolean).join(" · "),
      body,
      roundness: slot.roundness,
      variant: slot.variant,
    });
  };
}

function buildVisualMap(params: {
  cells: CellsSlot;
  legend: LegendSlot;
  palette: string[];
  range: { min: number; max: number };
  tokens: ResolvedColors["tokens"];
}): VisualMapComponentOption {
  const { cells, legend, palette, range, tokens } = params;
  const isVertical = legend.orient === "vertical";
  const verticalSide = legend.align === "center" ? "right" : legend.align;
  const shared = {
    show: legend.present,
    min: range.min,
    max: range.max,
    dimension: 2,
    seriesIndex: 0,
    orient: legend.orient,
    ...(isVertical
      ? {
          left: verticalSide,
          top:
            legend.verticalAlign === "top"
              ? 8
              : legend.verticalAlign === "middle"
                ? "middle"
                : undefined,
          bottom: legend.verticalAlign === "bottom" ? 8 : undefined,
        }
      : { left: legend.align, bottom: 0 }),
    textStyle: { color: tokens.mutedForeground, fontSize: 10 },
    inRange: { color: palette },
    outOfRange: { color: withAlpha(tokens.foreground, 0.08) },
  };

  if (cells.variant === "blocks") {
    return {
      ...shared,
      type: "piecewise",
      splitNumber: cells.levels,
      selectedMode: false,
      itemWidth: 13,
      itemHeight: 9,
      itemGap: 4,
      formatter: legend.valueFormatter
        ? (min: unknown, max: unknown) =>
            `${legend.valueFormatter?.(Number(min))}–${legend.valueFormatter?.(Number(max))}`
        : undefined,
    };
  }

  return {
    ...shared,
    type: "continuous",
    calculable: legend.calculable,
    realtime: legend.realtime,
    itemWidth: 10,
    itemHeight: 120,
    text: [
      legend.maxLabel ?? legend.valueFormatter?.(range.max) ?? range.max.toLocaleString(),
      legend.minLabel ?? legend.valueFormatter?.(range.min) ?? range.min.toLocaleString(),
    ],
    textGap: 8,
  };
}

function loadingOption(
  columns: number,
  rows: number,
  tokens: ResolvedColors["tokens"],
): EChartsOption {
  const x = Array.from({ length: columns }, (_, i) => String(i));
  const y = Array.from({ length: rows }, (_, i) => String(i));
  const data = y.flatMap((_, yi) => x.map((__, xi) => [xi, yi, (xi * 3 + yi * 2) % 5]));
  return {
    animation: false,
    grid: { left: 8, right: 8, top: 8, bottom: 8 },
    xAxis: { type: "category", data: x, show: false },
    yAxis: { type: "category", data: y, show: false },
    visualMap: {
      show: false,
      min: 0,
      max: 4,
      inRange: { color: [withAlpha(tokens.foreground, 0.05), withAlpha(tokens.foreground, 0.16)] },
    },
    tooltip: { show: false },
    series: [{ type: "heatmap", data, silent: true, itemStyle: { borderColor: tokens.background, borderWidth: 3, borderRadius: 2 } }],
  };
}

type LiveState = {
  resolved: ResolvedColors | null;
  repush: () => void;
  click: {
    data: Record<string, unknown>[];
    xDataKey: string;
    yDataKey: string;
    valueDataKey: string;
    enabled: boolean;
    callback?: (cell: HeatmapCell<Record<string, unknown>>) => void;
  };
};

export function Heatmap<TData extends Record<string, unknown>>({
  data,
  config,
  xDataKey,
  yDataKey,
  valueDataKey,
  className,
  min,
  max,
  animation = true,
  isLoading = false,
  loadingColumns = 7,
  loadingRows = 5,
  ariaLabel,
  onCellClick,
  chartOptions,
  children,
}: HeatmapProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const collected = collectConfig(children);
  const { cells, xAxis, yAxis, grid: showGrid, tooltip, legend } = collected;
  const xCategories = useMemo(() => uniqueValues(data, xDataKey), [data, xDataKey]);
  const yCategories = useMemo(() => uniqueValues(data, yDataKey), [data, yDataKey]);
  const seriesData = useMemo(() => {
    const xIndex = new Map(xCategories.map((value, index) => [value, index]));
    const yIndex = new Map(yCategories.map((value, index) => [value, index]));

    return data.map((row) => [
      xIndex.get(String(row[xDataKey])) ?? 0,
      yIndex.get(String(row[yDataKey])) ?? 0,
      Number(row[valueDataKey]) || 0,
    ]);
  }, [data, xDataKey, yDataKey, valueDataKey, xCategories, yCategories]);
  const isDense = seriesData.length >= 3000;
  const range = useMemo(() => valueRange(data, valueDataKey, min, max), [data, valueDataKey, min, max]);
  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);
  const defaultAriaLabel = `Heatmap of ${String(config[valueDataKey]?.label ?? valueDataKey)} by ${yDataKey} and ${xDataKey}`;

  const liveRef = useRef<LiveState>({
    resolved: null,
    repush: () => {},
    click: {
      data,
      xDataKey,
      yDataKey,
      valueDataKey,
      enabled: false,
      callback: onCellClick as LiveState["click"]["callback"],
    },
  });

  const buildOption = useCallback((): EChartsOption => {
    const resolved = liveRef.current.resolved;
    if (!resolved) return {};
    if (isLoading) return loadingOption(loadingColumns, loadingRows, resolved.tokens);

    const palette = heatPalette(resolved, valueDataKey);
    const hasVerticalLegend = legend.present && legend.orient === "vertical";
    const legendOnLeft = hasVerticalLegend && legend.align === "left";
    const legendOnRight = hasVerticalLegend && legend.align !== "left";
    const chartGrid: GridComponentOption = {
      left: legendOnLeft ? 96 : xAxis.present && !xAxis.hide ? 52 : 8,
      right: legendOnRight ? 72 : 8,
      top: 8,
      bottom: hasVerticalLegend
        ? xAxis.present && !xAxis.hide
          ? 34
          : 8
        : legend.present
        ? cells.variant === "blocks"
          ? 76
          : 58
        : xAxis.present && !xAxis.hide
          ? 34
          : 8,
      show: showGrid,
      borderWidth: showGrid ? 1 : 0,
      borderColor: withAlpha(resolved.tokens.border, 0.7),
      backgroundColor: withAlpha(resolved.tokens.foreground, 0.015),
    };

    return {
      animation: animation && !shouldReduceMotion && !isDense,
      animationDuration: 480,
      animationDelay: (index: number) => Math.min(index * 10, 240),
      grid: chartGrid,
      xAxis: buildAxis(xCategories, xAxis, resolved.tokens, "x") as XAxisOption,
      yAxis: buildAxis(yCategories, yAxis, resolved.tokens, "y", yAxis.inverse) as YAxisOption,
      visualMap: buildVisualMap({ cells, legend, palette, range, tokens: resolved.tokens }),
      tooltip: {
        show: tooltip.present,
        trigger: "item",
        confine: true,
        backgroundColor: "transparent",
        borderWidth: 0,
        padding: 0,
        extraCssText: "box-shadow:none;",
        showDelay: isDense ? 24 : 0,
        transitionDuration: 0,
        position: resolveTooltipPosition(tooltip.position),
        formatter: createTooltipFormatter({
          data,
          config,
          valueDataKey,
          xCategories,
          yCategories,
          slot: tooltip,
        }),
      },
      series: [
        {
          id: valueDataKey,
          name:
            typeof config[valueDataKey]?.label === "string"
              ? (config[valueDataKey]?.label as string)
              : valueDataKey,
          type: "heatmap",
          data: seriesData,
          silent: !tooltip.present && !cells.isClickable,
          cursor: cells.isClickable ? "pointer" : "default",
          itemStyle: {
            borderColor: resolved.tokens.background,
            borderWidth: cells.gap,
            borderRadius: cells.radius,
          },
          progressive: cells.progressive ?? (isDense ? 1000 : undefined),
          progressiveThreshold: cells.progressiveThreshold ?? (isDense ? 3000 : undefined),
          label: {
            show: cells.showValues,
            color: resolved.tokens.foreground,
            fontSize: 10,
            formatter: (params: unknown) => {
              const value = Number((params as { value?: unknown[] }).value?.[2] ?? 0);
              return cells.valueFormatter?.(value) ?? value.toLocaleString();
            },
          },
          emphasis: isDense
            ? { disabled: true }
            : {
                itemStyle: {
                  borderColor: resolved.tokens.foreground,
                  borderWidth: Math.max(cells.gap, 1),
                  shadowBlur: 5,
                  shadowColor: withAlpha(resolved.tokens.foreground, 0.14),
                },
              },
        },
      ],
    };
  }, [
    isLoading,
    loadingColumns,
    loadingRows,
    data,
    config,
    valueDataKey,
    xCategories,
    yCategories,
    seriesData,
    isDense,
    range,
    cells,
    xAxis,
    yAxis,
    showGrid,
    tooltip,
    legend,
    animation,
    shouldReduceMotion,
  ]);

  useEffect(() => {
    liveRef.current.click = {
      data,
      xDataKey,
      yDataKey,
      valueDataKey,
      enabled: cells.isClickable,
      callback: onCellClick as LiveState["click"]["callback"],
    };
  }, [data, xDataKey, yDataKey, valueDataKey, cells.isClickable, onCellClick]);

  useEffect(() => {
    const mount = mountRef.current;
    const container = containerRef.current;
    if (!mount || !container) return;
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
    chart.on("click", (params) => {
      const current = liveRef.current.click;
      if (!current.enabled || !current.callback) return;
      const p = params as { dataIndex?: number };
      const index = p.dataIndex ?? -1;
      const datum = current.data[index];
      if (!datum) return;
      current.callback({
        x: String(datum[current.xDataKey]),
        y: String(datum[current.yDataKey]),
        value: Number(datum[current.valueDataKey]) || 0,
        datum,
        index,
      });
    });
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
    liveRef.current.resolved = resolveColors(container, config, [valueDataKey]);
    const push = () => {
      const option = buildOption();
      const merged = chartOptions ? { ...option, ...chartOptions } : option;
      chart.setOption(merged as EChartsOption, { notMerge: true });
    };
    push();
    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, [valueDataKey]);
      push();
    };
    if (!isLoading && tooltip.present && tooltip.defaultIndex != null && data.length) {
      const dataIndex = Math.min(Math.max(tooltip.defaultIndex, 0), data.length - 1);
      chart.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex });
    }
  }, [buildOption, chartOptions, config, valueDataKey, isLoading, tooltip.present, tooltip.defaultIndex, data.length]);

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
      role="img"
      aria-label={ariaLabel ?? defaultAriaLabel}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="relative min-h-0 w-full flex-1">
        <div ref={mountRef} className="h-full min-h-0 w-full" />
      </div>
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-primary bg-background flex items-center justify-center gap-2 rounded-md border px-2 py-0.5 text-sm"
          >
            <div className="border-border border-t-primary h-3 w-3 animate-spin rounded-full border" />
            <span>Loading</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}

Heatmap.Cells = Cells;
Heatmap.XAxis = XAxis;
Heatmap.YAxis = YAxis;
Heatmap.Grid = Grid;
Heatmap.Tooltip = Tooltip;
Heatmap.Legend = Legend;
