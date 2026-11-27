import { describe, expect, it } from "vitest"

import {
  convertSchedule,
  describeCron,
  formatCronList,
  getNextRuns,
  matchesDay,
  parseCron,
  scheduleFromCron,
  scheduleToCron,
} from "../../registry/default/product/schedule-builder/schedule-builder-utils"

function parsed(expression: string) {
  const result = parseCron(expression)
  if (!result.ok) throw new Error(`expected ${expression} to parse`)
  return result.schedule
}

const iso = (runs: { date: Date }[]) => runs.map((run) => run.date.toISOString())

describe("parseCron", () => {
  it("expands stars, ranges, steps, and lists", () => {
    const schedule = parsed("*/15 9-17 1,15 * 1-5")
    expect(schedule.minutes).toEqual([0, 15, 30, 45])
    expect(schedule.hours).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17])
    expect(schedule.daysOfMonth).toEqual([1, 15])
    expect(schedule.months).toHaveLength(12)
    expect(schedule.daysOfWeek).toEqual([1, 2, 3, 4, 5])
    expect(schedule.dayOfMonthStar).toBe(false)
    expect(schedule.dayOfWeekStar).toBe(false)
  })

  it("reads stepped ranges and a start with a step", () => {
    expect(parsed("1-30/10 * * * *").minutes).toEqual([1, 11, 21])
    expect(parsed("50/5 * * * *").minutes).toEqual([50, 55])
    expect(parsed("0 0/8 * * *").hours).toEqual([0, 8, 16])
  })

  it("reads names case-insensitively and 7 as Sunday", () => {
    expect(parsed("0 0 * jan,Jul *").months).toEqual([1, 7])
    expect(parsed("0 0 * * MON-fri").daysOfWeek).toEqual([1, 2, 3, 4, 5])
    expect(parsed("0 0 * * 7").daysOfWeek).toEqual([0])
    expect(parsed("0 0 * * 5-7").daysOfWeek).toEqual([0, 5, 6])
  })

  it("removes duplicates and sorts", () => {
    expect(parsed("30,0,30,15 * * * *").minutes).toEqual([0, 15, 30])
  })

  it("expands macros", () => {
    expect(parsed("@daily").hours).toEqual([0])
    expect(parsed("@hourly").minutes).toEqual([0])
    expect(parsed("@weekly").daysOfWeek).toEqual([0])
    expect(parsed("@yearly").months).toEqual([1])
  })

  it("marks day fields that start with a star", () => {
    expect(parsed("0 0 */2 * 1").dayOfMonthStar).toBe(true)
    expect(parsed("0 0 */2 * 1").dayOfWeekStar).toBe(false)
  })

  it("reports the wrong number of fields", () => {
    expect(parseCron("* * * *")).toEqual({ ok: false, error: { code: "fieldCount", count: 4 } })
    expect(parseCron("")).toEqual({ ok: false, error: { code: "fieldCount", count: 0 } })
    expect(parseCron("@reboot")).toEqual({ ok: false, error: { code: "fieldCount", count: 1 } })
  })

  it("reports values out of range", () => {
    expect(parseCron("60 * * * *")).toEqual({
      ok: false,
      error: { code: "outOfRange", field: "minute", value: 60, min: 0, max: 59 },
    })
    expect(parseCron("0 0 0 * *")).toMatchObject({ error: { code: "outOfRange", field: "dayOfMonth" } })
    expect(parseCron("0 0 * 13 *")).toMatchObject({ error: { code: "outOfRange", field: "month" } })
    expect(parseCron("0 0 * * 8")).toMatchObject({ error: { code: "outOfRange", field: "dayOfWeek" } })
  })

  it("refuses unreadable values, reversed ranges, and bad steps", () => {
    expect(parseCron("x * * * *")).toMatchObject({ error: { code: "invalidValue", token: "x" } })
    expect(parseCron("0 0 * * FRI-MON")).toMatchObject({ error: { code: "invalidValue" } })
    expect(parseCron("0 0 * JAN * ")).toMatchObject({ ok: true })
    expect(parseCron("0 0 MON * *")).toMatchObject({ error: { code: "invalidValue", field: "dayOfMonth" } })
    expect(parseCron("1,,2 * * * *")).toMatchObject({ error: { code: "invalidValue" } })
    expect(parseCron("*/0 * * * *")).toMatchObject({ error: { code: "invalidStep" } })
    expect(parseCron("*/x * * * *")).toMatchObject({ error: { code: "invalidStep" } })
    expect(parseCron("*/2/3 * * * *")).toMatchObject({ error: { code: "invalidValue" } })
  })
})

