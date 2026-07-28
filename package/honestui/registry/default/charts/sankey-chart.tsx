"use client";

import {
  resolveTooltipPosition,
  roundnessClass,
  tooltipIndicatorHtml,
  tooltipRow,
  tooltipVariantClass,
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
  useState,
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

type SankeyNodeItem = NonNullable<SankeySeriesOption["data"]>[number];
type SankeyEdgeItem = NonNullable<SankeySeriesOption["links"]>[number];

const INTRO_COLUMN_STAGGER = 130; 
const INTRO_NODE_GROW = 340; 
const INTRO_LINK_DELAY = 90; 
const INTRO_LINK_DRAW = 520; 
const INTRO_FEATHER = 0.05; 
const INTRO_NODE_SCALE_FROM = 0.8; 
const LOADING_ANIMATION_DURATION = 2000; 
const DEFAULT_NODE_WIDTH = 10;
const DEFAULT_NODE_PADDING = 10;
const DEFAULT_LINK_CURVATURE = 0.5;
const DEFAULT_ITERATIONS = 32;
const GRAY = "rgba(120, 120, 120, 1)"; 

const NODE_FILL_OPACITY = 1; 
const NODE_DIM_OPACITY = 0.3; 
const LINK_FILL_OPACITY = 0.4; 
const LINK_DIM_OPACITY = 0.05; 
const LABEL_DIM_OPACITY = 0.3; 
const INSIDE_PLATE_ALPHA = 0.55; 
const INSIDE_RIM_WIDTH = 1; 

const LOADING_NODE_FLOOR = 0.1; 
const LOADING_NODE_PEAK = 0.42; 
const LOADING_LINK_FLOOR = 0.04; 
const LOADING_LINK_PEAK = 0.16; 
const LOADING_SHIMMER_BAND = 0.22; 
const LOADING_SHIMMER_FEATHER = 0.22; 

const SKELETON_NODES = [
  { name: "s0" },
  { name: "s1" },
  { name: "s2" },
  { name: "m0" },
  { name: "m1" },
  { name: "m2" },
  { name: "e0" },
  { name: "e1" },
];
const SKELETON_LINKS = [
  { source: "s0", target: "m0", value: 8 },
  { source: "s0", target: "m1", value: 5 },
  { source: "s1", target: "m1", value: 7 },
  { source: "s1", target: "m2", value: 4 },
  { source: "s2", target: "m1", value: 5 },
  { source: "s2", target: "m2", value: 6 },
  { source: "m0", target: "e0", value: 7 },
  { source: "m1", target: "e0", value: 9 },
  { source: "m1", target: "e1", value: 6 },
  { source: "m2", target: "e1", value: 8 },
];

export type LinkVariant = "gradient" | "solid" | "source" | "target";
export type NodeLabelPosition = "inside" | "outside";

export type SankeyAnimationType = "none" | "default";

export type SankeyNode = {
  name: string;
  icon?: ReactNode;
};

export type SankeyLink = {
  source: number;
  target: number;
  value: number;
};

export type SankeyData = {
  nodes: SankeyNode[];
  links: SankeyLink[];
};

export interface SankeyChartProps {
  data: SankeyData; 
  config: ChartConfig; 
  children: ReactNode; 
  className?: string; 
  nodeWidth?: number; 
  nodePadding?: number; 
  linkCurvature?: number; 
  iterations?: number; 

  sort?: boolean;
  align?: "left" | "justify"; 
  verticalAlign?: "justify" | "top";
  defaultSelectedNode?: string | null; 
  onSelectionChange?: (selection: { dataKey: string; value: number } | null) => void; 
  isLoading?: boolean; 
  animation?: boolean; 
  animationType?: SankeyAnimationType; 
  chartOptions?: Record<string, unknown>; 
}

export interface NodeProps {
  radius?: number; 
  isClickable?: boolean; 
  children?: ReactNode; 
}

const Node: FC<NodeProps> = () => null;

export interface NodeLabelProps {
  position?: NodeLabelPosition; 
  showValues?: boolean; 
  valueFormatter?: (value: number) => string; 
}

const NodeLabel: FC<NodeLabelProps> = () => null;

export interface LinkProps {
  variant?: LinkVariant; 
  verticalPadding?: number; 
}

const Link: FC<LinkProps> = () => null;

export interface TooltipProps {
  variant?: TooltipVariant; 
  roundness?: TooltipRoundness; 
  position?: TooltipPosition; 
  defaultIndex?: number; 
}

const Tooltip: FC<TooltipProps> = () => null;

type NodeSlot = {
  radius: number;
  isClickable: boolean;
};
type NodeLabelSlot = {
  position?: NodeLabelPosition; 
  showValues: boolean;
  valueFormatter?: (value: number) => string;
};
type LinkSlot = {
  variant: LinkVariant;
  verticalPadding: number;
};
type TooltipSlot = {
  present: boolean;
  variant: TooltipVariant;
  roundness: TooltipRoundness;
  position: TooltipPosition;
  defaultIndex?: number;
};

type CollectedConfig = {
  nodeConfig: NodeSlot;
  nodeLabel: NodeLabelSlot | null;
  linkConfig: LinkSlot;
  tooltip: TooltipSlot;
};

function collectConfig(children: ReactNode): CollectedConfig {
  let nodeConfig: NodeSlot = { radius: 0, isClickable: false };
  let nodeLabel: NodeLabelSlot | null = null;
  let linkConfig: LinkSlot = { variant: "gradient", verticalPadding: 0 };
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
    position: "variable",
  };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = child.type;

    if (type === Node) {
      const props = child.props as NodeProps;
      nodeConfig = {
        radius: props.radius ?? 0,
        isClickable: props.isClickable ?? false,
      };
      Children.forEach(props.children, (labelChild) => {
        if (isValidElement(labelChild) && labelChild.type === NodeLabel) {
          const lp = labelChild.props as NodeLabelProps;
          nodeLabel = {
            position: lp.position,
            showValues: lp.showValues ?? false,
            valueFormatter: lp.valueFormatter,
          };
        }
      });
    } else if (type === Link) {
      const props = child.props as LinkProps;
      linkConfig = {
        variant: props.variant ?? "gradient",
        verticalPadding: props.verticalPadding ?? 0,
      };
    } else if (type === Tooltip) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        position: props.position ?? "variable",
        defaultIndex: props.defaultIndex,
      };
    }
  });

  return { nodeConfig, nodeLabel, linkConfig, tooltip };
}

