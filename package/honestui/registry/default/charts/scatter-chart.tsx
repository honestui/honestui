"use client";

import {
  buildChartCss,
  getColorsCount,
  resolveColors,
  withAlpha,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/default/ui/charts/chart";
import { LegendOverlay, type LegendVariant } from "@/registry/default/ui/charts/legend";
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
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type ReactNode,
} from "react";
import {
  GridComponent,
  MarkAreaComponent,
  TooltipComponent,
  type GridComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { ScatterChart as ScatterChartModule, type ScatterSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type {
  ChartConfig,
  LegendVariant,
  TooltipPosition,
  TooltipRoundness,
  TooltipVariant,
};

echarts.use([
  ScatterChartModule,
  GridComponent,
  MarkAreaComponent,
  TooltipComponent,
  CanvasRenderer,
]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = ComposeOption<
  ScatterSeriesOption | GridComponentOption | TooltipComponentOption
>;
type ArrayItem<T> = T extends readonly (infer U)[] ? U : T;
type XAxisOption = ArrayItem<NonNullable<EChartsOption["xAxis"]>>;
type YAxisOption = ArrayItem<NonNullable<EChartsOption["yAxis"]>>;

const GRAY = "rgba(120, 120, 120, 1)";
const SELECTION_DIM = 0.2;

export type ScatterVariant = "standard" | "bubble";
export type ScatterSymbol =
  | "circle"
  | "rect"
  | "roundRect"
  | "triangle"
  | "diamond"
  | "pin"
  | "arrow";

export type ScatterPoint<TData extends Record<string, unknown>> = {
  x: number;
  y: number;
  size?: number;
  seriesKey: string;
  datum: TData;
  index: number;
};

export interface ScatterChartProps<TData extends Record<string, unknown>> {
  data: TData[];
  config: ChartConfig;
  xDataKey: keyof TData & string;
  yDataKey: keyof TData & string;
  groupDataKey?: keyof TData & string;
  pointNameDataKey?: keyof TData & string;
  className?: string;
  animation?: boolean;
  defaultSelectedDataKey?: string | null;
  onSelectionChange?: (key: string | null) => void;
  onPointClick?: (point: ScatterPoint<TData>) => void;
  isLoading?: boolean;
  loadingPoints?: number;
  ariaLabel?: string;
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

export interface ScatterProps {
  dataKey: string;
  variant?: ScatterVariant;
  sizeDataKey?: string;
  symbol?: ScatterSymbol;
  symbolSize?: number;
  minSize?: number;
  maxSize?: number;
  fillOpacity?: number;
  isClickable?: boolean;
  large?: boolean;
  largeThreshold?: number;
}

const Scatter: FC<ScatterProps> = () => null;
Scatter.displayName = "ScatterChart.Scatter";

export interface AxisProps {
  tickFormatter?: (value: number, index: number) => string;
  label?: string;
  hideDots?: boolean;
  min?: number;
  max?: number;
}

const XAxis: FC<AxisProps> = () => null;
XAxis.displayName = "ScatterChart.XAxis";

const YAxis: FC<AxisProps> = () => null;
YAxis.displayName = "ScatterChart.YAxis";

const Grid: FC = () => null;
Grid.displayName = "ScatterChart.Grid";

export type QuadrantLabels = {
  topLeft?: string;
  topRight?: string;
  bottomLeft?: string;
  bottomRight?: string;
};

export interface QuadrantsProps {
  xSplit: number;
  ySplit: number;
  labels?: QuadrantLabels;
  showLabels?: boolean;
}

const Quadrants: FC<QuadrantsProps> = () => null;
Quadrants.displayName = "ScatterChart.Quadrants";

export interface TooltipProps {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  position?: TooltipPosition;
  xValueFormatter?: (value: number) => string;
  yValueFormatter?: (value: number) => string;
  sizeValueFormatter?: (value: number) => string;
  defaultIndex?: number;
}

const Tooltip: FC<TooltipProps> = () => null;
Tooltip.displayName = "ScatterChart.Tooltip";

export interface LegendProps {
  variant?: LegendVariant;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  isClickable?: boolean;
}

const Legend: FC<LegendProps> = () => null;
Legend.displayName = "ScatterChart.Legend";

type ScatterSlot = Required<
  Pick<
    ScatterProps,
    | "dataKey"
    | "variant"
    | "symbol"
    | "symbolSize"
    | "minSize"
    | "maxSize"
    | "fillOpacity"
    | "isClickable"
    | "large"
    | "largeThreshold"
  >
> &
  Pick<ScatterProps, "sizeDataKey">;
type AxisSlot = AxisProps & { present: boolean };
type QuadrantsSlot = QuadrantsProps & { present: boolean; showLabels: boolean };
type TooltipSlot = Required<Pick<TooltipProps, "variant" | "roundness" | "position">> &
  Omit<TooltipProps, "variant" | "roundness" | "position"> & { present: boolean };
type LegendSlot = Required<
  Pick<LegendProps, "variant" | "align" | "verticalAlign" | "isClickable">
> & { present: boolean };

function matchesSlot(type: unknown, slot: unknown, name: string) {
  if (type === slot) return true;
  if (typeof type !== "function") return false;
  const candidate = (type as FC).displayName ?? type.name;
  return candidate === name || candidate === `ScatterChart.${name}`;
}

function collectConfig(children: ReactNode) {
  const scatters: ScatterSlot[] = [];
  let xAxis: AxisSlot = { present: false };
  let yAxis: AxisSlot = { present: false };
  let grid = false;
  let quadrants: QuadrantsSlot = {
    present: false,
    xSplit: 0,
    ySplit: 0,
    showLabels: true,
  };
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
    position: "variable",
  };
  let legend: LegendSlot = {
    present: false,
    variant: "circle",
    align: "center",
    verticalAlign: "bottom",
    isClickable: false,
  };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (matchesSlot(child.type, Scatter, "Scatter")) {
      const props = child.props as ScatterProps;
      scatters.push({
        dataKey: props.dataKey,
        variant: props.variant ?? "standard",
        sizeDataKey: props.sizeDataKey,
        symbol: props.symbol ?? "circle",
        symbolSize: props.symbolSize ?? 10,
        minSize: props.minSize ?? 8,
        maxSize: props.maxSize ?? 44,
        fillOpacity: props.fillOpacity ?? 0.78,
        isClickable: props.isClickable ?? false,
        large: props.large ?? false,
        largeThreshold: props.largeThreshold ?? 2000,
      });
    } else if (matchesSlot(child.type, XAxis, "XAxis")) {
      xAxis = { present: true, ...(child.props as AxisProps) };
    } else if (matchesSlot(child.type, YAxis, "YAxis")) {
      yAxis = { present: true, ...(child.props as AxisProps) };
    } else if (matchesSlot(child.type, Grid, "Grid")) {
      grid = true;
    } else if (matchesSlot(child.type, Quadrants, "Quadrants")) {
      const props = child.props as QuadrantsProps;
      quadrants = { present: true, showLabels: props.showLabels ?? true, ...props };
    } else if (matchesSlot(child.type, Tooltip, "Tooltip")) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        position: props.position ?? "variable",
        xValueFormatter: props.xValueFormatter,
        yValueFormatter: props.yValueFormatter,
        sizeValueFormatter: props.sizeValueFormatter,
        defaultIndex: props.defaultIndex,
      };
    } else if (matchesSlot(child.type, Legend, "Legend")) {
      const props = child.props as LegendProps;
      legend = {
        present: true,
        variant: props.variant ?? "circle",
        align: props.align ?? "center",
        verticalAlign: props.verticalAlign ?? "bottom",
        isClickable: props.isClickable ?? false,
      };
    }
  });

  return { scatters, xAxis, yAxis, grid, quadrants, tooltip, legend };
}

function finiteNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function extent(values: number[]) {
  if (!values.length) return { min: 0, max: 1 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return { min: min - 1, max: max + 1 };
  const pad = (max - min) * 0.06;
  return { min: min - pad, max: max + pad };
}

function scaleBubble(value: number, values: number[], minSize: number, maxSize: number) {
  if (!values.length) return (minSize + maxSize) / 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return (minSize + maxSize) / 2;
  const ratio = Math.sqrt(Math.max(0, value - min) / (max - min));
  return minSize + ratio * (maxSize - minSize);
}

function scatterPaint(slots: string[], opacity: number, bubble: boolean) {
  const colors = slots.length ? slots : [GRAY];
  if (colors.length === 1) return withAlpha(colors[0], opacity);
  if (!bubble) return withAlpha(colors[colors.length - 1], opacity);
  return new echarts.graphic.RadialGradient(0.38, 0.32, 0.78, [
    { offset: 0, color: withAlpha(colors[0], Math.min(1, opacity + 0.16)) },
    { offset: 1, color: withAlpha(colors[colors.length - 1], opacity) },
  ]);
}

function buildMarkArea(params: {
  slot: QuadrantsSlot;
  xRange: { min: number; max: number };
  yRange: { min: number; max: number };
  base: string;
  tokens: ResolvedColors["tokens"];
}): ScatterSeriesOption["markArea"] {
  const { slot, xRange, yRange, base, tokens } = params;
  if (!slot.present) return undefined;
  const labels = slot.labels ?? {};
  const areas = [
    [labels.topLeft, xRange.min, slot.xSplit, slot.ySplit, yRange.max, 0.035],
    [labels.topRight, slot.xSplit, xRange.max, slot.ySplit, yRange.max, 0.065],
    [labels.bottomLeft, xRange.min, slot.xSplit, yRange.min, slot.ySplit, 0.018],
    [labels.bottomRight, slot.xSplit, xRange.max, yRange.min, slot.ySplit, 0.045],
  ] as const;

  return {
    silent: true,
    animation: false,
    label: {
      show: slot.showLabels,
      position: "insideTopLeft",
      color: tokens.mutedForeground,
      fontSize: 10,
      padding: [4, 3],
    },
    data: areas.map(([name, x1, x2, y1, y2, alpha]) => [
      {
        name: name ?? "",
        xAxis: x1,
        yAxis: y1,
        itemStyle: {
          color: withAlpha(base, alpha),
          borderColor: withAlpha(tokens.border, 0.72),
          borderWidth: 1,
        },
      },
      { xAxis: x2, yAxis: y2 },
    ]),
  } as ScatterSeriesOption["markArea"];
}

function createTooltipFormatter(params: {
  data: Record<string, unknown>[];
  config: ChartConfig;
  xDataKey: string;
  yDataKey: string;
  pointNameDataKey?: string;
  scatters: ScatterSlot[];
  slot: TooltipSlot;
  selectedDataKey: string | null;
}) {
  const { data, config, xDataKey, yDataKey, pointNameDataKey, scatters, slot, selectedDataKey } =
    params;
  return (raw: unknown) => {
    const p = raw as {
      seriesId?: string;
      seriesName?: string;
      value?: unknown[];
      dataIndex?: number;
    };
    const key = p.seriesId ?? p.seriesName ?? "";
    const scatter = scatters.find((item) => item.dataKey === key);
    const values = p.value ?? [];
    const index = finiteNumber(values[3] ?? p.dataIndex);
    const datum = data[index];
    const x = finiteNumber(values[0] ?? datum?.[xDataKey]);
    const y = finiteNumber(values[1] ?? datum?.[yDataKey]);
    const size = scatter?.sizeDataKey
      ? finiteNumber(values[2] ?? datum?.[scatter.sizeDataKey])
      : undefined;
    const item = config[key];
    const colorsCount = item ? getColorsCount(item) : 1;
    const dimmed = selectedDataKey != null && selectedDataKey !== key ? " opacity-30" : "";
    const xLabel = String(config[xDataKey]?.label ?? xDataKey);
    const yLabel = String(config[yDataKey]?.label ?? yDataKey);
    const rows = [
      tooltipRow({
        indicatorHtml: tooltipIndicatorHtml(key, colorsCount),
        labelText: xLabel,
        valueText: slot.xValueFormatter?.(x) ?? x.toLocaleString(),
        dimmed,
      }),
      tooltipRow({
        indicatorHtml: '<div class="h-2.5 w-2.5 shrink-0"></div>',
        labelText: yLabel,
        valueText: slot.yValueFormatter?.(y) ?? y.toLocaleString(),
        dimmed,
      }),
    ];
    if (size != null && scatter?.sizeDataKey) {
      rows.push(
        tooltipRow({
          indicatorHtml: '<div class="h-2.5 w-2.5 shrink-0"></div>',
          labelText: String(config[scatter.sizeDataKey]?.label ?? scatter.sizeDataKey),
          valueText: slot.sizeValueFormatter?.(size) ?? size.toLocaleString(),
          dimmed,
        }),
      );
    }
    const seriesLabel = typeof item?.label === "string" ? item.label : p.seriesName;
    const pointLabel = pointNameDataKey ? String(datum?.[pointNameDataKey] ?? "") : "";

    return tooltipShell({
      label: [pointLabel, seriesLabel].filter(Boolean).join(" · "),
      body: rows.join(""),
      roundness: slot.roundness,
      variant: slot.variant,
    });
  };
}

function loadingOption(count: number, tokens: ResolvedColors["tokens"]): EChartsOption {
  const data = Array.from({ length: count }, (_, index) => [
    12 + ((index * 23) % 76),
    14 + ((index * 31) % 72),
  ]);
  return {
    animation: false,
    grid: { left: 8, right: 8, top: 8, bottom: 8 },
    xAxis: { type: "value", show: false, min: 0, max: 100 },
    yAxis: { type: "value", show: false, min: 0, max: 100 },
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "scatter",
        data,
        silent: true,
        symbolSize: (value: unknown) => 8 + ((finiteNumber((value as unknown[])[0]) * 7) % 18),
        itemStyle: {
          color: withAlpha(tokens.foreground, 0.08),
          borderColor: withAlpha(tokens.foreground, 0.2),
          borderWidth: 1,
        },
      },
    ],
  };
}

