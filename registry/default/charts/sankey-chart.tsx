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
  type FC,
  type ReactNode,
} from "react";
import { TooltipComponent, type TooltipComponentOption } from "echarts/components";
import { SankeyChart as SankeyChartModule, type SankeySeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type { ChartConfig, TooltipPosition, TooltipRoundness, TooltipVariant };

echarts.use([SankeyChartModule, TooltipComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = ComposeOption<SankeySeriesOption | TooltipComponentOption>;

const GRAY = "rgba(120, 120, 120, 1)";

export type SankeyNodeAlign = "justify" | "left" | "right";
export type SankeyLinkColor = "source" | "target" | "gradient";
export type SankeyOrient = "horizontal" | "vertical";

export type SankeyLink<TData extends Record<string, unknown>> = {
  source: string;
  target: string;
  value: number;
  datum: TData;
  index: number;
};

export type SankeyNode = {
  name: string;
  /** Total flowing in. Zero for a source node. */
  inflow: number;
  /** Total flowing out. Zero for a terminal node. */
  outflow: number;
};

export interface SankeyChartProps<TData extends Record<string, unknown>> {
  /** One row per link. Nodes are derived from the source and target names. */
  data: TData[];
  config: ChartConfig;
  sourceKey: keyof TData & string;
  targetKey: keyof TData & string;
  valueKey: keyof TData & string;
  /** Optional node order. Nodes not listed follow in order of appearance. */
  nodes?: string[];
  orient?: SankeyOrient;
  className?: string;
  animation?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
  onNodeClick?: (node: SankeyNode) => void;
  onLinkClick?: (link: SankeyLink<TData>) => void;
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

export interface NodesProps {
  width?: number;
  gap?: number;
  align?: SankeyNodeAlign;
  radius?: number;
  isClickable?: boolean;
  /** Lets people drag nodes to untangle a dense layout. */
  draggable?: boolean;
}

const Nodes: FC<NodesProps> = () => null;
Nodes.displayName = "SankeyChart.Nodes";

export interface LinksProps {
  color?: SankeyLinkColor;
  opacity?: number;
  curveness?: number;
  isClickable?: boolean;
}

const Links: FC<LinksProps> = () => null;
Links.displayName = "SankeyChart.Links";

export interface LabelsProps {
  showValues?: boolean;
  valueFormatter?: (value: number) => string;
}

const Labels: FC<LabelsProps> = () => null;
Labels.displayName = "SankeyChart.Labels";

export interface TooltipProps {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  position?: TooltipPosition;
  valueFormatter?: (value: number) => string;
}

const Tooltip: FC<TooltipProps> = () => null;
Tooltip.displayName = "SankeyChart.Tooltip";

type NodesSlot = Required<NodesProps>;
type LinksSlot = Required<LinksProps>;
type LabelsSlot = LabelsProps & { present: boolean };
type TooltipSlot = Required<Pick<TooltipProps, "variant" | "roundness" | "position">> &
  Pick<TooltipProps, "valueFormatter"> & { present: boolean };

function matchesSlot(type: unknown, slot: FC, name: string) {
  if (type === slot) return true;
  if (typeof type !== "function") return false;
  const candidate = (type as FC).displayName ?? type.name;
  return candidate === name || candidate === `SankeyChart.${name}`;
}

function collectConfig(children: ReactNode) {
  let nodes: NodesSlot = { width: 10, gap: 12, align: "justify", radius: 2, isClickable: false, draggable: false };
  let links: LinksSlot = { color: "source", opacity: 0.22, curveness: 0.5, isClickable: false };
  let labels: LabelsSlot = { present: false };
  let tooltip: TooltipSlot = { present: false, variant: "default", roundness: "lg", position: "variable" };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (matchesSlot(child.type, Nodes, "Nodes")) {
      const props = child.props as NodesProps;
      nodes = {
        width: props.width ?? 10,
        gap: props.gap ?? 12,
        align: props.align ?? "justify",
        radius: props.radius ?? 2,
        isClickable: props.isClickable ?? false,
        draggable: props.draggable ?? false,
      };
    } else if (matchesSlot(child.type, Links, "Links")) {
      const props = child.props as LinksProps;
      links = {
        color: props.color ?? "source",
        opacity: props.opacity ?? 0.22,
        curveness: props.curveness ?? 0.5,
        isClickable: props.isClickable ?? false,
      };
    } else if (matchesSlot(child.type, Labels, "Labels")) {
      labels = { present: true, ...(child.props as LabelsProps) };
    } else if (matchesSlot(child.type, Tooltip, "Tooltip")) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        position: props.position ?? "variable",
        valueFormatter: props.valueFormatter,
      };
    }
  });

  return { nodes, links, labels, tooltip };
}

