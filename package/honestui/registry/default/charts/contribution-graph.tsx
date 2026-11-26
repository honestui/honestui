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
  type CSSProperties,
  type FC,
  type ReactNode,
} from "react";
import {
  CalendarComponent,
  TooltipComponent,
  VisualMapPiecewiseComponent,
  type CalendarComponentOption,
  type TooltipComponentOption,
  type VisualMapComponentOption,
} from "echarts/components";
import { HeatmapChart as HeatmapChartModule, type HeatmapSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type { ChartConfig, TooltipPosition, TooltipRoundness, TooltipVariant };

echarts.use([HeatmapChartModule, CalendarComponent, TooltipComponent, VisualMapPiecewiseComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = ComposeOption<
  HeatmapSeriesOption | CalendarComponentOption | TooltipComponentOption | VisualMapComponentOption
>;

const GRAY = "rgba(120, 120, 120, 1)";
const DAY_MS = 86_400_000;
const DEFAULT_LEVELS = 4;
// The empty level is a faint wash of the foreground, the same neutral every
// chart uses for loading and inactive marks, so empty days read as "zero",
// not "missing".
const EMPTY_ALPHA = 0.06;
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type ContributionDateInput = string | number | Date;
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ContributionDay<TData extends Record<string, unknown>> = {
  /** The day as `YYYY-MM-DD`. */
  date: string;
  value: number;
  /** 0 for an empty day, then 1 up to the number of levels. */
  level: number;
  /** The source row, when the day has one. */
  datum?: TData;
};

export interface ContributionGraphProps<TData extends Record<string, unknown>> {
  data: TData[];
  config: ChartConfig;
  /** The field holding each row's day: a `YYYY-MM-DD` string, a timestamp, or a Date. */
  dateKey: keyof TData & string;
  /** The numeric field counted on each day. Its config entry colours the cells. */
  valueKey: keyof TData & string;
  /**
   * The days shown: a year (`2025`), or a `[start, end]` pair. Defaults to the
   * 52 weeks ending on the latest day in `data`.
   */
  range?: number | [ContributionDateInput, ContributionDateInput];
  /** First day of each week column, where 0 is Sunday. */
  weekStart?: WeekStart;
  className?: string;
  animation?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
  onDayClick?: (day: ContributionDay<TData>) => void;
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

export interface CellsProps {
  radius?: number;
  gap?: number;
  /** Number of coloured levels above the empty level. */
  levels?: number;
  /**
   * Lower bounds for each coloured level, ascending. Overrides `levels`. A
   * day at or above `thresholds[i]` takes level `i + 1`.
   */
  thresholds?: number[];
  /** Largest cell size in pixels. Cells shrink to fit the container's width. */
  maxSize?: number;
  isClickable?: boolean;
}

const Cells: FC<CellsProps> = () => null;
Cells.displayName = "ContributionGraph.Cells";

export interface MonthsProps {
  /** Formats a month label, given the month index (0 is January) and year. */
  tickFormatter?: (month: number, year: number) => string;
}

const Months: FC<MonthsProps> = () => null;
Months.displayName = "ContributionGraph.Months";

export interface WeekdaysProps {
  /** Labels every day, or every other day like GitHub. */
  show?: "alternate" | "all";
  /** Seven labels, Sunday first. */
  labels?: string[];
}

const Weekdays: FC<WeekdaysProps> = () => null;
Weekdays.displayName = "ContributionGraph.Weekdays";

export interface LegendProps {
  lessLabel?: string;
  moreLabel?: string;
  align?: "left" | "right";
}

const Legend: FC<LegendProps> = () => null;
Legend.displayName = "ContributionGraph.Legend";

export interface TooltipProps {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  position?: TooltipPosition;
  valueFormatter?: (value: number) => string;
  dateFormatter?: (date: Date) => string;
}

const Tooltip: FC<TooltipProps> = () => null;
Tooltip.displayName = "ContributionGraph.Tooltip";

type CellsSlot = Required<Omit<CellsProps, "thresholds">> & Pick<CellsProps, "thresholds">;
type MonthsSlot = MonthsProps & { present: boolean };
type WeekdaysSlot = Required<Pick<WeekdaysProps, "show">> & Pick<WeekdaysProps, "labels"> & { present: boolean };
type LegendSlot = Required<LegendProps> & { present: boolean };
type TooltipSlot = Required<Pick<TooltipProps, "variant" | "roundness" | "position">> &
  Pick<TooltipProps, "valueFormatter" | "dateFormatter"> & { present: boolean };

function matchesSlot(type: unknown, slot: FC, name: string) {
  if (type === slot) return true;
  if (typeof type !== "function") return false;
  const candidate = (type as FC).displayName ?? type.name;
  return candidate === name || candidate === `ContributionGraph.${name}`;
}

function collectConfig(children: ReactNode) {
  let cells: CellsSlot = { radius: 2, gap: 2, levels: DEFAULT_LEVELS, maxSize: 14, isClickable: false };
  let months: MonthsSlot = { present: false };
  let weekdays: WeekdaysSlot = { present: false, show: "alternate" };
  let legend: LegendSlot = { present: false, lessLabel: "Less", moreLabel: "More", align: "right" };
  let tooltip: TooltipSlot = { present: false, variant: "default", roundness: "lg", position: "variable" };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (matchesSlot(child.type, Cells, "Cells")) {
      const props = child.props as CellsProps;
      const thresholds = props.thresholds?.length ? [...props.thresholds].sort((a, b) => a - b) : undefined;
      cells = {
        radius: props.radius ?? 2,
        gap: props.gap ?? 2,
        levels: thresholds?.length ?? Math.max(1, Math.round(props.levels ?? DEFAULT_LEVELS)),
        thresholds,
        maxSize: props.maxSize ?? 14,
        isClickable: props.isClickable ?? false,
      };
    } else if (matchesSlot(child.type, Months, "Months")) {
      months = { present: true, ...(child.props as MonthsProps) };
    } else if (matchesSlot(child.type, Weekdays, "Weekdays")) {
      const props = child.props as WeekdaysProps;
      weekdays = { present: true, show: props.show ?? "alternate", labels: props.labels };
    } else if (matchesSlot(child.type, Legend, "Legend")) {
      const props = child.props as LegendProps;
      legend = {
        present: true,
        lessLabel: props.lessLabel ?? "Less",
        moreLabel: props.moreLabel ?? "More",
        align: props.align ?? "right",
      };
    } else if (matchesSlot(child.type, Tooltip, "Tooltip")) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        position: props.position ?? "variable",
        valueFormatter: props.valueFormatter,
        dateFormatter: props.dateFormatter,
      };
    }
  });

  return { cells, months, weekdays, legend, tooltip };
}