type LiveState = {
  resolved: ResolvedColors | null;
  repush: () => void;
  clickability: Map<string, boolean>;
  click: {
    data: Record<string, unknown>[];
    xDataKey: string;
    yDataKey: string;
    scatters: ScatterSlot[];
    callback?: (point: ScatterPoint<Record<string, unknown>>) => void;
  };
};

export function ScatterChart<TData extends Record<string, unknown>>({
  data,
  config,
  xDataKey,
  yDataKey,
  groupDataKey,
  pointNameDataKey,
  className,
  animation = true,
  defaultSelectedDataKey = null,
  onSelectionChange,
  onPointClick,
  isLoading = false,
  loadingPoints = 14,
  ariaLabel,
  chartOptions,
  children,
}: ScatterChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);
  const { scatters, xAxis, yAxis, grid: showGrid, quadrants, tooltip, legend } = useMemo(
    () => collectConfig(children),
    [children],
  );
  const seriesKeys = useMemo(() => scatters.map((scatter) => scatter.dataKey), [scatters]);
  const xRange = useMemo(
    () => extent(data.map((row) => Number(row[xDataKey])).filter(Number.isFinite)),
    [data, xDataKey],
  );
  const yRange = useMemo(
    () => extent(data.map((row) => Number(row[yDataKey])).filter(Number.isFinite)),
    [data, yDataKey],
  );
  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);
  const defaultAriaLabel = `Scatter chart comparing ${String(
    config[yDataKey]?.label ?? yDataKey,
  )} and ${String(config[xDataKey]?.label ?? xDataKey)}`;

  const liveRef = useRef<LiveState>({
    resolved: null,
    repush: () => {},
    clickability: new Map(),
    click: {
      data,
      xDataKey,
      yDataKey,
      scatters,
      callback: onPointClick as LiveState["click"]["callback"],
    },
  });

  useEffect(() => {
    liveRef.current.clickability = new Map(
      scatters.map((scatter) => [scatter.dataKey, scatter.isClickable]),
    );
    liveRef.current.click = {
      data,
      xDataKey,
      yDataKey,
      scatters,
      callback: onPointClick as LiveState["click"]["callback"],
    };
  }, [data, onPointClick, scatters, xDataKey, yDataKey]);

  const toggleSelection = useCallback(
    (key: string) => {
      setSelectedDataKey((current) => {
        const next = current === key ? null : key;
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange],
  );

  const buildOption = useCallback((): EChartsOption => {
    const resolved = liveRef.current.resolved;
    if (!resolved) return {};
    if (isLoading) return loadingOption(loadingPoints, resolved.tokens);

    const legendTop = legend.present && legend.verticalAlign === "top";
    const legendBottom = legend.present && legend.verticalAlign === "bottom";
    const splitColor = withAlpha(resolved.tokens.border, 0.8);
    const xBounds = { min: xAxis.min ?? xRange.min, max: xAxis.max ?? xRange.max };
    const yBounds = { min: yAxis.min ?? yRange.min, max: yAxis.max ?? yRange.max };
    const chartGrid: GridComponentOption = {
      left: 8,
      right: 8,
      top: legendTop ? 42 : 16,
      bottom: legendBottom ? 42 : 12,
      containLabel: true,
    };
    const buildAxis = (slot: AxisSlot, bounds: { min: number; max: number }): XAxisOption => ({
      type: "value",
      scale: true,
      min: bounds.min,
      max: bounds.max,
      name: slot.label,
      nameLocation: "middle",
      nameGap: 34,
      nameTextStyle: { color: resolved.tokens.mutedForeground, fontSize: 10 },
      axisLine: { show: false },
      axisTick: {
        show: slot.present && !slot.hideDots,
        length: 2,
        lineStyle: { color: splitColor, width: 2, cap: "round" },
      },
      axisLabel: {
        show: slot.present,
        color: resolved.tokens.mutedForeground,
        fontSize: 10,
        margin: 8,
        formatter: slot.tickFormatter,
      },
      splitLine: {
        show: showGrid,
        lineStyle: { color: splitColor, type: [3, 3], width: 1 },
      },
    });

    return {
      animation: animation && !shouldReduceMotion,
      animationDuration: 520,
      animationDelay: (index: number) => Math.min(index * 12, 260),
      grid: chartGrid,
      xAxis: buildAxis(xAxis, xBounds),
      yAxis: buildAxis(yAxis, yBounds) as YAxisOption,
      tooltip: {
        show: tooltip.present,
        trigger: "item",
        confine: true,
        backgroundColor: "transparent",
        borderWidth: 0,
        padding: 0,
        extraCssText: "box-shadow:none;",
        transitionDuration: 0,
        position: resolveTooltipPosition(tooltip.position),
        formatter: createTooltipFormatter({
          data,
          config,
          xDataKey,
          yDataKey,
          pointNameDataKey,
          scatters,
          slot: tooltip,
          selectedDataKey,
        }),
      },
      series: scatters.map((scatter, seriesIndex) => {
        const filtered = data
          .map((datum, index) => ({ datum, index }))
          .filter(({ datum }) =>
            groupDataKey ? String(datum[groupDataKey]) === scatter.dataKey : true,
          );
        const sizeValues = scatter.sizeDataKey
          ? filtered.map(({ datum }) => finiteNumber(datum[scatter.sizeDataKey as string]))
          : [];
        const colors = resolved.series[scatter.dataKey] ?? [GRAY];
        const base = colors[colors.length - 1] ?? GRAY;
        const selected = selectedDataKey == null || selectedDataKey === scatter.dataKey;
        const seriesData = filtered.map(({ datum, index }) => [
          finiteNumber(datum[xDataKey]),
          finiteNumber(datum[yDataKey]),
          scatter.sizeDataKey ? finiteNumber(datum[scatter.sizeDataKey]) : scatter.symbolSize,
          index,
        ]);

        return {
          id: scatter.dataKey,
          name:
            typeof config[scatter.dataKey]?.label === "string"
              ? (config[scatter.dataKey]?.label as string)
              : scatter.dataKey,
          type: "scatter" as const,
          data: seriesData,
          symbol: scatter.symbol,
          symbolSize: (value: unknown) =>
            scatter.variant === "bubble"
              ? scaleBubble(
                  finiteNumber((value as unknown[])[2]),
                  sizeValues,
                  scatter.minSize,
                  scatter.maxSize,
                )
              : scatter.symbolSize,
          silent: !tooltip.present && !scatter.isClickable,
          cursor: scatter.isClickable ? "pointer" : "default",
          large: scatter.large,
          largeThreshold: scatter.largeThreshold,
          itemStyle: {
            color: scatterPaint(colors, scatter.fillOpacity, scatter.variant === "bubble"),
            borderColor: base,
            borderWidth: scatter.variant === "bubble" ? 1.25 : 1,
            opacity: selected ? 1 : SELECTION_DIM,
          },
          emphasis: {
            disabled: !scatter.isClickable,
            scale: 1.18,
            itemStyle: {
              borderColor: resolved.tokens.foreground,
              borderWidth: 2,
              shadowBlur: 8,
              shadowColor: withAlpha(resolved.tokens.foreground, 0.18),
            },
          },
          markArea:
            seriesIndex === 0
              ? buildMarkArea({
                  slot: quadrants,
                  xRange: xBounds,
                  yRange: yBounds,
                  base,
                  tokens: resolved.tokens,
                })
              : undefined,
        };
      }),
    };
  }, [
    animation,
    config,
    data,
    groupDataKey,
    isLoading,
    legend,
    loadingPoints,
    pointNameDataKey,
    quadrants,
    scatters,
    selectedDataKey,
    shouldReduceMotion,
    showGrid,
    tooltip,
    xAxis,
    xDataKey,
    xRange,
    yAxis,
    yDataKey,
    yRange,
  ]);

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
      const p = params as { seriesId?: string; value?: unknown[]; dataIndex?: number };
      const key = String(p.seriesId ?? "");
      const current = liveRef.current;
      if (current.clickability.get(key)) toggleSelection(key);
      if (!current.click.callback) return;
      const index = finiteNumber(p.value?.[3] ?? p.dataIndex);
      const datum = current.click.data[index];
      const scatter = current.click.scatters.find((item) => item.dataKey === key);
      if (!datum || !scatter) return;
      current.click.callback({
        x: finiteNumber(datum[current.click.xDataKey]),
        y: finiteNumber(datum[current.click.yDataKey]),
        size: scatter.sizeDataKey ? finiteNumber(datum[scatter.sizeDataKey]) : undefined,
        seriesKey: key,
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
  }, [toggleSelection]);

  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;
    liveRef.current.resolved = resolveColors(container, config, seriesKeys);
    const push = () => {
      const option = buildOption();
      chart.setOption((chartOptions ? { ...option, ...chartOptions } : option) as EChartsOption, {
        notMerge: true,
      });
    };
    push();
    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, seriesKeys);
      push();
    };
  }, [buildOption, chartOptions, config, seriesKeys]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || isLoading || !tooltip.present || tooltip.defaultIndex == null || !data.length)
      return;
    const timer = setTimeout(() => {
      chart.dispatchAction({
        type: "showTip",
        seriesIndex: 0,
        dataIndex: Math.min(Math.max(tooltip.defaultIndex ?? 0, 0), data.length - 1),
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [data.length, isLoading, tooltip.defaultIndex, tooltip.present]);

  const legendStyle: CSSProperties = {
    position: "absolute",
    left: 16,
    right: 16,
    pointerEvents: "auto",
    ...(legend.verticalAlign === "top"
      ? { top: 12 }
      : legend.verticalAlign === "bottom"
        ? { bottom: 12 }
        : { top: "50%", transform: "translateY(-50%)" }),
  };

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
      aria-busy={isLoading}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        className="relative min-h-0 w-full flex-1"
        role="img"
        aria-label={ariaLabel ?? defaultAriaLabel}
      >
        <div ref={mountRef} className="h-full min-h-0 w-full" />
      </div>

      {legend.present && !isLoading && (
        <LegendOverlay
          seriesKeys={seriesKeys}
          config={config}
          variant={legend.variant}
          align={legend.align}
          verticalAlign={legend.verticalAlign}
          selectedKey={selectedDataKey}
          hoveredKey={null}
          isClickable={legend.isClickable}
          onToggle={toggleSelection}
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

ScatterChart.Scatter = Scatter;
ScatterChart.XAxis = XAxis;
ScatterChart.YAxis = YAxis;
ScatterChart.Grid = Grid;
ScatterChart.Quadrants = Quadrants;
ScatterChart.Tooltip = Tooltip;
ScatterChart.Legend = Legend;
