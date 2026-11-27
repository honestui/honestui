import type {
  CronError,
  CronFieldName,
  CronParseResult,
  CronSchedule,
  Schedule,
  ScheduleBuilderLabels,
  ScheduleKind,
  ScheduleRun,
  ScheduleTime,
  ScheduleWeekday,
} from "./schedule-builder-types"

/* -------------------------------------------------------------------------- */
/* Parsing                                                                    */
/* -------------------------------------------------------------------------- */

const FIELD_ORDER: readonly CronFieldName[] = [
  "minute",
  "hour",
  "dayOfMonth",
  "month",
  "dayOfWeek",
]

const FIELD_RANGES: Record<CronFieldName, readonly [number, number]> = {
  minute: [0, 59],
  hour: [0, 23],
  dayOfMonth: [1, 31],
  month: [1, 12],
  // 7 is accepted as a second spelling of Sunday.
  dayOfWeek: [0, 7],
}

const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const WEEKDAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
}

/** The minute intervals that repeat evenly every hour, so "every N minutes" stays true across the hour. */
export const MINUTE_INTERVALS: readonly number[] = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30]
/** The hour intervals that repeat evenly every day. */
export const HOUR_INTERVALS: readonly number[] = [1, 2, 3, 4, 6, 8, 12]

type FieldResult = { ok: true; values: number[] } | { ok: false; error: CronError }

function readValue(token: string, field: CronFieldName): number | null {
  if (/^\d+$/.test(token)) return Number(token)
  const upper = token.toUpperCase()
  if (field === "month") {
    const index = MONTH_NAMES.indexOf(upper)
    return index === -1 ? null : index + 1
  }
  if (field === "dayOfWeek") {
    const index = WEEKDAY_NAMES.indexOf(upper)
    return index === -1 ? null : index
  }
  return null
}

function parseField(text: string, field: CronFieldName): FieldResult {
  const [min, max] = FIELD_RANGES[field]
  const values = new Set<number>()

  for (const item of text.split(",")) {
    if (item === "") return { ok: false, error: { code: "invalidValue", field, token: text } }

    const [base, stepText, ...extra] = item.split("/")
    if (extra.length > 0 || base === undefined || base === "") {
      return { ok: false, error: { code: "invalidValue", field, token: item } }
    }

    let step = 1
    if (stepText !== undefined) {
      if (!/^\d+$/.test(stepText) || Number(stepText) < 1) {
        return { ok: false, error: { code: "invalidStep", field, token: item } }
      }
      step = Number(stepText)
    }

    let start: number
    let end: number
    if (base === "*") {
      start = min
      end = field === "dayOfWeek" ? 6 : max
    } else {
      const [startText, endText, ...rest] = base.split("-")
      if (rest.length > 0 || startText === undefined) {
        return { ok: false, error: { code: "invalidValue", field, token: item } }
      }
      const first = readValue(startText, field)
      if (first === null) return { ok: false, error: { code: "invalidValue", field, token: item } }
      if (first < min || first > max) {
        return { ok: false, error: { code: "outOfRange", field, value: first, min, max } }
      }
      start = first

      if (endText === undefined) {
        // "5/15" runs from 5 to the end of the range; a bare "5" is one value.
        end = stepText === undefined ? first : field === "dayOfWeek" ? 6 : max
      } else {
        const last = readValue(endText, field)
        if (last === null) return { ok: false, error: { code: "invalidValue", field, token: item } }
        if (last < min || last > max) {
          return { ok: false, error: { code: "outOfRange", field, value: last, min, max } }
        }
        // Ranges do not wrap around, so "FRI-MON" is refused instead of guessed at.
        if (last < first) return { ok: false, error: { code: "invalidValue", field, token: item } }
        end = last
      }
    }

    for (let value = start; value <= end; value += step) {
      values.add(field === "dayOfWeek" && value === 7 ? 0 : value)
    }
  }

  return { ok: true, values: [...values].sort((a, b) => a - b) }
}