describe("matchesDay", () => {
  it("needs either day field when both are restricted", () => {
    const schedule = parsed("0 0 1 * 1")
    expect(matchesDay(schedule, { month: 3, day: 1, weekday: 3 })).toBe(true)
    expect(matchesDay(schedule, { month: 3, day: 9, weekday: 1 })).toBe(true)
    expect(matchesDay(schedule, { month: 3, day: 9, weekday: 2 })).toBe(false)
  })

  it("needs both when one day field starts with a star", () => {
    const schedule = parsed("0 0 */2 * 1")
    expect(matchesDay(schedule, { month: 3, day: 3, weekday: 1 })).toBe(true)
    expect(matchesDay(schedule, { month: 3, day: 4, weekday: 1 })).toBe(false)
    expect(matchesDay(schedule, { month: 3, day: 3, weekday: 2 })).toBe(false)
  })

  it("checks the month", () => {
    expect(matchesDay(parsed("0 0 * 2 *"), { month: 3, day: 1, weekday: 0 })).toBe(false)
  })
})

describe("getNextRuns", () => {
  const from = new Date("2026-03-04T10:07:30Z") // A Wednesday.

  it("returns the next five runs after the start, in UTC by default", () => {
    expect(iso(getNextRuns("*/15 * * * *", { from }))).toEqual([
      "2026-03-04T10:15:00.000Z",
      "2026-03-04T10:30:00.000Z",
      "2026-03-04T10:45:00.000Z",
      "2026-03-04T11:00:00.000Z",
      "2026-03-04T11:15:00.000Z",
    ])
  })

  it("skips an exact match with the start", () => {
    const start = new Date("2026-03-04T09:00:00Z")
    expect(iso(getNextRuns("0 9 * * *", { from: start, count: 1 }))).toEqual([
      "2026-03-05T09:00:00.000Z",
    ])
  })

  it("follows weekdays across a weekend", () => {
    expect(iso(getNextRuns("0 9 * * 1-5", { from, count: 4 }))).toEqual([
      "2026-03-05T09:00:00.000Z",
      "2026-03-06T09:00:00.000Z",
      "2026-03-09T09:00:00.000Z",
      "2026-03-10T09:00:00.000Z",
    ])
  })

  it("skips months without the day", () => {
    expect(iso(getNextRuns("0 0 31 * *", { from, count: 3 }))).toEqual([
      "2026-03-31T00:00:00.000Z",
      "2026-05-31T00:00:00.000Z",
      "2026-07-31T00:00:00.000Z",
    ])
  })

  it("finds leap days years ahead", () => {
    expect(iso(getNextRuns("0 0 29 2 *", { from, count: 2 }))).toEqual([
      "2028-02-29T00:00:00.000Z",
      "2032-02-29T00:00:00.000Z",
    ])
  })

  it("returns nothing for a date that never exists", () => {
    expect(getNextRuns("0 0 30 2 *", { from })).toEqual([])
  })

  it("returns nothing for an invalid expression", () => {
    expect(getNextRuns("nope", { from })).toEqual([])
  })

  it("uses either day field when both are restricted", () => {
    // The 15th, or any Friday.
    expect(iso(getNextRuns("0 12 15 * 5", { from, count: 4 }))).toEqual([
      "2026-03-06T12:00:00.000Z",
      "2026-03-13T12:00:00.000Z",
      "2026-03-15T12:00:00.000Z",
      "2026-03-20T12:00:00.000Z",
    ])
  })

  it("reads wall-clock times in the time zone", () => {
    expect(iso(getNextRuns("0 9 * * *", { from, count: 2, timeZone: "America/New_York" }))).toEqual([
      "2026-03-04T14:00:00.000Z",
      "2026-03-05T14:00:00.000Z",
    ])
    expect(iso(getNextRuns("0 9 * * *", { from, count: 1, timeZone: "Asia/Kolkata" }))).toEqual([
      "2026-03-05T03:30:00.000Z",
    ])
  })

  it("keeps the wall-clock time across a daylight saving change", () => {
    // New York moves to daylight time on 8 March 2026.
    const start = new Date("2026-03-06T00:00:00Z")
    expect(
      iso(getNextRuns("0 9 * * *", { from: start, count: 4, timeZone: "America/New_York" }))
    ).toEqual([
      "2026-03-06T14:00:00.000Z",
      "2026-03-07T14:00:00.000Z",
      "2026-03-08T13:00:00.000Z",
      "2026-03-09T13:00:00.000Z",
    ])
  })

  it("runs a skipped time after the gap, and marks it", () => {
    const start = new Date("2026-03-07T12:00:00Z")
    const runs = getNextRuns("30 2 * * *", { from: start, count: 2, timeZone: "America/New_York" })
    // 2:30 does not exist on 8 March; it runs at 3:30 daylight time.
    expect(iso(runs)).toEqual(["2026-03-08T07:30:00.000Z", "2026-03-09T06:30:00.000Z"])
    expect(runs.map((run) => run.shifted)).toEqual([true, false])
  })

  it("does not run twice when a shifted time lands on a real one", () => {
    const start = new Date("2026-03-08T06:00:00Z") // 1:00 in New York.
    const runs = getNextRuns("0,30 2,3 * * *", { from: start, count: 3, timeZone: "America/New_York" })
    expect(iso(runs)).toEqual([
      "2026-03-08T07:00:00.000Z",
      "2026-03-08T07:30:00.000Z",
      "2026-03-09T06:00:00.000Z",
    ])
    expect(runs.map((run) => run.shifted)).toEqual([false, false, false])
  })

  it("runs a repeated time once, at its first occurrence", () => {
    // New York moves back to standard time on 1 November 2026; 1:30 happens twice.
    const start = new Date("2026-10-31T12:00:00Z")
    expect(
      iso(getNextRuns("30 1 * * *", { from: start, count: 2, timeZone: "America/New_York" }))
    ).toEqual(["2026-11-01T05:30:00.000Z", "2026-11-02T06:30:00.000Z"])
  })
})