function nodeGradient(slots: string[]): string | echarts.graphic.LinearGradient {
  if (slots.length <= 1) return slots[0] ?? GRAY;
  const stops = slots.map((color, i) => ({ offset: i / (slots.length - 1), color }));
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, stops);
}

function edgeColor(
  variant: LinkVariant,
  sourceSlots: string[],
  targetSlots: string[],
  foreground: string,
): string | echarts.graphic.LinearGradient {
  switch (variant) {
    case "gradient": {
      const source = sourceSlots[0] ?? GRAY;
      const target = targetSlots[0] ?? GRAY;
      return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: withAlpha(source, 0.2) },
        { offset: 0.5, color: withAlpha(source, 0.5) },
        { offset: 1, color: withAlpha(target, 0.2) },
      ]);
    }
    case "source":
      return nodeGradient(sourceSlots);
    case "target":
      return nodeGradient(targetSlots);
    case "solid":
    default:
      return foreground;
  }
}

type Paint = string | echarts.graphic.LinearGradient;
type IntroState = {
  elapsed: number; 
  depths: Record<string, number>; 
};

function computeNodeDepths(data: SankeyData): Record<string, number> {
  const nameOf = (ref: number) => data.nodes[ref]?.name ?? String(ref);
  const depths: Record<string, number> = {};
  for (const node of data.nodes) depths[node.name] = 0;

  for (let pass = 0; pass < data.nodes.length; pass++) {
    let changed = false;
    for (const link of data.links) {
      const source = nameOf(link.source);
      const target = nameOf(link.target);
      if (depths[target] === undefined || depths[source] === undefined) continue;
      if (depths[target] < depths[source] + 1) {
        depths[target] = depths[source] + 1;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return depths;
}

function introDuration(depths: Record<string, number>): number {
  const maxDepth = Math.max(0, ...Object.values(depths));
  return Math.max(
    maxDepth * INTRO_COLUMN_STAGGER + INTRO_NODE_GROW,
    Math.max(0, maxDepth - 1) * INTRO_COLUMN_STAGGER + INTRO_LINK_DELAY + INTRO_LINK_DRAW,
  );
}

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function nodePhase(intro: IntroState, name: string): number {
  const start = (intro.depths[name] ?? 0) * INTRO_COLUMN_STAGGER;
  return easeOut(clamp01((intro.elapsed - start) / INTRO_NODE_GROW));
}
function linkPhase(intro: IntroState, sourceName: string): number {
  const start = (intro.depths[sourceName] ?? 0) * INTRO_COLUMN_STAGGER + INTRO_LINK_DELAY;
  return easeOut(clamp01((intro.elapsed - start) / INTRO_LINK_DRAW));
}

function paintAxis(paint: Paint): "x" | "y" | null {
  if (typeof paint === "string") return null;
  const horizontal = Math.abs((paint.x2 ?? 0) - (paint.x ?? 0));
  const vertical = Math.abs((paint.y2 ?? 0) - (paint.y ?? 0));
  return horizontal >= vertical ? "x" : "y";
}

function paintStops(paint: Paint): { offset: number; color: string }[] {
  if (typeof paint === "string") {
    return [
      { offset: 0, color: paint },
      { offset: 1, color: paint },
    ];
  }
  const stops = paint.colorStops ?? [];
  if (stops.length === 0) return [{ offset: 0, color: GRAY }];
  return stops.map((stop) => ({ offset: stop.offset, color: stop.color }));
}

function sampleStops(stops: { offset: number; color: string }[], at: number): string {
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (!first) return GRAY;
  if (at <= first.offset) return first.color;
  if (at >= last.offset) return last.color;
  for (let i = 1; i < stops.length; i++) {
    const from = stops[i - 1];
    const to = stops[i];
    if (at > to.offset) continue;
    const span = to.offset - from.offset;
    if (span <= 1e-6) return to.color;
    return echarts.color.lerp((at - from.offset) / span, [from.color, to.color]) || from.color;
  }
  return last.color;
}

function windowedPaint(
  paint: Paint,
  axis: "x" | "y",
  edges: [number, number, number, number],
): Paint | null {
  const own = paintAxis(paint);
  if (own !== null && own !== axis) return null;

  const stops = paintStops(paint);
  const alphaAt = (offset: number) => {
    if (offset <= edges[0] || offset >= edges[3]) return 0;
    if (offset >= edges[1] && offset <= edges[2]) return 1;
    if (offset < edges[1]) return (offset - edges[0]) / Math.max(1e-6, edges[1] - edges[0]);
    return (edges[3] - offset) / Math.max(1e-6, edges[3] - edges[2]);
  };

  const offsets = [...new Set([0, 1, ...stops.map((stop) => stop.offset), ...edges])]
    .filter((offset) => offset >= 0 && offset <= 1)
    .sort((a, b) => a - b);
  const windowed = offsets.map((offset) => ({
    offset,
    color: withAlpha(sampleStops(stops, offset), alphaAt(offset)),
  }));

  return axis === "x"
    ? new echarts.graphic.LinearGradient(0, 0, 1, 0, windowed)
    : new echarts.graphic.LinearGradient(0, 0, 0, 1, windowed);
}

function growPaint(paint: Paint, phase: number): Paint | null {
  const half = (INTRO_NODE_SCALE_FROM + (1 - INTRO_NODE_SCALE_FROM) * phase) / 2;
  return windowedPaint(paint, "y", [
    0.5 - half - INTRO_FEATHER,
    0.5 - half,
    0.5 + half,
    0.5 + half + INTRO_FEATHER,
  ]);
}

function drawPaint(paint: Paint, phase: number): Paint | null {
  const head = phase * (1 + INTRO_FEATHER);
  return windowedPaint(paint, "x", [-2, -1, head - INTRO_FEATHER, head]);
}

function connectedNodeSet(data: SankeyData, selected: string): Set<string> {
  const set = new Set<string>([selected]);
  const selectedIdx = data.nodes.findIndex((node) => node.name === selected);
  if (selectedIdx === -1) return set;

  for (const link of data.links) {
    if (link.source === selectedIdx) {
      const name = data.nodes[link.target]?.name;
      if (name) set.add(name);
    } else if (link.target === selectedIdx) {
      const name = data.nodes[link.source]?.name;
      if (name) set.add(name);
    }
  }
  return set;
}

function computeNodeValues(data: SankeyData): Record<string, number> {
  const values: Record<string, number> = {};
  data.nodes.forEach((node, index) => {
    let outgoing = 0;
    let incoming = 0;
    for (const link of data.links) {
      if (link.source === index) outgoing += link.value;
      if (link.target === index) incoming += link.value;
    }
    values[node.name] = outgoing > 0 ? outgoing : incoming;
  });
  return values;
}

function shimmerWindowStops(center: number, color: string, floor: number, peak: number) {
  const half = LOADING_SHIMMER_BAND;
  const feather = LOADING_SHIMMER_FEATHER;

  const alphaAt = (x: number) => {
    const dist = Math.abs(x - center);
    if (dist <= half - feather) return peak;
    if (dist >= half) return floor;

    const eased = Math.sin(((1 - (dist - (half - feather)) / feather) * Math.PI) / 2);
    return floor + (peak - floor) * eased;
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

type OptionBuildContext = {
  data: SankeyData;
  config: ChartConfig;
  nodeConfig: NodeSlot;
  nodeLabel: NodeLabelSlot | null;
  linkConfig: LinkSlot;
  tooltipSlot: TooltipSlot;
  selectedNode: string | null;
  nodeWidth: number;
  nodePadding: number;
  linkCurvature: number;
  iterations: number;
  align: "left" | "justify";
  isLoading: boolean;
  resolved: ResolvedColors;
  nodeValues: Record<string, number>;
  outsideLabels: boolean; 
  intro: IntroState | null; 
};

function buildNodeLabel(ctx: OptionBuildContext): SankeySeriesOption["label"] {
  const { nodeLabel, config, nodeValues, resolved } = ctx;
  const position = nodeLabel?.position;

  if (position !== "inside" && position !== "outside") return { show: false };

  const { tokens } = resolved;
  const inside = position === "inside";
  const showValues = nodeLabel?.showValues ?? false;
  const format = nodeLabel?.valueFormatter ?? ((value: number) => value.toLocaleString());

  const labelOf = (name: string) => {
    const label = config[name]?.label;
    return typeof label === "string" ? label : name;
  };

  const formatter = (params: unknown): string => {
    const name = String((params as { name?: string | number }).name ?? "");
    const nameText = labelOf(name);
    if (!showValues) return `{name|${nameText}}`;
    return `{name|${nameText}}\n{value|${format(nodeValues[name] ?? 0)}}`;
  };

  return {
    show: true,

    position: inside ? "inside" : "right",
    align: inside ? "center" : "left",
    formatter,
    rich: {
      name: {
        color: tokens.foreground,
        fontSize: inside ? 10 : 12,
        fontWeight: 500,
        lineHeight: 15,
      },
      value: {
        color: withAlpha(tokens.foreground, inside ? 0.6 : 0.5),
        fontFamily: "monospace",
        fontSize: inside ? 11 : 12,
        lineHeight: 15,
      },
    },

  };
}

function buildSankeySeries(ctx: OptionBuildContext): SankeySeriesOption {
  const {
    config,
    data,
    nodeConfig,
    linkConfig,
    selectedNode,
    nodeWidth,
    nodePadding,
    linkCurvature,
    iterations,
    align,
    resolved,
    outsideLabels,
    intro,
  } = ctx;
  const { tokens, series: slotsByName } = resolved;
  const hasSelection = selectedNode !== null;
  const connected = hasSelection ? connectedNodeSet(data, selectedNode) : null;

  const insideLabels = ctx.nodeLabel?.position === "inside";

  const targetNames = new Set(
    data.links.map((link) => data.nodes[link.target]?.name ?? String(link.target)),
  );

  const nodes: SankeyNodeItem[] = data.nodes.map((node) => {
    const slots = slotsByName[node.name] ?? [GRAY];
    const dimmed = connected ? !connected.has(node.name) : false;

    const phase = intro ? nodePhase(intro, node.name) : 1;
    const fill = nodeGradient(slots);
    const grown = phase < 1 ? growPaint(fill, phase) : fill;
    const nodeAlpha = (dimmed ? NODE_DIM_OPACITY : NODE_FILL_OPACITY) * phase;

    return {
      name: node.name,
      itemStyle: insideLabels
        ? {

            color: withAlpha(tokens.background, INSIDE_PLATE_ALPHA * phase),
            borderColor: grown ?? fill,
            borderWidth: INSIDE_RIM_WIDTH,
            borderRadius: nodeConfig.radius,
            opacity: (dimmed ? NODE_DIM_OPACITY : 1) * phase,
          }
        : {
            color: grown ?? fill,
            opacity: nodeAlpha,
            borderWidth: 0,
            borderRadius: nodeConfig.radius,
          },

      label: {
        ...(config[node.name]?.label === "" ? { show: false } : {}),
        opacity: (dimmed ? LABEL_DIM_OPACITY : 1) * phase,
        ...(outsideLabels && !targetNames.has(node.name)
          ? { position: "left" as const, align: "right" as const }
          : {}),
      },
    };
  });

  const links: SankeyEdgeItem[] = data.links.map((link) => {
    const source = data.nodes[link.source]?.name ?? String(link.source);
    const target = data.nodes[link.target]?.name ?? String(link.target);
    const sourceSlots = slotsByName[source] ?? [GRAY];
    const targetSlots = slotsByName[target] ?? [GRAY];

    const isConnected = !hasSelection || source === selectedNode || target === selectedNode;

    const phase = intro ? linkPhase(intro, source) : 1;
    const band = edgeColor(linkConfig.variant, sourceSlots, targetSlots, tokens.foreground);
    const drawn = phase < 1 ? drawPaint(band, phase) : band;

    return {
      source,
      target,
      value: link.value,
      lineStyle: {
        color: drawn ?? band,
        opacity: (isConnected ? LINK_FILL_OPACITY : LINK_DIM_OPACITY) * (drawn ? 1 : phase),
      },
    };
  });

  return {
    id: "__sankey",
    type: "sankey",
    z: 3,

    left: outsideLabels ? 120 : 8,
    right: outsideLabels ? 120 : 8,
    top: 12,
    bottom: 12,
    nodeWidth,
    nodeGap: nodePadding,
    layoutIterations: iterations,
    nodeAlign: align === "left" ? "left" : "justify",
    draggable: false,

    emphasis: { focus: "none" },
    lineStyle: { curveness: linkCurvature },
    label: buildNodeLabel(ctx),
    data: nodes,
    links,
  };
}

function buildInsidePlateSeries(ctx: OptionBuildContext): SankeySeriesOption | null {
  const {
    data,
    nodeConfig,
    nodeLabel,
    selectedNode,
    nodeWidth,
    nodePadding,
    linkCurvature,
    iterations,
    align,
    resolved,
    outsideLabels,
    intro,
  } = ctx;
  if (nodeLabel?.position !== "inside") return null;

  const { series: slotsByName } = resolved;
  const hasSelection = selectedNode !== null;
  const connected = hasSelection ? connectedNodeSet(data, selectedNode) : null;

  const nodes: SankeyNodeItem[] = data.nodes.map((node) => {
    const slots = slotsByName[node.name] ?? [GRAY];
    const dimmed = connected ? !connected.has(node.name) : false;

    const phase = intro ? nodePhase(intro, node.name) : 1;
    const fill = nodeGradient(slots);
    const grown = phase < 1 ? growPaint(fill, phase) : fill;
    return {
      name: node.name,
      itemStyle: {
        color: grown ?? fill,
        opacity: (dimmed ? NODE_DIM_OPACITY : NODE_FILL_OPACITY) * phase,
        borderWidth: 0,
        borderRadius: nodeConfig.radius,
      },
      label: { show: false },
    };
  });

  const links: SankeyEdgeItem[] = data.links.map((link) => ({
    source: data.nodes[link.source]?.name ?? String(link.source),
    target: data.nodes[link.target]?.name ?? String(link.target),
    value: link.value,
    lineStyle: { opacity: 0 },
  }));

  return {
    id: "__sankey-plate",
    type: "sankey",
    z: 2, 
    silent: true,
    left: outsideLabels ? 120 : 8,
    right: outsideLabels ? 120 : 8,
    top: 12,
    bottom: 12,
    nodeWidth,
    nodeGap: nodePadding,
    layoutIterations: iterations,
    nodeAlign: align === "left" ? "left" : "justify",
    draggable: false,
    emphasis: { disabled: true },
    label: { show: false },
    lineStyle: { curveness: linkCurvature },
    data: nodes,
    links,
  };
}

function createTooltipFormatter(ctx: OptionBuildContext) {
  const { config, nodeValues, tooltipSlot } = ctx;

  const labelOf = (name: string) => {
    const label = config[name]?.label;
    return typeof label === "string" ? label : name;
  };
  const colorsOf = (name: string) => (config[name] ? getColorsCount(config[name]) : 1);

  const wrap = (body: string) =>
    `<div class="grid min-w-32 items-start gap-1.5 border border-border/50 px-2.5 py-1.5 text-xs shadow-xl ${roundnessClass[tooltipSlot.roundness]} ${tooltipVariantClass[tooltipSlot.variant]}"><div class="grid gap-1.5">${body}</div></div>`;

  return (params: unknown): string => {
    const p = params as {
      dataType?: string;
      name?: string;
      data?: { source?: string | number; target?: string | number; value?: number };
    };

    if (p.dataType === "edge") {
      const source = String(p.data?.source ?? "");
      const target = String(p.data?.target ?? "");
      const value = typeof p.data?.value === "number" ? p.data.value.toLocaleString() : "";
      return wrap(
        tooltipRow({
          indicatorHtml: tooltipIndicatorHtml(source, colorsOf(source)),
          labelText: `${labelOf(source)} → ${labelOf(target)}`,
          valueText: value,
          dimmed: "",
        }),
      );
    }

    const name = String(p.name ?? "");
    const value = (nodeValues[name] ?? 0).toLocaleString();
    return wrap(
      tooltipRow({
        indicatorHtml: tooltipIndicatorHtml(name, colorsOf(name)),
        labelText: labelOf(name),
        valueText: value,
        dimmed: "",
      }),
    );
  };
}

function buildTooltipOption(ctx: OptionBuildContext): TooltipComponentOption {
  const { tooltipSlot, isLoading } = ctx;
  return {
    show: tooltipSlot.present && !isLoading,
    trigger: "item",
    confine: true,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    extraCssText: "box-shadow:none;",

    position: resolveTooltipPosition(tooltipSlot.position),
    formatter: createTooltipFormatter(ctx),
  };
}

function buildLoadingOption(ctx: OptionBuildContext): EChartsOption {
  const { resolved } = ctx;
  const transparent = withAlpha(resolved.tokens.foreground, 0);

  return {
    animation: false,
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "sankey",
        left: 12,
        right: 12,
        top: 12,
        bottom: 12,
        nodeWidth: DEFAULT_NODE_WIDTH,
        nodeGap: DEFAULT_NODE_PADDING,
        layoutIterations: DEFAULT_ITERATIONS,
        draggable: false,
        silent: true,
        emphasis: { disabled: true },
        label: { show: false },
        itemStyle: { color: transparent, borderWidth: 0 },
        lineStyle: { color: transparent, curveness: DEFAULT_LINK_CURVATURE },
        data: SKELETON_NODES,
        links: SKELETON_LINKS,
      },
    ],
  };
}

type LiveState = {
  resolved: ResolvedColors | null; 
  hasRevealed: boolean; 
  intro: IntroState | null; 

  handlers: {
    onSelectionChange?: (selection: { dataKey: string; value: number } | null) => void;
    isNodeClickable: boolean;
    nodeValues: Record<string, number>;
  };

  repush: () => void;
};

export function SankeyChart({
  data,
  config,
  children,
  className,
  nodeWidth = DEFAULT_NODE_WIDTH,
  nodePadding = DEFAULT_NODE_PADDING,
  linkCurvature = DEFAULT_LINK_CURVATURE,
  iterations = DEFAULT_ITERATIONS,
  align = "justify",
  defaultSelectedNode = null,
  onSelectionChange,
  isLoading = false,
  animation = true,
  animationType = "default",
  chartOptions,
}: SankeyChartProps) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);

  const live = useRef<LiveState>({
    resolved: null,
    hasRevealed: false,
    intro: null,
    handlers: {
      onSelectionChange,
      isNodeClickable: false,
      nodeValues: {},
    },
    repush: () => {},
  }).current;

  const shouldReduceMotion = useReducedMotion();

  const [selectedNode, setSelectedNode] = useState<string | null>(defaultSelectedNode);

  const collected = useMemo(() => collectConfig(children), [children]);
  const { nodeConfig, nodeLabel, linkConfig, tooltip: tooltipSlot } = collected;

  const nodeValues = useMemo(() => computeNodeValues(data), [data]);
  const outsideLabels = nodeLabel?.position === "outside";

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  const nodeNames = useMemo(() => data.nodes.map((node) => node.name), [data]);

  live.handlers = {
    onSelectionChange,
    isNodeClickable: nodeConfig.isClickable,
    nodeValues,
  };

  const toggleSelection = useCallback(
    (name: string) => {
      setSelectedNode((prev) => {
        const next = prev === name ? null : name;
        const { onSelectionChange: cb, nodeValues: values } = live.handlers;
        cb?.(next === null ? null : { dataKey: next, value: values[next] ?? 0 });
        return next;
      });
    },
    [live],
  );

  const buildOption = useCallback((): EChartsOption => {
    const resolved = live.resolved;
    if (!resolved) return {};

    const ctx: OptionBuildContext = {
      data,
      config,
      nodeConfig,
      nodeLabel,
      linkConfig,
      tooltipSlot,
      selectedNode,
      nodeWidth,
      nodePadding,
      linkCurvature,
      iterations,
      align,
      isLoading,
      resolved,
      nodeValues,
      outsideLabels,
      intro: live.intro,
    };

    if (isLoading) return buildLoadingOption(ctx);

    const series: SankeySeriesOption[] = [];
    const plateSeries = buildInsidePlateSeries(ctx);
    if (plateSeries) series.push(plateSeries);
    series.push(buildSankeySeries(ctx));

    return {
      animation: false,
      tooltip: buildTooltipOption(ctx),
      series,
    };
  }, [
    live,
    data,
    config,
    nodeConfig,
    nodeLabel,
    linkConfig,
    tooltipSlot,
    selectedNode,
    nodeWidth,
    nodePadding,
    linkCurvature,
    iterations,
    align,
    isLoading,
    nodeValues,
    outsideLabels,
  ]);

  useEffect(() => {
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
      live.repush();
    });
    resizeObserver.observe(mount);

    const themeObserver = new MutationObserver(() => {
      live.repush();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    chart.on("click", (params) => {
      const { isNodeClickable } = live.handlers;
      if (!isNodeClickable) return;
      const p = params as { dataType?: string; name?: string };
      if (p.dataType !== "node") return;
      if (typeof p.name === "string") toggleSelection(p.name);
    });

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart.dispose();
      echartsRef.current = null;

      live.hasRevealed = false;
    };

  }, []);

  useEffect(() => {
    const chart = echartsRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;

    live.resolved = resolveColors(container, config, nodeNames);

    const push = (mergeOnly: boolean) => {
      const option = buildOption();
      const merged = chartOptions ? { ...option, ...chartOptions } : option;
      Object.assign(merged, { animation: false, animationDurationUpdate: 0 });

      chart.setOption(
        merged as EChartsOption,
        mergeOnly ? { lazyUpdate: true, silent: true } : { notMerge: true },
      );
    };

    if (isLoading) live.hasRevealed = false;
    const shouldReveal = !live.hasRevealed && !isLoading;
    if (shouldReveal) live.hasRevealed = true;
    const revealEnabled =
      animation && shouldReveal && animationType !== "none" && !shouldReduceMotion;

    let raf = 0;
    if (revealEnabled) {
      const depths = computeNodeDepths(data);
      const duration = introDuration(depths);
      live.intro = { elapsed: 0, depths };
      push(false);

      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const done = elapsed >= duration;
        live.intro = done ? null : { elapsed, depths };
        push(true);
        if (!done) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } else {
      live.intro = null;
      push(false);
    }

    live.repush = () => {
      live.resolved = resolveColors(container, config, nodeNames);
      push(false);
    };

    return () => {
      cancelAnimationFrame(raf);
      live.intro = null;
    };
  }, [
    live,
    buildOption,
    chartOptions,
    data,
    isLoading,
    animation,
    animationType,
    shouldReduceMotion,
    config,
    nodeNames,
  ]);

  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || !isLoading) return;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const phase = ((((now - start) / LOADING_ANIMATION_DURATION) % 1) + 1) % 1;

      const foreground = live.resolved?.tokens.foreground ?? GRAY;
      const w = chart.getWidth();
      const h = chart.getHeight();
      if (!w || !h) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const maxT = (w + h) / (2 * w);
      const center = phase * (maxT + 2 * LOADING_SHIMMER_BAND) - LOADING_SHIMMER_BAND;
      const clip = (floor: number, peak: number) =>
        new echarts.graphic.LinearGradient(
          0,
          0,
          w,
          w,
          shimmerWindowStops(center, foreground, floor, peak),
          true,
        );
      chart.setOption(
        {
          series: [
            {
              id: "__loading",
              itemStyle: { color: clip(LOADING_NODE_FLOOR, LOADING_NODE_PEAK), borderWidth: 0 },
              lineStyle: {
                color: clip(LOADING_LINK_FLOOR, LOADING_LINK_PEAK),
                curveness: DEFAULT_LINK_CURVATURE,
              },
            },
          ],
        },
        { silent: true, lazyUpdate: true },
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, isLoading]);

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
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

SankeyChart.Node = Node;
SankeyChart.NodeLabel = NodeLabel;
SankeyChart.Link = Link;
SankeyChart.Tooltip = Tooltip;
