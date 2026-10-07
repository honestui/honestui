import { describe, expect, it } from "vitest"

import {
  collectDataQuality,
  noValueHtml,
  qualityRangeId,
  qualityRunId,
  qualitySeriesOwner,
  readSeriesQuality,
  cellStatusSeries,
  resolveDataStatusText,
  runFocusPatch,
  runValues,
  shareTotals,
  statusDetailText,
  statusFillStyles,
  statusLabelHtml,
  statusNotesHtml,
  statusPointStyles,
  strokeRuns,
  summarizeDataQuality,
  type PointQuality,
} from "../../registry/default/ui/charts/data-quality"

const keys = { statusKey: "status", lowerKey: "low", upperKey: "high" }

function point(value: number | null, status: PointQuality["status"] = null): PointQuality {
  return { value, status, range: null }
}

describe("readSeriesQuality", () => {
  it("reads the status and bounds each row supplies", () => {
    const { points, issues } = readSeriesQuality(
      [
        { revenue: 412, status: "measured" },
        { revenue: 430, status: "forecast", low: 390, high: 470 },
      ],
      "revenue",
      keys,
    )

    expect(points).toEqual([
      { value: 412, status: "measured", range: null },
      { value: 430, status: "forecast", range: { lower: 390, upper: 470 } },
    ])
    expect(issues).toEqual([])
  })

  it("never promotes a row without a status to measured", () => {
    const { points, issues } = readSeriesQuality([{ revenue: 412 }], "revenue", keys)

    expect(points[0].status).toBeNull()
    expect(issues).toEqual([])
  })

  it("keeps an absent value absent instead of plotting zero", () => {
    const { points } = readSeriesQuality(
      [{ revenue: null }, { revenue: undefined }, { revenue: "" }, { revenue: "n/a" }, {}],
      "revenue",
      keys,
    )

    expect(points.map((entry) => entry.value)).toEqual([null, null, null, null, null])
  })

  it("reports an unknown status and draws the point without one", () => {
    const { points, issues } = readSeriesQuality(
      [{ revenue: 412, status: "audited" }],
      "revenue",
      keys,
    )

    expect(points[0]).toEqual({ value: 412, status: null, range: null })
    expect(issues).toHaveLength(1)
    expect(issues[0]).toContain('"audited" is not a data status')
  })

  it("does not draw a value on a row that is marked missing", () => {
    const { points, issues } = readSeriesQuality(
      [{ revenue: 412, status: "missing", low: 400, high: 420 }],
      "revenue",
      keys,
    )

    expect(points[0]).toEqual({ value: null, status: "missing", range: null })
    expect(issues).toHaveLength(1)
  })

  it.each([
    ["inverted bounds", { revenue: 430, low: 470, high: 390 }],
    ["bounds that exclude the value", { revenue: 430, low: 440, high: 470 }],
    ["a single bound", { revenue: 430, low: 390 }],
  ])("drops the range and reports %s", (_name, row) => {
    const { points, issues } = readSeriesQuality([row], "revenue", keys)

    expect(points[0].range).toBeNull()
    expect(points[0].value).toBe(430)
    expect(issues).toHaveLength(1)
  })

  it("keeps a range that has no point estimate", () => {
    const { points, issues } = readSeriesQuality(
      [{ revenue: null, status: "forecast", low: 390, high: 470 }],
      "revenue",
      keys,
    )

    expect(points[0]).toEqual({
      value: null,
      status: "forecast",
      range: { lower: 390, upper: 470 },
    })
    expect(issues).toEqual([])
  })

  it("ignores a bound key that is configured without its pair", () => {
    const { points, issues } = readSeriesQuality(
      [{ revenue: 430, low: 390, high: 470 }],
      "revenue",
      { lowerKey: "low" },
    )

    expect(points[0].range).toBeNull()
    expect(issues).toHaveLength(1)
  })
})

