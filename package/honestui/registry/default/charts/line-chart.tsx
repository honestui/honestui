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
  buildChartCss,
  flattenColor,
  normalizeColor,
  getColorsCount,
  resolveColors,
  seriesPaint,
  withAlpha,
  type ChartConfig,
  type ResolvedColors,
  withChartFont,
} from "@/registry/default/ui/charts/chart";
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
  dotItemStyle,
  dotStyle,
  sampleGradient,
  type DotItemStyleOption,
  type DotVariant,
} from "@/registry/default/ui/charts/dot";
import {
  collectDataQuality,
  dataQualityAriaSummary,
  dataQualityKeys,
  DataStatusKey,
  noValueHtml,
  isQualityRunId,
  missingMarkerSeries,
  qualityRunId,
  qualitySeriesOwner,
  rangeWhiskerSeries,
  reportDataQualityIssues,
  runFocusPatch,
  resolveDataStatusText,
  runValues,
  summarizeDataQuality,
  statusDetailText,
  statusNotesHtml,
  STROKE_DASH,
  strokeRuns,
  type DataQualityKeys,
  type DataStatus,
  type DataStatusText,
  type PointQuality,
  type ResolvedDataStatusText,
} from "@/registry/default/ui/charts/data-quality";
import { LegendOverlay, type LegendVariant } from "@/registry/default/ui/charts/legend";
import {
  applyPartialPeriod,
  axisBreakSeries,
  axisTruncation,
  Band,
  bandSeries,
  bandSeriesId,
  collectHonesty,
  fillMissingRows,
  fitDomain,
  formatCount,
  gapRegionSeries,
  gapSpans,
  HonestyKeyItems,
  honestyNotesHtml,
  isLowSample,
  PartialPeriod,
  partialPeriodSeries,
  readBand,
  readSampleSizes,
  readValue,
  resolveHonestyText,
  resolvePartialPeriod,
  sampleSizeSeries,
  type BandRun,
  type ChartHonestyText,
  type GapSpan,
  type GapsOption,
  type HonestyKeyEntry,
  type HonestyNote,
  type ResolvedChartHonestyText,
  type SampleSizeDisplay,
} from "@/registry/default/ui/charts/honesty";
import {
  buildReferenceSeries,
  collectReferences,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  referenceColorKeys,
} from "@/registry/default/ui/charts/reference";
import {
  COMPARE_DASH,
  COMPARE_OPACITY,
  compareLabel,
  compareSeriesId,
  compareValues,
  comparisonDetailHtml,
  readCompareValue,
} from "@/registry/default/ui/charts/comparison";
import { joinChartSync } from "@/registry/default/ui/charts/sync";
import {
  buildInsideZoom,
  collectZoom,
  isZoomed,
  Zoom,
  useZoomWheelGuard,
  ZOOM_RESET_CLASS,
} from "@/registry/default/ui/charts/zoom";
import {
  CustomChart,
  LineChart as LineChartModule,
  type CustomSeriesOption,
  type LineSeriesOption,
} from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type {
  ChartConfig,
  ChartHonestyText,
  GapsOption,
  SampleSizeDisplay,
  DotVariant,
  LegendVariant,
  TooltipPosition,
  TooltipRoundness,
  TooltipVariant,
};

echarts.use([LineChartModule, CustomChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;

type EChartsOption = ComposeOption<
  LineSeriesOption | CustomSeriesOption | GridComponentOption | TooltipComponentOption | DataZoomComponentOption
>;

type ArrayItem<T> = T extends readonly (infer U)[] ? U : T;
type XAxisOption = ArrayItem<NonNullable<EChartsOption["xAxis"]>>;
type YAxisOption = ArrayItem<NonNullable<EChartsOption["yAxis"]>>;

const STROKE_WIDTH = 0.8; 
const LOADING_ANIMATION_DURATION = 2000; 
const REVEAL_DURATION = 1000; 

const LOADING_DEFAULT_POINTS = 14;

const BUFFER_DASH: [number, number] = [4, 3];

const GLOW_LAYERS: { width: number; opacity: number; blur: number; symbolPad: number }[] = [
  { width: 2, opacity: 0.9, blur: 5, symbolPad: 2 },
  { width: 2, opacity: 0.6, blur: 12, symbolPad: 6 },
  { width: 2, opacity: 0.38, blur: 24, symbolPad: 11 },
  { width: 2, opacity: 0.22, blur: 42, symbolPad: 16 },
];

const GRID_LINE_OPACITY = 1; 
const AXIS_POINTER_OPACITY = 1; 

const LOADING_STROKE_OPACITY = 0.5; 
const LOADING_SHIMMER_BAND = 0.2; 
const LOADING_SHIMMER_FEATHER = 0.2; 
const BRUSH_STROKE_OPACITY = 0.5; 
const BRUSH_FILLER_OPACITY = 0; 

export type StrokeVariant = "solid" | "dashed" | "animated-dashed";
export type LineAnimationType =
  | "none"
  | "left-to-right"
  | "right-to-left"
  | "center-out"
  | "edges-in";
export type CurveType =
  | "linear"
  | "smooth"
  | "bump"
  | "monotone"
  | "monotoneX"
  | "monotoneY"
  | "natural"
  | "step";

export interface LineChartProps<TData extends Record<string, unknown>> {
  data: TData[]; 
  config: ChartConfig; 
  xDataKey?: keyof TData & string; 
  className?: string; 
  curveType?: CurveType; 
  animation?: boolean; 
  animationType?: LineAnimationType; 
  enableHoverHighlight?: boolean; 
  enableHoverReveal?: boolean; 
  defaultSelectedDataKey?: string | null; 
  onSelectionChange?: (key: string | null) => void; 
  isLoading?: boolean; 
  loadingPoints?: number; 
  ariaLabel?: string;
  dataStatusText?: DataStatusText; 
  /** Rewords the partial-period, interval, gap, axis, and sample-size text. */
  honestyText?: ChartHonestyText;
  /**
   * Shade stretches where no series has a value. With an `interval`, rows
   * absent from a time series are found and shown as gaps too.
   */
  gaps?: GapsOption;
  /** Charts with the same id show their crosshair and tooltip together. */
  syncId?: string;
  chartOptions?: Record<string, unknown>; 
  children?: ReactNode; 
}

export interface LineProps {
  dataKey: string; 
  strokeVariant?: StrokeVariant; 
  strokeWidth?: number; 
  curveType?: CurveType; 
  animationType?: LineAnimationType; 
  connectNulls?: boolean; 
  isClickable?: boolean; 
  glowing?: boolean; 
  enableBufferLine?: boolean; 
  statusKey?: string; 
  lowerKey?: string; 
  upperKey?: string; 
  /** A data key holding the same measure for an earlier period, drawn as a ghost line. */
  compareDataKey?: string;
  /** The row field with the number of observations behind each value. */
  sampleSizeKey?: string;
  /** Values with fewer observations are ringed and named in the key. */
  minSampleSize?: number;
  /** `label` writes n above the points; `tooltip` keeps it in the tooltip. Defaults to `label`. */
  sampleSizeDisplay?: SampleSizeDisplay;
  children?: ReactNode; 
}

const Line: FC<LineProps> = () => null;

export interface DotProps {
  variant?: DotVariant; 
}

const Dot: FC<DotProps> = () => null;

const ActiveDot: FC<DotProps> = () => null;

export interface XAxisProps {
  dataKey?: string; 

  tickFormatter?: (value: string, index: number) => string; 
  label?: string; 
  hideDots?: boolean; 
}

const XAxis: FC<XAxisProps> = () => null;

export interface YAxisProps {
  dataKey?: string; 
  tickFormatter?: (value: number, index: number) => string; 
  label?: string; 
  hideDots?: boolean; 
  /** The axis start. `"auto"` fits the data instead of starting at zero. Defaults to zero. */
  min?: number | "auto";
  /** The axis end. Defaults to a rounded value above the data. */
  max?: number;
  /** When the axis does not reach zero, mark the break and say where it starts. Defaults to `auto`. */
  truncationNotice?: "auto" | "off";
}

const YAxis: FC<YAxisProps> = () => null;

const Grid: FC = () => null;

export interface TooltipProps {
  variant?: TooltipVariant; 
  roundness?: TooltipRoundness; 
  cursor?: boolean; 
  position?: TooltipPosition; 
}

const Tooltip: FC<TooltipProps> = () => null;

export interface LegendProps {
  variant?: LegendVariant; 
  align?: "left" | "center" | "right"; 
  verticalAlign?: "top" | "middle" | "bottom"; 
  isClickable?: boolean; 
}

const Legend: FC<LegendProps> = () => null;

type LineSeriesConfig = {
  dataKey: string;
  strokeVariant: StrokeVariant;
  strokeWidth: number;
  curveType?: CurveType;
  animationType?: LineAnimationType;
  connectNulls: boolean;
  isClickable: boolean;
  glowing: boolean;
  enableBufferLine: boolean;
  quality: DataQualityKeys | null;
  dotVariant: DotVariant; 
  activeDotVariant: DotVariant; 
  compareDataKey?: string;
  sampleSizeKey?: string;
  minSampleSize?: number;
  sampleSizeDisplay: SampleSizeDisplay;
};

type XAxisSlot = {
  present: boolean;
  dataKey?: string;
  tickFormatter?: (value: string, index: number) => string;
  label?: string;
  hideDots: boolean;
};
type YAxisSlot = {
  present: boolean;
  dataKey?: string;
  tickFormatter?: (value: number, index: number) => string;
  label?: string;
  hideDots: boolean;
  min?: number | "auto";
  max?: number;
  truncationNotice: "auto" | "off";
};
type TooltipSlot = {
  present: boolean;
  variant: TooltipVariant;
  roundness: TooltipRoundness;
  cursor: boolean;
  position: TooltipPosition;
};
type LegendSlot = {
  present: boolean;
  variant: LegendVariant;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  isClickable: boolean;
};
type BrushSlot = {
  present: boolean; 
  height?: number;
  formatLabel?: (value: string, index: number) => string;
  onChange?: (range: { startIndex: number; endIndex: number }) => void;
};

type CollectedConfig = {
  lines: LineSeriesConfig[];
  xAxis: XAxisSlot;
  yAxis: YAxisSlot;
  showGrid: boolean;
  tooltip: TooltipSlot;
  legend: LegendSlot;
  brush: BrushSlot;
};

function collectConfig(children: ReactNode): CollectedConfig {
  const lines: LineSeriesConfig[] = [];
  let xAxis: XAxisSlot = { present: false, hideDots: false };
  let yAxis: YAxisSlot = { present: false, hideDots: false, truncationNotice: "auto" };
  let showGrid = false;
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
    cursor: true,
    position: "variable",
  };
  let legend: LegendSlot = {
    present: false,
    variant: "rounded-square",
    align: "right",
    verticalAlign: "top",
    isClickable: false,
  };
  let brush: BrushSlot = { present: false };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = child.type;

    if (type === Line) {
      const props = child.props as LineProps;
      let dotVariant: DotVariant = "none";
      let activeDotVariant: DotVariant = "none";
      Children.forEach(props.children, (dotChild) => {
        if (!isValidElement(dotChild)) return;
        if (dotChild.type === Dot) {
          dotVariant = (dotChild.props as DotProps).variant ?? "default";
        } else if (dotChild.type === ActiveDot) {
          activeDotVariant = (dotChild.props as DotProps).variant ?? "default";
        }
      });
      lines.push({
        dataKey: props.dataKey,

        strokeVariant: props.strokeVariant ?? "solid",
        strokeWidth: props.strokeWidth ?? STROKE_WIDTH,
        curveType: props.curveType,
        animationType: props.animationType,
        connectNulls: props.connectNulls ?? false,
        isClickable: props.isClickable ?? false,
        glowing: props.glowing ?? false,
        enableBufferLine: props.enableBufferLine ?? false,
        quality: dataQualityKeys(props),
        dotVariant,
        activeDotVariant,
        compareDataKey: props.compareDataKey,
        sampleSizeKey: props.sampleSizeKey,
        minSampleSize: props.minSampleSize,
        sampleSizeDisplay: props.sampleSizeDisplay ?? "label",
      });
    } else if (type === XAxis) {
      const props = child.props as XAxisProps;
      xAxis = {
        present: true,
        dataKey: props.dataKey,
        tickFormatter: props.tickFormatter,
        label: props.label,
        hideDots: props.hideDots ?? false,
      };
    } else if (type === YAxis) {
      const props = child.props as YAxisProps;
      yAxis = {
        present: true,
        dataKey: props.dataKey,
        tickFormatter: props.tickFormatter,
        label: props.label,
        hideDots: props.hideDots ?? false,
        min: props.min,
        max: props.max,
        truncationNotice: props.truncationNotice ?? "auto",
      };
    } else if (type === Grid) {
      showGrid = true;
    } else if (type === Tooltip) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        cursor: props.cursor ?? true,
        position: props.position ?? "variable",
      };
    } else if (type === Legend) {
      const props = child.props as LegendProps;
      legend = {
        present: true,
        variant: props.variant ?? "rounded-square",
        align: props.align ?? "right",
        verticalAlign: props.verticalAlign ?? "top",
        isClickable: props.isClickable ?? false,
      };
    } else if (type === Brush) {
      const props = child.props as BrushProps;
      brush = {
        present: true,
        height: props.height,
        formatLabel: props.formatLabel,
        onChange: props.onChange,
      };
    }
  });

  return { lines, xAxis, yAxis, showGrid, tooltip, legend, brush };
}