function nodeLabel(config: ChartConfig, name: string) {
  const label = config[name]?.label;
  return typeof label === "string" ? label : name;
}

type Graph<TData extends Record<string, unknown>> = {
  nodes: SankeyNode[];
  links: SankeyLink<TData>[];
  /** For a node without its own colour: the config key it borrows one from. */
  colorKey: Map<string, string | null>;
};

function buildGraph<TData extends Record<string, unknown>>(
  data: TData[],
  sourceKey: string,
  targetKey: string,
  valueKey: string,
  order: string[] | undefined,
  config: ChartConfig,
): Graph<TData> {
  const links = data
    .map((datum, index) => ({
      source: String(datum[sourceKey]),
      target: String(datum[targetKey]),
      value: Math.max(Number(datum[valueKey]) || 0, 0),
      datum,
      index,
    }))
    // ECharts rejects self-loops, and a zero link has no width to draw.
    .filter((link) => link.source !== link.target && link.value > 0);
  const names = [...(order ?? [])];
  for (const link of links) {
    if (!names.includes(link.source)) names.push(link.source);
    if (!names.includes(link.target)) names.push(link.target);
  }
  const nodes = names.map((name) => ({
    name,
    inflow: links.filter((link) => link.target === name).reduce((sum, link) => sum + link.value, 0),
    outflow: links.filter((link) => link.source === name).reduce((sum, link) => sum + link.value, 0),
  }));

  // A node without a config colour borrows the colour of its largest inflow,
  // so a flow keeps its identity until it reaches a node that defines its own.
  const colorKey = new Map<string, string | null>();
  const resolve = (name: string, seen: Set<string>): string | null => {
    if (colorKey.has(name)) return colorKey.get(name) ?? null;
    if (config[name]?.colors) {
      colorKey.set(name, name);
      return name;
    }
    if (seen.has(name)) return null;
    seen.add(name);
    const incoming = links.filter((link) => link.target === name).sort((a, b) => b.value - a.value)[0];
    const key = incoming ? resolve(incoming.source, seen) : null;
    colorKey.set(name, key);
    return key;
  };
  names.forEach((name) => resolve(name, new Set()));

  return { nodes, links, colorKey };
}

type BuildContext = {
  graph: Graph<Record<string, unknown>>;
  config: ChartConfig;
  orient: SankeyOrient;
  nodesSlot: NodesSlot;
  linksSlot: LinksSlot;
  labels: LabelsSlot;
  tooltip: TooltipSlot;
  resolved: ResolvedColors;
};

function colorOf(ctx: BuildContext, name: string) {
  const key = ctx.graph.colorKey.get(name);
  return (key && ctx.resolved.series[key]?.[0]) || GRAY;
}

function createTooltipFormatter(ctx: BuildContext) {
  const { config, tooltip, graph } = ctx;
  const format = (value: number) => tooltip.valueFormatter?.(value) ?? value.toLocaleString();
  const spacer = '<div class="h-2.5 w-2.5 shrink-0"></div>';
  const indicator = (name: string) => {
    const key = graph.colorKey.get(name);
    return key ? tooltipIndicatorHtml(key, getColorsCount(config[key] ?? {})) : spacer;
  };
  return (raw: unknown) => {
    const p = raw as { dataType?: "node" | "edge"; dataIndex?: number };
    if (p.dataType === "edge") {
      const link = graph.links[p.dataIndex ?? -1];
      if (!link) return "";
      const source = graph.nodes.find((node) => node.name === link.source);
      const share = source?.outflow ? link.value / source.outflow : 0;
      const body =
        tooltipRow({
          indicatorHtml: indicator(link.source),
          labelText: escapeHtml(nodeLabel(config, link.target)),
          valueText: format(link.value),
          dimmed: "",
        }) +
        tooltipRow({
          indicatorHtml: spacer,
          labelText: `Of ${escapeHtml(nodeLabel(config, link.source))}`,
          valueText: `${(share * 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`,
          dimmed: "",
        });
      return tooltipShell({
        label: `${escapeHtml(nodeLabel(config, link.source))} → ${escapeHtml(nodeLabel(config, link.target))}`,
        body,
        roundness: tooltip.roundness,
        variant: tooltip.variant,
      });
    }
    const node = graph.nodes[p.dataIndex ?? -1];
    if (!node) return "";
    const rows = [];
    if (node.inflow) {
      rows.push(tooltipRow({ indicatorHtml: indicator(node.name), labelText: "In", valueText: format(node.inflow), dimmed: "" }));
    }
    if (node.outflow) {
      rows.push(
        tooltipRow({
          indicatorHtml: node.inflow ? spacer : indicator(node.name),
          labelText: "Out",
          valueText: format(node.outflow),
          dimmed: "",
        }),
      );
    }
    return tooltipShell({
      label: escapeHtml(nodeLabel(config, node.name)),
      body: rows.join(""),
      roundness: tooltip.roundness,
      variant: tooltip.variant,
    });
  };
}