describe("strokeRuns", () => {
  it("draws the revenue story as measured, provisional, then forecast", () => {
    const runs = strokeRuns([
      point(400, "measured"),
      point(428, "measured"),
      point(187, "provisional"),
      point(436, "forecast"),
      point(452, "forecast"),
    ])

    expect(runs).toEqual([
      { stroke: "plain", start: 0, end: 1 },
      { stroke: "provisional", start: 1, end: 2 },
      { stroke: "forecast", start: 2, end: 4 },
    ])
  })

  it("keeps a segment solid only when both of its ends are", () => {
    const runs = strokeRuns([point(1, "measured"), point(2, "estimated"), point(3, "measured")])

    expect(runs).toEqual([{ stroke: "estimated", start: 0, end: 2 }])
  })

  it("never bridges a point without a value", () => {
    const runs = strokeRuns([point(1), point(2), point(null, "missing"), point(4), point(5)])

    expect(runs).toEqual([
      { stroke: "plain", start: 0, end: 1 },
      { stroke: "plain", start: 3, end: 4 },
    ])
  })

  it("separates two runs of the same status that are not adjacent", () => {
    const runs = strokeRuns([point(1), point(2), point(3, "forecast"), point(4), point(5)])
    const plain = runs.filter((run) => run.stroke === "plain")

    expect(runs).toEqual([
      { stroke: "plain", start: 0, end: 1 },
      { stroke: "forecast", start: 1, end: 3 },
      { stroke: "plain", start: 3, end: 4 },
    ])
    expect(runValues([1, 2, 3, 4, 5], plain[0])).toEqual([1, 2, null, null, null])
    expect(runValues([1, 2, 3, 4, 5], plain[1])).toEqual([null, null, null, 4, 5])
  })
})

describe("shareTotals", () => {
  it("has no total for a row with a missing value", () => {
    const data = [
      { web: 60, mobile: 40 },
      { web: 70, mobile: null },
    ]
    const quality = collectDataQuality(data, [{ dataKey: "mobile", quality: { statusKey: "s" } }])

    expect(shareTotals(data, ["web", "mobile"], quality.points)).toEqual([100, null])
  })
})

describe("collectDataQuality", () => {
  const data = [
    { a: 1, aStatus: "measured", b: 2 },
    { a: 2, aStatus: "forecast", aLow: 1, aHigh: 3, b: 3 },
  ]
  const series = [
    { dataKey: "a", quality: { statusKey: "aStatus", lowerKey: "aLow", upperKey: "aHigh" } },
    { dataKey: "b", quality: null },
  ]

  it("tracks only the series that name a status or bounds field", () => {
    const quality = collectDataQuality(data, series)

    expect(Object.keys(quality.points)).toEqual(["a"])
    expect(quality.summary).toEqual({ statuses: ["measured", "forecast"], hasRanges: true })
  })

  it("drops ranges when the chart plots shares", () => {
    const quality = collectDataQuality(data, series, { dropRanges: true })

    expect(quality.summary.hasRanges).toBe(false)
    expect(quality.points.a[1].status).toBe("forecast")
  })

  it("summarizes nothing when no row makes a claim", () => {
    expect(summarizeDataQuality([[point(1), point(2)]])).toEqual({
      statuses: [],
      hasRanges: false,
    })
  })
})