function buildGlowSeries(params: {
  key: string;
  paint: string | echarts.graphic.LinearGradient;
  slots: string[];
  values: (number | null)[];
  curve: { smooth: boolean; step: "middle" | false };
  connectNulls: boolean;
  z: number;
  selectionDim: number;
  dotSize: number;
}): LineSeriesOption[] {
  const { key, paint, slots, values, curve, connectNulls, z, selectionDim, dotSize } = params;
  const multiColor = slots.length > 1;
  const base = slots[0] ?? "rgba(120, 120, 120, 1)";
  const showDots = dotSize > 0;

  return GLOW_LAYERS.map((layer, i): LineSeriesOption => {
    const glowOpacity = layer.opacity * selectionDim;
    const blurOpacity = glowOpacity * 0.3;

    const glowData: LinePoint[] =
      !multiColor || !showDots
        ? values
        : values.map((value, idx): LinePoint => {
            if (value === null) return null;
            const t = values.length > 1 ? idx / (values.length - 1) : 0;
            const color = sampleGradient(slots, t);
            return {
              value,
              itemStyle: { color, opacity: glowOpacity },
              emphasis: { itemStyle: { color, opacity: glowOpacity } },
            };
          });

    return {
      id: `__glow-${i}-${key}`,
      type: "line",
      data: glowData,
      smooth: curve.smooth,
      step: curve.step,
      connectNulls,
      silent: true,
      showSymbol: showDots,
      symbol: "circle",
      symbolSize: showDots ? dotSize + layer.symbolPad : 0,
      tooltip: { show: false },
      z,
      lineStyle: {
        color: paint,
        width: layer.width,
        opacity: glowOpacity,

        shadowBlur: layer.blur,

        shadowColor: sampleGradient(slots, 0.5),
        cap: "round",
        join: "round",
      },
      itemStyle: multiColor ? { opacity: glowOpacity } : { color: base, opacity: glowOpacity },

      emphasis: {
        focus: "none",
        scale: false,
        lineStyle: { opacity: glowOpacity },
        itemStyle: { opacity: glowOpacity },
      },
      blur: { lineStyle: { opacity: blurOpacity }, itemStyle: { opacity: blurOpacity } },
    };
  });
}

function curveConfig(curveType: CurveType): { smooth: boolean; step: "middle" | false } {

  if (curveType === "step") return { smooth: false, step: "middle" };
  if (curveType === "linear") return { smooth: false, step: false };
  return { smooth: true, step: false };
}

function getOpacity(selected: string | null, key: string) {
  if (selected === null || selected === key) return { stroke: 1, dot: 1 };
  return { stroke: 0.3, dot: 0.3 };
}

function getLoadingData(points: number): number[] {
  const rows: number[] = [];
  let value = 30 + Math.random() * 20;
  for (let i = 0; i < points; i++) {
    value = Math.min(58, Math.max(16, value + (Math.random() - 0.5) * 16));
    rows.push(Math.round(value));
  }
  return rows;
}

function shimmerWindowStops(center: number, color: string, peak: number) {
  const half = LOADING_SHIMMER_BAND;
  const feather = LOADING_SHIMMER_FEATHER;

  const alphaAt = (x: number) => {
    const dist = Math.abs(x - center);
    if (dist <= half - feather) return peak;
    if (dist >= half) return 0;

    return peak * Math.sin(((1 - (dist - (half - feather)) / feather) * Math.PI) / 2);
  };

  const offsets = [
    0,
    center - half,
    center - half + feather,
    center,
    center + half - feather,
    center + half,
    1,
  ]
    .filter((x) => x >= 0 && x <= 1)
    .sort((a, b) => a - b);

  const stops: { offset: number; color: string }[] = [];
  for (const offset of offsets) {
    if (stops.length === 0 || offset - stops[stops.length - 1].offset > 1e-4) {
      stops.push({ offset, color: withAlpha(color, alphaAt(offset)) });
    }
  }
  return stops;
}

const BUFFER_PREFIX = "__buffer-";

const REVEAL_PREFIX = "__reveal-";

type ResolvedBand = {
  index: number;
  dataKey?: string;
  label: string;
  color?: string;
  bounds: ({ lower: number; upper: number } | null)[];
  runs: BandRun[];
};

type HonestyPlan = {
  text: ResolvedChartHonestyText;
  partial: { start: number; progress: number | null; label: string; note: string } | null;
  bands: ResolvedBand[];
  gaps: GapSpan[];
  gapLabel: string;
  axis: { min?: number; max?: number; truncatedAt: number | null; label: string; description: string };
  sampleSizes: Record<string, (number | null)[]>;
};

type OptionBuildContext = {
  data: Record<string, unknown>[];
  config: ChartConfig;
  lines: LineSeriesConfig[];
  curveType: CurveType;
  selectedDataKey: string | null;
  hasSelection: boolean;
  showGrid: boolean;
  xAxisSlot: XAxisSlot;
  yAxisSlot: YAxisSlot;
  tooltipSlot: TooltipSlot;
  legendSlot: LegendSlot;
  isLoading: boolean;
  loadingData: () => number[];
  showBrush: boolean;
  brushHeight: number;
  enableHoverHighlight: boolean;
  enableHoverReveal: boolean; 
  revealIndex: number | null; 
  revealSink: Record<string, unknown[]>; 
  resolved: ResolvedColors;
  quality: Record<string, PointQuality[]>; 
  /** Point quality before the partial period marked its tail provisional. */
  claimedQuality: Record<string, PointQuality[]>;
  statusText: ResolvedDataStatusText;
  honesty: HonestyPlan;
  rendererSize: { width: number; height: number }; 
  categories: string[];
  brushRange: BrushRange; 
  getHoveredKey: () => string | null; 
};

