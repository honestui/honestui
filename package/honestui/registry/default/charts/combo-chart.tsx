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
  type CSSProperties,
  type FC,
  type ReactNode,
} from "react";
import {
  buildChartCss,
  flattenColor,
  getColorsCount,
  resolveColors,
  seriesPaint,
  withAlpha,
  withChartFont,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/default/ui/charts/chart";
import { dotStyle, sampleGradient, type DotVariant } from "@/registry/default/ui/charts/dot";
import { LegendOverlay, type LegendVariant } from "@/registry/default/ui/charts/legend";
import {
  DataStatusKey,
  reportDataQualityIssues,
  resolveDataStatusText,
  statusFillStyles,
  STROKE_DASH,
  type DataQualitySummary,
  type RenderItemApi,
} from "@/registry/default/ui/charts/data-quality";
import {
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
  HONESTY_PREFIX,
  HonestyKeyItems,
  honestyNotesHtml,
  isLowSample,
  labelStride,
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
  type ReferenceSlots,
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
  useZoomWheelGuard,
  Zoom,
  ZOOM_RESET_CLASS,
  type ZoomSlot,
} from "@/registry/default/ui/charts/zoom";
import {
  BarChart as BarChartModule,
  CustomChart,
  LineChart as LineChartModule,
  type BarSeriesOption,
  type CustomSeriesOption,
  type LineSeriesOption,
} from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption, ImagePatternObject } from "echarts/core";
import * as echarts from "echarts/core";

export type {
  ChartConfig,
  DotVariant,
  LegendVariant,
  TooltipPosition,
  TooltipRoundness,
  TooltipVariant,
};