/**
 * Reads a five-field cron expression: minute, hour, day of month, month, and
 * day of week. Accepts `*`, numbers, ranges (`1-5`), steps (`*\/15`, `1-30/5`,
 * `5/15`), lists, month and weekday names (`JAN`, `MON`), 7 for Sunday, and
 * the macros `@hourly`, `@daily`, `@weekly`, `@monthly`, and `@yearly`.
 */
export function parseCron(expression: string): CronParseResult {
  const trimmed = expression.trim()
  const expanded = MACROS[trimmed.toLowerCase()] ?? trimmed
  const parts = expanded === "" ? [] : expanded.split(/\s+/)

  if (parts.length !== 5) return { ok: false, error: { code: "fieldCount", count: parts.length } }

  const results: number[][] = []
  for (let index = 0; index < 5; index += 1) {
    const result = parseField(parts[index], FIELD_ORDER[index])
    if (!result.ok) return result
    results.push(result.values)
  }

  return {
    ok: true,
    schedule: {
      minutes: results[0],
      hours: results[1],
      daysOfMonth: results[2],
      months: results[3],
      daysOfWeek: results[4],
      dayOfMonthStar: parts[2].startsWith("*"),
      dayOfWeekStar: parts[4].startsWith("*"),
    },
  }
}

/**
 * Whether a calendar day matches the day fields. When either day field starts
 * with `*`, the day must match both; when both are restricted, matching
 * either is enough. This is how Vixie cron and its descendants behave.
 */
export function matchesDay(
  schedule: CronSchedule,
  date: { month: number; day: number; weekday: number }
): boolean {
  if (!schedule.months.includes(date.month)) return false
  const dayOfMonth = schedule.daysOfMonth.includes(date.day)
  const dayOfWeek = schedule.daysOfWeek.includes(date.weekday)
  return schedule.dayOfMonthStar || schedule.dayOfWeekStar
    ? dayOfMonth && dayOfWeek
    : dayOfMonth || dayOfWeek
}

/* -------------------------------------------------------------------------- */
/* Time zones                                                                 */
/* -------------------------------------------------------------------------- */

const MINUTE_MS = 60_000
const DAY_MS = 86_400_000

const wallFormatters = new Map<string, Intl.DateTimeFormat>()

function wallFormatter(timeZone: string) {
  let formatter = wallFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
    wallFormatters.set(timeZone, formatter)
  }
  return formatter
}

type WallTime = { year: number; month: number; day: number; hour: number; minute: number; second: number }

/** The calendar date and clock time an instant shows in a time zone. */
export function getWallTime(instant: number, timeZone: string): WallTime {
  const wall: WallTime = { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0 }
  for (const part of wallFormatter(timeZone).formatToParts(instant)) {
    if (part.type in wall) wall[part.type as keyof WallTime] = Number(part.value)
  }
  return wall
}

/** How far the zone's clocks are ahead of UTC at an instant, in milliseconds. */
function zoneOffset(instant: number, timeZone: string) {
  const wall = getWallTime(instant, timeZone)
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second)
  return asUtc - Math.floor(instant / 1000) * 1000
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    wallFormatter(timeZone)
    return true
  } catch {
    return false
  }
}

/* -------------------------------------------------------------------------- */
/* Next runs                                                                  */
/* -------------------------------------------------------------------------- */

export type NextRunsOptions = {
  /** Runs strictly after this instant are returned. Defaults to now. */
  from?: Date | undefined
  /** Defaults to 5. */
  count?: number | undefined
  /** An IANA zone such as `Europe/Berlin`. Defaults to `UTC`. */
  timeZone?: string | undefined
  /** How far ahead to look before giving up, for expressions such as `0 0 30 2 *` that never run. Defaults to 8 years. */
  searchYears?: number | undefined
}

/**
 * The next times a schedule runs, read in a time zone. A time that does not
 * exist because the clocks moved forward runs that much later and is marked
 * `shifted`; a time that happens twice because the clocks moved back runs once,
 * at the first occurrence.
 */