function buildChartLayout({ legendSlot, xAxisSlot, showBrush, brushHeight }: OptionBuildContext): {
  grid: GridComponentOption;
  brushBottom: number;
} {
  const legendTop = legendSlot.present && legendSlot.verticalAlign === "top";
  const legendBottom = legendSlot.present && legendSlot.verticalAlign === "bottom";

  const brushGap = showBrush ? brushHeight + 30 + (xAxisSlot.label ? 22 : 0) : 0;

  return {
    grid: {
      left: 8,
      right: 8,
      top: legendTop ? 42 : 16,
      bottom: 8 + brushGap + (legendBottom ? 34 : 0),
    },
    brushBottom: legendBottom ? 34 : 6,
  };
}

function buildMainAxes(ctx: OptionBuildContext): { xAxis: XAxisOption; yAxis: YAxisOption } {
  const { xAxisSlot, yAxisSlot, showGrid, isLoading, categories, loadingData } = ctx;
  const { tokens } = ctx.resolved;

  const axisLabelColor = tokens.mutedForeground;
  const splitLineColor = withAlpha(tokens.border, GRID_LINE_OPACITY);

  const tickDotColor = flattenColor(splitLineColor, tokens.background);

  const xTickFormatter = xAxisSlot.tickFormatter;
  const yTickFormatter = yAxisSlot.tickFormatter;

  const xAxis: XAxisOption = {
    type: "category",
    boundaryGap: false,
    show: true,
    data: isLoading ? loadingData().map((_, i) => i) : categories,

    name: isLoading ? undefined : xAxisSlot.label,
    nameLocation: "middle",
    nameGap: 30,
    nameTextStyle: { color: axisLabelColor, fontSize: 10 },
    axisLine: { show: false },

    axisTick: {
      show: !isLoading && xAxisSlot.present && !xAxisSlot.hideDots,

      alignWithLabel: true,
      length: 0.5,
      lineStyle: { color: tickDotColor, width: 3, cap: "round" },
    },
    splitLine: { show: false },
    axisLabel: {
      show: !isLoading && xAxisSlot.present,
      color: axisLabelColor,
      fontSize: 10,
      margin: 8,
      formatter: xTickFormatter
        ? (value: string, index: number) => xTickFormatter(value, index)
        : undefined,
    },
  };

  const yAxis: YAxisOption = {
    type: "value",
    show: yAxisSlot.present || showGrid,
    min: isLoading ? undefined : ctx.honesty.axis.min,
    max: isLoading ? undefined : ctx.honesty.axis.max,

    name: isLoading ? undefined : yAxisSlot.label,
    nameLocation: "middle",
    nameGap: 38,
    nameTextStyle: { color: axisLabelColor, fontSize: 10 },
    axisLine: { show: false },

    axisTick: {
      show: yAxisSlot.present && !isLoading && !yAxisSlot.hideDots,
      length: 0.5,
      lineStyle: { color: tickDotColor, width: 3, cap: "round" },
    },
    splitLine: {

      show: showGrid && !isLoading,
      lineStyle: { color: splitLineColor, type: [3, 3] as [number, number], width: 1 },
    },
    axisLabel: {

      show: yAxisSlot.present && !isLoading,
      color: axisLabelColor,
      fontSize: 10,
      margin: 8,
      formatter: yTickFormatter
        ? (value: number, index: number) => yTickFormatter(value, index)
        : undefined,
    },
  };

  return { xAxis, yAxis };
}

function createTooltipFormatter(ctx: OptionBuildContext) {
  const { config, selectedDataKey, tooltipSlot, getHoveredKey, quality, statusText, honesty } = ctx;
  const linesByKey = new Map(ctx.lines.map((line) => [line.dataKey, line]));
  const compareKeys = new Map(
    ctx.lines.flatMap((line) => (line.compareDataKey ? [[line.dataKey, line.compareDataKey]] : [])),
  );

  return (params: unknown): string => {
    const rows = Array.isArray(params) ? params : [params];
    if (!rows.length) return "";

    const first = rows[0] as { axisValue?: string | number; name?: string; dataIndex?: number };
    const rowIndex = rows
      .map((row) => (row as { dataIndex?: number }).dataIndex)
      .find((index): index is number => typeof index === "number");
    const inPartial = honesty.partial !== null && rowIndex !== undefined && rowIndex >= honesty.partial.start;
    let lowSampleMin: number | null = null;

    const axisValue = first.axisValue ?? first.name ?? "";
    const label = String(axisValue);

    const seen = new Set<string>();
    const statuses = new Set<DataStatus>();
    const body = rows
      .map((param) => {
        const p = param as {
          seriesId?: string;
          seriesName?: string;
          value?: number | string | null;
          dataIndex?: number;
        };
        const rawId = String(p.seriesId ?? "");

        const key = rawId.startsWith(BUFFER_PREFIX)
          ? rawId.slice(BUFFER_PREFIX.length)
          : rawId.startsWith("__")
            ? ""
            : (p.seriesId ?? p.seriesName ?? "");
        if (!key) return "";

        const point = typeof p.dataIndex === "number" ? quality[key]?.[p.dataIndex] : undefined;
        const hasValue = p.value !== null && p.value !== undefined && p.value !== "-";
        if (!hasValue && !point) return "";
        if (seen.has(key)) return "";
        seen.add(key);
        // A tail marked provisional only by the partial period is explained by
        // the period's own note, not again as "Provisional".
        const claimed =
          typeof p.dataIndex === "number" ? ctx.claimedQuality[key]?.[p.dataIndex] : undefined;
        const periodMarked = inPartial && point?.status === "provisional" && claimed?.status !== "provisional";
        if (point?.status && !periodMarked) statuses.add(point.status);

        const item = config[key];
        const colorsCount = item ? getColorsCount(item) : 1;
        const labelText = typeof item?.label === "string" ? item.label : (p.seriesName ?? key);
        const hovered = getHoveredKey();
        const dimmed =
          (selectedDataKey != null && selectedDataKey !== key) ||
          (hovered != null && hovered !== key)
            ? " opacity-30"
            : "";
        const value = !hasValue
          ? noValueHtml(statusText)
          : typeof p.value === "number"
            ? p.value.toLocaleString()
            : String(p.value);

        const compareKey = compareKeys.get(key);
        const row = typeof p.dataIndex === "number" ? ctx.data[p.dataIndex] : undefined;
        const comparison = compareKey
          ? comparisonDetailHtml({
              current: typeof p.value === "number" ? p.value : null,
              previous: readCompareValue(row, compareKey),
              label: compareLabel(config, compareKey),
              dimmed,
            })
          : "";

        return (
          tooltipRow({
            indicatorHtml: tooltipIndicatorHtml(key, colorsCount),
            labelText,
            valueText: value,
            dimmed,
            detailText: honestyDetail({
              base: point
                ? statusDetailText(
                    periodMarked ? { ...point, status: null } : point,
                    statusText,
                    (bound) => bound.toLocaleString(),
                  )
                : "",
              periodLabel: periodMarked && honesty.partial ? honesty.partial.label : "",
              bands: honesty.bands
                .filter((band) => band.dataKey === key)
                .flatMap((band) => {
                  const range = typeof p.dataIndex === "number" ? band.bounds[p.dataIndex] : null;
                  return range
                    ? [`${band.label} ${range.lower.toLocaleString()} – ${range.upper.toLocaleString()}`]
                    : [];
                }),
              sample: (() => {
                const n =
                  typeof p.dataIndex === "number" ? honesty.sampleSizes[key]?.[p.dataIndex] : undefined;
                if (n === undefined || n === null) return "";
                const line = linesByKey.get(key);
                if (isLowSample(n, line?.minSampleSize)) {
                  lowSampleMin = Math.max(lowSampleMin ?? 0, line?.minSampleSize ?? 0);
                }
                return honesty.text.sampleSize(formatCount(n));
              })(),
            }) || undefined,
          }) + comparison
        );
      })
      .join("");

    const looseBands = honesty.bands
      .filter((band) => !band.dataKey)
      .map((band) => {
        const range = rowIndex !== undefined ? band.bounds[rowIndex] : null;
        if (!range) return "";
        return tooltipRow({
          indicatorHtml: `<div class="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-current opacity-20"></div>`,
          labelText: band.label,
          valueText: `${range.lower.toLocaleString()} – ${range.upper.toLocaleString()}`,
          dimmed: "",
        });
      })
      .join("");

    const notes: HonestyNote[] = [];
    if (inPartial && honesty.partial) {
      notes.push({ label: honesty.partial.label, description: honesty.partial.note });
    }
    if (rowIndex !== undefined && honesty.gaps.some((gap) => rowIndex >= gap.start && rowIndex <= gap.end)) {
      notes.push({ label: honesty.gapLabel, description: honesty.text.noDataDescription });
    }
    if (lowSampleMin !== null) {
      notes.push({
        label: honesty.text.lowSampleLabel(formatCount(lowSampleMin)),
        description: honesty.text.lowSampleDescription,
      });
    }

    return tooltipShell({
      label,
      body: body + looseBands + statusNotesHtml(statuses, statusText) + honestyNotesHtml(notes),
      roundness: tooltipSlot.roundness,
      variant: tooltipSlot.variant,
    });
  };
}

function honestyDetail(parts: {
  base: string;
  periodLabel: string;
  bands: string[];
  sample: string;
}): string {
  return [parts.periodLabel, parts.base, ...parts.bands, parts.sample].filter(Boolean).join(" · ");
}

function buildTooltipOption(ctx: OptionBuildContext): TooltipComponentOption {
  const { tooltipSlot, isLoading } = ctx;
  const { tokens } = ctx.resolved;

  return {
    ...tooltipBaseOption({
      present: tooltipSlot.present && !isLoading,
      cursor: tooltipSlot.cursor,
      tokens,
      position: tooltipSlot.position,
      axisPointerColor: withAlpha(tokens.border, AXIS_POINTER_OPACITY),
      strokeWidth: STROKE_WIDTH,
    }),
    formatter: createTooltipFormatter(ctx),
  };
}

