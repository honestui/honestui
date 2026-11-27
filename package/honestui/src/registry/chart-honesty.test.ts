import { createElement } from "react"
import { describe, expect, it } from "vitest"

import type { PointQuality } from "../../registry/default/ui/charts/data-quality"
import {
  addInterval,
  applyPartialPeriod,
  axisTruncation,
  Band,
  bandRuns,
  bandSeries,
  collectHonesty,
  fillMissingRows,
  fitDomain,
  gapRegionSeries,
  gapSpans,
  honestyNotesHtml,
  isLowSample,
  labelStride,
  niceStep,
  parseTime,
  PartialPeriod,
  periodBounds,
  readBand,
  readSampleSizes,
  readValue,
  resolveHonestyText,
  resolvePartialPeriod,
  sampleSizeSeries,
} from "../../registry/default/ui/charts/honesty"

const utc = (iso: string) => Date.parse(iso)

function point(value: number | null, status: PointQuality["status"] = null): PointQuality {
  return { value, status, range: null }
}

describe("text", () => {
  it("keeps defaults for anything left out", () => {
    const text = resolveHonestyText({ noDataLabel: "Keine Daten" })
    expect(text.noDataLabel).toBe("Keine Daten")
    expect(text.partialPeriodLabel).toBe("In progress")
    expect(text.axisStartsAt("40")).toBe("Axis starts at 40")
    expect(text.sampleSize("1,200")).toBe("n=1,200")
  })
})

describe("readValue", () => {
  it("treats absent and non-numeric values as no value, never zero", () => {
    expect(readValue(null)).toBeNull()
    expect(readValue(undefined)).toBeNull()
    expect(readValue("")).toBeNull()
    expect(readValue("n/a")).toBeNull()
    expect(readValue(true)).toBeNull()
    expect(readValue(0)).toBe(0)
    expect(readValue("12.5")).toBe(12.5)
  })
})

describe("time", () => {
  it("parses ISO dates, months, timestamps, and Dates only", () => {
    expect(parseTime("2026-11-03")).toBe(utc("2026-11-03"))
    expect(parseTime("2026-11")).toBe(utc("2026-11-01"))
    expect(parseTime(1_700_000_000_000)).toBe(1_700_000_000_000)
    expect(parseTime(new Date(utc("2026-01-01")))).toBe(utc("2026-01-01"))
    expect(parseTime("Nov 3")).toBeNull()
    expect(parseTime("Monday")).toBeNull()
  })

  it("adds calendar months without spilling into the next month", () => {
    expect(new Date(addInterval(utc("2026-01-31"), "month")).toISOString().slice(0, 10)).toBe("2026-02-28")
    expect(new Date(addInterval(utc("2026-11-15"), "quarter")).toISOString().slice(0, 10)).toBe("2027-02-15")
    expect(addInterval(utc("2026-11-01"), "day", 3)).toBe(utc("2026-11-04"))
  })

  it("finds period bounds, with weeks starting on Monday", () => {
    // 26 November 2026 is a Thursday.
    const now = utc("2026-11-26T15:00:00Z")
    expect(periodBounds(now, "week")).toEqual([utc("2026-11-23"), utc("2026-11-30")])
    expect(periodBounds(now, "month")).toEqual([utc("2026-11-01"), utc("2026-12-01")])
    expect(periodBounds(now, "quarter")).toEqual([utc("2026-10-01"), utc("2027-01-01")])
    expect(periodBounds(now, "day")).toEqual([utc("2026-11-26"), utc("2026-11-27")])
  })
})