export function getNextRuns(
  schedule: CronSchedule | string,
  { from = new Date(), count = 5, timeZone = "UTC", searchYears = 8 }: NextRunsOptions = {}
): ScheduleRun[] {
  let parsed: CronSchedule
  if (typeof schedule === "string") {
    const result = parseCron(schedule)
    if (!result.ok) return []
    parsed = result.schedule
  } else {
    parsed = schedule
  }

  const fromMs = from.getTime()
  const start = getWallTime(fromMs, timeZone)
  const runs: ScheduleRun[] = []
  const maxDays = Math.ceil(searchYears * 366)

  for (let offset = 0; offset <= maxDays && runs.length < count; offset += 1) {
    const day = new Date(Date.UTC(start.year, start.month - 1, start.day + offset))
    const year = day.getUTCFullYear()
    const month = day.getUTCMonth() + 1
    const date = day.getUTCDate()

    if (!matchesDay(parsed, { month, day: date, weekday: day.getUTCDay() })) continue

    const midnight = Date.UTC(year, month - 1, date)
    const before = zoneOffset(midnight - DAY_MS, timeZone)
    const after = zoneOffset(midnight + 2 * DAY_MS, timeZone)
    const byInstant = new Map<number, ScheduleRun>()

    for (const hour of parsed.hours) {
      for (const minute of parsed.minutes) {
        const wall = midnight + hour * 3_600_000 + minute * MINUTE_MS
        let instant: number
        let shifted = false

        if (before === after) {
          instant = wall - before
        } else {
          // The clocks change near this day: try the offsets on either side of the change.
          const early = wall - before
          const late = wall - after
          const earlyFits = early + zoneOffset(early, timeZone) === wall
          const lateFits = late + zoneOffset(late, timeZone) === wall
          if (earlyFits && lateFits) instant = Math.min(early, late)
          else if (earlyFits) instant = early
          else if (lateFits) instant = late
          else {
            // The time was skipped; the offset from before the change lands it after the gap.
            instant = early
            shifted = true
          }
        }

        if (instant <= fromMs) continue
        const existing = byInstant.get(instant)
        if (!existing || (existing.shifted && !shifted)) {
          byInstant.set(instant, { date: new Date(instant), shifted })
        }
      }
    }

    const sorted = [...byInstant.values()].sort((a, b) => a.date.getTime() - b.date.getTime())
    for (const run of sorted) {
      if (runs.length >= count) break
      if (runs.length > 0 && runs[runs.length - 1].date.getTime() >= run.date.getTime()) continue
      runs.push(run)
    }
  }

  return runs
}

/* -------------------------------------------------------------------------- */
/* Friendly schedules                                                         */
/* -------------------------------------------------------------------------- */

/** Writes a list of numbers with runs of three or more as ranges: `1-5`, `1,3,5`. */
export function formatCronList(values: readonly number[]): string {
  const sorted = [...new Set(values)].sort((a, b) => a - b)
  const parts: string[] = []
  let index = 0
  while (index < sorted.length) {
    let end = index
    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end] + 1) end += 1
    if (end - index >= 2) parts.push(`${sorted[index]}-${sorted[end]}`)
    else for (let i = index; i <= end; i += 1) parts.push(String(sorted[i]))
    index = end + 1
  }
  return parts.join(",")
}

/** The cron expression for a schedule. */
export function scheduleToCron(schedule: Schedule): string {
  switch (schedule.kind) {
    case "minutes":
      return schedule.interval === 1 ? "* * * * *" : `*/${schedule.interval} * * * *`
    case "hours":
      return `${schedule.minute} ${schedule.interval === 1 ? "*" : `*/${schedule.interval}`} * * *`
    case "daily":
      return `${schedule.time.minute} ${schedule.time.hour} * * *`
    case "weekly":
      return `${schedule.time.minute} ${schedule.time.hour} * * ${
        schedule.days.length === 0 ? "*" : formatCronList(schedule.days)
      }`
    case "monthly":
      return `${schedule.time.minute} ${schedule.time.hour} ${schedule.day} * *`
    case "cron":
      return schedule.expression.trim().replace(/\s+/g, " ")
  }
}

function isEvery(values: readonly number[], step: number, size: number) {
  if (values.length !== size / step) return false
  return values.every((value, index) => value === index * step)
}