function seriesOption(ctx: BuildContext): SankeySeriesOption {
  const { graph, config, orient, nodesSlot, linksSlot, labels, resolved } = ctx;
  const { tokens } = resolved;
  const isVertical = orient === "vertical";
  const format = (value: number) => labels.valueFormatter?.(value) ?? value.toLocaleString();
  const hasOutflow = new Set(graph.links.map((link) => link.source));

  return {
    id: "sankey",
    type: "sankey",
    orient,
    left: isVertical ? 8 : 8,
    right: isVertical ? 8 : labels.present ? 8 : 8,
    top: isVertical ? (labels.present ? 24 : 8) : 8,
    bottom: isVertical ? (labels.present ? 24 : 8) : 8,
    nodeWidth: nodesSlot.width,
    nodeGap: nodesSlot.gap,
    nodeAlign: nodesSlot.align,
    layoutIterations: 32,
    draggable: nodesSlot.draggable,
    cursor: nodesSlot.isClickable || linksSlot.isClickable ? "pointer" : "default",
    silent: !ctx.tooltip.present && !nodesSlot.isClickable && !linksSlot.isClickable,
    emphasis: {
      // Hovering a node or a link keeps only its neighbourhood in focus.
      focus: "adjacency",
      lineStyle: { opacity: Math.min(linksSlot.opacity * 2.2, 0.6) },
    },
    blur: {
      itemStyle: { opacity: 0.25 },
      lineStyle: { opacity: 0.05 },
      label: { opacity: 0.4 },
    },
    itemStyle: { borderWidth: 0, borderRadius: nodesSlot.radius },
    lineStyle: { color: linksSlot.color, opacity: linksSlot.opacity, curveness: linksSlot.curveness },
    label: {
      show: labels.present,
      color: tokens.foreground,
      fontSize: 11,
      distance: 6,
    },
    data: graph.nodes.map((node) => {
      // Terminal nodes label inward so the last column never runs off the edge.
      const isTerminal = !hasOutflow.has(node.name);
      const position = isVertical ? (isTerminal ? "top" : "bottom") : isTerminal ? "left" : "right";
      const total = Math.max(node.inflow, node.outflow);
      return {
        name: node.name,
        itemStyle: { color: colorOf(ctx, node.name) },
        label: {
          position,
          formatter: () =>
            labels.showValues
              ? `{name|${nodeLabel(config, node.name)}}  {value|${format(total)}}`
              : `{name|${nodeLabel(config, node.name)}}`,
          rich: {
            name: { color: tokens.foreground, fontSize: 11 },
            value: { color: tokens.mutedForeground, fontSize: 10 },
          },
        },
      };
    }),
    links: graph.links.map((link) => ({
      source: link.source,
      target: link.target,
      value: link.value,
    })),
  } as SankeySeriesOption;
}

function loadingOption(tokens: ResolvedColors["tokens"]): EChartsOption {
  const color = withAlpha(tokens.foreground, 0.1);
  const names = ["a", "b", "c", "d", "e", "f"];
  return {
    animation: false,
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "sankey",
        silent: true,
        left: 8,
        right: 8,
        top: 8,
        bottom: 8,
        nodeWidth: 10,
        nodeGap: 12,
        label: { show: false },
        itemStyle: { color, borderWidth: 0, borderRadius: 2 },
        lineStyle: { color: withAlpha(tokens.foreground, 0.5), opacity: 0.08, curveness: 0.5 },
        data: names.map((name) => ({ name })),
        links: [
          { source: "a", target: "c", value: 5 },
          { source: "a", target: "d", value: 3 },
          { source: "b", target: "d", value: 4 },
          { source: "c", target: "e", value: 4 },
          { source: "d", target: "e", value: 3 },
          { source: "d", target: "f", value: 4 },
        ],
      },
    ],
  };
}

