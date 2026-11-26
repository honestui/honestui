"use client";

import {
  escapeHtml,
  tooltipBaseOption,
  tooltipIndicatorHtml,
  tooltipRow,
  tooltipShell,
  type TooltipPosition,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/default/ui/charts/tooltip";
import {
  Brush,
  buildBrushDataZoom,
  syncBrushOverlay,
  type BrushGeometry,
  type BrushOverlayElements,
  type BrushProps,
  type BrushRange,
} from "@/registry/default/ui/charts/brush";
import {
  DataZoomComponent,
  GridComponent,
  TooltipComponent,
  type DataZoomComponentOption,
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
  useState,
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
import {
  BarChart as BarChartModule,
  CandlestickChart as CandlestickChartModule,
  LineChart as LineChartModule,
  type BarSeriesOption,
  type CandlestickSeriesOption,
  type LineSeriesOption,
} from "echarts/charts";
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
import {
  buildInsideZoom,
  collectZoom,
  isZoomed,
  useZoomWheelGuard,
  Zoom,
  ZOOM_RESET_CLASS,
  type ZoomSlot,
} from "@/registry/default/ui/charts/zoom";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type { ChartConfig, TooltipPosition, TooltipRoundness, TooltipVariant };

echarts.use([
  CandlestickChartModule,
  BarChartModule,
  LineChartModule,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = ComposeOption<
  | CandlestickSeriesOption
  | BarSeriesOption
  | LineSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | DataZoomComponentOption
>;
type ArrayItem<T> = T extends readonly (infer U)[] ? U : T;
type XAxisOption = ArrayItem<NonNullable<EChartsOption["xAxis"]>>;
type YAxisOption = ArrayItem<NonNullable<EChartsOption["yAxis"]>>;

const GRAY = "rgba(120, 120, 120, 1)";
const POINTER_STROKE_WIDTH = 0.8;
const REVEAL_DURATION = 500;
const VOLUME_OPACITY = 0.32;
const BRUSH_STROKE_OPACITY = 0.5;
const LOADING_CANDLES = 24;

/** Config keys the chart reads its rising and falling colors from. */
export const CANDLESTICK_KEYS = ["up", "down"] as const;

export type CandleVariant = "filled" | "hollow";

export interface CandlestickChartProps<TData extends Record<string, unknown>> {
  /** One row per period, oldest first. */
  data: TData[];
  /** Labels and colors for `up` (close above open) and `down`. */
  config: ChartConfig;
  /** The period field shown on the x-axis. */
  xDataKey: keyof TData & string;
  openDataKey?: keyof TData & string;
  highDataKey?: keyof TData & string;
  lowDataKey?: keyof TData & string;
  closeDataKey?: keyof TData & string;
  /** Adds volume bars along the bottom of the plot. */
  volumeDataKey?: keyof TData & string;
  className?: string;
  animation?: boolean;
  isLoading?: boolean;
  /** Charts that share a `syncId` show their crosshair and tooltip at the same period. */
  syncId?: string;
  ariaLabel?: string;
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

export interface CandlesProps {
  /** `filled` fills every body; `hollow` leaves rising bodies open. */
  variant?: CandleVariant;
  /** Body width as a share of each period, from 0 to 1. */
  width?: number;
  /** Widest a body may grow, in pixels. */
  maxWidth?: number;
}

const Candles: FC<CandlesProps> = () => null;
Candles.displayName = "CandlestickChart.Candles";

export interface VolumeProps {
  /** Share of the plot height the tallest volume bar may reach. */
  height?: number;
}

const Volume: FC<VolumeProps> = () => null;
Volume.displayName = "CandlestickChart.Volume";

export interface CandlestickXAxisProps {
  tickFormatter?: (value: string, index: number) => string;
  label?: string;
  hideDots?: boolean;
}

const XAxis: FC<CandlestickXAxisProps> = () => null;
XAxis.displayName = "CandlestickChart.XAxis";

export interface CandlestickYAxisProps {
  tickFormatter?: (value: number, index: number) => string;
  label?: string;
  hideDots?: boolean;
  /** Price scales usually sit on the right. */
  position?: "left" | "right";
}

const YAxis: FC<CandlestickYAxisProps> = () => null;
YAxis.displayName = "CandlestickChart.YAxis";

const Grid: FC = () => null;
Grid.displayName = "CandlestickChart.Grid";

export interface CandlestickTooltipProps {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  position?: TooltipPosition;
  /** Draws the dashed crosshair with value labels on both axes. */
  crosshair?: boolean;
  defaultIndex?: number;
  valueFormatter?: (value: number) => string;
  volumeFormatter?: (value: number) => string;
  /** Formats the period shown as the tooltip title. Defaults to the XAxis `tickFormatter`. */
  labelFormatter?: (label: string) => string;
}

const Tooltip: FC<CandlestickTooltipProps> = () => null;
Tooltip.displayName = "CandlestickChart.Tooltip";

type Collected = {
  candles: Required<CandlesProps>;
  volume: { present: boolean; height: number };
  xAxis: { present: boolean } & CandlestickXAxisProps;
  yAxis: { present: boolean } & CandlestickYAxisProps;
  showGrid: boolean;
  tooltip: { present: boolean; crosshair: boolean } & Required<
    Pick<CandlestickTooltipProps, "variant" | "roundness" | "position">
  > &
    Pick<
      CandlestickTooltipProps,
      "defaultIndex" | "valueFormatter" | "volumeFormatter" | "labelFormatter"
    >;
  brush: { present: boolean } & BrushProps;
};

function collectConfig(children: ReactNode): Collected {
  const c: Collected = {
    candles: { variant: "filled", width: 0.6, maxWidth: 14 },
    volume: { present: false, height: 0.2 },
    xAxis: { present: false },
    yAxis: { present: false },
    showGrid: false,
    tooltip: {
      present: false,
      crosshair: true,
      variant: "default",
      roundness: "lg",
      position: "variable",
    },
    brush: { present: false },
  };
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Candles) {
      const p = child.props as CandlesProps;
      c.candles = {
        variant: p.variant ?? "filled",
        width: Math.min(Math.max(p.width ?? 0.6, 0.05), 1),
        maxWidth: p.maxWidth ?? 14,
      };
    } else if (child.type === Volume) {
      const p = child.props as VolumeProps;
      c.volume = { present: true, height: Math.min(Math.max(p.height ?? 0.2, 0.05), 0.6) };
    } else if (child.type === XAxis) {
      c.xAxis = { present: true, ...(child.props as CandlestickXAxisProps) };
    } else if (child.type === YAxis) {
      c.yAxis = { present: true, ...(child.props as CandlestickYAxisProps) };
    } else if (child.type === Grid) {
      c.showGrid = true;
    } else if (child.type === Tooltip) {
      const p = child.props as CandlestickTooltipProps;
      c.tooltip = {
        present: true,
        crosshair: p.crosshair ?? true,
        variant: p.variant ?? "default",
        roundness: p.roundness ?? "lg",
        position: p.position ?? "variable",
        defaultIndex: p.defaultIndex,
        valueFormatter: p.valueFormatter,
        volumeFormatter: p.volumeFormatter,
        labelFormatter: p.labelFormatter,
      };
    } else if (child.type === Brush) {
      c.brush = { present: true, ...(child.props as BrushProps) };
    }
  });
  return c;
}

/** One normalized period. */
export type Candle = {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
};

function loadingCandles(): Candle[] {
  let close = 100;
  return Array.from({ length: LOADING_CANDLES }, (_, i) => {
    const open = close;
    close = open + Math.sin(i * 1.3) * 3 + Math.cos(i * 0.4) * 2;
    return {
      label: String(i),
      open,
      close,
      high: Math.max(open, close) + 1.5,
      low: Math.min(open, close) - 1.5,
      volume: 40 + Math.abs(Math.sin(i * 0.7)) * 60,
    };
  });
}

type BuildContext = {
  candles: Candle[];
  config: ChartConfig;
  collected: Collected;
  resolved: ResolvedColors;
  isLoading: boolean;
  hasVolume: boolean;
  showBrush: boolean;
  brushHeight: number;
  brushRange: BrushRange;
  references: ReferenceSlots | null;
  zoom: ZoomSlot;
};

function buildLayout(ctx: BuildContext) {
  const brushGap = ctx.showBrush ? ctx.brushHeight + 30 + (ctx.collected.xAxis.label ? 22 : 0) : 0;
  const grid: GridComponentOption = { left: 8, right: 8, top: 16, bottom: 8 + brushGap };
  return { grid, brushBottom: 6 };
}

function buildOption(ctx: BuildContext): EChartsOption {
  const { candles, collected, resolved, isLoading, hasVolume, config } = ctx;
  const { tokens } = resolved;
  const labelColor = tokens.mutedForeground;
  const tickDot = flattenColor(tokens.border, tokens.background);
  const up = isLoading ? withAlpha(tokens.foreground, 0.16) : (resolved.series.up?.[0] ?? GRAY);
  const down = isLoading ? withAlpha(tokens.foreground, 0.08) : (resolved.series.down?.[0] ?? GRAY);
  const hollow = collected.candles.variant === "hollow" && !isLoading;
  const format = collected.tooltip.valueFormatter ?? ((v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 }));
  const formatVolume =
    collected.tooltip.volumeFormatter ??
    ((v: number) => v.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 }));
  const xFormat = collected.xAxis.tickFormatter;
  const yFormat = collected.yAxis.tickFormatter;
  const volumeShare = collected.volume.height;
  const { grid, brushBottom } = buildLayout(ctx);

  const xAxis: XAxisOption = {
    type: "category",
    boundaryGap: true,
    data: candles.map((c) => c.label),
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
      hideOverlap: true,
      formatter: xFormat ? (value: string, index: number) => xFormat(value, index) : undefined,
    },
    axisPointer: {
      label: {
        formatter: (p: { value: unknown }) => {
          const value = String(p.value ?? "");
          const index = candles.findIndex((c) => c.label === value);
          return xFormat ? xFormat(value, index) : value;
        },
      },
    },
  };

  // Written by the axis `min` callback during layout, before labels format.
  const priceFloor = { value: -Infinity };
  const priceAxis: YAxisOption = {
    type: "value",
    position: collected.yAxis.position ?? "right",
    scale: true,
    show: collected.yAxis.present || collected.showGrid,
    // Padding is a share of the visible span, so it follows the zoomed
    // window. With volume, the lower bound drops so the tallest volume bar
    // never reaches the lowest wick, and the price floor is kept so labels
    // inside the volume zone can be hidden.
    boundaryGap: [0.04, 0.04],
    min: hasVolume
      ? (extent: { min: number; max: number }) => {
          const span = Math.max(extent.max - extent.min, Math.abs(extent.max) * 0.01, 1e-6);
          priceFloor.value = extent.min - span * 0.04;
          return priceFloor.value - (span * volumeShare) / (1 - volumeShare);
        }
      : undefined,
    name: isLoading ? undefined : collected.yAxis.label,
    nameLocation: "middle",
    nameGap: 44,
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
      formatter: (value: number, index: number) =>
        hasVolume && value < priceFloor.value
          ? ""
          : yFormat
            ? yFormat(value, index)
            : value.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    },
    axisPointer: {
      label: { formatter: (p: { value: unknown }) => format(Number(p.value)) },
    },
  };

  const maxVolume = Math.max(1, ...candles.map((c) => c.volume ?? 0));
  const volumeAxis: YAxisOption = {
    type: "value",
    show: false,
    min: 0,
    // The tallest bar fills `volumeShare` of the plot.
    max: maxVolume / volumeShare,
    axisPointer: { show: false },
  };

  const candleSeries: CandlestickSeriesOption = {
    id: "candles",
    name: "Price",
    type: "candlestick",
    data: candles.map((c) => [c.open, c.close, c.low, c.high]),
    barWidth: `${Math.round(collected.candles.width * 100)}%`,
    barMaxWidth: collected.candles.maxWidth,
    silent: isLoading,
    z: 3,
    itemStyle: {
      color: hollow ? tokens.background : up,
      color0: down,
      borderColor: up,
      borderColor0: down,
      borderColorDoji: tokens.mutedForeground,
      borderWidth: 1,
    },
    emphasis: { itemStyle: { borderWidth: 1.5 } },
    animationDuration: REVEAL_DURATION,
    animationEasing: "cubicOut",
  };

  const volumeSeries: BarSeriesOption | null = hasVolume
    ? {
        id: "volume",
        name: "Volume",
        type: "bar",
        yAxisIndex: 1,
        data: candles.map((c) => ({
          value: c.volume ?? 0,
          itemStyle: { color: withAlpha(c.close >= c.open ? up : down, isLoading ? 1 : VOLUME_OPACITY) },
        })),
        barWidth: `${Math.round(collected.candles.width * 100)}%`,
        barMaxWidth: collected.candles.maxWidth,
        silent: true,
        z: 1,
        itemStyle: { borderRadius: [1, 1, 0, 0] },
        emphasis: { disabled: true },
        animationDuration: REVEAL_DURATION,
      }
    : null;

  const tooltipSlot = collected.tooltip;
  const pointerLine = { color: tokens.border, width: POINTER_STROKE_WIDTH, type: [3, 3] as [number, number] };
  const tooltip: TooltipComponentOption = {
    ...tooltipBaseOption({
      present: tooltipSlot.present && !isLoading,
      cursor: true,
      tokens,
      position: tooltipSlot.position,
      axisPointerColor: tokens.border,
      strokeWidth: POINTER_STROKE_WIDTH,
    }),
    axisPointer: tooltipSlot.crosshair
      ? {
          type: "cross",
          lineStyle: pointerLine,
          crossStyle: pointerLine,
          label: {
            show: true,
            backgroundColor: tokens.foreground,
            color: tokens.background,
            fontSize: 10,
            padding: [3, 6],
            borderRadius: 4,
            shadowBlur: 0,
          },
        }
      : { type: "line", lineStyle: pointerLine },
    formatter: (params: unknown) => {
      const rows = (Array.isArray(params) ? params : [params]) as { dataIndex?: number }[];
      const index = rows.find((p) => typeof p.dataIndex === "number")?.dataIndex;
      const candle = index == null ? undefined : candles[index];
      if (!candle) return "";
      const kind = candle.close >= candle.open ? "up" : "down";
      const item = config[kind];
      const change = candle.close - candle.open;
      const pct = candle.open ? (change / candle.open) * 100 : 0;
      const sign = change > 0 ? "+" : change < 0 ? "−" : "";
      const spacer = '<div class="h-2.5 w-2.5 shrink-0"></div>';
      const row = (label: string, value: string, indicatorHtml = spacer) =>
        tooltipRow({ indicatorHtml, labelText: escapeHtml(label), valueText: value, dimmed: "" });
      const labelFormat = collected.tooltip.labelFormatter;
      const label = labelFormat
        ? labelFormat(candle.label)
        : xFormat
          ? xFormat(candle.label, index ?? 0)
          : candle.label;
      const body = [
        row(
          typeof item?.label === "string" ? item.label : kind === "up" ? "Up" : "Down",
          `${sign}${format(Math.abs(change))} (${sign}${Math.abs(pct).toFixed(2)}%)`,
          tooltipIndicatorHtml(kind, item ? getColorsCount(item) : 1),
        ),
        row("Open", format(candle.open)),
        row("High", format(candle.high)),
        row("Low", format(candle.low)),
        row("Close", format(candle.close)),
        hasVolume && candle.volume != null ? row("Volume", formatVolume(candle.volume)) : "",
      ].join("");
      return tooltipShell({
        label: escapeHtml(label),
        body,
        roundness: tooltipSlot.roundness,
        variant: tooltipSlot.variant,
      });
    },
  };

  const series: (CandlestickSeriesOption | BarSeriesOption | LineSeriesOption)[] = [candleSeries];
  if (volumeSeries) series.push(volumeSeries);
  const yAxes: YAxisOption[] = hasVolume ? [priceAxis, volumeAxis] : [priceAxis];

  const reference = isLoading
    ? null
    : buildReferenceSeries({ refs: ctx.references, resolved, valueAxes: { x: false, y: true } });
  if (reference) series.push(reference);
  // Zoom shares the brush's window: it replaces the brush's own inside zoom,
  // or stands alone without a brush.
  const insideZoom = ctx.zoom.present
    ? buildInsideZoom({ zoom: ctx.zoom, range: ctx.brushRange, filterMode: "filter" })
    : null;

  if (!ctx.showBrush) {
    return {
      grid,
      xAxis,
      yAxis: yAxes,
      tooltip,
      series,
      ...(insideZoom ? { dataZoom: [insideZoom] } : {}),
    };
  }

  const miniGrid: GridComponentOption = {
    left: 8,
    right: 8,
    bottom: brushBottom,
    height: ctx.brushHeight,
    outerBoundsMode: "none",
  };
  series.push({
    id: "__mini",
    type: "line",
    xAxisIndex: 1,
    yAxisIndex: yAxes.length,
    data: candles.map((c) => c.close),
    silent: true,
    showSymbol: false,
    tooltip: { show: false },
    lineStyle: { color: withAlpha(up, BRUSH_STROKE_OPACITY), width: 1 },
    areaStyle: { color: withAlpha(up, 0.08) },
    emphasis: { disabled: true },
    animation: false,
  });
  const dataZoom: DataZoomComponentOption[] = buildBrushDataZoom({
    brushBottom,
    brushHeight: ctx.brushHeight,
    brushRange: ctx.brushRange,
    fillerColor: withAlpha(tokens.foreground, 0),
  }).map((zoom) => ({ ...zoom, filterMode: "filter" }));
  if (insideZoom) dataZoom[1] = insideZoom;

  return {
    grid: [grid, miniGrid],
    xAxis: [
      xAxis,
      { type: "category", gridIndex: 1, show: false, boundaryGap: true, data: candles.map((c) => c.label), axisPointer: { show: false } },
    ],
    yAxis: [...yAxes, { type: "value", gridIndex: 1, show: false, scale: true }],
    tooltip,
    dataZoom,
    series,
  };
}

