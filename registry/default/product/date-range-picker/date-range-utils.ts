import { differenceInCalendarDays, format, isSameDay } from "date-fns"
import type { Locale } from "date-fns"

/**
 * The value shape used by DateRangePicker. `to` may be missing while a
 * selection is still incomplete; a cleared value is undefined at the
 * component level.
 */
export interface DateRange {
  from: Date | undefined
  to?: Date | undefined
}

export function isRangeComplete(range: DateRange | undefined): boolean {
  return Boolean(range?.from && range?.to)
}

/**
 * Compares two ranges by calendar day so equal values constructed at
 * different times of day stay interchangeable.
 */
export function isSameRange(
  a: DateRange | undefined,
  b: DateRange | undefined
): boolean {
  if (!a && !b) {
    return true
  }
  if (!a || !b) {
    return false
  }
  const fromMatches =
    (!a.from && !b.from) || (a.from !== undefined && b.from !== undefined && isSameDay(a.from, b.from))
  const toMatches =
    (!a.to && !b.to) || (a.to !== undefined && b.to !== undefined && isSameDay(a.to, b.to))
  return fromMatches && toMatches
}

/**
 * Builds the completed range for two picked days. When the second day comes
 * before the first, the earlier day becomes the start instead of reporting
 * an error.
 */
export function completeRange(first: Date, second: Date): DateRange {
  const [from, to] =
    differenceInCalendarDays(second, first) < 0 ? [second, first] : [first, second]
  return { from, to }
}

export function formatDateLabel(date: Date, locale?: Locale): string {
  return format(date, "MMM d, yyyy", { locale })
}

export interface FormatTriggerOptions {
  locale?: Locale
  placeholder: string
  selectEndDateLabel: string
  formatRange?: ((range: DateRange) => string) | undefined
}

/**
 * Returns the text shown in the trigger for the current selection state:
 * the placeholder, the partial "start - Select end date" state, or the full
 * range formatted by `formatRange` or the default formatter.
 */
export function formatTriggerText(
  range: DateRange | undefined,
  options: FormatTriggerOptions
): string {
  if (!range?.from) {
    return options.placeholder
  }

  const start = formatDateLabel(range.from, options.locale)

  if (!range.to) {
    return `${start} - ${options.selectEndDateLabel}`
  }

  if (options.formatRange) {
    return options.formatRange(range)
  }

  return `${start} - ${formatDateLabel(range.to, options.locale)}`
}
