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
  getColorsCount,
  resolveColors,
  seriesPaint,
  withAlpha,
  withChartFont,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/default/ui/charts/chart";
import { dotStyle, type DotVariant } from "@/registry/default/ui/charts/dot";
import { LegendOverlay, type LegendVariant } from "@/registry/default/ui/charts/legend";
import { RadarComponent, type RadarComponentOption } from "echarts/components";
import { RadarChart as RadarChartModule, type RadarSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type { ChartConfig, DotVariant, LegendVariant, TooltipRoundness, TooltipVariant };

echarts.use([RadarChartModule, RadarComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = ComposeOption<RadarSeriesOption | RadarComponentOption>;

const REVEAL_DURATION = 800;
const STROKE_WIDTH = 1.5;
const FILL_OPACITY = 0.22;
const DIMMED_OPACITY = 0.18;
const FALLBACK_COLOR = "rgba(120, 120, 120, 1)";
// Spokes that reach past the outer ring by this much still count as hovering the axis.
const HOVER_REACH = 1.2;

export type RadarGridShape = "polygon" | "circle";
export type RadarGridVariant = "lines" | "filled";
export type RadarVariant = "filled" | "lines";

export interface RadarChartProps<TData extends Record<string, unknown>> {
  data: TData[];
  config: ChartConfig;
  nameKey: keyof TData & string;
  className?: string;
  min?: number;
  max?: number;
  animation?: boolean;
  defaultSelectedDataKey?: string | null;
  selectedDataKey?: string | null;
  onSelectionChange?: (dataKey: string | null) => void;
  isLoading?: boolean;
  ariaLabel?: string;
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

export interface GridProps {
  shape?: RadarGridShape;
  variant?: RadarGridVariant;
  rings?: number;
  spokes?: boolean;
}

export interface AxisProps {
  tickFormatter?: (name: string, index: number) => string;
  showValues?: boolean;
  valueFormatter?: (value: number) => string;
}

export interface RadarProps {
  dataKey: string;
  variant?: RadarVariant;
  dot?: DotVariant;
  fillOpacity?: number;
  strokeWidth?: number;
  dashed?: boolean;
}

export interface TooltipProps {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  defaultIndex?: number;
  valueFormatter?: (value: number) => string;
}

export interface LegendProps {
  variant?: LegendVariant;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "bottom";
  isClickable?: boolean;
}

const Grid: FC<GridProps> = () => null;
Grid.displayName = "RadarChart.Grid";
const Axis: FC<AxisProps> = () => null;
Axis.displayName = "RadarChart.Axis";
const Radar: FC<RadarProps> = () => null;
Radar.displayName = "RadarChart.Radar";
const Tooltip: FC<TooltipProps> = () => null;
Tooltip.displayName = "RadarChart.Tooltip";
const Legend: FC<LegendProps> = () => null;
Legend.displayName = "RadarChart.Legend";

type GridSlot = { present: boolean } & Required<GridProps>;
type AxisSlot = { present: boolean } & AxisProps;
type RadarSlot = Required<Omit<RadarProps, "fillOpacity">> & { fillOpacity: number };
type TooltipSlot = { present: boolean } & Omit<TooltipProps, "variant" | "roundness"> & {
  variant: TooltipVariant;
  roundness: TooltipRoundness;
};
type LegendSlot = { present: boolean } & Required<LegendProps>;

type CollectedConfig = {
  grid: GridSlot;
  axis: AxisSlot;
  radars: RadarSlot[];
  tooltip: TooltipSlot;
  legend: LegendSlot;
};

function collectConfig(children: ReactNode): CollectedConfig {
  const config: CollectedConfig = {
    grid: { present: false, shape: "polygon", variant: "lines", rings: 4, spokes: true },
    axis: { present: false },
    radars: [],
    tooltip: { present: false, variant: "default", roundness: "lg" },
    legend: {
      present: false,
      variant: "rounded-square",
      align: "center",
      verticalAlign: "bottom",
      isClickable: false,
    },
  };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Grid) {
      const props = child.props as GridProps;
      config.grid = {
        present: true,
        shape: props.shape ?? "polygon",
        variant: props.variant ?? "lines",
        rings: Math.max(1, Math.round(props.rings ?? 4)),
        spokes: props.spokes ?? true,
      };
    } else if (child.type === Axis) {
      config.axis = { present: true, ...(child.props as AxisProps) };
    } else if (child.type === Radar) {
      const props = child.props as RadarProps;
      const variant = props.variant ?? "filled";
      config.radars.push({
        dataKey: props.dataKey,
        variant,
        dot: props.dot ?? "none",
        fillOpacity: props.fillOpacity ?? (variant === "filled" ? FILL_OPACITY : 0),
        strokeWidth: props.strokeWidth ?? STROKE_WIDTH,
        dashed: props.dashed ?? false,
      });
    } else if (child.type === Tooltip) {
      const props = child.props as TooltipProps;
      config.tooltip = {
        present: true,
        ...props,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
      };
    } else if (child.type === Legend) {
      const props = child.props as LegendProps;
      config.legend = {
        present: true,
        variant: props.variant ?? "rounded-square",
        align: props.align ?? "center",
        verticalAlign: props.verticalAlign ?? "bottom",
        isClickable: props.isClickable ?? false,
      };
    }
  });

  return config;
}

/** Rounds the data maximum up so every ring lands on a readable value. */
function niceMax(value: number, rings: number): number {
  if (!Number.isFinite(value) || value <= 0) return rings;
  const rawStep = value / rings;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? rawStep;
  return step * rings;
}

function labelOf(config: ChartConfig, key: string): string {
  const label = config[key]?.label;
  return typeof label === "string" ? label : key;
}

type Geometry = { cx: number; cy: number; r: number };

/** Percent layout shared by the ECharts option and the HTML hover layer, so both agree. */
function layoutPercents(legend: LegendSlot): { cy: number; radius: number } {
  if (!legend.present) return { cy: 50, radius: 72 };
  return { cy: legend.verticalAlign === "top" ? 55 : 45, radius: 64 };
}

function geometryFor(width: number, height: number, legend: LegendSlot): Geometry {
  const { cy, radius } = layoutPercents(legend);
  return {
    cx: width / 2,
    cy: (height * cy) / 100,
    r: ((Math.min(width, height) / 2) * radius) / 100,
  };
}

/** Axes read clockwise from 12 o'clock. */
function axisAngle(index: number, count: number): number {
  return Math.PI / 2 - (index * 2 * Math.PI) / count;
}

type HoverState = { index: number; x: number; y: number } | null;

type LiveState = {
  resolved: ResolvedColors | null;
  hasRevealed: boolean;
  repush: () => void;
  hover: {
    enabled: boolean;
    count: number;
    legend: LegendSlot;
    set: (next: HoverState) => void;
  };
};

export function RadarChart<TData extends Record<string, unknown>>({
  data,
  config,
  nameKey,
  className,
  min = 0,
  max,
  animation = true,
  defaultSelectedDataKey = null,
  selectedDataKey: selectedProp,
  onSelectionChange,
  isLoading = false,
  ariaLabel,
  chartOptions,
  children,
}: RadarChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const collected = useMemo(() => collectConfig(children), [children]);
  const { grid, axis, radars, tooltip, legend } = collected;
  const seriesKeys = useMemo(() => radars.map((radar) => radar.dataKey), [radars]);
  const names = useMemo(() => data.map((row) => String(row[nameKey])), [data, nameKey]);

  const [internalSelected, setInternalSelected] = useState<string | null>(defaultSelectedDataKey);
  const selected = selectedProp !== undefined ? selectedProp : internalSelected;
  const select = useCallback(
    (key: string | null) => {
      setInternalSelected(key);
      onSelectionChange?.(key);
    },
    [onSelectionChange],
  );

  const [hover, setHover] = useState<HoverState>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const rings = grid.present ? grid.rings : 4;
  const scaleMax = useMemo(() => {
    if (max != null) return max;
    let top = 0;
    for (const row of data) {
      for (const key of seriesKeys) {
        const value = Number(row[key]);
        if (Number.isFinite(value)) top = Math.max(top, value);
      }
    }
    return niceMax(top, rings);
  }, [max, data, seriesKeys, rings]);

  const liveRef = useRef<LiveState>({
    resolved: null,
    hasRevealed: false,
    repush: () => {},
    hover: { enabled: false, count: 0, legend, set: () => {} },
  });

  useEffect(() => {
    liveRef.current.hover = {
      enabled: tooltip.present && !isLoading && names.length > 0,
      count: names.length,
      legend,
      set: setHover,
    };
  }, [tooltip.present, isLoading, names.length, legend]);

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  const buildOption = useCallback((): EChartsOption => {
    const resolved = liveRef.current.resolved;
    if (!resolved) return {};
    const { tokens } = resolved;
    const { cy, radius } = layoutPercents(legend);
    const ringColor = withAlpha(tokens.border, 1);
    const indicatorCount = isLoading ? 6 : Math.max(names.length, 3);

    const radar: RadarComponentOption = {
      center: ["50%", `${cy}%`],
      radius: `${radius}%`,
      startAngle: 90,
      clockwise: true,
      shape: grid.shape,
      splitNumber: rings,
      indicator: Array.from({ length: indicatorCount }, (_, index) => ({
        name: isLoading ? "" : (names[index] ?? ""),
        min,
        max: scaleMax,
      })),
      axisName: {
        show: axis.present && !isLoading,
        color: tokens.mutedForeground,
        fontSize: 10,
        formatter: axis.tickFormatter
          ? (name?: string, indicator?: unknown) =>
              axis.tickFormatter!(
                String(name ?? ""),
                names.indexOf(String((indicator as { name?: string })?.name ?? name)),
              )
          : undefined,
      },
      axisNameGap: 10,
      axisLine: {
        show: (grid.present && grid.spokes) || isLoading,
        lineStyle: { color: ringColor, width: 1 },
      },
      splitLine: {
        show: grid.present || isLoading,
        lineStyle: { color: ringColor, width: 1, type: [3, 3] as [number, number] },
      },
      splitArea: {
        show: grid.present && grid.variant === "filled" && !isLoading,
        areaStyle: {
          color: [withAlpha(tokens.foreground, 0.03), withAlpha(tokens.foreground, 0)],
        },
      },
      axisTick: { show: false },
      // ECharts repeats ring values on every spoke, so the HTML layer labels the first one only.
      axisLabel: { show: false },
    };

    if (isLoading) {
      const ghost = [0.82, 0.58, 0.74, 0.5, 0.88, 0.62].map((t) => min + t * (scaleMax - min));
      return {
        animation: false,
        radar,
        series: [
          {
            id: "__loading",
            type: "radar",
            silent: true,
            symbol: "none",
            lineStyle: { width: 0 },
            areaStyle: { color: withAlpha(tokens.foreground, 0.08) },
            data: [{ value: ghost }],
          },
        ],
      };
    }

    return {
      animation: false,
      radar,
      series: radars.map((slot) => {
        const slots = resolved.series[slot.dataKey] ?? [FALLBACK_COLOR];
        const paint = seriesPaint(slots);
        const solid = slots[0] ?? FALLBACK_COLOR;
        const dimmed = selected != null && selected !== slot.dataKey;
        const dot = slot.dot === "none" ? null : dotStyle(slot.dot, paint, tokens.background);
        return {
          id: slot.dataKey,
          name: labelOf(config, slot.dataKey),
          type: "radar",
          silent: true,
          z: dimmed ? 1 : 2,
          symbol: dot ? "circle" : "none",
          symbolSize: dot?.size ?? 0,
          itemStyle: { ...dot?.itemStyle, opacity: dimmed ? DIMMED_OPACITY : 1 },
          lineStyle: {
            color: paint,
            width: slot.strokeWidth,
            type: slot.dashed ? ([4, 3] as [number, number]) : "solid",
            opacity: dimmed ? DIMMED_OPACITY : 1,
          },
          areaStyle:
            slot.fillOpacity > 0
              ? {
                  color: withAlpha(solid, 1),
                  opacity: slot.fillOpacity * (dimmed ? 0.35 : 1),
                }
              : undefined,
          data: [
            {
              name: labelOf(config, slot.dataKey),
              value: data.map((row) => {
                const value = Number(row[slot.dataKey]);
                return Number.isFinite(value) ? value : 0;
              }),
            },
          ],
        };
      }),
    };
  }, [legend, grid, rings, isLoading, names, min, scaleMax, axis, radars, selected, config, data]);

  useEffect(() => {
    const mount = mountRef.current;
    const live = liveRef.current;
    if (!mount) return;
    const chart = echarts.init(mount);
    chartRef.current = chart;
    setSize({ width: chart.getWidth(), height: chart.getHeight() });

    let resizeFrame = 0;
    const resizeObserver = new ResizeObserver(() => {
      if (mount.clientWidth === chart.getWidth() && mount.clientHeight === chart.getHeight()) return;
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        chart.resize({ animation: { duration: 0 } });
        setSize({ width: chart.getWidth(), height: chart.getHeight() });
      });
    });
    resizeObserver.observe(mount);

    const themeObserver = new MutationObserver(() => liveRef.current.repush());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // ECharts reports a whole radar series on hover, not one axis. The pointer's
    // angle picks the nearest axis instead, so the tooltip compares every
    // series on that axis, the way a line chart's tooltip compares a column.
    const zr = chart.getZr();
    const onMove = (event: { offsetX: number; offsetY: number }) => {
      const { enabled, count, legend: legendSlot, set } = liveRef.current.hover;
      if (!enabled || count === 0) return;
      const { cx, cy, r } = geometryFor(chart.getWidth(), chart.getHeight(), legendSlot);
      const dx = event.offsetX - cx;
      const dy = cy - event.offsetY;
      if (Math.hypot(dx, dy) > r * HOVER_REACH) {
        set(null);
        return;
      }
      const pointer = Math.atan2(dy, dx);
      const step = (2 * Math.PI) / count;
      // Clockwise distance from 12 o'clock, then rounded to the nearest axis.
      const clockwise = (((Math.PI / 2 - pointer) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const index = Math.round(clockwise / step) % count;
      set({ index, x: event.offsetX, y: event.offsetY });
    };
    const onOut = () => liveRef.current.hover.set(null);
    zr.on("mousemove", onMove);
    zr.on("globalout", onOut);

    return () => {
      zr.off("mousemove", onMove);
      zr.off("globalout", onOut);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      chart.dispose();
      chartRef.current = null;
      live.hasRevealed = false;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;
    liveRef.current.resolved = resolveColors(container, config, seriesKeys);

    const push = (withEntrance: boolean) => {
      const option = buildOption();
      const merged = withChartFont(chartOptions ? { ...option, ...chartOptions } : option, container);
      Object.assign(merged, {
        animation: withEntrance,
        animationDuration: REVEAL_DURATION,
        animationEasing: "cubicOut",
        animationDurationUpdate: 0,
      });
      chart.setOption(merged as EChartsOption, { notMerge: true });
    };

    if (isLoading) liveRef.current.hasRevealed = false;
    const shouldReveal = !liveRef.current.hasRevealed && !isLoading;
    if (shouldReveal) liveRef.current.hasRevealed = true;
    push(animation && shouldReveal && !shouldReduceMotion);

    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, seriesKeys);
      push(false);
    };
  }, [buildOption, chartOptions, config, seriesKeys, isLoading, animation, shouldReduceMotion]);

  // A default index opens the tooltip on that axis, beside its outer point.
  const geometry = geometryFor(size.width, size.height, legend);
  const resting: HoverState =
    tooltip.present && !isLoading && tooltip.defaultIndex != null && names.length > 0
      ? (() => {
          const index = Math.min(Math.max(tooltip.defaultIndex, 0), names.length - 1);
          const angle = axisAngle(index, names.length);
          return {
            index,
            x: geometry.cx + Math.cos(angle) * geometry.r,
            y: geometry.cy - Math.sin(angle) * geometry.r,
          };
        })()
      : null;
  const hoverEnabled = tooltip.present && !isLoading;
  const active = (hoverEnabled ? hover : null) ?? resting;

  const tooltipHtml = useMemo(() => {
    if (!active || !tooltip.present) return "";
    const row = data[active.index];
    if (!row) return "";
    const body = radars
      .map((slot) => {
        const item = config[slot.dataKey];
        const raw = Number(row[slot.dataKey]);
        const value = Number.isFinite(raw)
          ? (tooltip.valueFormatter?.(raw) ?? raw.toLocaleString())
          : "—";
        return tooltipRow({
          indicatorHtml: tooltipIndicatorHtml(slot.dataKey, item ? getColorsCount(item) : 1),
          labelText: escapeHtml(labelOf(config, slot.dataKey)),
          valueText: escapeHtml(value),
          dimmed: selected != null && selected !== slot.dataKey ? " opacity-30" : "",
        });
      })
      .join("");
    const name = names[active.index] ?? "";
    const label = axis.tickFormatter ? axis.tickFormatter(name, active.index) : name;
    return tooltipShell({
      label: escapeHtml(label),
      body,
      roundness: tooltip.roundness,
      variant: tooltip.variant,
    });
  }, [active, tooltip, data, radars, config, selected, names, axis]);

  const activeAngle = active ? axisAngle(active.index, names.length) : 0;
  const tooltipOnLeft = active ? active.x > size.width / 2 : false;
  const tooltipStyle: CSSProperties | undefined = active
    ? {
        left: active.x,
        top: Math.min(Math.max(active.y, 40), Math.max(size.height - 40, 40)),
        transform: `translate(${tooltipOnLeft ? "calc(-100% - 14px)" : "14px"}, -50%)`,
      }
    : undefined;

  const legendStyle: CSSProperties = {
    position: "absolute",
    left: 16,
    right: 16,
    pointerEvents: "auto",
    ...(legend.verticalAlign === "top" ? { top: 12 } : { bottom: 12 }),
  };

  const defaultAriaLabel = `Radar chart comparing ${radars
    .map((slot) => labelOf(config, slot.dataKey))
    .join(", ")} across ${names.length} measures: ${names.join(", ")}.`;

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

        {axis.present && axis.showValues && !isLoading && size.width > 0 && (
          <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            {Array.from({ length: rings }, (_, ring) => {
              const fraction = (ring + 1) / rings;
              const value = min + fraction * (scaleMax - min);
              return (
                <text
                  key={ring}
                  x={geometry.cx + 4}
                  y={geometry.cy - fraction * geometry.r}
                  dominantBaseline="middle"
                  className="fill-muted-foreground"
                  fontSize={9}
                >
                  {axis.valueFormatter?.(value) ?? value.toLocaleString()}
                </text>
              );
            })}
          </svg>
        )}

        {active && tooltip.present && (
          <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            <line
              x1={geometry.cx}
              y1={geometry.cy}
              x2={geometry.cx + Math.cos(activeAngle) * geometry.r}
              y2={geometry.cy - Math.sin(activeAngle) * geometry.r}
              className="text-border"
              stroke="currentColor"
              strokeWidth={STROKE_WIDTH * 0.6}
              strokeDasharray="3 3"
            />
            {radars.map((slot) => {
              const raw = Number(data[active.index]?.[slot.dataKey]);
              if (!Number.isFinite(raw)) return null;
              const t = scaleMax === min ? 0 : (raw - min) / (scaleMax - min);
              const distance = Math.max(0, Math.min(t, 1)) * geometry.r;
              return (
                <circle
                  key={slot.dataKey}
                  cx={geometry.cx + Math.cos(activeAngle) * distance}
                  cy={geometry.cy - Math.sin(activeAngle) * distance}
                  r={4}
                  className="stroke-background"
                  strokeWidth={2}
                  style={{
                    fill: `var(--color-${slot.dataKey}-0)`,
                    opacity: selected != null && selected !== slot.dataKey ? 0.3 : 1,
                  }}
                />
              );
            })}
          </svg>
        )}

        {tooltipHtml && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10"
            style={tooltipStyle}
            dangerouslySetInnerHTML={{ __html: tooltipHtml }}
          />
        )}
      </div>

      {legend.present && !isLoading && (
        <LegendOverlay
          seriesKeys={seriesKeys}
          config={config}
          variant={legend.variant}
          align={legend.align}
          verticalAlign={legend.verticalAlign}
          selectedKey={selected}
          hoveredKey={null}
          isClickable={legend.isClickable}
          onToggle={(key) => select(selected === key ? null : key)}
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

RadarChart.Grid = Grid;
RadarChart.Axis = Axis;
RadarChart.Radar = Radar;
RadarChart.Tooltip = Tooltip;
RadarChart.Legend = Legend;