echarts.use([
  BarChartModule,
  LineChartModule,
  CustomChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

type EChartsInstance = ReturnType<typeof echarts.init>;

type EChartsOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | CustomSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | DataZoomComponentOption
>;

type ArrayItem<T> = T extends readonly (infer U)[] ? U : T;
type XAxisOption = ArrayItem<NonNullable<EChartsOption["xAxis"]>>;
type YAxisOption = ArrayItem<NonNullable<EChartsOption["yAxis"]>>;

const GRAY = "rgba(120, 120, 120, 1)";
const DEFAULT_BAR_RADIUS = 2;
const LINE_STROKE_WIDTH = 1.5;
const POINTER_STROKE_WIDTH = 0.8;
const SELECTION_DIM = 0.3;
const HOVER_BLUR = 0.3;
const REVEAL_DURATION = 600;
const BAR_STAGGER = 40;
const BRUSH_FILL_OPACITY = 0.5;
const LOADING_BARS = 12;
// A fixed silhouette, so the placeholder never jumps between renders.
const LOADING_SHAPE = [42, 55, 48, 63, 58, 71, 52, 66, 74, 61, 69, 78];

export type ComboBarVariant = "default" | "gradient" | "hatched" | "duotone";
export type ComboCurveType = "linear" | "smooth" | "step";
export type ComboStrokeVariant = "solid" | "dashed";
export type ComboAxisId = "left" | "right";
export type ComboStackType = "default" | "stacked";

export interface ComboChartProps<TData extends Record<string, unknown>> {
  /** Rows of data, one per category. */
  data: TData[];
  /** Labels and theme colors for every bar and line key. */
  config: ChartConfig;
  /** The category field shown on the x-axis. */
  xDataKey?: keyof TData & string;
  className?: string;
  /** Stacks every bar series that shares an axis. Lines are never stacked. */
  stackType?: ComboStackType;
  /** Default corner radius for bars. */
  barRadius?: number;
  /** Default curve for lines. */
  curveType?: ComboCurveType;
  barGap?: number;
  barCategoryGap?: number;
  animation?: boolean;
  defaultSelectedDataKey?: string | null;
  onSelectionChange?: (key: string | null) => void;
  isLoading?: boolean;
  /** Charts that share a `syncId` show their crosshair and tooltip at the same category. */
  syncId?: string;
  ariaLabel?: string;
  /**
   * Shade stretches where every series is empty. With `{ interval }`, rows
   * absent from a time series are put back and shown as gaps too.
   */
  gaps?: GapsOption;
  /** Rewords the partial-period, interval, gap, axis, and sample-size text. */
  honestyText?: ComboHonestyText;
  /** Escape hatch merged over the generated ECharts option. */
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

/** The shared honesty text, plus a notice for each side when the chart has two value axes. */
export type ComboHonestyText = ChartHonestyText & {
  leftAxisStartsAt?: (value: string) => string;
  leftAxisEndsAt?: (value: string) => string;
  leftAxisDescription?: (value: string) => string;
  rightAxisStartsAt?: (value: string) => string;
  rightAxisEndsAt?: (value: string) => string;
  rightAxisDescription?: (value: string) => string;
};

type ComboAxisText = Required<Omit<ComboHonestyText, keyof ChartHonestyText>>;
type ResolvedComboHonestyText = ResolvedChartHonestyText & ComboAxisText;

const COMBO_AXIS_TEXT: ComboAxisText = {
  leftAxisStartsAt: (value) => `Left axis starts at ${value}`,
  leftAxisEndsAt: (value) => `Left axis ends at ${value}`,
  leftAxisDescription: (value) =>
    `The left axis stops at ${value} instead of zero, so differences look larger than they are.`,
  rightAxisStartsAt: (value) => `Right axis starts at ${value}`,
  rightAxisEndsAt: (value) => `Right axis ends at ${value}`,
  rightAxisDescription: (value) =>
    `The right axis stops at ${value} instead of zero, so differences look larger than they are.`,
};

function resolveComboHonestyText(text?: ComboHonestyText): ResolvedComboHonestyText {
  const axisText = { ...COMBO_AXIS_TEXT };
  for (const key of Object.keys(COMBO_AXIS_TEXT) as (keyof ComboAxisText)[]) {
    const value = text?.[key];
    if (value) axisText[key] = value;
  }
  return { ...resolveHonestyText(text), ...axisText };
}

/** Sample-size props shared by `ComboChart.Bar` and `ComboChart.Line`. */
export interface ComboSampleSizeProps {
  /** The row field with the number of observations behind each value. */
  sampleSizeKey?: string;
  /** Values with fewer observations get a dashed mark and a key entry. */
  minSampleSize?: number;
  /** `"label"` writes n beside each value; `"tooltip"` keeps it in the tooltip. */
  sampleSizeDisplay?: SampleSizeDisplay;
}

export interface ComboBarProps extends ComboSampleSizeProps {
  dataKey: string;
  variant?: ComboBarVariant;
  radius?: number;
  /** Which value axis the bar is measured against. */
  yAxisId?: ComboAxisId;
  isClickable?: boolean;
  enableHoverHighlight?: boolean;
  /** A field holding the same measure for an earlier period, drawn as a tick across the bar. */
  compareDataKey?: string;
}

const Bar: FC<ComboBarProps> = () => null;
Bar.displayName = "ComboChart.Bar";

export interface ComboLineProps extends ComboSampleSizeProps {
  dataKey: string;
  curveType?: ComboCurveType;
  strokeVariant?: ComboStrokeVariant;
  strokeWidth?: number;
  /** Which value axis the line is measured against. */
  yAxisId?: ComboAxisId;
  isClickable?: boolean;
  connectNulls?: boolean;
  /** A field holding the same measure for an earlier period, drawn as a faded dashed line. */
  compareDataKey?: string;
  /** `ComboChart.Dot` and `ComboChart.ActiveDot`. */
  children?: ReactNode;
}

const Line: FC<ComboLineProps> = () => null;
Line.displayName = "ComboChart.Line";

export interface ComboDotProps {
  variant?: DotVariant;
}

const Dot: FC<ComboDotProps> = () => null;
Dot.displayName = "ComboChart.Dot";
const ActiveDot: FC<ComboDotProps> = () => null;
ActiveDot.displayName = "ComboChart.ActiveDot";

export interface ComboXAxisProps {
  dataKey?: string;
  tickFormatter?: (value: string, index: number) => string;
  label?: string;
  hideDots?: boolean;
}

const XAxis: FC<ComboXAxisProps> = () => null;
XAxis.displayName = "ComboChart.XAxis";

export interface ComboYAxisProps {
  /** `left` (default) or `right`. Add one YAxis per side. */
  yAxisId?: ComboAxisId;
  tickFormatter?: (value: number, index: number) => string;
  label?: string;
  hideDots?: boolean;
  /**
   * The axis start. `"auto"` fits it to the series on this axis. An axis that
   * measures bars always includes zero: `"auto"` is ignored there, and a start
   * above zero is kept but flagged.
   */
  min?: number | "auto";
  max?: number;
  /** `"off"` hides the notice and break mark for an axis that does not reach zero. */
  truncationNotice?: "auto" | "off";
}

const YAxis: FC<ComboYAxisProps> = () => null;
YAxis.displayName = "ComboChart.YAxis";

const Grid: FC = () => null;
Grid.displayName = "ComboChart.Grid";

export interface ComboTooltipProps {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  position?: TooltipPosition;
  /** Draws the dashed crosshair line. */
  cursor?: boolean;
  defaultIndex?: number;
  /** Formats each value. Receives the series key, so bars and lines can use different units. */
  valueFormatter?: (value: number, dataKey: string) => string;
  /** Formats the category shown as the tooltip title. */
  labelFormatter?: (label: string) => string;
}

const Tooltip: FC<ComboTooltipProps> = () => null;
Tooltip.displayName = "ComboChart.Tooltip";

export interface ComboLegendProps {
  variant?: LegendVariant;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  isClickable?: boolean;
}

const Legend: FC<ComboLegendProps> = () => null;
Legend.displayName = "ComboChart.Legend";

type SampleSizeConfig = {
  sampleSizeKey?: string;
  minSampleSize?: number;
  sampleSizeDisplay: SampleSizeDisplay;
};
type BarConfig = Required<
  Omit<ComboBarProps, "radius" | "compareDataKey" | keyof ComboSampleSizeProps>
> & {
  radius?: number;
  compareDataKey?: string;
} & SampleSizeConfig;
type LineConfig = {
  dataKey: string;
  curveType?: ComboCurveType;
  strokeVariant: ComboStrokeVariant;
  strokeWidth: number;
  yAxisId: ComboAxisId;
  isClickable: boolean;
  connectNulls: boolean;
  compareDataKey?: string;
  dotVariant: DotVariant;
  activeDotVariant: DotVariant;
} & SampleSizeConfig;
type XAxisSlot = { present: boolean } & Omit<ComboXAxisProps, "hideDots"> & { hideDots: boolean };
type YAxisSlot = { present: boolean } & Omit<ComboYAxisProps, "hideDots" | "yAxisId"> & {
  hideDots: boolean;
  truncationNotice: "auto" | "off";
};
type TooltipSlot = {
  present: boolean;
  variant: TooltipVariant;
  roundness: TooltipRoundness;
  position: TooltipPosition;
  cursor: boolean;
  defaultIndex?: number;
  valueFormatter?: (value: number, dataKey: string) => string;
  labelFormatter?: (label: string) => string;
};
type LegendSlot = {
  present: boolean;
  variant: LegendVariant;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  isClickable: boolean;
};
type BrushSlot = { present: boolean } & BrushProps;

type CollectedConfig = {
  bars: BarConfig[];
  lines: LineConfig[];
  xAxis: XAxisSlot;
  yAxes: Record<ComboAxisId, YAxisSlot>;
  showGrid: boolean;
  tooltip: TooltipSlot;
  legend: LegendSlot;
  brush: BrushSlot;
};

function collectConfig(children: ReactNode): CollectedConfig {
  const bars: BarConfig[] = [];
  const lines: LineConfig[] = [];
  let xAxis: XAxisSlot = { present: false, hideDots: false };
  const yAxes: Record<ComboAxisId, YAxisSlot> = {
    left: { present: false, hideDots: false, truncationNotice: "auto" },
    right: { present: false, hideDots: false, truncationNotice: "auto" },
  };
  let showGrid = false;
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
    position: "variable",
    cursor: true,
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
    if (type === Bar) {
      const p = child.props as ComboBarProps;
      bars.push({
        dataKey: p.dataKey,
        variant: p.variant ?? "default",
        radius: p.radius,
        yAxisId: p.yAxisId ?? "left",
        isClickable: p.isClickable ?? false,
        enableHoverHighlight: p.enableHoverHighlight ?? false,
        compareDataKey: p.compareDataKey,
        sampleSizeKey: p.sampleSizeKey,
        minSampleSize: p.minSampleSize,
        sampleSizeDisplay: p.sampleSizeDisplay ?? "label",
      });
    } else if (type === Line) {
      const p = child.props as ComboLineProps;
      let dotVariant: DotVariant = "none";
      let activeDotVariant: DotVariant = "default";
      Children.forEach(p.children, (dot) => {
        if (!isValidElement(dot)) return;
        if (dot.type === Dot) dotVariant = (dot.props as ComboDotProps).variant ?? "default";
        if (dot.type === ActiveDot) {
          activeDotVariant = (dot.props as ComboDotProps).variant ?? "default";
        }
      });
      lines.push({
        dataKey: p.dataKey,
        curveType: p.curveType,
        strokeVariant: p.strokeVariant ?? "solid",
        strokeWidth: p.strokeWidth ?? LINE_STROKE_WIDTH,
        yAxisId: p.yAxisId ?? "left",
        isClickable: p.isClickable ?? false,
        connectNulls: p.connectNulls ?? false,
        compareDataKey: p.compareDataKey,
        dotVariant,
        activeDotVariant,
        sampleSizeKey: p.sampleSizeKey,
        minSampleSize: p.minSampleSize,
        sampleSizeDisplay: p.sampleSizeDisplay ?? "label",
      });
    } else if (type === XAxis) {
      const p = child.props as ComboXAxisProps;
      xAxis = { ...p, present: true, hideDots: p.hideDots ?? false };
    } else if (type === YAxis) {
      const p = child.props as ComboYAxisProps;
      const id = p.yAxisId ?? "left";
      yAxes[id] = {
        present: true,
        tickFormatter: p.tickFormatter,
        label: p.label,
        min: p.min,
        max: p.max,
        hideDots: p.hideDots ?? false,
        truncationNotice: p.truncationNotice ?? "auto",
      };
    } else if (type === Grid) {
      showGrid = true;
    } else if (type === Tooltip) {
      const p = child.props as ComboTooltipProps;
      tooltip = {
        present: true,
        variant: p.variant ?? "default",
        roundness: p.roundness ?? "lg",
        position: p.position ?? "variable",
        cursor: p.cursor ?? true,
        defaultIndex: p.defaultIndex,
        valueFormatter: p.valueFormatter,
        labelFormatter: p.labelFormatter,
      };
    } else if (type === Legend) {
      const p = child.props as ComboLegendProps;
      legend = {
        present: true,
        variant: p.variant ?? "rounded-square",
        align: p.align ?? "right",
        verticalAlign: p.verticalAlign ?? "top",
        isClickable: p.isClickable ?? false,
      };
    } else if (type === Brush) {
      const p = child.props as BrushProps;
      brush = { present: true, ...p };
    }
  });

  return { bars, lines, xAxis, yAxes, showGrid, tooltip, legend, brush };
}

function hatchedPattern(color: string): ImagePatternObject | null {
  if (typeof document === "undefined") return null;
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.width = 5 * dpr;
  canvas.height = 5 * dpr;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = withAlpha(color, 0.3);
  ctx.fillRect(0, 0, 5, 5);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1.5, 5);
  return {
    image: canvas,
    repeat: "repeat",
    rotation: -Math.PI / 4,
    scaleX: 1 / dpr,
    scaleY: 1 / dpr,
  };
}

function barPaint(
  variant: ComboBarVariant,
  slots: string[],
): string | echarts.graphic.LinearGradient | ImagePatternObject {
  const base = slots[0] ?? GRAY;
  switch (variant) {
    case "gradient":
      return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: sampleGradient(slots, 0) },
        { offset: 1, color: withAlpha(sampleGradient(slots, 1), 0.15) },
      ]);
    case "hatched":
      return hatchedPattern(base) ?? base;
    case "duotone":
      return new echarts.graphic.LinearGradient(1, 0, 0, 0, [
        { offset: 0, color: base },
        { offset: 0.5, color: base },
        { offset: 0.5, color: withAlpha(base, 0.4) },
        { offset: 1, color: withAlpha(base, 0.4) },
      ]);
    default:
      if (slots.length <= 1) return base;
      return new echarts.graphic.LinearGradient(
        0,
        0,
        0,
        1,
        slots.map((color, i) => ({ offset: i / (slots.length - 1), color })),
      );
  }
}