type LiveState = {
  resolved: ResolvedColors | null;
  repush: () => void;
  click: {
    graph: Graph<Record<string, unknown>>;
    nodesEnabled: boolean;
    linksEnabled: boolean;
    onNode?: (node: SankeyNode) => void;
    onLink?: (link: SankeyLink<Record<string, unknown>>) => void;
  };
};

export function SankeyChart<TData extends Record<string, unknown>>({
  data,
  config,
  sourceKey,
  targetKey,
  valueKey,
  nodes,
  orient = "horizontal",
  className,
  animation = true,
  isLoading = false,
  ariaLabel,
  onNodeClick,
  onLinkClick,
  chartOptions,
  children,
}: SankeyChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { nodes: nodesSlot, links: linksSlot, labels, tooltip } = collectConfig(children);
  const graph = useMemo(
    () => buildGraph(data, sourceKey, targetKey, valueKey, nodes, config),
    [data, sourceKey, targetKey, valueKey, nodes, config],
  );
  const colorKeys = useMemo(
    () => Array.from(new Set([...graph.colorKey.values()].filter((key): key is string => Boolean(key)))),
    [graph],
  );
  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);
  const sources = graph.nodes.filter((node) => !node.inflow);
  const largest = [...graph.links].sort((a, b) => b.value - a.value).slice(0, 3);
  const defaultAriaLabel = `Sankey diagram of ${graph.links.length} flows between ${graph.nodes.length} nodes, starting from ${sources
    .map((node) => nodeLabel(config, node.name))
    .join(", ")}. Largest flows: ${largest
    .map((link) => `${nodeLabel(config, link.source)} to ${nodeLabel(config, link.target)} ${link.value.toLocaleString()}`)
    .join("; ")}.`;

  const liveRef = useRef<LiveState>({
    resolved: null,
    repush: () => {},
    click: { graph: graph as Graph<Record<string, unknown>>, nodesEnabled: false, linksEnabled: false },
  });

  const buildOption = useCallback((): EChartsOption => {
    const resolved = liveRef.current.resolved;
    if (!resolved) return {};
    if (isLoading) return loadingOption(resolved.tokens);
    const ctx: BuildContext = {
      graph: graph as Graph<Record<string, unknown>>,
      config,
      orient,
      nodesSlot,
      linksSlot,
      labels,
      tooltip,
      resolved,
    };
    return {
      animation: animation && !shouldReduceMotion,
      animationDuration: 480,
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
      series: [seriesOption(ctx)],
    };
  }, [isLoading, graph, config, orient, nodesSlot, linksSlot, labels, tooltip, animation, shouldReduceMotion]);

  useEffect(() => {
    liveRef.current.click = {
      graph: graph as Graph<Record<string, unknown>>,
      nodesEnabled: nodesSlot.isClickable,
      linksEnabled: linksSlot.isClickable,
      onNode: onNodeClick,
      onLink: onLinkClick as LiveState["click"]["onLink"],
    };
  }, [graph, nodesSlot.isClickable, linksSlot.isClickable, onNodeClick, onLinkClick]);

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
      const p = params as { dataType?: "node" | "edge"; dataIndex?: number };
      if (p.dataType === "edge") {
        const link = current.graph.links[p.dataIndex ?? -1];
        if (link && current.linksEnabled) current.onLink?.(link);
      } else {
        const node = current.graph.nodes[p.dataIndex ?? -1];
        if (node && current.nodesEnabled) current.onNode?.(node);
      }
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
    liveRef.current.resolved = resolveColors(container, config, colorKeys);
    const push = () => {
      const option = buildOption();
      const merged = withChartFont(chartOptions ? { ...option, ...chartOptions } : option, container);
      chart.setOption(merged as EChartsOption, { notMerge: true });
    };
    push();
    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, colorKeys);
      push();
    };
  }, [buildOption, chartOptions, config, colorKeys]);

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

SankeyChart.Nodes = Nodes;
SankeyChart.Links = Links;
SankeyChart.Labels = Labels;
SankeyChart.Tooltip = Tooltip;