/**
 * Days are handled as UTC midnights keyed by `YYYY-MM-DD`, so a date string
 * never shifts a day in a time zone west of UTC. Date objects contribute
 * their local calendar day.
 */
function toDay(input: ContributionDateInput): number | null {
  if (typeof input === "string") {
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(day: number) {
  return new Date(day).toISOString().slice(0, 10);
}

function resolveRange(range: ContributionGraphProps<Record<string, unknown>>["range"], days: number[]) {
  if (typeof range === "number") return { start: Date.UTC(range, 0, 1), end: Date.UTC(range, 11, 31) };
  if (Array.isArray(range)) {
    const start = toDay(range[0]);
    const end = toDay(range[1]);
    if (start != null && end != null) return start <= end ? { start, end } : { start: end, end: start };
  }
  const now = new Date();
  const end = days.length ? Math.max(...days) : Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return { start: end - 364 * DAY_MS, end };
}

function levelPalette(resolved: ResolvedColors, key: string, levels: number) {
  const slots = resolved.series[key] ?? [GRAY];
  if (slots.length > 1) {
    return Array.from({ length: levels }, (_, i) =>
      slots[Math.round((i / Math.max(levels - 1, 1)) * (slots.length - 1))],
    );
  }
  const base = slots[0] ?? GRAY;
  return Array.from({ length: levels }, (_, i) => withAlpha(base, levelAlpha(i, levels)));
}

/** Level opacities from 30% to full, matching the legend swatches. */
function levelAlpha(index: number, levels: number) {
  return levels === 1 ? 1 : 0.3 + (0.7 * index) / (levels - 1);
}

function levelOf(value: number, max: number, cells: CellsSlot) {
  if (!(value > 0)) return 0;
  if (cells.thresholds) return cells.thresholds.filter((bound) => value >= bound).length;
  return Math.min(cells.levels, Math.max(1, Math.ceil((value / (max || 1)) * cells.levels)));
}

type Layout = { cell: number; left: number; top: number; width: number; height: number };

function computeLayout(params: {
  width: number;
  height: number;
  weeks: number;
  showMonths: boolean;
  showWeekdays: boolean;
  legend: boolean;
  maxSize: number;
}): Layout {
  const { width, height, weeks, showMonths, showWeekdays, legend, maxSize } = params;
  const labelLeft = showWeekdays ? 30 : 0;
  const labelTop = showMonths ? 18 : 0;
  const legendRoom = legend ? 26 : 0;
  const fitWidth = (width - labelLeft - 2) / Math.max(weeks, 1);
  const fitHeight = (height - labelTop - legendRoom - 2) / 7;
  const cell = Math.max(4, Math.floor(Math.min(fitWidth, fitHeight, maxSize)));
  const gridWidth = cell * weeks;
  const gridHeight = cell * 7;
  // Center the whole block (labels, grid, legend) in the canvas.
  const left = Math.max(labelLeft, Math.floor((width - gridWidth - labelLeft) / 2) + labelLeft);
  const top = Math.max(labelTop, Math.floor((height - gridHeight - labelTop - legendRoom) / 2) + labelTop);
  return { cell, left, top, width: gridWidth, height: gridHeight };
}

type LiveState = {
  resolved: ResolvedColors | null;
  repush: () => void;
  click: {
    days: ContributionDay<Record<string, unknown>>[];
    index: Map<string, number>;
    enabled: boolean;
    callback?: (day: ContributionDay<Record<string, unknown>>) => void;
  };
};

export function ContributionGraph<TData extends Record<string, unknown>>({
  data,
  config,
  dateKey,
  valueKey,
  range,
  weekStart = 0,
  className,
  animation = true,
  isLoading = false,
  ariaLabel,
  onDayClick,
  chartOptions,
  children,
}: ContributionGraphProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { cells, months, weekdays, legend, tooltip } = collectConfig(children);

  const calendar = useMemo(() => {
    const totals = new Map<number, { value: number; datum: TData }>();
    for (const datum of data) {
      const day = toDay(datum[dateKey] as ContributionDateInput);
      if (day == null) continue;
      const previous = totals.get(day);
      // Several rows on one day add up, like several commits on one day.
      totals.set(day, { value: (previous?.value ?? 0) + (Number(datum[valueKey]) || 0), datum: previous?.datum ?? datum });
    }
    const { start, end } = resolveRange(range, [...totals.keys()]);
    const days: ContributionDay<TData>[] = [];
    let max = 0;
    for (let day = start; day <= end; day += DAY_MS) {
      const entry = totals.get(day);
      max = Math.max(max, entry?.value ?? 0);
      days.push({ date: dayKey(day), value: entry?.value ?? 0, level: 0, datum: entry?.datum });
    }
    for (const day of days) day.level = levelOf(day.value, max, cells);
    const offset = (new Date(start).getUTCDay() - weekStart + 7) % 7;
    const weeks = Math.ceil((offset + days.length) / 7);
    const index = new Map(days.map((day, i) => [day.date, i]));
    const total = days.reduce((sum, day) => sum + day.value, 0);
    const active = days.filter((day) => day.value > 0).length;
    return { days, index, start, end, weeks, max, total, active };
  }, [data, dateKey, valueKey, range, weekStart, cells]);

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);
  const seriesLabel = typeof config[valueKey]?.label === "string" ? (config[valueKey]?.label as string) : valueKey;
  const defaultAriaLabel = `Contribution graph of ${seriesLabel} from ${calendar.days[0]?.date ?? ""} to ${
    calendar.days[calendar.days.length - 1]?.date ?? ""
  }: ${calendar.total.toLocaleString()} in total across ${calendar.active} active days.`;

  const liveRef = useRef<LiveState>({
    resolved: null,
    repush: () => {},
    click: { days: [], index: new Map(), enabled: false },
  });

  const buildOption = useCallback((): EChartsOption => {
    const resolved = liveRef.current.resolved;
    const chart = chartRef.current;
    if (!resolved || !chart) return {};
    const { tokens } = resolved;
    const showLegend = legend.present && !isLoading;
    const layout = computeLayout({
      width: chart.getWidth(),
      height: chart.getHeight(),
      weeks: calendar.weeks,
      showMonths: months.present,
      showWeekdays: weekdays.present,
      legend: showLegend,
      maxSize: cells.maxSize,
    });

    // The legend is HTML under the grid, aligned to the grid's own edges.
    const legendNode = legendRef.current;
    if (legendNode) {
      legendNode.style.top = `${layout.top + layout.height + 8}px`;
      legendNode.style.left = `${layout.left}px`;
      legendNode.style.width = `${layout.width}px`;
      legendNode.style.setProperty("--swatch", `${Math.min(Math.max(layout.cell - cells.gap, 8), 11)}px`);
    }

    const palette = levelPalette(resolved, valueKey, cells.levels);
    const empty = withAlpha(tokens.foreground, EMPTY_ALPHA);
    const dayNames = weekdays.labels?.length === 7 ? weekdays.labels : WEEKDAY_NAMES;
    const nameMap = dayNames.map((name, day) => {
      if (weekdays.show === "all") return name;
      // Every other row from the second, like GitHub: Mon, Wed, Fri for a Sunday start.
      const row = (day - weekStart + 7) % 7;
      return row % 2 === 1 ? name : "";
    });
    const loadingColors = [withAlpha(tokens.foreground, 0.05), withAlpha(tokens.foreground, 0.1), withAlpha(tokens.foreground, 0.16)];

    const seriesData = calendar.days.map((day, i) => [
      day.date,
      day.value,
      isLoading ? ((Math.floor(i / 7) * 3 + (i % 7) * 2) % 3) : day.level,
    ]);

    return {
      animation: animation && !shouldReduceMotion && !isLoading,
      animationDuration: 480,
      animationDelay: (index: number) => Math.min(Math.floor(index / 7) * 6, 320),
      calendar: {
        orient: "horizontal",
        range: [dayKey(calendar.start), dayKey(calendar.end)],
        left: layout.left,
        top: layout.top,
        cellSize: [layout.cell, layout.cell],
        splitLine: { show: false },
        itemStyle: { color: "transparent", borderWidth: 0, borderColor: "transparent" },
        dayLabel: {
          show: weekdays.present && !isLoading,
          firstDay: weekStart,
          nameMap,
          color: tokens.mutedForeground,
          fontSize: 10,
          margin: 6,
          position: "start",
        },
        monthLabel: {
          show: months.present && !isLoading,
          color: tokens.mutedForeground,
          fontSize: 10,
          margin: 6,
          position: "start",
          align: "left",
          formatter: (params) =>
            months.tickFormatter?.(params.M - 1, Number(params.yyyy)) ?? MONTH_NAMES[params.M - 1] ?? "",
        },
        yearLabel: { show: false },
      },
      visualMap: {
        type: "piecewise",
        show: false,
        dimension: 2,
        seriesIndex: 0,
        pieces: isLoading
          ? loadingColors.map((color, value) => ({ value, color }))
          : [{ value: 0, color: empty }, ...palette.map((color, i) => ({ value: i + 1, color }))],
      },
      tooltip: {
        show: tooltip.present && !isLoading,
        trigger: "item",
        confine: true,
        backgroundColor: "transparent",
        borderWidth: 0,
        padding: 0,
        extraCssText: "box-shadow:none;",
        transitionDuration: 0,
        position: resolveTooltipPosition(tooltip.position),
        formatter: (raw: unknown) => {
          const value = (raw as { value?: [string, number, number] }).value;
          if (!value) return "";
          const [key, amount] = value;
          const [y, m, d] = key.split("-").map(Number);
          const date = new Date(y, m - 1, d);
          const label =
            tooltip.dateFormatter?.(date) ??
            date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
          const item = config[valueKey];
          return tooltipShell({
            label,
            body: tooltipRow({
              indicatorHtml: tooltipIndicatorHtml(valueKey, item ? getColorsCount(item) : 1),
              labelText: seriesLabel,
              valueText: tooltip.valueFormatter?.(amount) ?? amount.toLocaleString(),
              dimmed: "",
            }),
            roundness: tooltip.roundness,
            variant: tooltip.variant,
          });
        },
      },
      series: [
        {
          id: valueKey,
          name: seriesLabel,
          type: "heatmap",
          coordinateSystem: "calendar",
          data: seriesData,
          silent: isLoading || (!tooltip.present && !cells.isClickable),
          cursor: cells.isClickable ? "pointer" : "default",
          itemStyle: {
            borderColor: tokens.background,
            borderWidth: cells.gap,
            borderRadius: cells.radius + 1,
          },
          emphasis: {
            itemStyle: {
              borderColor: withAlpha(tokens.foreground, 0.55),
              borderWidth: Math.max(cells.gap - 1, 1),
            },
          },
        },
      ],
    } as EChartsOption;
  }, [calendar, cells, months, weekdays, legend.present, tooltip, isLoading, config, valueKey, seriesLabel, weekStart, animation, shouldReduceMotion]);

  useEffect(() => {
    liveRef.current.click = {
      days: calendar.days as ContributionDay<Record<string, unknown>>[],
      index: calendar.index,
      enabled: cells.isClickable,
      callback: onDayClick as LiveState["click"]["callback"],
    };
  }, [calendar, cells.isClickable, onDayClick]);

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
        // Cell size follows the width, so the layout is rebuilt.
        liveRef.current.repush();
      });
    });
    resizeObserver.observe(mount);
    const themeObserver = new MutationObserver(() => liveRef.current.repush());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    chart.on("click", (params) => {
      const current = liveRef.current.click;
      if (!current.enabled || !current.callback) return;
      const key = (params as { value?: [string] }).value?.[0];
      const day = key ? current.days[current.index.get(key) ?? -1] : undefined;
      if (day) current.callback(day);
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
    liveRef.current.resolved = resolveColors(container, config, [valueKey]);
    const push = () => {
      const option = buildOption();
      const merged = withChartFont(chartOptions ? { ...option, ...chartOptions } : option, container);
      chart.setOption(merged as EChartsOption, { notMerge: true });
    };
    push();
    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, [valueKey]);
      push();
    };
  }, [buildOption, chartOptions, config, valueKey]);

  const colorsCount = getColorsCount(config[valueKey] ?? {});
  const swatch = (level: number): CSSProperties => {
    if (level === 0) return { background: `color-mix(in srgb, currentColor ${EMPTY_ALPHA * 100}%, transparent)` };
    if (colorsCount > 1) {
      const slot = Math.round(((level - 1) / Math.max(cells.levels - 1, 1)) * (colorsCount - 1));
      return { background: `var(--color-${valueKey}-${slot})` };
    }
    const alpha = Math.round(levelAlpha(level - 1, cells.levels) * 1000) / 10;
    return { background: `color-mix(in srgb, var(--color-${valueKey}-0) ${alpha}%, transparent)` };
  };

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
        {legend.present && !isLoading && (
          <div
            ref={legendRef}
            aria-hidden
            className={`text-muted-foreground absolute flex items-center gap-1 text-[10px] leading-none select-none ${
              legend.align === "left" ? "justify-start" : "justify-end"
            }`}
          >
            <span className="mr-1">{legend.lessLabel}</span>
            {Array.from({ length: cells.levels + 1 }, (_, level) => (
              <span
                key={level}
                className="text-foreground size-(--swatch) shrink-0 rounded-[2px]"
                style={swatch(level)}
              />
            ))}
            <span className="ml-1">{legend.moreLabel}</span>
          </div>
        )}
      </div>
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

ContributionGraph.Cells = Cells;
ContributionGraph.Months = Months;
ContributionGraph.Weekdays = Weekdays;
ContributionGraph.Legend = Legend;
ContributionGraph.Tooltip = Tooltip;