function curveOf(curve: ComboCurveType): { smooth: boolean; step: "middle" | false } {
  if (curve === "step") return { smooth: false, step: "middle" };
  return { smooth: curve === "smooth", step: false };
}

type ComboBand = {
  index: number;
  dataKey?: string;
  label: string;
  color?: string;
  bounds: ({ lower: number; upper: number } | null)[];
  runs: BandRun[];
  axisIndex: number;
  curve: ComboCurveType;
};

type AxisPlan = {
  min?: number;
  max?: number;
  truncatedAt: number | null;
  show: boolean;
  label: string;
  description: string;
};

type ComboHonesty = {
  text: ResolvedComboHonestyText;
  partial: { start: number; label: string; note: string } | null;
  bands: ComboBand[];
  gaps: GapSpan[];
  gapLabel: string;
  axes: Record<ComboAxisId, AxisPlan>;
  sampleSizes: Record<string, (number | null)[]>;
  /** A partial period or gap shading reads every value as a claim: nothing is bridged. */
  tracked: boolean;
};

const BAND_FILL_OPACITY = 0.12;
const BAND_EDGE_OPACITY = 0.35;
const PARTIAL_FILL_OPACITY = 0.035;
const GAP_HATCH_OPACITY = 0.11;

type BuildContext = {
  data: Record<string, unknown>[];
  config: ChartConfig;
  collected: CollectedConfig;
  categories: string[];
  resolved: ResolvedColors;
  selectedKey: string | null;
  isStacked: boolean;
  barRadius: number;
  curveType: ComboCurveType;
  barGap?: number;
  barCategoryGap?: number;
  isLoading: boolean;
  showBrush: boolean;
  brushHeight: number;
  brushRange: BrushRange;
  hasRight: boolean;
  references: ReferenceSlots | null;
  zoom: ZoomSlot;
  honesty: ComboHonesty;
};

function seriesLabel(config: ChartConfig, key: string): string {
  const label = config[key]?.label;
  return typeof label === "string" ? label : key;
}

function buildLayout(ctx: BuildContext) {
  const { legend, xAxis } = ctx.collected;
  const legendTop = legend.present && legend.verticalAlign === "top";
  const legendBottom = legend.present && legend.verticalAlign === "bottom";
  const brushGap = ctx.showBrush ? ctx.brushHeight + 30 + (xAxis.label ? 22 : 0) : 0;
  const grid: GridComponentOption = {
    left: 8,
    right: 8,
    top: legendTop ? 42 : 16,
    bottom: 8 + brushGap + (legendBottom ? 34 : 0),
  };
  return { grid, brushBottom: legendBottom ? 34 : 6 };
}

function buildAxes(ctx: BuildContext): { xAxis: XAxisOption; yAxes: YAxisOption[] } {
  const { collected, resolved, isLoading, categories } = ctx;
  const { tokens } = resolved;
  const labelColor = tokens.mutedForeground;
  const split = tokens.border;
  const tickDot = flattenColor(split, tokens.background);
  const xSlot = collected.xAxis;
  const xFormat = xSlot.tickFormatter;

  const xAxis: XAxisOption = {
    type: "category",
    boundaryGap: true,
    data: isLoading ? LOADING_SHAPE.map((_, i) => String(i)) : categories,
    name: isLoading ? undefined : xSlot.label,
    nameLocation: "middle",
    nameGap: 30,
    nameTextStyle: { color: labelColor, fontSize: 10 },
    axisLine: { show: false },
    axisTick: {
      show: !isLoading && xSlot.present && !xSlot.hideDots,
      alignWithLabel: true,
      length: 0.5,
      lineStyle: { color: tickDot, width: 3, cap: "round" },
    },
    splitLine: { show: false },
    axisLabel: {
      show: !isLoading && xSlot.present,
      color: labelColor,
      fontSize: 10,
      margin: 8,
      formatter: xFormat ? (value: string, index: number) => xFormat(value, index) : undefined,
    },
  };

  const valueAxis = (id: ComboAxisId, index: number): YAxisOption => {
    const slot = collected.yAxes[id];
    const format = slot.tickFormatter;
    return {
      type: "value",
      position: id,
      show: slot.present || (index === 0 && collected.showGrid),
      min: isLoading ? undefined : ctx.honesty.axes[id].min,
      max: isLoading ? undefined : ctx.honesty.axes[id].max,
      // The right axis picks ticks that land on the left axis's grid lines,
      // so one set of dashed lines serves both scales.
      alignTicks: index > 0 ? true : undefined,
      name: isLoading ? undefined : slot.label,
      nameLocation: "middle",
      nameGap: 38,
      nameRotate: id === "right" ? -90 : 90,
      nameTextStyle: { color: labelColor, fontSize: 10 },
      axisLine: { show: false },
      axisTick: {
        show: slot.present && !isLoading && !slot.hideDots,
        length: 0.5,
        lineStyle: { color: tickDot, width: 3, cap: "round" },
      },
      splitLine: {
        show: index === 0 && collected.showGrid && !isLoading,
        lineStyle: { color: split, type: [3, 3], width: 1 },
      },
      axisLabel: {
        show: slot.present && !isLoading,
        color: labelColor,
        fontSize: 10,
        margin: 8,
        formatter: format ? (value: number, i: number) => format(value, i) : undefined,
      },
    };
  };

  const yAxes = [valueAxis("left", 0)];
  if (ctx.hasRight) yAxes.push(valueAxis("right", 1));
  return { xAxis, yAxes };
}

function axisIndexOf(ctx: BuildContext, id: ComboAxisId): number {
  return id === "right" && ctx.hasRight ? 1 : 0;
}