/**
 * The friendliest schedule that runs at exactly the same times as the
 * expression. Expressions no friendly shape can state, and invalid ones,
 * come back as `{ kind: "cron" }` with the expression unchanged.
 */
export function scheduleFromCron(expression: string): Schedule {
  const result = parseCron(expression)
  const asCron: Schedule = { kind: "cron", expression }
  if (!result.ok || expression.trim().startsWith("@")) return asCron

  const { minutes, hours, daysOfMonth, months, daysOfWeek, dayOfMonthStar, dayOfWeekStar } =
    result.schedule
  if (months.length !== 12) return asCron

  const everyDayOfMonth = dayOfMonthStar && daysOfMonth.length === 31
  const everyDayOfWeek = dayOfWeekStar && daysOfWeek.length === 7
  const oneTime = minutes.length === 1 && hours.length === 1
  const time = { hour: hours[0], minute: minutes[0] }

  if (everyDayOfMonth && everyDayOfWeek) {
    if (hours.length === 24) {
      const interval = MINUTE_INTERVALS.find((step) => isEvery(minutes, step, 60))
      if (interval !== undefined) return { kind: "minutes", interval }
      if (minutes.length === 1) return { kind: "hours", interval: 1, minute: minutes[0] }
      return asCron
    }
    if (oneTime) return { kind: "daily", time }
    if (minutes.length === 1) {
      const interval = HOUR_INTERVALS.find((step) => isEvery(hours, step, 24))
      if (interval !== undefined) return { kind: "hours", interval, minute: minutes[0] }
    }
    return asCron
  }

  if (!oneTime) return asCron

  if (everyDayOfMonth && !dayOfWeekStar) {
    return { kind: "weekly", days: daysOfWeek as ScheduleWeekday[], time }
  }
  if (everyDayOfWeek && !dayOfMonthStar && daysOfMonth.length === 1) {
    return { kind: "monthly", day: daysOfMonth[0], time }
  }
  return asCron
}

const DEFAULT_TIME: ScheduleTime = { hour: 9, minute: 0 }

function timeOf(schedule: Schedule): ScheduleTime {
  if ("time" in schedule) return schedule.time
  if (schedule.kind === "cron") {
    const parsed = parseCron(schedule.expression)
    if (parsed.ok && parsed.schedule.hours.length === 1 && parsed.schedule.minutes.length === 1) {
      return { hour: parsed.schedule.hours[0], minute: parsed.schedule.minutes[0] }
    }
  }
  return DEFAULT_TIME
}

/** Moves a schedule to another kind, keeping its time of day where both have one. */
export function convertSchedule(schedule: Schedule, kind: ScheduleKind): Schedule {
  if (schedule.kind === kind) return schedule
  const time = timeOf(schedule)
  switch (kind) {
    case "minutes":
      return { kind, interval: 15 }
    case "hours":
      return { kind, interval: 1, minute: schedule.kind === "minutes" ? 0 : time.minute }
    case "daily":
      return { kind, time }
    case "weekly":
      return { kind, days: [1, 2, 3, 4, 5], time }
    case "monthly":
      return { kind, day: 1, time }
    case "cron":
      return { kind, expression: scheduleToCron(schedule) }
  }
}

/* -------------------------------------------------------------------------- */
/* Describing                                                                 */
/* -------------------------------------------------------------------------- */

const pad = (value: number) => String(value).padStart(2, "0")

const FIELD_NAMES: Record<CronFieldName, string> = {
  minute: "minute",
  hour: "hour",
  dayOfMonth: "day of month",
  month: "month",
  dayOfWeek: "day of week",
}