function buildBrushOption(
  ctx: OptionBuildContext,
  brushBottom: number,
): {
  miniGrid: GridComponentOption;
  miniXAxis: XAxisOption;
  miniYAxis: YAxisOption;
  miniSeries: LineSeriesOption[];
  dataZoom: DataZoomComponentOption[];
} {
  const { data, lines, curveType, selectedDataKey, brushHeight, categories } = ctx;
  const { tokens } = ctx.resolved;

  const miniGrid: GridComponentOption = {
    left: 8,
    right: 8,
    bottom: brushBottom,
    height: brushHeight,

    outerBoundsMode: "none",
  };

  const miniXAxis: XAxisOption = {
    type: "category",
    gridIndex: 1,
    boundaryGap: false,
    show: false,
    data: categories,
    axisPointer: { show: false },
  };

  const miniYAxis: YAxisOption = { type: "value", gridIndex: 1, show: false };

  const miniSeries: LineSeriesOption[] = lines.map((line) => {
    const key = line.dataKey;
    const base = (ctx.resolved.series[key] ?? [])[0] ?? "rgba(120, 120, 120, 1)";
    const curve = curveConfig(line.curveType ?? curveType);

    const strokeDim = getOpacity(selectedDataKey, key).stroke;

    return {
      id: `__mini-${key}`,
      type: "line",
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: ctx.quality[key]?.map((point) => point.value) ?? data.map((row) => readValue(row[key])),
      smooth: curve.smooth,
      step: curve.step,
      connectNulls: line.connectNulls && !ctx.quality[key],
      silent: true,
      showSymbol: false,
      emphasis: { disabled: true },
      tooltip: { show: false },
      lineStyle: { color: base, width: 1, opacity: BRUSH_STROKE_OPACITY * strokeDim },
      z: 0,
    };
  });

  const dataZoom = buildBrushDataZoom({
    brushBottom,
    brushHeight,
    brushRange: ctx.brushRange,
    fillerColor: withAlpha(tokens.foreground, BRUSH_FILLER_OPACITY),
  });

  return { miniGrid, miniXAxis, miniYAxis, miniSeries, dataZoom };
}

function buildLoadingOption(
  ctx: OptionBuildContext,
  frame: { grid: GridComponentOption; xAxis: XAxisOption; yAxis: YAxisOption },
): EChartsOption {
  const { tokens } = ctx.resolved;
  const curve = curveConfig(ctx.curveType);

  return {
    animation: false,
    grid: frame.grid,
    xAxis: frame.xAxis,
    yAxis: frame.yAxis,
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "line",
        data: ctx.loadingData(),
        smooth: curve.smooth,
        step: curve.step,
        showSymbol: false,
        silent: true,

        lineStyle: { color: withAlpha(tokens.foreground, 0), width: 1 },
        z: 1,
      },
    ],
  };
}

type LinePoint =
  | number
  | null
  | {
      value: number | null;
      itemStyle: DotItemStyleOption;
      emphasis: { itemStyle: DotItemStyleOption };
    };

function buildLineSeries(ctx: OptionBuildContext): (LineSeriesOption | CustomSeriesOption)[] {
  const {
    data,
    config,
    lines,
    curveType,
    selectedDataKey,
    hasSelection,
    enableHoverHighlight,
    enableHoverReveal,
    revealIndex,
    revealSink,
    resolved,
    rendererSize,
  } = ctx;
  const background = resolved.tokens.background;

  return lines.flatMap((line): (LineSeriesOption | CustomSeriesOption)[] => {
    const key = line.dataKey;
    const slots = resolved.series[key] ?? ["rgba(120, 120, 120, 1)"];
    const paint = seriesPaint(slots);
    const isSelected = selectedDataKey === key;
    const opacity = getOpacity(selectedDataKey, key);
    const curve = curveConfig(line.curveType ?? curveType);
    const multiColor = slots.length > 1;

    const restingDot = dotStyle(line.dotVariant, paint, background);
    const activeDot = dotStyle(line.activeDotVariant, paint, background);
    const restingVisible = line.dotVariant !== "none";
    const dotOpacity = opacity.dot;

    // Dashes carry data status on a series that reads one, so its own stroke
    // variant, glow, buffer segment, and null bridging are not applied.
    const points = ctx.quality[key];
    const tracked = points !== undefined;
    // An absent value is a gap, never a zero.
    const values: (number | null)[] = points
      ? points.map((point) => point.value)
      : data.map((row) => readValue(row[key]));
    const n = values.length;

    const reveal = enableHoverReveal;
    const buffer = !reveal && !tracked && line.enableBufferLine && n >= 2;
    const revealActive = reveal && revealIndex !== null;

    const mainDash: "solid" | [number, number] =
      buffer || tracked || line.strokeVariant === "solid" ? "solid" : [3, 3];

    const strokePaint =
      reveal && multiColor
        ? new echarts.graphic.LinearGradient(
            8,
            0,
            Math.max(rendererSize.width - 8, 9),
            0,
            slots.map((color, i) => ({ offset: i / (slots.length - 1), color })),
            true,
          )
        : paint;

    const toPoints = (vals: (number | null)[]): LinePoint[] =>
      !multiColor
        ? vals
        : vals.map((value, i): LinePoint => {
            if (value === null) return null;
            const t = vals.length > 1 ? i / (vals.length - 1) : 0;
            const pointColor = sampleGradient(slots, t);
            return {
              value,
              itemStyle: {
                ...dotItemStyle(
                  restingVisible ? line.dotVariant : line.activeDotVariant,
                  pointColor,
                  background,
                ),
                opacity: dotOpacity,
              },
              emphasis: {
                itemStyle: {
                  ...dotItemStyle(
                    line.activeDotVariant === "none" ? "default" : line.activeDotVariant,
                    pointColor,
                    background,
                  ),
                  opacity: 1,
                },
              },
            };
          });

    if (reveal) revealSink[key] = toPoints(values);

    const mainValues: (number | null)[] = buffer
      ? values.map((v, i) => (i === n - 1 ? null : v))
      : revealActive
        ? sliceToNull(values, revealIndex as number)
        : values;

    const z = isSelected ? 3 : hasSelection ? 1 : 2;

    const glowSeries =
      line.glowing && !reveal && !tracked
        ? buildGlowSeries({
            key,
            paint,
            slots,
            values,
            curve,
            connectNulls: line.connectNulls,
            z,
            selectionDim: opacity.stroke,
            dotSize: restingVisible ? restingDot.size : 0,
          })
        : [];

    const mainSeries: LineSeriesOption = {
      id: key,
      name: typeof config[key]?.label === "string" ? config[key]?.label : key,
      type: "line",
      data: toPoints(mainValues),
      smooth: curve.smooth,
      step: curve.step,
      connectNulls: line.connectNulls && !tracked,
      cursor: line.isClickable ? "pointer" : "default",

      triggerEvent: line.isClickable,
      showSymbol: restingVisible,
      symbol: "circle",
      symbolSize: restingVisible ? restingDot.size : activeDot.size,
      z,
      lineStyle: {

        color: strokePaint,
        width: line.strokeWidth,
        opacity: tracked ? 0 : opacity.stroke,
        type: mainDash,
        dashOffset: 0,
      },
      itemStyle: multiColor
        ? { opacity: dotOpacity }
        : {
            ...(restingVisible ? restingDot.itemStyle : activeDot.itemStyle),
            opacity: dotOpacity,
          },
      emphasis: {

        focus: enableHoverHighlight && !enableHoverReveal && !hasSelection ? "series" : "none",
        scale: restingVisible ? activeDot.size / Math.max(restingDot.size, 1) : 1,
        ...(tracked ? { lineStyle: { opacity: 0 } } : {}),
        ...(multiColor ? {} : { itemStyle: { ...activeDot.itemStyle, opacity: 1 } }),
      },

      blur: {
        lineStyle: { opacity: tracked ? 0 : 0.3 },
        itemStyle: { opacity: 0.3 },
      },
    };

    const qualitySeries: (LineSeriesOption | CustomSeriesOption)[] = [];
    // The earlier period: the series color, faded and finely dashed, under
    // the series and silent, so hover and selection only ever hit the
    // current period. Its values reach the tooltip from the data row.
    if (line.compareDataKey) {
      qualitySeries.push({
        id: compareSeriesId(key),
        type: "line",
        data: compareValues(data, line.compareDataKey),
        smooth: curve.smooth,
        step: curve.step,
        connectNulls: line.connectNulls,
        silent: true,
        showSymbol: false,
        symbol: "none",
        z: z - 1,
        tooltip: { show: false },
        lineStyle: {
          color: slots[0],
          width: line.strokeWidth,
          opacity: COMPARE_OPACITY * opacity.stroke,
          type: COMPARE_DASH,
          cap: "round",
        },
        emphasis: { disabled: true },
        blur: { lineStyle: { opacity: COMPARE_OPACITY * 0.3 } },
      });
    }
    if (points) {
      const markColor = multiColor ? resolved.tokens.foreground : slots[0];
      const runPaint = multiColor
        ? new echarts.graphic.LinearGradient(
            8,
            0,
            Math.max(rendererSize.width - 8, 9),
            0,
            slots.map((color, i) => ({ offset: i / (slots.length - 1), color })),
            true,
          )
        : paint;

      strokeRuns(points).forEach((run, runIndex) => {
        const id = qualityRunId(key, runIndex);
        const runData = runValues(values, run);
        if (reveal) revealSink[id] = runData;
        qualitySeries.push({
          id,
          type: "line",
          data: revealActive ? sliceToNull(runData, revealIndex as number) : runData,
          smooth: curve.smooth,
          step: curve.step,
          connectNulls: false,
          silent: true,
          showSymbol: false,
          z,
          tooltip: { show: false },
          lineStyle: {
            color: runPaint,
            width: line.strokeWidth,
            opacity: opacity.stroke,
            type: STROKE_DASH[run.stroke],
            cap: run.stroke === "estimated" ? "round" : "butt",
          },
          emphasis: {
            focus: "none",
            lineStyle: { opacity: opacity.stroke, width: line.strokeWidth },
          },
          blur: { lineStyle: { opacity: opacity.stroke } },
        });
      });

      const ranges = points.flatMap((point, index) =>
        point.range ? [{ index, ...point.range }] : [],
      );
      if (ranges.length) {
        qualitySeries.push(
          rangeWhiskerSeries({
            dataKey: key,
            ranges,
            color: markColor,
            opacity: opacity.stroke,
            z,
          }),
        );
      }

      const missingMarkers = missingMarkerSeries({
        dataKey: key,
        points,
        color: markColor,
        opacity: opacity.stroke,
        z,
      });
      if (missingMarkers) qualitySeries.push(missingMarkers);
    }

    const sizes = ctx.honesty.sampleSizes[key];
    if (sizes) {
      const sampleMarks = sampleSizeSeries({
        dataKey: key,
        values,
        sizes,
        minSampleSize: line.minSampleSize,
        showLabels: line.sampleSizeDisplay === "label",
        format: (count) => ctx.honesty.text.sampleSize(formatCount(count)),
        labelColor: resolved.tokens.mutedForeground,
        ringColor: multiColor ? resolved.tokens.foreground : slots[0],
        background,
        opacity: opacity.stroke,
        z: z + 1,
      });
      if (sampleMarks) qualitySeries.push(sampleMarks);
    }

    if (reveal) {
      const muted = resolved.tokens.mutedForeground;
      const revealBase: LineSeriesOption = {
        id: `${REVEAL_PREFIX}${key}`,
        type: "line",

        data: revealActive ? sliceFrom(values, revealIndex as number) : values,
        smooth: curve.smooth,
        step: curve.step,
        connectNulls: false,
        silent: true,
        showSymbol: false,
        symbol: "circle",
        z: z - 1,

        lineStyle: {
          color: muted,
          width: line.strokeWidth,
          type: mainDash,
          opacity: revealActive ? 0.3 : 0,
        },
        emphasis: { disabled: true },
        blur: { lineStyle: { opacity: revealActive ? 0.3 : 0 } },
        tooltip: { show: false },
      };
      return [revealBase, mainSeries, ...qualitySeries];
    }

    if (!buffer) return [...glowSeries, mainSeries, ...qualitySeries];

    const bufferValues: (number | null)[] = values.map((v, i) => (i >= n - 2 ? v : null));
    const bufferSeries: LineSeriesOption = {
      id: `${BUFFER_PREFIX}${key}`,
      type: "line",
      data: toPoints(bufferValues),
      smooth: curve.smooth,
      step: curve.step,
      connectNulls: true,
      silent: true,
      showSymbol: restingVisible,
      symbol: "circle",
      symbolSize: restingVisible ? restingDot.size : activeDot.size,
      z,
      lineStyle: {
        color: paint,
        width: line.strokeWidth,
        opacity: opacity.stroke,
        type: BUFFER_DASH,
      },
      itemStyle: multiColor
        ? { opacity: dotOpacity }
        : {
            ...(restingVisible ? restingDot.itemStyle : activeDot.itemStyle),
            opacity: dotOpacity,
          },

      emphasis: {
        focus: "none",
        scale: false,
        lineStyle: { opacity: opacity.stroke },
        itemStyle: { opacity: dotOpacity },
      },
      blur: { lineStyle: { opacity: 0.3 }, itemStyle: { opacity: 0.3 } },
    };

    return [...glowSeries, mainSeries, bufferSeries, ...qualitySeries];
  });
}