function buildSeries(ctx: BuildContext): (BarSeriesOption | LineSeriesOption | CustomSeriesOption)[] {
  const { data, config, collected, resolved, selectedKey, honesty } = ctx;
  const { partial } = honesty;
  const hasSelection = selectedKey !== null;
  const background = resolved.tokens.background;
  const dimFor = (key: string) => (selectedKey === null || selectedKey === key ? 1 : SELECTION_DIM);

  const bars = collected.bars.map((bar, barIndex): BarSeriesOption => {
    const key = bar.dataKey;
    const slots = resolved.series[key] ?? [GRAY];
    const radius = bar.radius ?? ctx.barRadius;
    const stacked = ctx.isStacked;
    // A stacked column rounds only its top segment.
    const isTop =
      !stacked ||
      collected.bars.filter((b) => b.yAxisId === bar.yAxisId).slice(-1)[0]?.dataKey === key;
    const hover = bar.enableHoverHighlight && !hasSelection;
    return {
      id: key,
      name: seriesLabel(config, key),
      type: "bar",
      yAxisIndex: axisIndexOf(ctx, bar.yAxisId),
      // An absent value is an empty slot, never a zero bar. Bars in an open
      // period take the provisional hatch.
      data: data.map((row, index) => {
        const value = readValue(row[key]);
        if (value === null || !partial || index < partial.start) return value;
        return {
          value,
          itemStyle: {
            ...statusFillStyles(slots[0] ?? GRAY).provisional,
            borderRadius: isTop ? [radius, radius, 0, 0] : 0,
            opacity: dimFor(key),
          },
        };
      }),
      stack: stacked ? `__stack-${bar.yAxisId}` : undefined,
      barGap: ctx.barGap,
      barCategoryGap: ctx.barCategoryGap,
      cursor: bar.isClickable ? "pointer" : "default",
      z: 2,
      itemStyle: {
        color: barPaint(bar.variant, slots),
        borderRadius: isTop ? [radius, radius, 0, 0] : 0,
        opacity: dimFor(key),
      },
      emphasis: hover
        ? { focus: "self", blurScope: "coordinateSystem" }
        : { disabled: true },
      blur: hover ? { itemStyle: { opacity: HOVER_BLUR } } : undefined,
      animationDuration: REVEAL_DURATION,
      animationEasing: "cubicOut",
      animationDelay: (idx: number) => idx * BAR_STAGGER + barIndex * 20,
    };
  });

  const lines = collected.lines.map((line): LineSeriesOption => {
    const key = line.dataKey;
    const slots = resolved.series[key] ?? [GRAY];
    const paint = seriesPaint(slots);
    const curve = curveOf(line.curveType ?? ctx.curveType);
    const resting = dotStyle(line.dotVariant, paint, background);
    const active = dotStyle(
      line.activeDotVariant === "none" ? "default" : line.activeDotVariant,
      paint,
      background,
    );
    const showResting = line.dotVariant !== "none";
    const opacity = dimFor(key);
    // With an open period, the stroke is drawn by the two runs below; this
    // series keeps the points, the hover, and the tooltip.
    const split = partial !== null && partial.start < data.length;
    return {
      id: key,
      name: seriesLabel(config, key),
      type: "line",
      yAxisIndex: axisIndexOf(ctx, line.yAxisId),
      data: data.map((row) => readValue(row[key])),
      smooth: curve.smooth,
      step: curve.step,
      connectNulls: honesty.tracked ? false : line.connectNulls,
      cursor: line.isClickable ? "pointer" : "default",
      triggerEvent: line.isClickable,
      showSymbol: showResting,
      symbol: "circle",
      symbolSize: showResting ? resting.size : active.size,
      // Lines draw over bars so a trend is never hidden behind a column.
      z: 4,
      lineStyle: {
        color: paint,
        width: line.strokeWidth,
        type: line.strokeVariant === "dashed" ? [4, 3] : "solid",
        opacity: split ? 0 : opacity,
        cap: "round",
        join: "round",
      },
      itemStyle: { ...(showResting ? resting.itemStyle : active.itemStyle), opacity },
      emphasis: {
        focus: "none",
        scale: showResting ? active.size / Math.max(resting.size, 1) : 1,
        itemStyle: { ...active.itemStyle, opacity: 1 },
      },
      animationDuration: REVEAL_DURATION + 300,
      animationEasing: "cubicOut",
    };
  });

  // The earlier period of a line: its color, faded and finely dashed, under
  // the line and silent, so hover only ever hits the current period.
  const lineGhosts = collected.lines.flatMap((line): LineSeriesOption[] => {
    if (!line.compareDataKey) return [];
    const curve = curveOf(line.curveType ?? ctx.curveType);
    return [
      {
        id: compareSeriesId(line.dataKey),
        type: "line",
        yAxisIndex: axisIndexOf(ctx, line.yAxisId),
        data: compareValues(data, line.compareDataKey),
        smooth: curve.smooth,
        step: curve.step,
        connectNulls: line.connectNulls,
        silent: true,
        showSymbol: false,
        symbol: "none",
        z: 3,
        tooltip: { show: false },
        lineStyle: {
          color: (resolved.series[line.dataKey] ?? [GRAY])[0],
          width: line.strokeWidth,
          opacity: COMPARE_OPACITY * dimFor(line.dataKey),
          type: COMPARE_DASH,
          cap: "round",
        },
        emphasis: { disabled: true },
      },
    ];
  });

  // The earlier period of a bar: a short tick across its column. Stacked
  // segments compare in the tooltip only.
  const layout = {
    count: collected.bars.length,
    ...(ctx.barGap !== undefined ? { barGap: ctx.barGap } : {}),
    ...(ctx.barCategoryGap !== undefined ? { barCategoryGap: ctx.barCategoryGap } : {}),
  };
  const barTicks = ctx.isStacked
    ? []
    : collected.bars.flatMap((bar, position): CustomSeriesOption[] => {
        if (!bar.compareDataKey) return [];
        const style = {
          stroke: withAlpha(resolved.tokens.foreground, 0.7),
          lineWidth: 2,
          lineCap: "round" as const,
          opacity: dimFor(bar.dataKey),
        };
        const values = compareValues(data, bar.compareDataKey);
        return [
          {
            id: compareSeriesId(bar.dataKey),
            type: "custom",
            yAxisIndex: axisIndexOf(ctx, bar.yAxisId),
            data: values.flatMap((value, index) => (value === null ? [] : [[index, value]])),
            encode: { x: 0, y: 1 },
            silent: true,
            z: 5,
            tooltip: { show: false },
            renderItem: (_params, api) => {
              const index = api.value(0) as number;
              const value = api.value(1) as number;
              const slot = (api as unknown as RenderItemApi).barLayout(layout)?.[position];
              const [px, py] = api.coord([index, value]);
              const half = (slot?.width ?? 8) / 2 + 2;
              const shift = slot?.offsetCenter ?? 0;
              return {
                type: "line",
                shape: { x1: px + shift - half, y1: py, x2: px + shift + half, y2: py },
                style,
              };
            },
          },
        ];
      });

  // An open period splits each line's stroke: solid up to the last closed
  // row, short dashes from there on, as Data Status draws provisional values.
  const lineRuns = partial
    ? collected.lines.flatMap((line): LineSeriesOption[] => {
        if (partial.start >= data.length) return [];
        const key = line.dataKey;
        const values = data.map((row) => readValue(row[key]));
        const curve = curveOf(line.curveType ?? ctx.curveType);
        const paint = seriesPaint(resolved.series[key] ?? [GRAY]);
        const run = (id: string, runValues: (number | null)[], dashed: boolean): LineSeriesOption => ({
          id,
          type: "line",
          yAxisIndex: axisIndexOf(ctx, line.yAxisId),
          data: runValues,
          smooth: curve.smooth,
          step: curve.step,
          connectNulls: false,
          silent: true,
          showSymbol: false,
          symbol: "none",
          z: 4,
          tooltip: { show: false },
          lineStyle: {
            color: paint,
            width: line.strokeWidth,
            type: dashed ? STROKE_DASH.provisional : "solid",
            opacity: dimFor(key),
            cap: "round",
            join: "round",
          },
          emphasis: { disabled: true },
          animationDuration: REVEAL_DURATION + 300,
          animationEasing: "cubicOut",
        });
        const closed = values.map((value, i) => (i < partial.start ? value : null));
        const open = values.map((value, i) => (i >= partial.start - 1 ? value : null));
        return [
          ...(partial.start > 0 ? [run(`${HONESTY_PREFIX}closed-${key}`, closed, false)] : []),
          run(`${HONESTY_PREFIX}open-${key}`, open, true),
        ];
      })
    : [];

  return [
    ...buildHonestyRegions(ctx),
    ...bars,
    ...lines,
    ...lineRuns,
    ...lineGhosts,
    ...barTicks,
    ...buildSampleSeries(ctx),
  ];
}

