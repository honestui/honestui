import type * as echarts from "echarts/core";

type EChartsInstance = ReturnType<typeof echarts.init>;

/**
 * Synced crosshair. Charts that share a `syncId` show their crosshair and
 * tooltip at the same category while the pointer is over any one of them,
 * matched by category value (so the charts may hold different ranges) and
 * falling back to nothing when a chart lacks that category.
 *
 * This is deliberately narrower than `echarts.connect`, which would also
 * replay highlight, selection, and data zoom actions between charts whose
 * series ids happen to match. Brush and zoom ranges stay per chart; mirror
 * them with each Brush's `onChange` when charts should zoom together.
 */

type Member = {
  chart: EChartsInstance;
  /** Category labels in axis order. */
  categories: () => string[];
  /** Which screen axis holds the categories. */
  categoryAxis: "x" | "y";
  /** True while the pointer is over this chart. */
  hovering: boolean;
  /** The category this chart last showed at another chart's request. */
  remote: string | null;
};

const groups = new Map<string, Set<Member>>();

function showAt(member: Member, category: string) {
  const { chart } = member;
  if (chart.isDisposed()) return;
  const index = member.categories().indexOf(category);
  if (index < 0) {
    hide(member);
    return;
  }
  if (member.remote === category) return;
  member.remote = category;
  try {
    const axisFinder = member.categoryAxis === "x" ? { xAxisIndex: 0 } : { yAxisIndex: 0 };
    const along = chart.convertToPixel(axisFinder, index);
    if (typeof along !== "number" || !Number.isFinite(along)) return;
    const grid = (
      chart as unknown as {
        getModel: () => {
          getComponent: (
            type: string,
            index: number,
          ) => { coordinateSystem?: { getRect: () => { x: number; y: number; width: number; height: number } } };
        };
      }
    )
      .getModel()
      .getComponent("grid", 0)
      ?.coordinateSystem?.getRect();
    const across = grid
      ? member.categoryAxis === "x"
        ? grid.y + grid.height / 2
        : grid.x + grid.width / 2
      : (member.categoryAxis === "x" ? chart.getHeight() : chart.getWidth()) / 2;
    const [x, y] = member.categoryAxis === "x" ? [along, across] : [across, along];
    chart.dispatchAction({ type: "showTip", x, y });
  } catch {
    // A chart mid-update has no layout to read; the next move catches up.
  }
}

function hide(member: Member) {
  if (member.remote === null || member.chart.isDisposed()) return;
  member.remote = null;
  member.chart.dispatchAction({ type: "hideTip" });
}

/**
 * Joins a chart to a sync group. Returns the function that leaves it, which
 * removes the listeners and forgets the group once its last chart leaves.
 */
export function joinChartSync(params: {
  syncId: string;
  chart: EChartsInstance;
  categories: () => string[];
  categoryAxis: () => "x" | "y";
}): () => void {
  const { syncId, chart, categories } = params;
  const member: Member = {
    chart,
    categories,
    get categoryAxis() {
      return params.categoryAxis();
    },
    hovering: false,
    remote: null,
  };

  let group = groups.get(syncId);
  if (!group) {
    group = new Set();
    groups.set(syncId, group);
  }
  group.add(member);

  const others = () => [...(groups.get(syncId) ?? [])].filter((m) => m !== member);

  const onPointer = (event: unknown) => {
    if (!member.hovering) return;
    const axesInfo = (event as { axesInfo?: { axisDim?: string; axisIndex?: number; value?: unknown }[] })
      .axesInfo;
    const info = axesInfo?.find(
      (axis) => axis.axisDim === member.categoryAxis && (axis.axisIndex ?? 0) === 0,
    );
    const index = typeof info?.value === "number" ? info.value : Number(info?.value);
    const category = Number.isInteger(index) ? member.categories()[index] : undefined;
    for (const other of others()) {
      if (category === undefined) hide(other);
      else showAt(other, category);
    }
  };

  const zr = chart.getZr();
  const onMove = () => {
    if (member.hovering) return;
    member.hovering = true;
    member.remote = null;
    for (const other of others()) other.hovering = false;
  };
  const onOut = () => {
    if (!member.hovering) return;
    member.hovering = false;
    for (const other of others()) hide(other);
  };

  chart.on("updateAxisPointer", onPointer);
  zr.on("mousemove", onMove);
  zr.on("globalout", onOut);

  return () => {
    if (!chart.isDisposed()) {
      chart.off("updateAxisPointer", onPointer);
      zr.off("mousemove", onMove);
      zr.off("globalout", onOut);
    }
    if (member.hovering) for (const other of others()) hide(other);
    const current = groups.get(syncId);
    current?.delete(member);
    if (current && current.size === 0) groups.delete(syncId);
  };
}