// Bands sit under the lines and fade with the selection like their series.
function bandColor(ctx: OptionBuildContext, band: ResolvedBand): string {
  const { resolved } = ctx;
  if (band.color) return resolved.series[band.color]?.[0] ?? normalizeColor(band.color);
  if (band.dataKey) return resolved.series[band.dataKey]?.[0] ?? resolved.tokens.foreground;
  return resolved.tokens.foreground;
}

const BAND_FILL_OPACITY = 0.12;
const BAND_EDGE_OPACITY = 0.35;
const PARTIAL_FILL_OPACITY = 0.035;
const GAP_HATCH_OPACITY = 0.11;

function buildHonestySeries(ctx: OptionBuildContext): CustomSeriesOption[] {
  const { honesty, resolved, curveType } = ctx;
  const { tokens } = resolved;
  const out: CustomSeriesOption[] = [];

  for (const band of honesty.bands) {
    const color = bandColor(ctx, band);
    const line = band.dataKey ? ctx.lines.find((l) => l.dataKey === band.dataKey) : undefined;
    const dim = band.dataKey ? getOpacity(ctx.selectedDataKey, band.dataKey).stroke : 1;
    const curve = curveConfig(line?.curveType ?? curveType);
    const series = bandSeries({
      id: bandSeriesId(band.index, band.dataKey),
      bounds: band.bounds,
      runs: band.runs,
      fill: withAlpha(color, BAND_FILL_OPACITY * dim),
      edge: withAlpha(color, BAND_EDGE_OPACITY * dim),
      step: curve.step !== false,
      smooth: curve.smooth,
      z: 1,
    });
    if (series) out.push(series);
  }

  if (honesty.partial) {
    out.push(
      partialPeriodSeries({
        start: honesty.partial.start,
        label: honesty.partial.label,
        fill: withAlpha(tokens.foreground, PARTIAL_FILL_OPACITY),
        labelColor: tokens.mutedForeground,
        z: 0,
      }),
    );
  }

  const gaps = gapRegionSeries({
    spans: honesty.gaps,
    rowCount: ctx.data.length,
    label: honesty.gapLabel,
    hatch: withAlpha(tokens.foreground, GAP_HATCH_OPACITY),
    labelColor: tokens.mutedForeground,
    z: 0,
  });
  if (gaps) out.push(gaps);

  if (honesty.axis.truncatedAt !== null && ctx.yAxisSlot.truncationNotice !== "off") {
    out.push(axisBreakSeries({ stroke: tokens.mutedForeground, background: tokens.background, z: 6 }));
  }

  return out;
}

function sliceToNull<T>(vals: readonly T[], idx: number): (T | null)[] {
  return vals.map((v, i) => (i > idx ? null : v));
}

function sliceFrom<T>(vals: readonly T[], idx: number): (T | null)[] {
  return vals.map((v, i) => (i < idx ? null : v));
}

type LiveState = {
  resolved: ResolvedColors | null; 
  hoveredKey: string | null; 
  hasRevealed: boolean; 
  revealEndsAt: number; 
  loadingRows: number[] | null; 
  categories: string[]; 
  dataLength: number; 
  brushRange: BrushRange; 
  brushGeom: BrushGeometry | null; 
  brushOverlay: BrushOverlayElements | null; 
  brushHover: { inside: boolean; left: boolean; right: boolean };

  seriesKeyByIndex: (string | undefined)[];

  companionIdsByKey: Map<string, string[]>;
  revealIndex: number | null; 
  revealValues: Record<string, unknown[]>; 

  handlers: {
    onBrushChange?: (range: { startIndex: number; endIndex: number }) => void;
    onSelectionChange?: (key: string | null) => void;
    clickableKeys: Set<string>;
    selectedDataKey: string | null;
    brushFormatLabel?: (value: string, index: number) => string;
    seriesKeys: string[];
    enableHoverHighlight: boolean;
    enableHoverReveal: boolean;
    onZoomChange?: (range: { startIndex: number; endIndex: number }) => void;
  };

  repush: () => void;
};