// Bands, the open period, gap hatching, and axis breaks: the marks that sit
// behind or beside the series.
function buildHonestyRegions(ctx: BuildContext): CustomSeriesOption[] {
  const { honesty, resolved, selectedKey } = ctx;
  const { tokens } = resolved;
  const out: CustomSeriesOption[] = [];

  for (const band of honesty.bands) {
    const color = band.color
      ? (resolved.series[band.color]?.[0] ?? band.color)
      : band.dataKey
        ? (resolved.series[band.dataKey]?.[0] ?? tokens.foreground)
        : tokens.foreground;
    const dim = band.dataKey && selectedKey !== null && selectedKey !== band.dataKey ? SELECTION_DIM : 1;
    const curve = curveOf(band.curve);
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
    if (series) out.push({ ...series, yAxisIndex: band.axisIndex });
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

  if (honesty.axes.left.show) {
    out.push(axisBreakSeries({ stroke: tokens.mutedForeground, background: tokens.background, z: 6 }));
  }
  if (ctx.hasRight && honesty.axes.right.show) {
    out.push(rightAxisBreakSeries({ stroke: tokens.mutedForeground, background: tokens.background, z: 6 }));
  }
  return out;
}

// The shared break mark sits at the left end of the baseline; a right axis
// that does not reach zero gets the same mark at the right end.
function rightAxisBreakSeries(params: { stroke: string; background: string; z: number }): CustomSeriesOption {
  const { stroke, background, z } = params;
  return {
    id: `${HONESTY_PREFIX}axis-break-right`,
    type: "custom",
    data: [[0]],
    encode: { x: 0 },
    silent: true,
    clip: false,
    z,
    tooltip: { show: false },
    renderItem: (itemParams) => {
      const grid = itemParams.coordSys as unknown as { x: number; y: number; width: number; height: number };
      const x = grid.x + grid.width - 10;
      const y = grid.y + grid.height;
      const slash = (dx: number) => ({
        type: "line" as const,
        shape: { x1: x + dx - 2.5, y1: y + 3.5, x2: x + dx + 2.5, y2: y - 3.5 },
        style: { stroke, lineWidth: 1, lineCap: "round" as const },
      });
      return {
        type: "group",
        children: [
          { type: "rect", shape: { x: x - 1, y: y - 1.5, width: 6, height: 3 }, style: { fill: background } },
          slash(0),
          slash(4),
        ],
      };
    },
  };
}

// n beside each value, thinned so labels never collide, and a dashed mark on
// values below the minimum. Stacked bars keep n in the tooltip: a label per
// segment would sit inside the column.
function buildSampleSeries(ctx: BuildContext): CustomSeriesOption[] {
  const { data, collected, resolved, selectedKey, honesty } = ctx;
  const { tokens } = resolved;
  const dimFor = (key: string) => (selectedKey === null || selectedKey === key ? 1 : SELECTION_DIM);
  const format = (count: number) => honesty.text.sampleSize(formatCount(count));
  const out: CustomSeriesOption[] = [];

  for (const line of collected.lines) {
    const sizes = honesty.sampleSizes[line.dataKey];
    if (!sizes) continue;
    const series = sampleSizeSeries({
      dataKey: line.dataKey,
      values: data.map((row) => readValue(row[line.dataKey])),
      sizes,
      minSampleSize: line.minSampleSize,
      showLabels: line.sampleSizeDisplay === "label",
      format,
      labelColor: tokens.mutedForeground,
      ringColor: (resolved.series[line.dataKey] ?? [GRAY])[0],
      background: tokens.background,
      opacity: dimFor(line.dataKey),
      z: 5,
    });
    if (series) out.push({ ...series, yAxisIndex: axisIndexOf(ctx, line.yAxisId) });
  }

  // Grouped bars sit side by side; stacked bars share one column per axis.
  const stacks = Array.from(new Set(collected.bars.map((bar) => axisIndexOf(ctx, bar.yAxisId))));
  const layout = {
    count: ctx.isStacked ? stacks.length : collected.bars.length,
    ...(ctx.barGap !== undefined ? { barGap: ctx.barGap } : {}),
    ...(ctx.barCategoryGap !== undefined ? { barCategoryGap: ctx.barCategoryGap } : {}),
  };
  collected.bars.forEach((bar, barIndex) => {
    const sizes = honesty.sampleSizes[bar.dataKey];
    if (!sizes) return;
    const axisIndex = axisIndexOf(ctx, bar.yAxisId);
    const position = ctx.isStacked ? stacks.indexOf(axisIndex) : barIndex;
    const below = ctx.isStacked
      ? collected.bars.slice(0, barIndex).filter((other) => axisIndexOf(ctx, other.yAxisId) === axisIndex)
      : [];
    const showLabels = bar.sampleSizeDisplay === "label" && !ctx.isStacked;
    const items = data.flatMap((row, index) => {
      const value = readValue(row[bar.dataKey]);
      const n = sizes[index];
      if (value === null || n === null) return [];
      const low = isLowSample(n, bar.minSampleSize);
      if (!showLabels && !low) return [];
      const base = below.reduce((sum, other) => sum + (readValue(row[other.dataKey]) ?? 0), 0);
      return [[index, base, base + value, n, low ? 1 : 0]];
    });
    if (!items.length) return;
    const ring = (resolved.series[bar.dataKey] ?? [GRAY])[0];
    out.push({
      id: `${HONESTY_PREFIX}n-${bar.dataKey}`,
      type: "custom",
      yAxisIndex: axisIndex,
      data: items,
      encode: { x: 0, y: [1, 2] },
      silent: true,
      clip: false,
      z: 5,
      tooltip: { show: false },
      renderItem: (_params, api) => {
        const index = api.value(0) as number;
        const from = api.value(1) as number;
        const to = api.value(2) as number;
        const n = api.value(3) as number;
        const low = api.value(4) === 1;
        const slot = (api as unknown as RenderItemApi).barLayout(layout)?.[position];
        const width = slot?.width ?? 8;
        const [cx, yTo] = api.coord([index, to]);
        const [, yFrom] = api.coord([index, from]);
        const x = cx + (slot?.offsetCenter ?? 0);
        const top = Math.min(yFrom, yTo);
        const height = Math.abs(yFrom - yTo);
        const category = (api.size?.([1, 0]) as number[] | undefined)?.[0] ?? 40;
        const stride = labelStride(category);
        const children: unknown[] = [];
        if (low) {
          children.push({
            type: "rect",
            shape: { x: x - width / 2 - 1.5, y: top - 1.5, width: width + 3, height: height + 3, r: 2 },
            style: { fill: "none", stroke: ring, lineWidth: 1.25, lineDash: [3, 2] },
          });
        }
        if (showLabels && (low || index % stride === 0)) {
          const negative = to < from;
          children.push({
            type: "text",
            style: {
              text: format(n),
              x,
              y: negative ? yTo + (low ? 5 : 3) : yTo - (low ? 5 : 3),
              fill: tokens.mutedForeground,
              fontSize: 9,
              align: "center",
              verticalAlign: negative ? "top" : "bottom",
            },
          });
        }
        return { type: "group", children, style: { opacity: dimFor(bar.dataKey) } } as unknown as ReturnType<
          NonNullable<CustomSeriesOption["renderItem"]>
        >;
      },
    });
  });
  return out;
}

function buildTooltip(ctx: BuildContext): TooltipComponentOption {
  const { collected, config, resolved, selectedKey, isLoading } = ctx;
  const slot = collected.tooltip;
  const format = slot.valueFormatter;
  const compareKeys = new Map(
    [...collected.bars, ...collected.lines].flatMap((series) =>
      series.compareDataKey ? [[series.dataKey, series.compareDataKey] as const] : [],
    ),
  );

  return {
    ...tooltipBaseOption({
      present: slot.present && !isLoading,
      cursor: slot.cursor,
      tokens: resolved.tokens,
      position: slot.position,
      axisPointerColor: resolved.tokens.border,
      strokeWidth: POINTER_STROKE_WIDTH,
    }),
    formatter: (params: unknown) => {
      const rows = (Array.isArray(params) ? params : [params]) as {
        seriesId?: string;
        axisValue?: string;
        name?: string;
        value?: number | null;
        dataIndex?: number;
      }[];
      const first = rows[0];
      if (!first) return "";
      const rawLabel = String(first.axisValue ?? first.name ?? "");
      const label = escapeHtml(slot.labelFormatter ? slot.labelFormatter(rawLabel) : rawLabel);
      const { honesty } = ctx;
      const rowIndex = rows
        .map((p) => p.dataIndex)
        .find((index): index is number => typeof index === "number");
      const inPartial = honesty.partial !== null && rowIndex !== undefined && rowIndex >= honesty.partial.start;
      let lowSampleMin: number | null = null;
      const minSampleFor = new Map(
        [...collected.bars, ...collected.lines].map((series) => [series.dataKey, series.minSampleSize]),
      );
      const body = rows
        .filter((p) => !String(p.seriesId ?? "").startsWith("__"))
        .map((p) => {
          const key = p.seriesId ?? "";
          const item = config[key];
          const hasValue = typeof p.value === "number" && Number.isFinite(p.value);
          const value = hasValue
            ? format
              ? format(p.value as number, key)
              : (p.value as number).toLocaleString()
            : "—";
          const dimmed = selectedKey !== null && selectedKey !== key ? " opacity-30" : "";
          const compareKey = compareKeys.get(key);
          const row = typeof p.dataIndex === "number" ? ctx.data[p.dataIndex] : undefined;
          const comparison = compareKey
            ? comparisonDetailHtml({
                current: readCompareValue(row, key),
                previous: readCompareValue(row, compareKey),
                label: compareLabel(config, compareKey),
                format: format ? (v) => format(v, key) : undefined,
                dimmed,
              })
            : "";
          const index = p.dataIndex;
          const n = typeof index === "number" ? honesty.sampleSizes[key]?.[index] : undefined;
          const minSample = minSampleFor.get(key);
          if (n !== undefined && n !== null && isLowSample(n, minSample)) {
            lowSampleMin = Math.max(lowSampleMin ?? 0, minSample ?? 0);
          }
          const detail = [
            inPartial && hasValue && honesty.partial ? honesty.partial.label : "",
            ...honesty.bands
              .filter((band) => band.dataKey === key)
              .flatMap((band) => {
                const range = typeof index === "number" ? band.bounds[index] : null;
                return range
                  ? [`${band.label} ${range.lower.toLocaleString()} – ${range.upper.toLocaleString()}`]
                  : [];
              }),
            n !== undefined && n !== null ? honesty.text.sampleSize(formatCount(n)) : "",
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            tooltipRow({
              indicatorHtml: tooltipIndicatorHtml(key, item ? getColorsCount(item) : 1),
              labelText: seriesLabel(config, key),
              valueText: value,
              dimmed,
              detailText: detail || undefined,
            }) + comparison
          );
        })
        .join("");
      // Bands that belong to no series get their own rows.
      const looseBands = honesty.bands
        .filter((band) => !band.dataKey)
        .map((band) => {
          const range = rowIndex !== undefined ? band.bounds[rowIndex] : null;
          if (!range) return "";
          return tooltipRow({
            indicatorHtml: `<div class="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-current opacity-20"></div>`,
            labelText: escapeHtml(band.label),
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
        body: body + looseBands + honestyNotesHtml(notes),
        roundness: slot.roundness,
        variant: slot.variant,
      });
    },
  };
}

function buildBrush(ctx: BuildContext, brushBottom: number) {
  const { data, collected, resolved, categories } = ctx;
  const miniAxisIndex = ctx.hasRight ? 2 : 1;
  const miniGrid: GridComponentOption = {
    left: 8,
    right: 8,
    bottom: brushBottom,
    height: ctx.brushHeight,
    outerBoundsMode: "none",
  };
  const miniXAxis: XAxisOption = {
    type: "category",
    gridIndex: 1,
    boundaryGap: true,
    show: false,
    data: categories,
    axisPointer: { show: false },
  };
  const miniYAxis: YAxisOption = { type: "value", gridIndex: 1, show: false };
  const source = collected.bars[0]?.dataKey ?? collected.lines[0]?.dataKey;
  const color = (source && resolved.series[source]?.[0]) || GRAY;
  const values = data.map((row) => Number(source ? row[source] : 0) || 0);
  const miniSeries: BarSeriesOption[] = source
    ? [
        {
          id: "__mini",
          type: "bar",
          xAxisIndex: 1,
          yAxisIndex: miniAxisIndex,
          data: values,
          silent: true,
          barCategoryGap: "20%",
          emphasis: { disabled: true },
          tooltip: { show: false },
          itemStyle: { color, opacity: BRUSH_FILL_OPACITY, borderRadius: 1 },
          animation: false,
        },
      ]
    : [];
  const dataZoom = buildBrushDataZoom({
    brushBottom,
    brushHeight: ctx.brushHeight,
    brushRange: ctx.brushRange,
    fillerColor: withAlpha(resolved.tokens.foreground, 0),
  });
  return { miniGrid, miniXAxis, miniYAxis, miniSeries, dataZoom };
}

function buildOption(ctx: BuildContext): EChartsOption {
  const { grid, brushBottom } = buildLayout(ctx);
  const { xAxis, yAxes } = buildAxes(ctx);

  if (ctx.isLoading) {
    return {
      grid,
      xAxis,
      yAxis: yAxes,
      tooltip: { show: false },
      series: [
        {
          id: "__loading-bars",
          type: "bar",
          data: LOADING_SHAPE.slice(0, LOADING_BARS),
          barCategoryGap: "30%",
          silent: true,
          itemStyle: {
            color: withAlpha(ctx.resolved.tokens.foreground, 0.06),
            borderRadius: [2, 2, 0, 0],
          },
        },
        {
          id: "__loading-line",
          type: "line",
          data: LOADING_SHAPE.map((v) => v * 0.6 + 12),
          smooth: true,
          silent: true,
          showSymbol: false,
          lineStyle: { color: withAlpha(ctx.resolved.tokens.foreground, 0.16), width: 1.5 },
        },
      ],
    };
  }

  const brush = ctx.showBrush ? buildBrush(ctx, brushBottom) : null;
  // References are measured against the left (primary) value axis.
  const reference = buildReferenceSeries({
    refs: ctx.references,
    resolved: ctx.resolved,
    valueAxes: { x: false, y: true },
  });
  // Zoom shares the brush's window: it replaces the brush's own inside zoom,
  // or stands alone without a brush.
  const insideZoom = ctx.zoom.present
    ? buildInsideZoom({ zoom: ctx.zoom, range: ctx.brushRange })
    : null;
  const dataZoom = brush
    ? insideZoom
      ? [brush.dataZoom[0], insideZoom]
      : brush.dataZoom
    : insideZoom
      ? [insideZoom]
      : undefined;
  return {
    grid: brush ? [grid, brush.miniGrid] : grid,
    xAxis: brush ? [xAxis, brush.miniXAxis] : xAxis,
    yAxis: brush ? [...yAxes, brush.miniYAxis] : yAxes,
    tooltip: buildTooltip(ctx),
    dataZoom,
    series: [
      ...buildSeries(ctx),
      ...(reference ? [reference] : []),
      ...(brush?.miniSeries ?? []),
    ],
  };
}

const NO_STATUS: DataQualitySummary = { statuses: [], hasRanges: false };
const DATA_STATUS_TEXT = resolveDataStatusText();

function axisSide(series: { yAxisId: ComboAxisId }, hasRight: boolean): ComboAxisId {
  return series.yAxisId === "right" && hasRight ? "right" : "left";
}

/** Everything the honesty marks need, worked out once per data or children change. */
function planHonesty(params: {
  data: Record<string, unknown>[];
  categoryKey: string;
  collected: CollectedConfig;
  slots: ReturnType<typeof collectHonesty>;
  gaps: GapsOption | undefined;
  text: ResolvedComboHonestyText;
  hasRight: boolean;
  curveType: ComboCurveType;
  now: number;
}): { plan: ComboHonesty; issues: string[] } {
  const { data, categoryKey, collected, slots, gaps, text, hasRight, curveType, now } = params;
  const issues: string[] = [];
  const allSeries = [...collected.bars, ...collected.lines];
  const valuesOf = (key: string) => data.map((row) => readValue(row[key]));

  let partial: ComboHonesty["partial"] = null;
  if (slots.partial) {
    const found = resolvePartialPeriod(
      slots.partial,
      data.map((row) => row[categoryKey]),
      now,
    );
    if (found) {
      partial = {
        start: found.start,
        label: slots.partial.label ?? text.partialPeriodLabel,
        note:
          slots.partial.note ??
          [text.partialPeriodDescription, found.progress !== null ? text.partialProgress(found.progress) : ""]
            .filter(Boolean)
            .join(" "),
      };
    }
  }

  // Bands belong to lines. A bar's bounds would need whiskers, not a band.
  const barKeys = new Set(collected.bars.map((bar) => bar.dataKey));
  const bands = slots.bands.flatMap((band, index): ComboBand[] => {
    if (band.dataKey && barKeys.has(band.dataKey)) {
      issues.push(`Band for "${band.dataKey}": a band follows a line, and "${band.dataKey}" is a bar. The band is not drawn.`);
      return [];
    }
    const read = readBand(data, band);
    issues.push(...read.issues);
    const line = collected.lines.find((item) => item.dataKey === band.dataKey);
    return [
      {
        index,
        dataKey: band.dataKey,
        label: band.label ?? text.intervalLabel,
        color: band.color,
        bounds: read.bounds,
        runs: read.runs,
        axisIndex: line && axisSide(line, hasRight) === "right" ? 1 : 0,
        curve: line?.curveType ?? curveType,
      },
    ];
  });

  const gapList = gaps && allSeries.length ? gapSpans(allSeries.map((series) => valuesOf(series.dataKey)), data.length) : [];

  const sampleSizes: Record<string, (number | null)[]> = {};
  for (const series of allSeries) {
    if (series.sampleSizeKey) sampleSizes[series.dataKey] = readSampleSizes(data, series.sampleSizeKey);
  }

  const planAxis = (side: ComboAxisId): AxisPlan => {
    const empty: AxisPlan = { truncatedAt: null, show: false, label: "", description: "" };
    if (side === "right" && !hasRight) return empty;
    const slot = collected.yAxes[side];
    const onAxis = allSeries.filter((series) => axisSide(series, hasRight) === side);
    // An axis that measures bars keeps zero in view: a bar's length is its value.
    const measuresBars = collected.bars.some((bar) => axisSide(bar, hasRight) === side);
    let min = typeof slot.min === "number" ? slot.min : undefined;
    let max = slot.max;
    if (slot.min === "auto") {
      if (measuresBars) {
        issues.push(`The ${side} axis measures bars, so min="auto" is ignored: bars must start at zero, because their lengths are the values.`);
      } else {
        const values = onAxis.flatMap((series) => valuesOf(series.dataKey).filter((v): v is number => v !== null));
        for (const band of bands) {
          if ((band.axisIndex === 1 ? "right" : "left") !== side) continue;
          for (const range of band.bounds) if (range) values.push(range.lower, range.upper);
        }
        const domain = fitDomain(values);
        if (domain) {
          min = domain.min;
          max = max ?? domain.max;
        }
      }
    }
    const truncatedAt = axisTruncation(min ?? null, max ?? null);
    if (truncatedAt !== null && measuresBars) {
      issues.push(`The ${side} axis stops at ${truncatedAt} instead of zero, but it measures bars: their lengths no longer show their values. The chart marks the axis; consider letting it start at zero.`);
    }
    const formatted =
      truncatedAt === null ? "" : (slot.tickFormatter?.(truncatedAt, 0) ?? truncatedAt.toLocaleString());
    const atTop = truncatedAt !== null && truncatedAt < 0;
    const words = !hasRight
      ? { startsAt: text.axisStartsAt, endsAt: text.axisEndsAt, describe: text.axisDescription }
      : side === "left"
        ? { startsAt: text.leftAxisStartsAt, endsAt: text.leftAxisEndsAt, describe: text.leftAxisDescription }
        : { startsAt: text.rightAxisStartsAt, endsAt: text.rightAxisEndsAt, describe: text.rightAxisDescription };
    return {
      min,
      max,
      truncatedAt,
      show: truncatedAt !== null && slot.truncationNotice !== "off",
      label: atTop ? words.endsAt(formatted) : words.startsAt(formatted),
      description: words.describe(formatted),
    };
  };

  return {
    plan: {
      text,
      partial,
      bands,
      gaps: gapList,
      gapLabel: (typeof gaps === "object" ? gaps.label : undefined) ?? text.noDataLabel,
      axes: { left: planAxis("left"), right: planAxis("right") },
      sampleSizes,
      tracked: Boolean(slots.partial || gaps),
    },
    issues,
  };
}

function honestyKeyEntries(
  plan: ComboHonesty,
  collected: CollectedConfig,
  config: ChartConfig,
  isStacked: boolean,
): HonestyKeyEntry[] {
  const { text } = plan;
  const entries: HonestyKeyEntry[] = [];
  if (plan.partial) entries.push({ kind: "partial", label: plan.partial.label, description: plan.partial.note });
  for (const band of plan.bands) {
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
  if (plan.gaps.length) entries.push({ kind: "gap", label: plan.gapLabel, description: text.noDataDescription });
  for (const axis of [plan.axes.left, plan.axes.right]) {
    if (axis.show) entries.push({ kind: "axis", label: axis.label, description: axis.description });
  }
  const sized = [
    ...collected.lines.map((line) => ({ series: line, labelled: line.sampleSizeDisplay === "label" })),
    ...collected.bars.map((bar) => ({ series: bar, labelled: bar.sampleSizeDisplay === "label" && !isStacked })),
  ].filter(({ series }) => plan.sampleSizes[series.dataKey]);
  if (sized.some(({ labelled }) => labelled)) {
    entries.push({ kind: "sample", label: text.sampleSizeLabel, description: text.sampleSizeDescription });
  }
  const lowMins = sized.flatMap(({ series }) =>
    plan.sampleSizes[series.dataKey].some((n) => isLowSample(n, series.minSampleSize))
      ? [series.minSampleSize as number]
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
}

type LiveState = {
  resolved: ResolvedColors | null;
  hasRevealed: boolean;
  categories: string[];
  brushRange: BrushRange;
  brushGeom: BrushGeometry | null;
  brushOverlay: BrushOverlayElements | null;
  brushHover: { inside: boolean; left: boolean; right: boolean };
  handlers: {
    clickableKeys: Set<string>;
    onBrushChange?: (range: { startIndex: number; endIndex: number }) => void;
    onZoomChange?: (range: { startIndex: number; endIndex: number }) => void;
    brushFormatLabel?: (value: string, index: number) => string;
  };
  repush: () => void;
};

export function ComboChart<TData extends Record<string, unknown>>({
  data: inputData,
  config,
  xDataKey,
  className,
  stackType = "default",
  barRadius = DEFAULT_BAR_RADIUS,
  curveType = "smooth",
  barGap,
  barCategoryGap,
  animation = true,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  syncId,
  ariaLabel,
  gaps,
  honestyText,
  chartOptions,
  children,
}: ComboChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [selectedKey, setSelectedKey] = useState<string | null>(defaultSelectedDataKey);

  const liveRef = useRef<LiveState>({
    resolved: null,
    hasRevealed: false,
    categories: [],
    brushRange: { start: 0, end: 100 },
    brushGeom: null,
    brushOverlay: null,
    brushHover: { inside: false, left: false, right: false },
    handlers: { clickableKeys: new Set() },
    repush: () => {},
  });

  const collected = useMemo(() => collectConfig(children), [children]);
  const references = useMemo(() => collectReferences(children), [children]);
  const zoomSlot = useMemo(() => collectZoom(children), [children]);
  useZoomWheelGuard(containerRef, zoomSlot);
  const [zoomed, setZoomed] = useState(false);
  const seriesKeys = useMemo(
    () => [...collected.bars.map((b) => b.dataKey), ...collected.lines.map((l) => l.dataKey)],
    [collected],
  );
  const honestySlots = useMemo(() => collectHonesty(children), [children]);
  // Reference and band colors that name config keys resolve with the series.
  const colorKeys = useMemo(
    () => [
      ...seriesKeys,
      ...referenceColorKeys(references, config),
      ...honestySlots.bands.flatMap((band) => (band.color && config[band.color] ? [band.color] : [])),
    ],
    [seriesKeys, references, config, honestySlots],
  );
  const hasRight =
    collected.yAxes.right.present ||
    collected.bars.some((b) => b.yAxisId === "right") ||
    collected.lines.some((l) => l.yAxisId === "right");
  const showBrush = collected.brush.present;
  const brushHeight = collected.brush.height ?? 56;

  const categoryKey = useMemo(() => {
    if (collected.xAxis.dataKey) return collected.xAxis.dataKey;
    if (xDataKey) return xDataKey as string;
    const claimed = new Set(seriesKeys);
    return Object.keys(inputData[0] ?? {}).find((key) => !claimed.has(key)) ?? "";
  }, [collected.xAxis.dataKey, xDataKey, inputData, seriesKeys]);

  // With a gap interval, rows absent from the time series are put back as
  // empty rows, so the axis keeps time even and the hole shows.
  const gapInterval = typeof gaps === "object" ? gaps.interval : undefined;
  const data = useMemo(
    () =>
      gapInterval && categoryKey
        ? fillMissingRows(inputData, categoryKey, gapInterval).data
        : (inputData as Record<string, unknown>[]),
    [inputData, categoryKey, gapInterval],
  );

  const [renderedAt] = useState(() => Date.now());
  const honestyTextResolved = useMemo(() => resolveComboHonestyText(honestyText), [honestyText]);
  const honesty = useMemo(
    () =>
      planHonesty({
        data,
        categoryKey,
        collected,
        slots: honestySlots,
        gaps,
        text: honestyTextResolved,
        hasRight,
        curveType,
        now: renderedAt,
      }),
    [data, categoryKey, collected, honestySlots, gaps, honestyTextResolved, hasRight, curveType, renderedAt],
  );
  const honestyIssues = honesty.issues.join("\n");
  useEffect(() => {
    if (honestyIssues) reportDataQualityIssues("ComboChart", honestyIssues.split("\n"));
  }, [honestyIssues]);
  const honestyEntries = useMemo(
    () => honestyKeyEntries(honesty.plan, collected, config, stackType === "stacked"),
    [honesty, collected, config, stackType],
  );

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  const toggleSelection = useCallback(
    (key: string) => {
      setSelectedKey((prev) => {
        const next = prev === key ? null : key;
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange],
  );

  useEffect(() => {
    liveRef.current.handlers = {
      clickableKeys: new Set(
        [...collected.bars, ...collected.lines].filter((s) => s.isClickable).map((s) => s.dataKey),
      ),
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
    const last = Math.max(live.categories.length - 1, 0);
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
            start: format(live.categories[startIndex] ?? "", startIndex),
            end: format(live.categories[endIndex] ?? "", endIndex),
          }
        : null,
      showLabels: live.brushHover.inside,
      hover: live.brushHover,
    });
  }, []);

  const makeOption = useCallback((): EChartsOption => {
    const resolved = liveRef.current.resolved;
    if (!resolved) return {};
    const categories = data.map((row) => String(row[categoryKey] ?? ""));
    liveRef.current.categories = categories;
    const ctx: BuildContext = {
      data,
      config,
      collected,
      categories,
      resolved,
      selectedKey,
      isStacked: stackType === "stacked",
      barRadius,
      curveType,
      barGap,
      barCategoryGap,
      isLoading,
      showBrush: showBrush && !isLoading,
      brushHeight,
      brushRange: liveRef.current.brushRange,
      hasRight,
      references,
      zoom: isLoading ? { ...zoomSlot, present: false } : zoomSlot,
      honesty: honesty.plan,
    };
    const { brushBottom } = buildLayout(ctx);
    liveRef.current.brushGeom = ctx.showBrush ? { bottom: brushBottom, height: brushHeight } : null;
    return buildOption(ctx);
  }, [
    data,
    config,
    collected,
    categoryKey,
    selectedKey,
    stackType,
    barRadius,
    curveType,
    barGap,
    barCategoryGap,
    isLoading,
    showBrush,
    brushHeight,
    hasRight,
    references,
    zoomSlot,
    honesty,
  ]);

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

    chart.on("click", (params) => {
      const id = (params as { seriesId?: string }).seriesId;
      if (id && liveRef.current.handlers.clickableKeys.has(id)) toggleSelection(id);
    });

    chart.on("datazoom", () => {
      const option = chart.getOption() as { dataZoom?: { start?: number; end?: number }[] };
      const zoom = option.dataZoom?.[0];
      if (!zoom) return;
      liveRef.current.brushRange = { start: zoom.start ?? 0, end: zoom.end ?? 100 };
      setZoomed(isZoomed(liveRef.current.brushRange));
      syncBrushNow();
      const { onBrushChange, onZoomChange } = liveRef.current.handlers;
      if (!onBrushChange && !onZoomChange) return;
      const last = Math.max(liveRef.current.categories.length - 1, 0);
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
          categories: () => liveRef.current.categories,
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
  }, [syncBrushNow, toggleSelection, syncId]);

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
    liveRef.current.resolved = resolveColors(container, config, colorKeys);
    if (isLoading) liveRef.current.hasRevealed = false;
    const reveal = !liveRef.current.hasRevealed && !isLoading;
    if (reveal) liveRef.current.hasRevealed = true;
    push(animation && reveal && !shouldReduceMotion);
    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, colorKeys);
      push(false);
    };
  }, [makeOption, chartOptions, config, colorKeys, isLoading, animation, shouldReduceMotion, syncBrushNow]);

  const tooltipSlot = collected.tooltip;
  useEffect(() => {
    const chart = echartsRef.current;
    const index = tooltipSlot.defaultIndex;
    if (!chart || isLoading || !tooltipSlot.present || index == null) return;
    const timer = setTimeout(() => {
      chart.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: index });
    }, 300);
    return () => clearTimeout(timer);
  }, [tooltipSlot.present, tooltipSlot.defaultIndex, isLoading, data.length]);

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

  const barNames = collected.bars.map((b) => b.dataKey).join(", ") || "no bars";
  const lineNames = collected.lines.map((l) => l.dataKey).join(", ") || "no lines";
  const honestyAria = honestyEntries
    .filter((entry) => entry.kind !== "sample")
    .map((entry) => {
      const plan = honesty.plan;
      if (entry.kind === "partial" && plan.partial) {
        return ` ${entry.label} from ${String(data[plan.partial.start]?.[categoryKey] ?? "")}.`;
      }
      if (entry.kind === "gap") {
        const spans = plan.gaps.map((gap) => {
          const first = String(data[gap.start]?.[categoryKey] ?? "");
          const last = String(data[gap.end]?.[categoryKey] ?? "");
          return gap.start === gap.end ? first : `${first} to ${last}`;
        });
        return ` ${entry.label}: ${spans.join(", ")}.`;
      }
      return entry.kind === "axis" ? ` ${entry.description}` : ` ${entry.label}.`;
    })
    .join("");
  const defaultAriaLabel = `Combo chart with bars for ${barNames} and lines for ${lineNames} over ${categoryKey || "categories"}.${honestyAria}`;

  // The key takes the edge the series legend is not on, so the two never overlap.
  const keyOnTop = legendSlot.present && legendSlot.verticalAlign === "bottom";
  const honestyKey = !isLoading && honestyEntries.length > 0 && (
    <DataStatusKey
      summary={NO_STATUS}
      mark="line"
      text={DATA_STATUS_TEXT}
      extra={<HonestyKeyItems entries={honestyEntries} />}
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
      {keyOnTop && honestyKey}
      <div className="relative min-h-0 w-full flex-1" role="img" aria-label={ariaLabel ?? defaultAriaLabel}>
        <div ref={mountRef} className="h-full min-h-0 w-full" />
      </div>
      {!keyOnTop && honestyKey}

      {zoomSlot.present && zoomSlot.showReset && zoomed && !isLoading && (
        <button
          type="button"
          className={ZOOM_RESET_CLASS}
          style={{
            left: 16,
            ...(legendSlot.present && legendSlot.verticalAlign === "top" && legendSlot.align !== "right"
              ? { bottom: 12 }
              : { top: 12 }),
          }}
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
          selectedKey={selectedKey}
          hoveredKey={null}
          isClickable={legendSlot.isClickable}
          onToggle={toggleSelection}
          style={legendStyle}
        />
      )}

      {isLoading && <ChartLoading reduceMotion={!!shouldReduceMotion} />}
    </div>
  );
}

function ChartLoading({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <motion.div
        role="status"
        aria-live="polite"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="text-primary bg-background flex items-center justify-center gap-2 rounded-md border px-2 py-0.5 text-sm"
      >
        <div
          aria-hidden
          className={`border-border border-t-primary h-3 w-3 rounded-full border ${reduceMotion ? "" : "animate-spin"}`}
        />
        <span>Loading</span>
      </motion.div>
    </div>
  );
}

ComboChart.Bar = Bar;
ComboChart.Line = Line;
ComboChart.Dot = Dot;
ComboChart.ActiveDot = ActiveDot;
ComboChart.XAxis = XAxis;
ComboChart.YAxis = YAxis;
ComboChart.Grid = Grid;
ComboChart.Tooltip = Tooltip;
ComboChart.Legend = Legend;
ComboChart.Brush = Brush;
ComboChart.Zoom = Zoom;
ComboChart.ReferenceLine = ReferenceLine;
ComboChart.ReferenceArea = ReferenceArea;
ComboChart.ReferenceDot = ReferenceDot;
ComboChart.PartialPeriod = PartialPeriod;
ComboChart.Band = Band;