export const defaultScheduleBuilderLabels: ScheduleBuilderLabels = {
  frequency: "Repeats",
  kinds: {
    minutes: "Every few minutes",
    hours: "Hourly",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    cron: "Custom (cron)",
  },
  every: "Every",
  minutesUnit: (interval) => (interval === 1 ? "minute" : "minutes"),
  hoursUnit: (interval) => (interval === 1 ? "hour" : "hours"),
  atMinute: "at minute",
  minutePast: (minute) => `:${pad(minute)}`,
  at: "At",
  on: "On",
  onDay: "On day",
  dayOfMonth: (day) => String(day),
  days: "Days",
  expression: "Cron expression",
  expressionHint: "minute · hour · day of month · month · day of week",
  cronFieldNames: FIELD_NAMES,
  summary: "Runs",
  timeZone: "Time zone",
  nextRuns: (count) => `Next ${count} runs`,
  noRuns: "This schedule never runs.",
  shifted: "This time does not exist that day because the clocks move forward, so the run happens after the change.",
  shiftedShort: "Clocks change",
  skipsShortMonths: (day) => `Months with fewer than ${day} days are skipped.`,
  error: (error) => {
    switch (error.code) {
      case "fieldCount":
        return `Use five fields: minute, hour, day of month, month, and day of week. This has ${error.count}.`
      case "invalidValue":
        return `“${error.token}” is not a valid ${FIELD_NAMES[error.field]}.`
      case "outOfRange":
        return `The ${FIELD_NAMES[error.field]} must be ${error.min} to ${error.max}. This has ${error.value}.`
      case "invalidStep":
        return `“${error.token}” has a step that is not a whole number above 0.`
    }
  },
  everyMinute: "every minute",
  everyMinutes: (interval) => `every ${interval} minutes`,
  everyHourAt: (minute) => (minute === 0 ? "every hour" : `every hour at :${pad(minute)}`),
  everyHoursAt: (interval, minute) =>
    `every ${interval} hours${minute === 0 ? "" : ` at :${pad(minute)}`}`,
  atTimes: (times) => `at ${times}`,
  atMinutesPastHours: (minutes, hours) => `at ${minutes} past ${hours}`,
  everyDay: "every day",
  onWeekdays: "on weekdays",
  onWeekends: "on weekends",
  onDaysOfWeek: (days) => `on ${days}`,
  everyWeekday: "every weekday",
  everyWeekendDay: "every Saturday and Sunday",
  everyDaysOfWeek: (days) => `every ${days}`,
  onDaysOfMonth: (days, count) => `on ${count === 1 ? "day" : "days"} ${days} of the month`,
  dayOfMonthOrWeek: (daysOfMonth, daysOfWeek) => `${daysOfMonth} or ${daysOfWeek}`,
  dayOfMonthAndWeek: (daysOfMonth, daysOfWeek) => `${daysOfMonth}, only ${daysOfWeek}`,
  inMonths: (months) => `in ${months}`,
}

/** Groups runs of three or more consecutive values, then joins the pieces as a list. */
function describeSet(
  values: readonly number[],
  format: (value: number) => string,
  list: Intl.ListFormat
) {
  const pieces: string[] = []
  let index = 0
  while (index < values.length) {
    let end = index
    while (end + 1 < values.length && values[end + 1] === values[end] + 1) end += 1
    if (end - index >= 2) pieces.push(`${format(values[index])}–${format(values[end])}`)
    else for (let i = index; i <= end; i += 1) pieces.push(format(values[i]))
    index = end + 1
  }
  return list.format(pieces)
}

export type DescribeOptions = {
  locale?: Intl.LocalesArgument | undefined
  labels?: Partial<ScheduleBuilderLabels> | undefined
}

/** Formats a time of day for the locale, such as `9:00 AM` or `09:00`. */
export function formatScheduleTime(time: ScheduleTime, locale?: Intl.LocalesArgument): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(Date.UTC(2000, 0, 1, time.hour, time.minute))
}

/** The weekday's name for the locale. 0 is Sunday. */
export function formatWeekday(
  weekday: number,
  locale?: Intl.LocalesArgument,
  width: "long" | "short" | "narrow" = "long"
): string {
  // 1 January 2023 was a Sunday.
  return new Intl.DateTimeFormat(locale, { weekday: width, timeZone: "UTC" }).format(
    Date.UTC(2023, 0, 1 + weekday)
  )
}

/**
 * A sentence that says when an expression runs, such as "Every weekday at
 * 9:00 AM". Returns `null` for an invalid expression.
 */