describe("fillMissingRows", () => {
  it("puts back each absent day as an empty row in the data's own format", () => {
    const { data, inserted } = fillMissingRows(
      [
        { date: "2026-11-01", v: 1 },
        { date: "2026-11-04", v: 4 },
        { date: "2026-11-05", v: 5 },
      ],
      "date",
      "day",
    )
    expect(data.map((row) => row.date)).toEqual([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
    ])
    expect(inserted).toEqual([1, 2])
    expect(data[1]).toEqual({ date: "2026-11-02" })
  })

  it("steps months by the calendar and keeps month strings", () => {
    const { data, inserted } = fillMissingRows(
      [{ month: "2026-01" }, { month: "2026-04" }],
      "month",
      "month",
    )
    expect(data.map((row) => row.month)).toEqual(["2026-01", "2026-02", "2026-03", "2026-04"])
    expect(inserted).toEqual([1, 2])
  })

  it("leaves rows alone when the x values are not times", () => {
    const rows = [{ day: "Mon" }, { day: "Thu" }]
    expect(fillMissingRows(rows, "day", "day")).toEqual({ data: rows, inserted: [] })
  })

  it("does not read a slightly long step as a gap", () => {
    // A clock change makes one local day 25 hours long.
    const rows = [{ t: utc("2026-03-28T00:00:00Z") }, { t: utc("2026-03-29T01:00:00Z") }]
    expect(fillMissingRows(rows, "t", "day").inserted).toEqual([])
  })
})

describe("partial period", () => {
  const months = ["2026-08-01", "2026-09-01", "2026-10-01", "2026-11-01"]

  it("starts at a named category", () => {
    expect(resolvePartialPeriod({ x: "2026-10-01", progress: 0.5 }, months, 0)).toEqual({
      start: 2,
      progress: 0.5,
    })
    expect(resolvePartialPeriod({ x: "Dec" }, months, 0)).toBeNull()
  })

  it("finds the row whose period contains now, and how far through it is", () => {
    const found = resolvePartialPeriod({ period: "month", now: utc("2026-11-16T00:00:00Z") }, months, 0)
    expect(found?.start).toBe(3)
    expect(found?.progress).toBeCloseTo(0.5, 5)
  })

  it("finds nothing once the data stops before the current period", () => {
    expect(resolvePartialPeriod({ period: "month", now: utc("2027-01-10") }, months, 0)).toBeNull()
  })

  it("marks only unclaimed or measured values in the open period", () => {
    const points = [point(1), point(2, "measured"), point(3), point(4, "forecast"), point(null, "missing")]
    expect(applyPartialPeriod(points, 1).map((p) => p.status)).toEqual([
      null,
      "provisional",
      "provisional",
      "forecast",
      "missing",
    ])
  })
})

describe("gapSpans", () => {
  it("finds stretches where every series is empty", () => {
    const a = [1, null, null, 4, null, 6]
    const b = [1, null, null, 4, 5, 6]
    expect(gapSpans([a, b], 6)).toEqual([{ start: 1, end: 2, from: 0, to: 3 }])
  })

  it("reaches the plot edges for gaps at the ends", () => {
    expect(gapSpans([[null, 2, null]], 3)).toEqual([
      { start: 0, end: 0, from: -1, to: 1 },
      { start: 2, end: 2, from: 1, to: 3 },
    ])
  })

  it("treats a chart with no values as empty, not as one gap", () => {
    expect(gapSpans([[null, null]], 2)).toEqual([])
  })
})

describe("bands", () => {
  it("joins only consecutive rows that both have bounds", () => {
    const { bounds, runs, issues } = readBand(
      [
        { lo: 1, hi: 3 },
        { lo: 2, hi: 4 },
        {},
        { lo: 5, hi: 6 },
        { lo: 7 },
        { lo: 9, hi: 8 },
      ],
      { lowerKey: "lo", upperKey: "hi" },
    )
    expect(runs).toEqual([
      { start: 0, end: 1 },
      { start: 3, end: 3 },
    ])
    expect(bounds[2]).toBeNull()
    expect(issues).toHaveLength(2)
  })

  it("finds runs at the edges", () => {
    expect(bandRuns([{ lower: 1, upper: 2 }, null, { lower: 1, upper: 2 }])).toEqual([
      { start: 0, end: 0 },
      { start: 2, end: 2 },
    ])
  })

  it("encodes each run's extremes so the axis keeps the band in view", () => {
    const series = bandSeries({
      id: "b",
      bounds: [
        { lower: 1, upper: 3 },
        { lower: 0, upper: 5 },
      ],
      runs: [{ start: 0, end: 1 }],
      fill: "red",
      edge: "red",
      z: 1,
    })
    expect(series?.data).toEqual([[0, 1, 0, 5]])
    expect(bandSeries({ id: "b", bounds: [], runs: [], fill: "", edge: "", z: 1 })).toBeNull()
  })
})

