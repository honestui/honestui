import { DataZoomInsideComponent, type DataZoomComponentOption } from "echarts/components";
import {
  Children,
  isValidElement,
  useEffect,
  type FC,
  type ReactNode,
  type RefObject,
} from "react";
import * as echarts from "echarts/core";

echarts.use([DataZoomInsideComponent]);

/**
 * Zoom and pan inside the plot. By default a pinch on a trackpad or touch
 * screen, or a scroll with Ctrl held, zooms; a plain scroll keeps scrolling
 * the page. Dragging pans a zoomed chart. Double-click, or the
 * Reset button that appears while zoomed, returns to the full range.
 */
export interface ZoomProps {
  /**
   * What a scroll wheel does: `modifier` zooms only with Ctrl held (and on
   * pinch), `always` zooms on every scroll, `false` turns wheel zoom off.
   */
  wheel?: "modifier" | "always" | false;
  /** Drag to pan while zoomed. Defaults to true. */
  pan?: boolean;
  /** The smallest window, as a percentage of the full range. Defaults to 5. */
  minSpan?: number;
  /** Show a Reset button while zoomed. Defaults to true. */
  showReset?: boolean;
  onChange?: (range: { startIndex: number; endIndex: number }) => void;
}

export const Zoom: FC<ZoomProps> = () => null;
Zoom.displayName = "Zoom";

export type ZoomSlot = {
  present: boolean;
  wheel: "modifier" | "always" | false;
  pan: boolean;
  minSpan: number;
  showReset: boolean;
  onChange?: (range: { startIndex: number; endIndex: number }) => void;
};

export const NO_ZOOM: ZoomSlot = {
  present: false,
  wheel: "modifier",
  pan: true,
  minSpan: 5,
  showReset: true,
};

export function collectZoom(children: ReactNode): ZoomSlot {
  let slot = NO_ZOOM;
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = child.type as FC | string;
    const name = typeof type === "function" ? (type.displayName ?? type.name) : "";
    if (type !== Zoom && name !== "Zoom" && !String(name).endsWith(".Zoom")) return;
    const props = child.props as ZoomProps;
    slot = {
      present: true,
      wheel: props.wheel ?? "modifier",
      pan: props.pan ?? true,
      minSpan: props.minSpan ?? 5,
      showReset: props.showReset ?? true,
      onChange: props.onChange,
    };
  });
  return slot;
}

/** The inside data zoom for one axis, sharing its window with any Brush. */
export function buildInsideZoom(params: {
  zoom: ZoomSlot;
  range: { start: number; end: number };
  axis?: { xAxisIndex: number[] } | { yAxisIndex: number[] };
  filterMode?: "filter" | "none";
}): DataZoomComponentOption {
  const { zoom, range, axis = { xAxisIndex: [0] }, filterMode } = params;
  return {
    type: "inside",
    ...axis,
    start: range.start,
    end: range.end,
    minSpan: zoom.minSpan,
    ...(filterMode ? { filterMode } : {}),
    // ECharts reports a pinch as a wheel event with Ctrl held, so the
    // modifier setting zooms on pinch and leaves plain scrolling alone.
    zoomOnMouseWheel: zoom.wheel === "always" ? true : zoom.wheel === "modifier" ? "ctrl" : false,
    moveOnMouseWheel: false,
    moveOnMouseMove: zoom.pan,
    preventDefaultMouseMove: zoom.pan,
  } as DataZoomComponentOption;
}

/**
 * ECharts' inside zoom takes every wheel event over the plot and cancels its
 * default, even one it does not act on, so a plain scroll would stop
 * scrolling the page. Wheel events that should not zoom are stopped at the
 * chart's container, before ECharts sees them, and the page scrolls.
 */
export function useZoomWheelGuard(ref: RefObject<HTMLElement | null>, zoom: ZoomSlot) {
  const { present, wheel } = zoom;
  useEffect(() => {
    const element = ref.current;
    if (!element || !present || wheel === "always") return;
    const onWheel = (event: WheelEvent) => {
      if (wheel === "modifier" && event.ctrlKey) return;
      event.stopPropagation();
    };
    element.addEventListener("wheel", onWheel, { capture: true });
    return () => element.removeEventListener("wheel", onWheel, { capture: true });
  }, [ref, present, wheel]);
}

/** Whether a 0–100 window is narrower than the full range. */
export function isZoomed(range: { start: number; end: number }) {
  return range.start > 0.01 || range.end < 99.99;
}

export const ZOOM_RESET_CLASS =
  "bg-background text-muted-foreground hover:text-foreground border-border absolute z-10 rounded-md border px-2 py-0.5 text-xs shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
