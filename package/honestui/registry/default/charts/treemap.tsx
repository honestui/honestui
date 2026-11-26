"use client";

import {
  escapeHtml,
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
  flattenColor,
  getColorsCount,
  resolveColors,
  withAlpha,
  type ChartConfig,
  type ResolvedColors,
  withChartFont,
} from "@/registry/default/ui/charts/chart";
import { LegendOverlay, type LegendVariant } from "@/registry/default/ui/charts/legend";
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
import { TooltipComponent, type TooltipComponentOption } from "echarts/components";
import { TreemapChart as TreemapChartModule, type TreemapSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type { ChartConfig, LegendVariant, TooltipPosition, TooltipRoundness, TooltipVariant };

echarts.use([TreemapChartModule, TooltipComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = ComposeOption<TreemapSeriesOption | TooltipComponentOption>;

const GRAY = "rgba(120, 120, 120, 1)";
const BREADCRUMB_HEIGHT = 22;

/** A node in the tree. Leaves carry a value; a parent's value is the sum of its children. */
export type TreemapNode = {
  name: string;
  value?: number;
  children?: TreemapNode[];
  [key: string]: unknown;
};

export type TreemapTile = {
  name: string;
  value: number;
  /** Names from the top-level category down to this tile. */
  path: string[];
  /** The top-level category that colours this tile. */
  category: string;
  node: TreemapNode;
};

export interface TreemapProps {
  /** Top-level nodes. Each one is a category and should have a `config` entry. */
  data: TreemapNode[];
  config: ChartConfig;
  className?: string;
  animation?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
  onTileClick?: (tile: TreemapTile) => void;
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

export interface TilesProps {
  radius?: number;
  gap?: number;
  /** Shows each tile's value under its name. */
  showValues?: boolean;
  valueFormatter?: (value: number) => string;
  /**
   * Shows only the top level until a tile is clicked, then zooms into it. A
   * breadcrumb leads back out.
   */
  isDrillable?: boolean;
  /** Labels parent tiles in a header strip when several levels are shown at once. */
  showParentLabels?: boolean;
  /** The breadcrumb's first item, which returns to the top level. */
  rootLabel?: string;
  isClickable?: boolean;
}

const Tiles: FC<TilesProps> = () => null;
Tiles.displayName = "Treemap.Tiles";

export interface TooltipProps {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  position?: TooltipPosition;
  valueFormatter?: (value: number) => string;
}

const Tooltip: FC<TooltipProps> = () => null;
Tooltip.displayName = "Treemap.Tooltip";

export interface LegendProps {
  variant?: LegendVariant;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "bottom";
}

const Legend: FC<LegendProps> = () => null;
Legend.displayName = "Treemap.Legend";

type TilesSlot = Required<Omit<TilesProps, "valueFormatter">> & Pick<TilesProps, "valueFormatter">;
type TooltipSlot = Required<Pick<TooltipProps, "variant" | "roundness" | "position">> &
  Pick<TooltipProps, "valueFormatter"> & { present: boolean };
type LegendSlot = Required<LegendProps> & { present: boolean };

function matchesSlot(type: unknown, slot: FC, name: string) {
  if (type === slot) return true;
  if (typeof type !== "function") return false;
  const candidate = (type as FC).displayName ?? type.name;
  return candidate === name || candidate === `Treemap.${name}`;
}

function collectConfig(children: ReactNode) {
  let tiles: TilesSlot = {
    radius: 2,
    gap: 2,
    showValues: true,
    isDrillable: false,
    showParentLabels: true,
    rootLabel: "All",
    isClickable: false,
  };
  let tooltip: TooltipSlot = { present: false, variant: "default", roundness: "lg", position: "variable" };
  let legend: LegendSlot = { present: false, variant: "rounded-square", align: "center", verticalAlign: "bottom" };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (matchesSlot(child.type, Tiles, "Tiles")) {
      const props = child.props as TilesProps;
      tiles = {
        radius: props.radius ?? 2,
        gap: props.gap ?? 2,
        showValues: props.showValues ?? true,
        isDrillable: props.isDrillable ?? false,
        showParentLabels: props.showParentLabels ?? true,
        rootLabel: props.rootLabel ?? "All",
        isClickable: props.isClickable ?? false,
        valueFormatter: props.valueFormatter,
      };
    } else if (matchesSlot(child.type, Tooltip, "Tooltip")) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        position: props.position ?? "variable",
        valueFormatter: props.valueFormatter,
      };
    } else if (matchesSlot(child.type, Legend, "Legend")) {
      const props = child.props as LegendProps;
      legend = {
        present: true,
        variant: props.variant ?? "rounded-square",
        align: props.align ?? "center",
        verticalAlign: props.verticalAlign ?? "bottom",
      };
    }
  });

  return { tiles, tooltip, legend };
}