describe("axis", () => {
  it("picks round steps", () => {
    expect(niceStep(100)).toBe(20)
    expect(niceStep(0.34)).toBe(0.1)
    expect(niceStep(7)).toBe(2)
  })

  it("fits a rounded domain without floating-point residue", () => {
    expect(fitDomain([99.61, 99.95])).toEqual({ min: 99.6, max: 100 })
    expect(fitDomain([40, 87])).toEqual({ min: 40, max: 90 })
    expect(fitDomain([5, 5])).toEqual({ min: 4.4, max: 5.6 })
    expect(fitDomain([])).toBeNull()
  })

  it("flags an axis that does not reach zero", () => {
    expect(axisTruncation(40, 90)).toBe(40)
    expect(axisTruncation(-90, -10)).toBe(-10)
    expect(axisTruncation(0, 90)).toBeNull()
    expect(axisTruncation(-5, 10)).toBeNull()
    expect(axisTruncation(null, null)).toBeNull()
  })
})

describe("sample size", () => {
  it("reads counts and ignores negative or absent ones", () => {
    expect(readSampleSizes([{ n: 12 }, { n: -1 }, {}, { n: "40" }], "n")).toEqual([12, null, null, 40])
  })

  it("marks values below the minimum only when one is set", () => {
    expect(isLowSample(12, 30)).toBe(true)
    expect(isLowSample(30, 30)).toBe(false)
    expect(isLowSample(12, undefined)).toBe(false)
    expect(isLowSample(null, 30)).toBe(false)
  })

  it("thins labels to keep them apart", () => {
    expect(labelStride(60)).toBe(1)
    expect(labelStride(10)).toBe(3)
    expect(labelStride(0)).toBe(1)
  })

  it("draws low samples even when labels are tooltip-only", () => {
    const series = sampleSizeSeries({
      dataKey: "score",
      values: [4, 5, null],
      sizes: [100, 10, 5],
      minSampleSize: 30,
      showLabels: false,
      format: String,
      labelColor: "",
      ringColor: "",
      background: "",
      opacity: 1,
      z: 3,
    })
    expect(series?.data).toEqual([[1, 5, 10, 1]])
  })
})

describe("parts and notes", () => {
  it("collects the partial period and bands from children", () => {
    const slots = collectHonesty([
      createElement(PartialPeriod, { key: "p", x: "Nov", label: "Month to date" }),
      createElement(Band, { key: "a", lowerKey: "lo", upperKey: "hi" }),
      createElement(Band, { key: "b", lowerKey: "lo2", upperKey: "hi2", dataKey: "v" }),
    ])
    expect(slots.partial?.label).toBe("Month to date")
    expect(slots.bands.map((band) => band.lowerKey)).toEqual(["lo", "lo2"])
  })

  it("escapes notes", () => {
    expect(honestyNotesHtml([{ label: "<b>", description: "a & b" }])).toContain("&lt;b&gt;")
    expect(honestyNotesHtml([])).toBe("")
  })

  it("draws no gap regions when there are none", () => {
    expect(
      gapRegionSeries({ spans: [], rowCount: 3, label: "", hatch: "", labelColor: "", z: 0 }),
    ).toBeNull()
  })
})