export function LineChart<TData extends Record<string, unknown>>({
  data: inputData,
  config,
  xDataKey,
  className,
  curveType = "linear",
  animation = true,
  animationType = "left-to-right",
  enableHoverHighlight = false,
  enableHoverReveal = false,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  loadingPoints = LOADING_DEFAULT_POINTS,
  ariaLabel,
  dataStatusText,
  honestyText,
  gaps,
  syncId,
  chartOptions,
  children,
}: LineChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);

  const liveRef = useRef<LiveState>({
    resolved: null,
    hoveredKey: null,
    hasRevealed: false,
    revealEndsAt: 0,
    loadingRows: null,
    categories: [],
    dataLength: 0,
    brushRange: { start: 0, end: 100 },
    brushGeom: null,
    brushOverlay: null,
    brushHover: { inside: false, left: false, right: false },
    seriesKeyByIndex: [],
    companionIdsByKey: new Map(),
    revealIndex: null,
    revealValues: {},
    handlers: {
      onBrushChange: undefined, 
      onSelectionChange,
      clickableKeys: new Set<string>(),
      selectedDataKey: defaultSelectedDataKey,
      brushFormatLabel: undefined, 
      seriesKeys: [],
      enableHoverHighlight,
      enableHoverReveal,
    },
    repush: () => {},
  });

  const loadingData = useCallback(
    () => (liveRef.current.loadingRows ??= getLoadingData(loadingPoints)),
    [loadingPoints],
  );
  const shouldReduceMotion = useReducedMotion();

  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);

  const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);

  const collected = useMemo(() => collectConfig(children), [children]);
  const {
    lines,
    xAxis: xAxisSlot,
    yAxis: yAxisSlot,
    showGrid,
    tooltip: tooltipSlot,
    legend: legendSlot,
    brush: brushSlot,
  } = collected;

  const showBrush = brushSlot.present;
  const brushHeight = brushSlot.height ?? 56;

  const references = useMemo(() => collectReferences(children), [children]);
  const zoomSlot = useMemo(() => collectZoom(children), [children]);
  useZoomWheelGuard(containerRef, zoomSlot);
  const [zoomed, setZoomed] = useState(false);

  const seriesKeys = useMemo(() => lines.map((line) => line.dataKey), [lines]);
  const honestySlots = useMemo(() => collectHonesty(children), [children]);
  const colorKeys = useMemo(
    () => [
      ...seriesKeys,
      ...referenceColorKeys(references, config),
      ...honestySlots.bands.flatMap((band) => (band.color && config[band.color] ? [band.color] : [])),
    ],
    [seriesKeys, references, config, honestySlots],
  );

  const xCategoryKey = useMemo(() => {
    if (xAxisSlot.dataKey) return xAxisSlot.dataKey;
    if (xDataKey) return xDataKey as string;
    const firstRow = inputData[0];
    if (firstRow) {
      const claimed = new Set(seriesKeys);
      const found = Object.keys(firstRow).find((key) => !claimed.has(key));
      if (found) return found;
    }
    return "";
  }, [xAxisSlot.dataKey, xDataKey, inputData, seriesKeys]);

  // With a gap interval, rows absent from the time series are put back as
  // empty rows, so the axis keeps time even and the hole shows.
  const gapInterval = typeof gaps === "object" ? gaps.interval : undefined;
  const data = useMemo(
    () =>
      gapInterval && xCategoryKey
        ? fillMissingRows(inputData, xCategoryKey, gapInterval).data
        : (inputData as Record<string, unknown>[]),
    [inputData, xCategoryKey, gapInterval],
  );

  // A partial period or gap shading reads every series' values as claims, so
  // an absent value is never drawn as zero or bridged.
  const trackAll = Boolean(honestySlots.partial || gaps);
  const qualitySeries = useMemo(
    () =>
      lines.map((line) => ({
        dataKey: line.dataKey,
        quality: line.quality ?? (trackAll ? {} : null),
      })),
    [lines, trackAll],
  );
  const claimed = useMemo(() => collectDataQuality(data, qualitySeries), [data, qualitySeries]);

  const [renderedAt] = useState(() => Date.now());
  const honestyTextResolved = useMemo(() => resolveHonestyText(honestyText), [honestyText]);
  const partial = useMemo(() => {
    if (!honestySlots.partial) return null;
    const found = resolvePartialPeriod(
      honestySlots.partial,
      data.map((row) => row[xCategoryKey]),
      renderedAt,
    );
    if (!found) return null;
    const description = honestySlots.partial.note ?? [
      honestyTextResolved.partialPeriodDescription,
      found.progress !== null ? honestyTextResolved.partialProgress(found.progress) : "",
    ]
      .filter(Boolean)
      .join(" ");
    return {
      start: found.start,
      progress: found.progress,
      label: honestySlots.partial.label ?? honestyTextResolved.partialPeriodLabel,
      note: description,
    };
  }, [honestySlots, data, xCategoryKey, renderedAt, honestyTextResolved]);

  const quality = useMemo(() => {
    if (!partial) return claimed;
    const points: Record<string, PointQuality[]> = {};
    for (const [key, value] of Object.entries(claimed.points)) {
      points[key] = applyPartialPeriod(value, partial.start);
    }
    return { ...claimed, points };
  }, [claimed, partial]);

  const statusText = useMemo(() => resolveDataStatusText(dataStatusText), [dataStatusText]);

  const bands = useMemo(
    () =>
      honestySlots.bands.map((band, index) => {
        const read = readBand(data, band);
        return {
          index,
          dataKey: band.dataKey,
          label: band.label ?? honestyTextResolved.intervalLabel,
          color: band.color,
          bounds: read.bounds,
          runs: read.runs,
          issues: read.issues,
        };
      }),
    [honestySlots, data, honestyTextResolved],
  );

  const gapList = useMemo(() => {
    if (!gaps) return [];
    const series = Object.values(quality.points).map((points) => points.map((point) => point.value));
    return series.length ? gapSpans(series, data.length) : [];
  }, [gaps, quality, data.length]);

  const sampleSizes = useMemo(() => {
    const sizes: Record<string, (number | null)[]> = {};
    for (const line of lines) {
      if (line.sampleSizeKey) sizes[line.dataKey] = readSampleSizes(data, line.sampleSizeKey);
    }
    return sizes;
  }, [lines, data]);

  const axis = useMemo(() => {
    const { min: minProp, max: maxProp } = yAxisSlot;
    let min: number | undefined = typeof minProp === "number" ? minProp : undefined;
    let max: number | undefined = maxProp;
    if (minProp === "auto") {
      const values: number[] = [];
      for (const line of lines) {
        const points = quality.points[line.dataKey];
        for (let i = 0; i < data.length; i++) {
          const value = points ? points[i].value : readValue(data[i][line.dataKey]);
          if (value !== null) values.push(value);
          const range = points?.[i].range;
          if (range) values.push(range.lower, range.upper);
        }
      }
      for (const band of bands) {
        for (const range of band.bounds) if (range) values.push(range.lower, range.upper);
      }
      const domain = fitDomain(values);
      if (domain) {
        min = domain.min;
        max = max ?? domain.max;
      }
    }
    const truncatedAt = axisTruncation(min ?? null, max ?? null);
    const formatted =
      truncatedAt === null
        ? ""
        : (yAxisSlot.tickFormatter?.(truncatedAt, 0) ?? truncatedAt.toLocaleString());
    const atTop = truncatedAt !== null && truncatedAt < 0;
    return {
      min,
      max,
      truncatedAt,
      label: atTop
        ? honestyTextResolved.axisEndsAt(formatted)
        : honestyTextResolved.axisStartsAt(formatted),
      description: honestyTextResolved.axisDescription(formatted),
    };
  }, [yAxisSlot, lines, quality, data, bands, honestyTextResolved]);

  const honesty = useMemo<HonestyPlan>(
    () => ({
      text: honestyTextResolved,
      partial,
      bands,
      gaps: gapList,
      gapLabel: (typeof gaps === "object" ? gaps.label : undefined) ?? honestyTextResolved.noDataLabel,
      axis,
      sampleSizes,
    }),
    [honestyTextResolved, partial, bands, gapList, gaps, axis, sampleSizes],
  );

  const qualityIssues = [...quality.issues, ...bands.flatMap((band) => band.issues)].join("\n");
  useEffect(() => {
    if (qualityIssues) reportDataQualityIssues("LineChart", qualityIssues.split("\n"));
  }, [qualityIssues]);

  // The key and summary name what the app claimed; the partial period has its own entry.
  const keySummary = useMemo(
    () => summarizeDataQuality(Object.values(claimed.points)),
    [claimed],
  );

  const honestyEntries = useMemo((): HonestyKeyEntry[] => {
    const text = honestyTextResolved;
    const entries: HonestyKeyEntry[] = [];
    if (partial) entries.push({ kind: "partial", label: partial.label, description: partial.note });
    for (const band of bands) {
      if (!band.runs.length) continue;
      entries.push({
        kind: "band",
        label: band.label,
        description: text.intervalDescription,
        color: band.color
          ? config[band.color]
            ? `var(--color-${band.color}-0)`
            : band.color
          : band.dataKey
            ? `var(--color-${band.dataKey}-0)`
            : undefined,
      });
    }
    if (gapList.length) {
      entries.push({ kind: "gap", label: honesty.gapLabel, description: text.noDataDescription });
    }
    if (axis.truncatedAt !== null && yAxisSlot.truncationNotice !== "off") {
      entries.push({ kind: "axis", label: axis.label, description: axis.description });
    }
    const labelled = lines.filter((line) => sampleSizes[line.dataKey]);
    if (labelled.some((line) => line.sampleSizeDisplay === "label")) {
      entries.push({
        kind: "sample",
        label: text.sampleSizeLabel,
        description: text.sampleSizeDescription,
      });
    }
    const lowMins = labelled.flatMap((line) =>
      sampleSizes[line.dataKey].some((n) => isLowSample(n, line.minSampleSize))
        ? [line.minSampleSize as number]
        : [],
    );
    if (lowMins.length) {
      entries.push({
        kind: "low-sample",
        label: text.lowSampleLabel(formatCount(Math.max(...lowMins))),
        description: text.lowSampleDescription,
      });
    }
    return entries;
  }, [honestyTextResolved, partial, bands, config, gapList, honesty.gapLabel, axis, yAxisSlot, lines, sampleSizes]);

  const honestyAria = honestyEntries
    .filter((entry) => entry.kind !== "sample")
    .map((entry) =>
      entry.kind === "partial" && partial
        ? ` ${entry.label} from ${String(data[partial.start]?.[xCategoryKey] ?? "")}.`
        : entry.kind === "gap"
          ? ` ${entry.label}: ${gapList
              .map((gap) => {
                const first = String(data[gap.start]?.[xCategoryKey] ?? "");
                const last = String(data[gap.end]?.[xCategoryKey] ?? "");
                return gap.start === gap.end ? first : `${first} to ${last}`;
              })
              .join(", ")}.`
          : entry.kind === "axis"
            ? ` ${entry.description}`
            : ` ${entry.label}.`,
    )
    .join("");

  const defaultAriaLabel = `Line chart with ${seriesKeys.join(", ") || "no series"} over ${String(xDataKey ?? "categories")}.${dataQualityAriaSummary(keySummary, statusText)}${honestyAria}`;

  const effectiveAnimation = lines[0]?.animationType ?? animationType;

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  const hasSelection = selectedDataKey !== null;

  const clickableKeys = useMemo(
    () => new Set(lines.filter((line) => line.isClickable).map((line) => line.dataKey)),
    [lines],
  );

  useEffect(() => {
    liveRef.current.handlers = {
      onBrushChange: brushSlot.onChange,
      onSelectionChange,
      clickableKeys,
      selectedDataKey,
      brushFormatLabel: brushSlot.formatLabel,
      seriesKeys,
      enableHoverHighlight,
      enableHoverReveal,
      onZoomChange: zoomSlot.onChange,
    };
    liveRef.current.dataLength = data.length;
  });

  const toggleSelection = useCallback(
    (key: string) => {

      if (liveRef.current.hoveredKey !== null) {
        const chart = echartsRef.current;
        const companions = chart ? liveRef.current.companionIdsByKey.get(liveRef.current.hoveredKey) : undefined;
        if (chart && companions) {
          for (const seriesId of companions) chart.dispatchAction({ type: "downplay", seriesId });
        }
        liveRef.current.hoveredKey = null;
        setHoveredDataKey(null);
      }
      setSelectedDataKey((prev) => {
        const next = prev === key ? null : key;
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange],
  );

  const syncBrushOverlayNow = useCallback(() => {
    const chart = echartsRef.current;
    if (!chart) return;

    const geom = liveRef.current.brushGeom;
    const tokens = liveRef.current.resolved?.tokens;
    if (!geom || !tokens) {
      syncBrushOverlay(chart, liveRef.current, null);
      return;
    }

    const range = liveRef.current.brushRange;
    const categories = liveRef.current.categories;
    const format = liveRef.current.handlers.brushFormatLabel;
    const lastIndex = Math.max(categories.length - 1, 0);
    const startIndex = Math.round((range.start / 100) * lastIndex);
    const endIndex = Math.round((range.end / 100) * lastIndex);
    const labels =
      format && categories.length
        ? {
            start: format(categories[startIndex] ?? "", startIndex),
            end: format(categories[endIndex] ?? "", endIndex),
          }
        : null;

    syncBrushOverlay(chart, liveRef.current, {
      range,
      geom,
      size: { width: chart.getWidth(), height: chart.getHeight() },
      tokens,
      labels,
      showLabels: liveRef.current.brushHover.inside,
      hover: liveRef.current.brushHover,
    });
  }, []);

  const buildOption = useCallback((): EChartsOption => {
    const resolved = liveRef.current.resolved;
    if (!resolved) return {};

    const categories = data.map((row) => String(row[xCategoryKey]));
    liveRef.current.categories = categories;

    const revealSink: Record<string, unknown[]> = {};

    const ctx: OptionBuildContext = {
      data,
      config,
      lines,
      curveType,
      selectedDataKey,
      hasSelection,
      showGrid,
      xAxisSlot,
      yAxisSlot,
      tooltipSlot,
      legendSlot,
      isLoading,
      loadingData,
      showBrush,
      brushHeight,
      enableHoverHighlight,
      enableHoverReveal,
      revealIndex: liveRef.current.revealIndex,
      revealSink,
      resolved,
      quality: quality.points,
      claimedQuality: claimed.points,
      statusText,
      honesty,
      rendererSize: {
        width: echartsRef.current?.getWidth() ?? mountRef.current?.clientWidth ?? 0,
        height: echartsRef.current?.getHeight() ?? mountRef.current?.clientHeight ?? 0,
      },
      categories,
      brushRange: liveRef.current.brushRange,
      getHoveredKey: () => liveRef.current.hoveredKey,
    };

    const { grid, brushBottom } = buildChartLayout(ctx);
    liveRef.current.brushGeom = showBrush ? { bottom: brushBottom, height: brushHeight } : null;

    const { xAxis, yAxis } = buildMainAxes(ctx);

    if (isLoading) return buildLoadingOption(ctx, { grid, xAxis, yAxis });

    const brush = showBrush ? buildBrushOption(ctx, brushBottom) : null;
    const reference = buildReferenceSeries({
      refs: references,
      resolved,
      valueAxes: { x: false, y: true },
    });

    const series = [
      ...buildHonestySeries(ctx),
      ...buildLineSeries(ctx),
      ...(reference ? [reference] : []),
      ...(brush?.miniSeries ?? []),
    ];

    // Zoom shares the brush's window: it replaces the brush's own inside
    // zoom, or stands alone without a brush.
    const insideZoom = zoomSlot.present
      ? buildInsideZoom({ zoom: zoomSlot, range: liveRef.current.brushRange })
      : null;
    const dataZoom = brush
      ? insideZoom
        ? [brush.dataZoom[0], insideZoom]
        : brush.dataZoom
      : insideZoom
        ? [insideZoom]
        : undefined;

    if (enableHoverReveal) liveRef.current.revealValues = revealSink;

    liveRef.current.seriesKeyByIndex = series.map((s) => {
      const id = String(s.id ?? "");
      return id && !id.startsWith("__") ? id : undefined;
    });

    const companionIdsByKey = new Map<string, string[]>();
    for (const line of lines) {
      const ids: string[] = [];
      if (line.glowing) {
        for (let i = 0; i < GLOW_LAYERS.length; i++) ids.push(`__glow-${i}-${line.dataKey}`);
      }
      if (line.enableBufferLine && data.length >= 2) ids.push(`${BUFFER_PREFIX}${line.dataKey}`);
      if (enableHoverReveal) ids.push(`${REVEAL_PREFIX}${line.dataKey}`);
      for (const entry of series) {
        const id = String(entry.id ?? "");
        if (qualitySeriesOwner(id) === line.dataKey) ids.push(id);
      }
      if (ids.length) companionIdsByKey.set(line.dataKey, ids);
    }
    liveRef.current.companionIdsByKey = companionIdsByKey;

    return {
      animation: false,
      grid: brush ? [grid, brush.miniGrid] : grid,
      xAxis: brush ? [xAxis, brush.miniXAxis] : xAxis,
      yAxis: brush ? [yAxis, brush.miniYAxis] : yAxis,
      tooltip: buildTooltipOption(ctx),
      dataZoom,
      series,
    };
  }, [
    references,
    zoomSlot,
    data,
    config,
    lines,
    xCategoryKey,
    curveType,
    selectedDataKey,
    hasSelection,
    showGrid,
    xAxisSlot,
    yAxisSlot,
    tooltipSlot,
    legendSlot,
    isLoading,
    loadingData,
    showBrush,
    brushHeight,
    enableHoverHighlight,
    enableHoverReveal,
    quality,
    claimed,
    statusText,
    honesty,
  ]);

  useEffect(() => {
    const live = liveRef.current;
    const mount = mountRef.current;
    const container = containerRef.current;
    if (!mount || !container) return;

    const chart = echarts.init(mount);
    echartsRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {

      if (mount.clientWidth === chart.getWidth() && mount.clientHeight === chart.getHeight()) {
        return;
      }
      chart.resize();
      liveRef.current.repush();
    });
    resizeObserver.observe(mount);

    const themeObserver = new MutationObserver(() => {
      liveRef.current.repush();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    chart.on("click", (params) => {
      const { clickableKeys: clickable } = liveRef.current.handlers;
      const p = params as { seriesId?: string; seriesIndex?: number };

      const id =
        p.seriesId ??
        (typeof p.seriesIndex === "number" ? liveRef.current.seriesKeyByIndex[p.seriesIndex] : undefined);
      if (typeof id === "string" && clickable.has(id)) toggleSelection(id);
    });

    const syncRunFocus = () => {
      const patch = runFocusPatch(
        liveRef.current.companionIdsByKey,
        liveRef.current.hoveredKey,
        (key) => getOpacity(liveRef.current.handlers.selectedDataKey, key).stroke,
      );
      if (patch.length) chart.setOption({ series: patch }, { silent: true, lazyUpdate: true });
    };

    chart.on("mouseover", (params) => {
      const { enableHoverHighlight: hoverOn, enableHoverReveal: revealOn } = liveRef.current.handlers;

      if (!hoverOn || revealOn) return;

      if (liveRef.current.handlers.selectedDataKey !== null) return;
      const p = params as { seriesId?: string; seriesIndex?: number; componentType?: string };
      if (p.componentType !== "series") return;
      const id =
        p.seriesId ??
        (typeof p.seriesIndex === "number" ? liveRef.current.seriesKeyByIndex[p.seriesIndex] : undefined);
      if (typeof id !== "string" || id.startsWith("__")) return;
      liveRef.current.hoveredKey = id;
      setHoveredDataKey(id);
      const companions = liveRef.current.companionIdsByKey.get(id);
      if (companions) {
        for (const seriesId of companions) chart.dispatchAction({ type: "highlight", seriesId });
      }
      syncRunFocus();
    });
    chart.on("mouseout", () => {
      const prev = liveRef.current.hoveredKey;
      if (prev === null) return;
      liveRef.current.hoveredKey = null;
      setHoveredDataKey(null);
      const companions = liveRef.current.companionIdsByKey.get(prev);
      if (companions) {
        for (const seriesId of companions) chart.dispatchAction({ type: "downplay", seriesId });
      }
      syncRunFocus();
    });

    const zrReveal = chart.getZr();
    const pushReveal = (idx: number | null) => {
      const keys = liveRef.current.handlers.seriesKeys;
      const on = idx !== null;
      const runIds = Object.keys(liveRef.current.revealValues).filter(isQualityRunId);
      chart.setOption(
        {
          series: [
            ...runIds.map((id) => ({
              id,
              data: on
                ? sliceToNull(liveRef.current.revealValues[id], idx)
                : liveRef.current.revealValues[id],
            })),
            ...keys.flatMap((key) => [
            {
              id: key,
              data: on
                ? sliceToNull(liveRef.current.revealValues[key] ?? [], idx)
                : (liveRef.current.revealValues[key] ?? []),
            },
            {
              id: `${REVEAL_PREFIX}${key}`,

              data: on
                ? sliceFrom(liveRef.current.revealValues[key] ?? [], idx)
                : (liveRef.current.revealValues[key] ?? []),
              lineStyle: { opacity: on ? 0.3 : 0 },
            },
          ]),
          ],
        },

        { silent: true },
      );

      for (const key of keys) {
        chart.dispatchAction(
          on
            ? { type: "highlight", seriesId: key, dataIndex: idx as number }
            : { type: "downplay", seriesId: key },
        );
      }
    };
    const clearReveal = () => {
      if (liveRef.current.revealIndex === null) return;
      liveRef.current.revealIndex = null;
      pushReveal(null);
    };
    const applyReveal = (event: { offsetX?: number; offsetY?: number }) => {
      const len = liveRef.current.dataLength;
      if (len < 1) return;
      const x = event.offsetX ?? -1;
      const y = event.offsetY ?? -1;
      if (!chart.containPixel({ gridIndex: 0 }, [x, y])) {
        clearReveal();
        return;
      }
      const raw = chart.convertFromPixel({ gridIndex: 0 }, [x, y])[0];
      const idx = Math.max(0, Math.min(len - 1, Math.round(raw)));
      if (idx === liveRef.current.revealIndex) return;
      liveRef.current.revealIndex = idx;
      pushReveal(idx);
    };
    const onZrRevealMove = (event: { offsetX?: number; offsetY?: number }) => {
      if (!liveRef.current.handlers.enableHoverReveal) return;
      applyReveal(event);
    };
    const onZrRevealOut = () => {
      if (liveRef.current.handlers.enableHoverReveal) clearReveal();
    };
    zrReveal.on("mousemove", onZrRevealMove);
    zrReveal.on("globalout", onZrRevealOut);

    chart.on("datazoom", () => {
      const option = chart.getOption() as { dataZoom?: { start?: number; end?: number }[] };
      const zoom = option.dataZoom?.[0];
      if (!zoom) return;

      liveRef.current.brushRange = { start: zoom.start ?? 0, end: zoom.end ?? 100 };
      setZoomed(isZoomed(liveRef.current.brushRange));
      syncBrushOverlayNow();

      const { onBrushChange: onChange, onZoomChange } = liveRef.current.handlers;
      if (!onChange && !onZoomChange) return;
      const len = liveRef.current.dataLength;
      const startIndex = Math.round(((zoom.start ?? 0) / 100) * (len - 1));
      const endIndex = Math.round(((zoom.end ?? 100) / 100) * (len - 1));
      onChange?.({ startIndex, endIndex });
      onZoomChange?.({ startIndex, endIndex });
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
          categories: () => liveRef.current.categories,
          categoryAxis: () => "x",
        })
      : null;

    const zr = chart.getZr();
    const applyHover = (next: { inside: boolean; left: boolean; right: boolean }) => {
      const prev = liveRef.current.brushHover;
      if (prev.inside === next.inside && prev.left === next.left && prev.right === next.right) {
        return;
      }
      liveRef.current.brushHover = next;
      syncBrushOverlayNow();
    };
    const onZrMove = (event: { offsetX?: number; offsetY?: number }) => {
      const geom = liveRef.current.brushGeom;
      if (!geom) return;
      const x = event.offsetX ?? -1;
      const y = event.offsetY ?? -1;
      const top = chart.getHeight() - geom.bottom - geom.height;
      const inside = y >= top - 4 && y <= top + geom.height + 4;
      const trackLeft = 8;
      const trackWidth = Math.max(chart.getWidth() - 16, 1);
      const { start, end } = liveRef.current.brushRange;
      const selectionLeft = trackLeft + (trackWidth * start) / 100;
      const selectionRight = trackLeft + (trackWidth * end) / 100;
      applyHover({
        inside,
        left: inside && Math.abs(x - selectionLeft) <= 8,
        right: inside && Math.abs(x - selectionRight) <= 8,
      });
    };
    const onZrOut = () => applyHover({ inside: false, left: false, right: false });
    zr.on("mousemove", onZrMove);
    zr.on("globalout", onZrOut);

    return () => {
      leaveSync?.();
      chart.getZr().off("dblclick", onDoubleClick);
      zrReveal.off("mousemove", onZrRevealMove);
      zrReveal.off("globalout", onZrRevealOut);
      zr.off("mousemove", onZrMove);
      zr.off("globalout", onZrOut);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart.dispose();
      echartsRef.current = null;

      live.brushOverlay = null;

      live.hasRevealed = false;
    };

  }, [syncBrushOverlayNow, toggleSelection, syncId]);

  useEffect(() => {
    const chart = echartsRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;

    liveRef.current.resolved = resolveColors(container, config, colorKeys);

    const push = (withEntrance: boolean) => {
      const option = buildOption();
      const merged = withChartFont(chartOptions ? { ...option, ...chartOptions } : option, container);
      Object.assign(merged, {
        animation: withEntrance,
        animationDuration: REVEAL_DURATION,
        animationDurationUpdate: 0,
      });

      chart.setOption(merged as EChartsOption, { notMerge: true });

      syncBrushOverlayNow();
    };

    if (isLoading) liveRef.current.hasRevealed = false;
    const shouldReveal = !liveRef.current.hasRevealed && !isLoading;
    if (shouldReveal) liveRef.current.hasRevealed = true;
    const revealEnabled =
      animation && shouldReveal && effectiveAnimation !== "none" && !shouldReduceMotion;
    if (revealEnabled) liveRef.current.revealEndsAt = performance.now() + REVEAL_DURATION;
    push(revealEnabled);

    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, colorKeys);
      push(false);
    };
  }, [
    buildOption,
    chartOptions,
    isLoading,
    animation,
    effectiveAnimation,
    shouldReduceMotion,
    config,
    colorKeys,
    syncBrushOverlayNow,
  ]);

  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || isLoading) return;
    const animatedKeys = lines

      .filter(
        (line) =>
          line.strokeVariant === "animated-dashed" && !line.enableBufferLine && !line.quality,
      )
      .map((line) => line.dataKey);
    if (animatedKeys.length === 0 || hasSelection) return;

    let raf = 0;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    const begin = () => {
      const loopStart = performance.now();
      const tick = (now: number) => {
        const offset = -(((now - loopStart) / 1000) % 1) * 6; 
        chart.setOption(
          { series: animatedKeys.map((id) => ({ id, lineStyle: { dashOffset: offset } })) },
          { silent: true, lazyUpdate: true },
        );
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const delay = Math.max(0, liveRef.current.revealEndsAt - performance.now());
    if (delay > 0) delayTimer = setTimeout(begin, delay + 50);
    else begin();

    return () => {
      if (delayTimer !== undefined) clearTimeout(delayTimer);
      cancelAnimationFrame(raf);
    };
  }, [lines, hasSelection, isLoading]);

  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || !isLoading) return;

    let raf = 0;
    let lastPhase = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const phase = ((((now - start) / LOADING_ANIMATION_DURATION) % 1) + 1) % 1;

      if (phase < lastPhase) liveRef.current.loadingRows = getLoadingData(loadingPoints);
      lastPhase = phase;

      const foreground = liveRef.current.resolved?.tokens.foreground ?? "rgba(120, 120, 120, 1)";

      const w = chart.getWidth();
      const h = chart.getHeight();
      if (!w || !h) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const maxT = (w + h) / (2 * w);
      const center = phase * (maxT + 2 * LOADING_SHIMMER_BAND) - LOADING_SHIMMER_BAND;
      const clip = (peak: number) =>
        new echarts.graphic.LinearGradient(
          0,
          0,
          w,
          w,
          shimmerWindowStops(center, foreground, peak),
          true,
        );
      chart.setOption(
        {
          series: [
            {
              id: "__loading",
              data: loadingData(),
              lineStyle: { color: clip(LOADING_STROKE_OPACITY), width: 1 },
            },
          ],
        },
        { silent: true, lazyUpdate: true },
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isLoading, loadingPoints, loadingData]);

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

  // The status key takes the edge the series legend is not on, so the two never overlap.
  const statusKeyOnTop = legendSlot.present && legendSlot.verticalAlign === "bottom";
  const statusKey = !isLoading && (
    <DataStatusKey
      summary={keySummary}
      mark="line"
      text={statusText}
      extra={honestyEntries.length ? <HonestyKeyItems entries={honestyEntries} /> : undefined}
    />
  );

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
      aria-busy={isLoading}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {statusKeyOnTop && statusKey}

      <div
        className="relative min-h-0 w-full flex-1"
        role="img"
        aria-label={ariaLabel ?? defaultAriaLabel}
      >
        <div ref={mountRef} className="h-full min-h-0 w-full" />
      </div>

      {!statusKeyOnTop && statusKey}

      {zoomSlot.present && zoomSlot.showReset && zoomed && !isLoading && (
        <button
          type="button"
          className={ZOOM_RESET_CLASS}
          style={{ left: 16, ...(legendSlot.present && legendSlot.verticalAlign === "top" && legendSlot.align !== "right" ? { bottom: 12 } : { top: 12 }) }}
          onClick={() => echartsRef.current?.dispatchAction({ type: "dataZoom", start: 0, end: 100 })}
        >
          Reset zoom
        </button>
      )}

      {legendSlot.present && !isLoading && (
        <LegendOverlay
          seriesKeys={seriesKeys}
          config={config}
          variant={legendSlot.variant}
          align={legendSlot.align}
          verticalAlign={legendSlot.verticalAlign}
          selectedKey={selectedDataKey}
          hoveredKey={hoveredDataKey}
          isClickable={legendSlot.isClickable}
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

LineChart.Line = Line;
LineChart.Dot = Dot;
LineChart.ActiveDot = ActiveDot;
LineChart.XAxis = XAxis;
LineChart.YAxis = YAxis;
LineChart.Grid = Grid;
LineChart.Tooltip = Tooltip;
LineChart.Legend = Legend;
LineChart.Brush = Brush;
LineChart.Zoom = Zoom;
LineChart.ReferenceLine = ReferenceLine;
LineChart.ReferenceArea = ReferenceArea;
LineChart.ReferenceDot = ReferenceDot;
LineChart.PartialPeriod = PartialPeriod;
LineChart.Band = Band;