export function describeCron(
  expression: string | CronSchedule,
  { locale, labels: labelsProp }: DescribeOptions = {}
): string | null {
  let schedule: CronSchedule
  if (typeof expression === "string") {
    const result = parseCron(expression)
    if (!result.ok) return null
    schedule = result.schedule
  } else {
    schedule = expression
  }

  const labels = { ...defaultScheduleBuilderLabels, ...labelsProp }
  const list = new Intl.ListFormat(locale as string | undefined, { type: "conjunction" })
  const { minutes, hours, daysOfMonth, months, daysOfWeek } = schedule

  /* When in the day. */
  let timePhrase: string
  let needsDay = false
  const minuteInterval = MINUTE_INTERVALS.find((step) => isEvery(minutes, step, 60))
  const hourInterval = HOUR_INTERVALS.find((step) => isEvery(hours, step, 24))

  if (hours.length === 24 && minutes.length === 60) {
    timePhrase = labels.everyMinute
  } else if (hours.length === 24 && minuteInterval !== undefined) {
    timePhrase = labels.everyMinutes(minuteInterval)
  } else if (hours.length === 24 && minutes.length === 1) {
    timePhrase = labels.everyHourAt(minutes[0])
  } else if (minutes.length === 1 && hourInterval !== undefined && hourInterval > 1) {
    timePhrase = labels.everyHoursAt(hourInterval, minutes[0])
  } else if (minutes.length * hours.length <= 6) {
    const times = hours.flatMap((hour) =>
      minutes.map((minute) => formatScheduleTime({ hour, minute }, locale))
    )
    timePhrase = labels.atTimes(list.format(times))
    needsDay = true
  } else {
    const hourFormat = new Intl.DateTimeFormat(locale, { hour: "numeric", timeZone: "UTC" })
    timePhrase = labels.atMinutesPastHours(
      describeSet(minutes, (minute) => `:${pad(minute)}`, list),
      describeSet(hours, (hour) => hourFormat.format(Date.UTC(2000, 0, 1, hour)), list)
    )
    needsDay = true
  }

  /* Which days. */
  const restrictsDayOfMonth = daysOfMonth.length < 31
  const restrictsDayOfWeek = daysOfWeek.length < 7
  const weekdayList = () => describeSet(daysOfWeek, (day) => formatWeekday(day, locale), list)
  const weekdayPhrase = () => {
    if (daysOfWeek.join() === "1,2,3,4,5") return labels.onWeekdays
    if (daysOfWeek.join() === "0,6") return labels.onWeekends
    return labels.onDaysOfWeek(weekdayList())
  }
  const monthDayPhrase = () =>
    labels.onDaysOfMonth(describeSet(daysOfMonth, String, list), daysOfMonth.length)

  let leading = ""
  let dayPhrase = ""
  if (restrictsDayOfMonth && restrictsDayOfWeek) {
    dayPhrase =
      schedule.dayOfMonthStar || schedule.dayOfWeekStar
        ? labels.dayOfMonthAndWeek(monthDayPhrase(), weekdayPhrase())
        : labels.dayOfMonthOrWeek(monthDayPhrase(), weekdayPhrase())
  } else if (restrictsDayOfWeek) {
    if (needsDay) {
      // "Every weekday at 9:00 AM" reads better than "At 9:00 AM on weekdays".
      if (daysOfWeek.join() === "1,2,3,4,5") leading = labels.everyWeekday
      else if (daysOfWeek.join() === "0,6") leading = labels.everyWeekendDay
      else leading = labels.everyDaysOfWeek(weekdayList())
    } else {
      dayPhrase = weekdayPhrase()
    }
  } else if (restrictsDayOfMonth) {
    dayPhrase = monthDayPhrase()
  } else if (needsDay) {
    leading = labels.everyDay
  }

  /* Which months. */
  const monthFormat = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" })
  const monthPhrase =
    months.length === 12
      ? ""
      : labels.inMonths(describeSet(months, (month) => monthFormat.format(Date.UTC(2000, month - 1, 1)), list))

  const sentence = [leading, timePhrase, dayPhrase, monthPhrase].filter(Boolean).join(" ")
  return sentence.charAt(0).toLocaleUpperCase(locale as string | undefined) + sentence.slice(1)
}