describe("friendly schedules", () => {
  it("writes each kind as cron", () => {
    expect(scheduleToCron({ kind: "minutes", interval: 1 })).toBe("* * * * *")
    expect(scheduleToCron({ kind: "minutes", interval: 15 })).toBe("*/15 * * * *")
    expect(scheduleToCron({ kind: "hours", interval: 1, minute: 5 })).toBe("5 * * * *")
    expect(scheduleToCron({ kind: "hours", interval: 6, minute: 0 })).toBe("0 */6 * * *")
    expect(scheduleToCron({ kind: "daily", time: { hour: 9, minute: 30 } })).toBe("30 9 * * *")
    expect(
      scheduleToCron({ kind: "weekly", days: [5, 1, 2, 3, 4], time: { hour: 9, minute: 0 } })
    ).toBe("0 9 * * 1-5")
    expect(
      scheduleToCron({ kind: "weekly", days: [1, 3, 5], time: { hour: 9, minute: 0 } })
    ).toBe("0 9 * * 1,3,5")
    expect(scheduleToCron({ kind: "monthly", day: 15, time: { hour: 8, minute: 0 } })).toBe("0 8 15 * *")
    expect(scheduleToCron({ kind: "cron", expression: "  0  9 *  * * " })).toBe("0 9 * * *")
  })

  it("reads friendly shapes back", () => {
    expect(scheduleFromCron("*/15 * * * *")).toEqual({ kind: "minutes", interval: 15 })
    expect(scheduleFromCron("* * * * *")).toEqual({ kind: "minutes", interval: 1 })
    expect(scheduleFromCron("5 * * * *")).toEqual({ kind: "hours", interval: 1, minute: 5 })
    expect(scheduleFromCron("0 */6 * * *")).toEqual({ kind: "hours", interval: 6, minute: 0 })
    expect(scheduleFromCron("30 9 * * *")).toEqual({ kind: "daily", time: { hour: 9, minute: 30 } })
    expect(scheduleFromCron("0 9 * * MON-FRI")).toEqual({
      kind: "weekly",
      days: [1, 2, 3, 4, 5],
      time: { hour: 9, minute: 0 },
    })
    expect(scheduleFromCron("0 8 15 * *")).toEqual({ kind: "monthly", day: 15, time: { hour: 8, minute: 0 } })
  })

  it("keeps expressions no friendly shape can state", () => {
    for (const expression of ["*/7 * * * *", "0 9-17 * * *", "0 9 1 * 1", "0 9 * 1 *", "0 9 1,15 * *", "@daily", "bad"]) {
      expect(scheduleFromCron(expression)).toEqual({ kind: "cron", expression })
    }
  })

  it("round-trips every friendly shape", () => {
    const schedules = [
      { kind: "minutes", interval: 20 },
      { kind: "hours", interval: 8, minute: 45 },
      { kind: "daily", time: { hour: 0, minute: 0 } },
      { kind: "weekly", days: [0, 6], time: { hour: 18, minute: 15 } },
      { kind: "monthly", day: 31, time: { hour: 23, minute: 59 } },
    ] as const
    for (const schedule of schedules) {
      expect(scheduleFromCron(scheduleToCron(schedule))).toEqual(schedule)
    }
  })

  it("keeps the time of day when the kind changes", () => {
    const daily = { kind: "daily", time: { hour: 7, minute: 30 } } as const
    expect(convertSchedule(daily, "weekly")).toEqual({ kind: "weekly", days: [1, 2, 3, 4, 5], time: daily.time })
    expect(convertSchedule(daily, "monthly")).toEqual({ kind: "monthly", day: 1, time: daily.time })
    expect(convertSchedule(daily, "cron")).toEqual({ kind: "cron", expression: "30 7 * * *" })
    expect(convertSchedule({ kind: "cron", expression: "15 6 * * 1" }, "daily")).toEqual({
      kind: "daily",
      time: { hour: 6, minute: 15 },
    })
    expect(convertSchedule(daily, "daily")).toBe(daily)
  })

  it("compresses lists into ranges of three or more", () => {
    expect(formatCronList([1, 2])).toBe("1,2")
    expect(formatCronList([0, 1, 2, 4, 6, 5])).toBe("0-2,4-6")
  })
})