type LiveState = {
  resolved: ResolvedColors | null;
  hasRevealed: boolean;
  labels: string[];
  brushRange: BrushRange;
  brushGeom: BrushGeometry | null;
  brushOverlay: BrushOverlayElements | null;
  brushHover: { inside: boolean; left: boolean; right: boolean };
  handlers: {
    onBrushChange?: (range: { startIndex: number; endIndex: number }) => void;
    onZoomChange?: (range: { startIndex: number; endIndex: number }) => void;
    brushFormatLabel?: (value: string, index: number) => string;
  };
  repush: () => void;
};

export function CandlestickChart<TData extends Record<string, unknown>>({
  data,
  config,
  xDataKey,
  openDataKey = "open" as keyof TData & string,
  highDataKey = "high" as keyof TData & string,
  lowDataKey = "low" as keyof TData & string,
  closeDataKey = "close" as keyof TData & string,
  volumeDataKey,
  className,
  animation = true,
  isLoading = false,
  syncId,
  ariaLabel,
  chartOptions,
  children,
}: CandlestickChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const liveRef = useRef<LiveState>({
    resolved: null,
    hasRevealed: false,
    labels: [],
    brushRange: { start: 0, end: 100 },
    brushGeom: null,
    brushOverlay: null,
    brushHover: { inside: false, left: false, right: false },
    handlers: {},
    repush: () => {},
  });

  const collected = useMemo(() => collectConfig(children), [children]);
  const references = useMemo(() => collectReferences(children), [children]);
  const zoomSlot = useMemo(() => collectZoom(children), [children]);
  useZoomWheelGuard(containerRef, zoomSlot);
  const [zoomed, setZoomed] = useState(false);
  const candles = useMemo<Candle[]>(() => {
    if (isLoading) return loadingCandles();
    return data.map((row) => {
      const volume = volumeDataKey ? Number(row[volumeDataKey]) : NaN;
      return {
        label: String(row[xDataKey] ?? ""),
        open: Number(row[openDataKey]),
        high: Number(row[highDataKey]),
        low: Number(row[lowDataKey]),
        close: Number(row[closeDataKey]),
        volume: Number.isFinite(volume) ? volume : null,
      };
    });
  }, [data, isLoading, xDataKey, openDataKey, highDataKey, lowDataKey, closeDataKey, volumeDataKey]);
  const hasVolume = collected.volume.present && (isLoading || !!volumeDataKey);
  const showBrush = collected.brush.present && !isLoading;
  const brushHeight = collected.brush.height ?? 56;
  const keys = useMemo(
    () => [...CANDLESTICK_KEYS, ...referenceColorKeys(references, config)],
    [references, config],
  );
  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  useEffect(() => {
    liveRef.current.handlers = {
      onBrushChange: collected.brush.onChange,
      onZoomChange: zoomSlot.onChange,
      brushFormatLabel: collected.brush.formatLabel,
    };
  });

  const syncBrushNow = useCallback(() => {
    const chart = echartsRef.current;
    if (!chart) return;
    const live = liveRef.current;
    const tokens = live.resolved?.tokens;
    if (!live.brushGeom || !tokens) {
      syncBrushOverlay(chart, live, null);
      return;
    }
    const last = Math.max(live.labels.length - 1, 0);
    const startIndex = Math.round((live.brushRange.start / 100) * last);
    const endIndex = Math.round((live.brushRange.end / 100) * last);
    const format = live.handlers.brushFormatLabel;
    syncBrushOverlay(chart, live, {
      range: live.brushRange,
      geom: live.brushGeom,
      size: { width: chart.getWidth(), height: chart.getHeight() },
      tokens,
      labels: format
        ? {
            start: format(live.labels[startIndex] ?? "", startIndex),
            end: format(live.labels[endIndex] ?? "", endIndex),
          }
        : null,
      showLabels: live.brushHover.inside,
      hover: live.brushHover,
    });
  }, []);

  const makeOption = useCallback((): EChartsOption => {
    const resolved = liveRef.current.resolved;
    if (!resolved) return {};
    liveRef.current.labels = candles.map((c) => c.label);
    const ctx: BuildContext = {
      candles,
      config,
      collected,
      resolved,
      isLoading,
      hasVolume,
      showBrush,
      brushHeight,
      brushRange: liveRef.current.brushRange,
      references,
      zoom: isLoading ? { ...zoomSlot, present: false } : zoomSlot,
    };
    liveRef.current.brushGeom = showBrush ? { bottom: buildLayout(ctx).brushBottom, height: brushHeight } : null;
    return buildOption(ctx);
  }, [candles, config, collected, isLoading, hasVolume, showBrush, brushHeight, references, zoomSlot]);

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

    chart.on("datazoom", () => {
      const option = chart.getOption() as { dataZoom?: { start?: number; end?: number }[] };
      const zoom = option.dataZoom?.[0];
      if (!zoom) return;
      liveRef.current.brushRange = { start: zoom.start ?? 0, end: zoom.end ?? 100 };
      setZoomed(isZoomed(liveRef.current.brushRange));
      syncBrushNow();
      const { onBrushChange, onZoomChange } = liveRef.current.handlers;
      if (!onBrushChange && !onZoomChange) return;
      const last = Math.max(liveRef.current.labels.length - 1, 0);
      const range = {
        startIndex: Math.round(((zoom.start ?? 0) / 100) * last),
        endIndex: Math.round(((zoom.end ?? 100) / 100) * last),
      };
      onBrushChange?.(range);
      onZoomChange?.(range);
    });

    const onDoubleClick = () => {
      if (!isZoomed(liveRef.current.brushRange)) return;
      chart.dispatchAction({ type: "dataZoom", start: 0, end: 100 });
    };
    chart.getZr().on("dblclick", onDoubleClick);

    const leaveSync = syncId
      ? joinChartSync({
          syncId,
          chart,
          categories: () => liveRef.current.labels,
          categoryAxis: () => "x",
        })
      : null;

    const zr = chart.getZr();
    const onMove = (event: { offsetX?: number; offsetY?: number }) => {
      const geom = liveRef.current.brushGeom;
      if (!geom) return;
      const x = event.offsetX ?? -1;
      const y = event.offsetY ?? -1;
      const top = chart.getHeight() - geom.bottom - geom.height;
      const inside = y >= top - 4 && y <= top + geom.height + 4;
      const width = Math.max(chart.getWidth() - 16, 1);
      const { start, end } = liveRef.current.brushRange;
      const next = {
        inside,
        left: inside && Math.abs(x - (8 + (width * start) / 100)) <= 8,
        right: inside && Math.abs(x - (8 + (width * end) / 100)) <= 8,
      };
      const prev = liveRef.current.brushHover;
      if (prev.inside === next.inside && prev.left === next.left && prev.right === next.right) return;
      liveRef.current.brushHover = next;
      syncBrushNow();
    };
    const onOut = () => {
      liveRef.current.brushHover = { inside: false, left: false, right: false };
      syncBrushNow();
    };
    zr.on("mousemove", onMove);
    zr.on("globalout", onOut);

    return () => {
      leaveSync?.();
      zr.off("dblclick", onDoubleClick);
      zr.off("mousemove", onMove);
      zr.off("globalout", onOut);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart.dispose();
      echartsRef.current = null;
      live.brushOverlay = null;
      live.hasRevealed = false;
    };
  }, [syncBrushNow, syncId]);

  useEffect(() => {
    const chart = echartsRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;
    const push = (withEntrance: boolean) => {
      const option = makeOption();
      const merged = withChartFont(chartOptions ? { ...option, ...chartOptions } : option, container);
      Object.assign(merged, { animation: withEntrance, animationDurationUpdate: 0 });
      chart.setOption(merged as EChartsOption, { notMerge: true });
      syncBrushNow();
    };
    liveRef.current.resolved = resolveColors(container, config, keys);
    if (isLoading) liveRef.current.hasRevealed = false;
    const reveal = !liveRef.current.hasRevealed && !isLoading;
    if (reveal) liveRef.current.hasRevealed = true;
    // Hundreds of candles animate poorly, so dense series appear at once.
    push(animation && reveal && !shouldReduceMotion && candles.length <= 400);
    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, keys);
      push(false);
    };
  }, [makeOption, chartOptions, config, keys, isLoading, animation, shouldReduceMotion, candles.length, syncBrushNow]);

  const tooltipSlot = collected.tooltip;
  useEffect(() => {
    const chart = echartsRef.current;
    const index = tooltipSlot.defaultIndex;
    if (!chart || isLoading || !tooltipSlot.present || index == null) return;
    const timer = setTimeout(() => {
      chart.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: index });
    }, 300);
    return () => clearTimeout(timer);
  }, [tooltipSlot.present, tooltipSlot.defaultIndex, isLoading, candles.length]);

  const first = candles[0];
  const last = candles[candles.length - 1];
  const defaultAriaLabel =
    !isLoading && first && last
      ? `Candlestick chart of ${candles.length} periods from ${first.label} to ${last.label}. Opened at ${first.open.toLocaleString()}, closed at ${last.close.toLocaleString()}, high ${Math.max(...candles.map((c) => c.high)).toLocaleString()}, low ${Math.min(...candles.map((c) => c.low)).toLocaleString()}.`
      : "Candlestick chart.";

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
      {zoomSlot.present && zoomSlot.showReset && zoomed && !isLoading && (
        <button
          type="button"
          className={ZOOM_RESET_CLASS}
          style={{ left: 16, top: 12 }}
          onClick={() => echartsRef.current?.dispatchAction({ type: "dataZoom", start: 0, end: 100 })}
        >
          Reset zoom
        </button>
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

CandlestickChart.Candles = Candles;
CandlestickChart.Volume = Volume;
CandlestickChart.XAxis = XAxis;
CandlestickChart.YAxis = YAxis;
CandlestickChart.Grid = Grid;
CandlestickChart.Tooltip = Tooltip;
CandlestickChart.Brush = Brush;
CandlestickChart.Zoom = Zoom;
CandlestickChart.ReferenceLine = ReferenceLine;
CandlestickChart.ReferenceArea = ReferenceArea;
CandlestickChart.ReferenceDot = ReferenceDot;