describe("tooltip text", () => {
  const text = resolveDataStatusText()
  const format = (value: number) => String(value)

  it("names the status and range of a point", () => {
    const detail = statusDetailText(
      { value: 430, status: "forecast", range: { lower: 390, upper: 470 } },
      text,
      format,
    )

    expect(detail).toBe("Forecast · Range 390 – 470")
  })

  it("makes no claim for a point without a status", () => {
    expect(statusDetailText(point(430), text, format)).toBe("")
  })

  it("explains every status in view except measured", () => {
    const html = statusNotesHtml(new Set(["measured", "forecast", "missing"] as const), text)

    expect(html).toContain("Forecast:")
    expect(html).toContain("Missing:")
    expect(html).not.toContain("Measured")
    expect(statusNotesHtml(new Set(["measured"] as const), text)).toBe("")
  })

  it("escapes replacement text before it reaches the tooltip", () => {
    const custom = resolveDataStatusText({
      statuses: { forecast: { label: "<b>Plan</b>", description: 'a "guess" & more' } },
    })
    const html = statusNotesHtml(new Set(["forecast"] as const), custom)

    expect(html).toContain("&lt;b&gt;Plan&lt;/b&gt;")
    expect(html).toContain("a &quot;guess&quot; &amp; more")
    expect(custom.statuses.measured.label).toBe("Measured")
  })

  it("escapes the no-value and status labels that tooltips insert as HTML", () => {
    const custom = resolveDataStatusText({
      noValueLabel: "<i>none</i>",
      statuses: { forecast: { label: "Plan & <b>guess</b>" } },
    })

    expect(noValueHtml(custom)).toBe("&lt;i&gt;none&lt;/i&gt;")
    expect(statusLabelHtml("forecast", custom)).toBe("Plan &amp; &lt;b&gt;guess&lt;/b&gt;")
    expect(statusLabelHtml(null, custom)).toBe("")
  })
})

describe("companion series", () => {
  it("maps run and range ids back to a data key that contains hyphens", () => {
    expect(qualitySeriesOwner(qualityRunId("net-revenue-2", 3))).toBe("net-revenue-2")
    expect(qualitySeriesOwner(qualityRangeId("net-revenue-2"))).toBe("net-revenue-2")
    expect(qualitySeriesOwner("net-revenue-2")).toBeNull()
  })

  it("dims the runs of every series except the hovered one", () => {
    const companions = new Map([
      ["web", [qualityRunId("web", 0), qualityRangeId("web")]],
      ["mobile", [qualityRunId("mobile", 0)]],
    ])
    const patch = runFocusPatch(companions, "web", () => 1)

    expect(patch.map((entry) => [entry.id, entry.lineStyle.opacity])).toEqual([
      [qualityRunId("web", 0), 1],
      [qualityRunId("mobile", 0), 0.3],
    ])
  })
})

describe("status marks", () => {
  it("leaves measured and missing marks to the chart's own drawing", () => {
    for (const styles of [statusFillStyles("rgb(0, 0, 0)"), statusPointStyles("rgb(0, 0, 0)")]) {
      expect(Object.keys(styles).sort()).toEqual(["estimated", "forecast", "provisional"])
    }
  })

  it("outlines every non-measured mark in the series colour", () => {
    const styles = statusFillStyles("rgb(10, 20, 30)")

    expect(styles.forecast).toMatchObject({ color: "transparent", borderColor: "rgb(10, 20, 30)" })
    expect(styles.forecast?.borderType).toEqual([4, 3])
    expect(styles.estimated?.borderColor).toBe("rgb(10, 20, 30)")
  })

  it("marks only the heatmap cells that are not measured", () => {
    const series = cellStatusSeries({
      dataKey: "orders",
      cells: [
        { x: 0, y: 0, status: "measured" },
        { x: 1, y: 0, status: null },
        { x: 2, y: 0, status: "forecast" },
        { x: 3, y: 1, status: "missing" },
      ],
      foreground: "black",
      background: "white",
      z: 3,
    })

    expect((series?.data as number[][]).map(([x, y]) => [x, y])).toEqual([
      [2, 0],
      [3, 1],
    ])
  })

  it("adds no heatmap overlay when every cell is measured or unlabelled", () => {
    const series = cellStatusSeries({
      dataKey: "orders",
      cells: [
        { x: 0, y: 0, status: "measured" },
        { x: 1, y: 0, status: null },
      ],
      foreground: "black",
      background: "white",
      z: 3,
    })

    expect(series).toBeNull()
  })

  it("counts points that are not shown with replaceable wording", () => {
    expect(resolveDataStatusText().notShownLabel(2)).toBe("2 not shown")
    expect(
      resolveDataStatusText({ notShownLabel: (count) => `${count} nicht gezeigt` }).notShownLabel(2),
    ).toBe("2 nicht gezeigt")
  })
})