function nodeValue(node: TreemapNode): number {
  if (node.children?.length) return node.children.reduce((sum, child) => sum + nodeValue(child), 0);
  return Math.max(Number(node.value) || 0, 0);
}

function treeDepth(nodes: TreemapNode[]): number {
  return nodes.reduce((depth, node) => Math.max(depth, node.children?.length ? 1 + treeDepth(node.children) : 1), 0);
}

/** Picks near-black or near-white text for a fill, flattened over the page. */
function readableText(fill: string, background: string) {
  const [r, g, b] = (flattenColor(fill, background).match(/\d+/g) ?? ["0", "0", "0"]).map(Number);
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  // Biased towards white: mid-tone fills read better with light text, and
  // dark text takes over once the fill is light enough to clear 4.5:1 with it.
  return luminance > 0.3 ? "rgba(10, 10, 10, 0.92)" : "rgba(255, 255, 255, 0.96)";
}

type SeriesNode = {
  name: string;
  value: number;
  id: string;
  children?: SeriesNode[];
  itemStyle: Record<string, unknown>;
  label?: Record<string, unknown>;
  upperLabel?: Record<string, unknown>;
  emphasis?: Record<string, unknown>;
};

type BuildContext = {
  data: TreemapNode[];
  config: ChartConfig;
  tiles: TilesSlot;
  tooltip: TooltipSlot;
  resolved: ResolvedColors;
  total: number;
  lookup: Map<string, { node: TreemapNode; path: string[]; category: string }>;
};

function buildSeriesData(ctx: BuildContext): SeriesNode[] {
  const { resolved, tiles } = ctx;
  const { tokens } = resolved;
  const formatValue = (value: number) => tiles.valueFormatter?.(value) ?? value.toLocaleString();

  const walk = (node: TreemapNode, path: string[], base: string, depth: number, rank: number, siblings: number): SeriesNode => {
    const value = nodeValue(node);
    // Top-level nodes are categories, shown by their config label.
    const configLabel = depth === 0 ? ctx.config[node.name]?.label : undefined;
    const name = typeof configLabel === "string" ? configLabel : node.name;
    const id = path.join("\u0000");
    const isParent = Boolean(node.children?.length);
    // Depth tints: categories take their full colour; children step lighter by
    // rank so neighbours stay distinguishable while reading as one family.
    const step = siblings > 1 ? rank / (siblings - 1) : 0;
    const alpha = depth === 0 ? 1 : 1 - step * 0.42;
    const fill = withAlpha(base, alpha);
    const text = readableText(fill, tokens.background);

    if (isParent) {
      const ordered = [...(node.children ?? [])].sort((a, b) => nodeValue(b) - nodeValue(a));
      const headerColor = withAlpha(base, depth === 0 ? 0.14 : 0.1);
      return {
        name: node.name,
        value,
        id,
        children: ordered.map((child, index) =>
          walk(child, [...path, child.name], base, depth + 1, index, ordered.length),
        ),
        itemStyle: {
          color: fill,
          // A parent shows through its border as a tinted frame, which holds the
          // header strip and keeps sibling groups apart.
          borderColor: headerColor,
          borderWidth: tiles.showParentLabels ? tiles.gap : 0,
          gapWidth: tiles.gap,
          borderRadius: tiles.radius,
        },
        upperLabel: {
          show: tiles.showParentLabels,
          height: 24,
          color: tokens.foreground,
          fontSize: 11,
          fontWeight: 500,
          padding: [0, 4],
          formatter: () =>
            tiles.showValues
              ? `{name|${name}}  {value|${formatValue(value)}}`
              : `{name|${name}}`,
          // Rich fragments set their own line height so the strip's text
          // centers instead of riding the top edge.
          rich: {
            name: { color: tokens.foreground, fontSize: 11, fontWeight: 500, lineHeight: 24 },
            value: { color: tokens.mutedForeground, fontSize: 10, lineHeight: 24 },
          },
        },
        label: {
          // Shown when the parent is a leaf of the visible depth (drill-down).
          color: text,
          formatter: () =>
            tiles.showValues ? `{name|${name}}\n{value|${formatValue(value)}}` : `{name|${name}}`,
          rich: {
            name: { color: text, fontSize: 12, fontWeight: 500, lineHeight: 16 },
            value: { color: withAlpha(text, 0.72), fontSize: 11, lineHeight: 15 },
          },
        },
      };
    }

    return {
      name: node.name,
      value,
      id,
      itemStyle: { color: fill, borderColor: "transparent", borderWidth: 0, borderRadius: tiles.radius },
      label: {
        color: text,
        formatter: () =>
          tiles.showValues ? `{name|${name}}\n{value|${formatValue(value)}}` : `{name|${name}}`,
        rich: {
          name: { color: text, fontSize: 12, fontWeight: 500, lineHeight: 16 },
          value: { color: withAlpha(text, 0.72), fontSize: 11, lineHeight: 15 },
        },
      },
    };
  };

  return ctx.data.map((node) => walk(node, [node.name], resolved.series[node.name]?.[0] ?? GRAY, 0, 0, 1));
}