describe("describeCron", () => {
  const describe_ = (expression: string) => describeCron(expression, { locale: "en-US" })

  it("states friendly schedules plainly", () => {
    expect(describe_("* * * * *")).toBe("Every minute")
    expect(describe_("*/15 * * * *")).toBe("Every 15 minutes")
    expect(describe_("0 * * * *")).toBe("Every hour")
    expect(describe_("5 * * * *")).toBe("Every hour at :05")
    expect(describe_("0 */6 * * *")).toBe("Every 6 hours")
    expect(describe_("30 9 * * *")).toBe("Every day at 9:30 AM")
    expect(describe_("0 9 * * 1-5")).toBe("Every weekday at 9:00 AM")
    expect(describe_("0 10 * * 0,6")).toBe("Every Saturday and Sunday at 10:00 AM")
    expect(describe_("0 9 * * 1,3,5")).toBe("Every Monday, Wednesday, and Friday at 9:00 AM")
    expect(describe_("0 8 1 * *")).toBe("At 8:00 AM on day 1 of the month")
  })

  it("describes lists, ranges, and months", () => {
    expect(describe_("0 9,17 * * *")).toBe("Every day at 9:00 AM and 5:00 PM")
    expect(describe_("0,30 9-17 * * 1-5")).toBe("Every weekday at :00 and :30 past 9 AM–5 PM")
    expect(describe_("0 0 1,15 * *")).toBe("At 12:00 AM on days 1 and 15 of the month")
    expect(describe_("0 0 1 1,4,7,10 *")).toBe("At 12:00 AM on day 1 of the month in January, April, July, and October")
    expect(describe_("*/10 * * * 1-5")).toBe("Every 10 minutes on weekdays")
  })

  it("says whether both day fields or either one apply", () => {
    expect(describe_("0 9 1 * 1")).toBe("At 9:00 AM on day 1 of the month or on Monday")
    expect(describe_("0 9 */2 * 1")).toBe(
      "At 9:00 AM on days 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, and 31 of the month, only on Monday"
    )
  })

  it("returns null for an invalid expression", () => {
    expect(describe_("61 * * * *")).toBeNull()
  })

  it("takes other wording", () => {
    expect(
      describeCron("*/5 * * * *", { labels: { everyMinutes: (n) => `alle ${n} Minuten` } })
    ).toBe("Alle 5 Minuten")
  })
})