function createTooltipFormatter(ctx: BuildContext) {
  const { config, tooltip, total, lookup } = ctx;
  const format = (value: number) => tooltip.valueFormatter?.(value) ?? value.toLocaleString();
  return (raw: unknown) => {
    const p = raw as { data?: { id?: string }; value?: number };
    const entry = p.data?.id ? lookup.get(p.data.id) : undefined;
    if (!entry) return "";
    const value = nodeValue(entry.node);
    const item = config[entry.category];
    const parent = entry.path.length > 1 ? lookup.get(entry.path.slice(0, -1).join("\u0000")) : undefined;
    const parentValue = parent ? nodeValue(parent.node) : total;
    const share = parentValue ? value / parentValue : 0;
    const percent = `${(share * 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
    const spacer = '<div class="h-2.5 w-2.5 shrink-0"></div>';
    const body =
      tooltipRow({
        indicatorHtml: tooltipIndicatorHtml(entry.category, item ? getColorsCount(item) : 1),
        labelText: escapeHtml(entry.node.name),
        valueText: format(value),
        dimmed: "",
      }) +
      tooltipRow({
        indicatorHtml: spacer,
        labelText: parent
          ? `Of ${escapeHtml(parent.path.length === 1 && typeof config[parent.node.name]?.label === "string" ? (config[parent.node.name]?.label as string) : parent.node.name)}`
          : "Of total",
        valueText: percent,
        dimmed: "",
      });
    const categoryLabel = typeof item?.label === "string" ? item.label : entry.category;
    return tooltipShell({
      label: escapeHtml([categoryLabel, ...entry.path.slice(1, -1)].join(" / ") || categoryLabel),
      body,
      roundness: tooltip.roundness,
      variant: tooltip.variant,
    });
  };
}

function loadingOption(tokens: ResolvedColors["tokens"]): EChartsOption {
  const values = [40, 26, 18, 12, 9, 7, 5, 4];
  return {
    animation: false,
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "treemap",
        silent: true,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        label: { show: false },
        itemStyle: { gapWidth: 2, borderWidth: 0 },
        data: values.map((value, index) => ({
          name: String(index),
          value,
          itemStyle: { color: withAlpha(tokens.foreground, 0.05 + (index % 3) * 0.04), borderRadius: 2 },
        })),
      },
    ],
  };
}

type LiveState = {
  resolved: ResolvedColors | null;
  repush: () => void;
  click: {
    lookup: BuildContext["lookup"];
    enabled: boolean;
    callback?: (tile: TreemapTile) => void;
  };
};

export function Treemap({
  data,
  config,
  className,
  animation = true,
  isLoading = false,
  ariaLabel,
  onTileClick,
  chartOptions,
  children,
}: TreemapProps) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { tiles, tooltip, legend } = collectConfig(children);
  const categories = useMemo(() => data.map((node) => node.name), [data]);
  const total = useMemo(() => data.reduce((sum, node) => sum + nodeValue(node), 0), [data]);
  const depth = useMemo(() => treeDepth(data), [data]);
  const lookup = useMemo(() => {
    const map: BuildContext["lookup"] = new Map();
    const walk = (node: TreemapNode, path: string[], category: string) => {
      map.set(path.join("\u0000"), { node, path, category });
      node.children?.forEach((child) => walk(child, [...path, child.name], category));
    };
    data.forEach((node) => walk(node, [node.name], node.name));
    return map;
  }, [data]);
  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);
  const sorted = [...data].sort((a, b) => nodeValue(b) - nodeValue(a));
  const defaultAriaLabel = `Treemap of ${data.length} categories totalling ${total.toLocaleString()}: ${sorted
    .slice(0, 6)
    .map((node) => {
      const label = config[node.name]?.label;
      return `${typeof label === "string" ? label : node.name} ${nodeValue(node).toLocaleString()}`;
    })
    .join(", ")}${sorted.length > 6 ? ", and more" : ""}.`;

  const liveRef = useRef<LiveState>({
    resolved: null,
    repush: () => {},
    click: { lookup, enabled: false },
  });

  const buildOption = useCallback((): EChartsOption => {
    const resolved = liveRef.current.resolved;
    if (!resolved) return {};
    if (isLoading) return loadingOption(resolved.tokens);
    const { tokens } = resolved;
    const ctx: BuildContext = { data, config, tiles, tooltip, resolved, total, lookup };
    const legendRoom = legend.present ? 32 : 0;
    const legendTop = legend.present && legend.verticalAlign === "top";

    return {
      animation: animation && !shouldReduceMotion,
      animationDuration: 480,
      animationDurationUpdate: shouldReduceMotion ? 0 : 360,
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
        formatter: createTooltipFormatter(ctx),
      },
      series: [
        {
          id: "treemap",
          name: tiles.rootLabel,
          type: "treemap",
          drillDownIcon: "",
          left: 0,
          right: 0,
          top: legendTop ? legendRoom : 0,
          bottom: (legend.present && !legendTop ? legendRoom : 0) + (tiles.isDrillable ? BREADCRUMB_HEIGHT + 8 : 0),
          roam: false,
          // Labels and gaps are drawn per node, so no level needs styling here.
          leafDepth: tiles.isDrillable ? 1 : undefined,
          nodeClick: tiles.isDrillable ? "zoomToNode" : false,
          cursor: tiles.isDrillable || tiles.isClickable ? "pointer" : "default",
          squareRatio: 0.5 * (1 + Math.sqrt(5)),
          visibleMin: 64,
          childrenVisibleMin: 400,
          silent: !tooltip.present && !tiles.isDrillable && !tiles.isClickable,
          itemStyle: { gapWidth: tiles.gap, borderWidth: 0, borderColor: "transparent" },
          // The root is the canvas itself: no header strip, no frame. Deeper
          // levels are styled per node.
          levels: [{ itemStyle: { gapWidth: tiles.gap, borderWidth: 0 }, upperLabel: { show: false } }],
          label: {
            show: true,
            position: "insideTopLeft",
            padding: [6, 8],
            overflow: "truncate",
            ellipsis: "…",
          },
          upperLabel: { show: depth > 1 && tiles.showParentLabels && !tiles.isDrillable, height: 24 },
          emphasis: {
            itemStyle: { shadowBlur: 0 },
            upperLabel: { show: depth > 1 && tiles.showParentLabels && !tiles.isDrillable },
          },
          breadcrumb: {
            show: tiles.isDrillable,
            left: 0,
            bottom: legend.present && !legendTop ? legendRoom : 0,
            height: BREADCRUMB_HEIGHT,
            emptyItemWidth: 24,
            itemStyle: {
              color: withAlpha(tokens.foreground, 0.04),
              borderColor: withAlpha(tokens.border, 1),
              borderWidth: 0.5,
              shadowBlur: 0,
              textStyle: { color: tokens.mutedForeground, fontSize: 11 },
            },
            emphasis: {
              itemStyle: {
                color: withAlpha(tokens.foreground, 0.08),
                textStyle: { color: tokens.foreground, fontSize: 11 },
              },
            },
          },
          data: buildSeriesData(ctx),
        },
      ],
    } as EChartsOption;
  }, [isLoading, data, config, tiles, tooltip, legend, total, lookup, depth, animation, shouldReduceMotion]);

  useEffect(() => {
    liveRef.current.click = {
      lookup,
      enabled: tiles.isClickable,
      callback: onTileClick,
    };
  }, [lookup, tiles.isClickable, onTileClick]);

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
      const id = (params as { data?: { id?: string } }).data?.id;
      const entry = id ? current.lookup.get(id) : undefined;
      if (!entry) return;
      current.callback({
        name: entry.node.name,
        value: nodeValue(entry.node),
        path: entry.path,
        category: entry.category,
        node: entry.node,
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
    liveRef.current.resolved = resolveColors(container, config, categories);
    const push = () => {
      const option = buildOption();
      const merged = withChartFont(chartOptions ? { ...option, ...chartOptions } : option, container);
      chart.setOption(merged as EChartsOption, { notMerge: true });
    };
    push();
    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, categories);
      push();
    };
  }, [buildOption, chartOptions, config, categories]);

  const legendStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    ...(legend.verticalAlign === "top" ? { top: 0 } : { bottom: 0 }),
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
          <LegendOverlay
            seriesKeys={categories}
            config={config}
            variant={legend.variant}
            align={legend.align}
            verticalAlign={legend.verticalAlign}
            selectedKey={null}
            hoveredKey={null}
            isClickable={false}
            onToggle={() => {}}
            style={legendStyle}
          />
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

Treemap.Tiles = Tiles;
Treemap.Tooltip = Tooltip;
Treemap.Legend = Legend;
