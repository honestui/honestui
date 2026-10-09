import type {
  NumberSeparators,
  ParsedQuantity,
  QuantityFieldLabels,
  QuantityRangeError,
  QuantityRounding,
  QuantityUnit,
  QuantityUnitGroup,
} from "./quantity-field-types"

type DurationUnitKey = "ms" | "s" | "min" | "h" | "d" | "wk"

/** Elapsed time. A day is exactly 24 hours and a week is 7 of them; calendar months and years are left out because their length varies. */
export const durationUnits: QuantityUnitGroup<DurationUnitKey> = {
  base: "s",
  units: [
    { key: "ms", symbol: "ms", name: "Milliseconds", factor: 0.001, aliases: ["msec", "msecs", "millisecond", "milliseconds"] },
    { key: "s", symbol: "s", name: "Seconds", factor: 1, aliases: ["sec", "secs", "second", "seconds"] },
    { key: "min", symbol: "min", name: "Minutes", factor: 60, aliases: ["m", "mins", "minute", "minutes"] },
    { key: "h", symbol: "h", name: "Hours", factor: 3600, aliases: ["hr", "hrs", "hour", "hours"] },
    { key: "d", symbol: "d", name: "Days", factor: 86_400, aliases: ["day", "days"] },
    { key: "wk", symbol: "wk", name: "Weeks", factor: 604_800, aliases: ["w", "wks", "week", "weeks"] },
  ],
}

type StorageUnitKey = "B" | "kB" | "MB" | "GB" | "TB" | "KiB" | "MiB" | "GiB" | "TiB"

/**
 * Data size. `kB`, `MB`, `GB`, and `TB` are powers of 1000; `KiB`, `MiB`,
 * `GiB`, and `TiB` are powers of 1024. Symbols are matched exactly, so `Mb`
 * (megabits) is never read as megabytes.
 */
export const storageUnits: QuantityUnitGroup<StorageUnitKey> = {
  base: "B",
  caseSensitive: true,
  units: [
    { key: "B", symbol: "B", name: "Bytes", factor: 1, aliases: ["byte", "bytes"] },
    { key: "kB", symbol: "kB", name: "Kilobytes", factor: 1000, aliases: ["KB", "kilobyte", "kilobytes"] },
    { key: "MB", symbol: "MB", name: "Megabytes", factor: 1000 ** 2, aliases: ["megabyte", "megabytes"] },
    { key: "GB", symbol: "GB", name: "Gigabytes", factor: 1000 ** 3, aliases: ["gigabyte", "gigabytes"] },
    { key: "TB", symbol: "TB", name: "Terabytes", factor: 1000 ** 4, aliases: ["terabyte", "terabytes"] },
    { key: "KiB", symbol: "KiB", name: "Kibibytes", factor: 1024, aliases: ["kibibyte", "kibibytes"] },
    { key: "MiB", symbol: "MiB", name: "Mebibytes", factor: 1024 ** 2, aliases: ["mebibyte", "mebibytes"] },
    { key: "GiB", symbol: "GiB", name: "Gibibytes", factor: 1024 ** 3, aliases: ["gibibyte", "gibibytes"] },
    { key: "TiB", symbol: "TiB", name: "Tebibytes", factor: 1024 ** 4, aliases: ["tebibyte", "tebibytes"] },
  ],
}

const DEFAULT_MAXIMUM_FRACTION_DIGITS = 2
const DEFAULT_INCREMENT = 1

/**
 * Removes the binary noise that multiplying and dividing factors leaves
 * behind, such as 6.000000000000001. Whole numbers pass through untouched, so
 * large byte counts keep every digit.
 */
function trimFloat(value: number) {
  return Number.isInteger(value) ? value : Number(value.toPrecision(15))
}

function roundHalfAwayFromZero(value: number) {
  return Math.sign(value) * Math.round(Math.abs(value))
}

export function getUnit<TKey extends string>(
  group: QuantityUnitGroup<TKey>,
  key: TKey
): QuantityUnit<TKey> {
  const unit = group.units.find((candidate) => candidate.key === key)
  if (!unit) {
    throw new Error(`QuantityField: "${key}" is not a unit in this unit group.`)
  }
  return unit
}

/** Converts without rounding. */
export function convertQuantity(value: number, from: QuantityUnit, to: QuantityUnit) {
  return trimFloat((value * from.factor) / to.factor)
}

export function roundToIncrement(value: number, increment = DEFAULT_INCREMENT) {
  return trimFloat(roundHalfAwayFromZero(trimFloat(value / increment)) * increment)
}

/**
 * How many decimal places `unit` gets. A unit never gets more places than the
 * stored increment can tell apart: with whole seconds stored, seconds show no
 * decimals and minutes show two.
 */
export function getFractionDigits(
  unit: QuantityUnit,
  valueUnit: QuantityUnit,
  rounding: QuantityRounding = {}
) {
  const maximum = rounding.maximumFractionDigits ?? DEFAULT_MAXIMUM_FRACTION_DIGITS
  const increment = rounding.increment ?? DEFAULT_INCREMENT
  const incrementsPerUnit = unit.factor / (valueUnit.factor * increment)
  const useful = Math.ceil(Math.log10(incrementsPerUnit) - 1e-9)
  return Math.min(Math.max(useful, 0), maximum)
}

/** The number the field shows for a stored value: converted to `unit`, then rounded half away from zero. */
export function toDisplayNumber(
  value: number,
  unit: QuantityUnit,
  valueUnit: QuantityUnit,
  rounding?: QuantityRounding
) {
  const digits = getFractionDigits(unit, valueUnit, rounding)
  const scale = 10 ** digits
  return roundHalfAwayFromZero(trimFloat(convertQuantity(value, valueUnit, unit) * scale)) / scale
}

/** Whether the shown number, read back in `unit`, is the stored value and not a rounded view of it. */
export function isDisplayExact(
  value: number,
  unit: QuantityUnit,
  valueUnit: QuantityUnit,
  rounding?: QuantityRounding
) {
  const shown = toDisplayNumber(value, unit, valueUnit, rounding)
  const readBack = convertQuantity(shown, unit, valueUnit)
  return Math.abs(readBack - value) <= Math.max(1, Math.abs(value)) * 1e-9
}

/** The stored value for a number entered in `unit`, rounded to the stored increment. */
export function fromDisplayNumber(
  shown: number,
  unit: QuantityUnit,
  valueUnit: QuantityUnit,
  rounding: QuantityRounding = {}
) {
  return roundToIncrement(convertQuantity(shown, unit, valueUnit), rounding.increment)
}

function clamp(value: number, min: number | undefined, max: number | undefined) {
  if (min !== undefined && value < min) return min
  if (max !== undefined && value > max) return max
  return value
}

export function getRangeError(
  value: number | null,
  min: number | undefined,
  max: number | undefined
): QuantityRangeError | null {
  if (value === null) return null
  if (min !== undefined && value < min) return "belowMin"
  if (max !== undefined && value > max) return "aboveMax"
  return null
}

type DisplayChange = {
  /** The stored value before the change. */
  value: number | null
  /** The number the number field reports. */
  next: number | null
  /**
   * The change came from a stepper, an arrow key, or the wheel. It is applied
   * as a difference to the exact stored value and kept inside the limits.
   */
  isStep: boolean
  unit: QuantityUnit
  valueUnit: QuantityUnit
  rounding?: QuantityRounding | undefined
  min?: number | undefined
  max?: number | undefined
}

/**
 * Turns a change to the shown number into the next stored value.
 *
 * The shown number can be a rounded view (100 min shows as 1.67 h), so two
 * cases must not be read literally. The number field reporting the number it
 * already shows, as it does on blur, leaves the stored value alone. A step
 * adds its size to the stored value, so 1.67 h plus one hour is 160 minutes
 * and not 2.67 hours.
 */
export function applyDisplayChange({
  value,
  next,
  isStep,
  unit,
  valueUnit,
  rounding,
  min,
  max,
}: DisplayChange): number | null {
  if (next === null) return null

  const shown = value === null ? null : toDisplayNumber(value, unit, valueUnit, rounding)
  if (shown !== null && next === shown) return isStep ? clamp(value as number, min, max) : value

  if (!isStep) return fromDisplayNumber(next, unit, valueUnit, rounding)

  if (value === null || shown === null) {
    return clamp(fromDisplayNumber(next, unit, valueUnit, rounding), min, max)
  }

  const difference = convertQuantity(next - shown, unit, valueUnit)
  return clamp(roundToIncrement(value + difference, rounding?.increment), min, max)
}

/** The decimal and grouping characters `locale` writes numbers with. */
export function getNumberSeparators(locale?: Intl.LocalesArgument): NumberSeparators {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
  return {
    decimal: parts.find((part) => part.type === "decimal")?.value ?? ".",
    group: parts.find((part) => part.type === "group")?.value ?? ",",
  }
}

const SPACE_LIKE = /[   ]/g
const APOSTROPHE_LIKE = /[’']/g

function escapeForRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Reads an unsigned number written with the locale's separators. Grouping is
 * accepted only in threes, so `1,5` in an English locale is refused instead of
 * being read as 15. A plain space is accepted as a grouping character in every locale.
 */
function parseNumberToken(token: string, separators: NumberSeparators): number | null {
  const decimal = separators.decimal
  const localeGroup = separators.group.replace(SPACE_LIKE, " ").replace(APOSTROPHE_LIKE, "'")
  const groups = [...new Set([localeGroup, " "])].filter((group) => group !== decimal)
  const groupPattern = `[${groups.map(escapeForRegExp).join("")}]`

  const match = new RegExp(
    `^(\\d{1,3}(?:${groupPattern}\\d{3})+|\\d+)?(?:${escapeForRegExp(decimal)}(\\d+))?$`
  ).exec(token.replace(APOSTROPHE_LIKE, "'"))
  if (!match) return null

  const [, whole = "", fraction = ""] = match
  if (whole === "" && fraction === "") return null

  const value = Number(`${whole.replace(/\D/g, "") || "0"}.${fraction || "0"}`)
  return Number.isFinite(value) ? value : null
}

function findUnitByText<TKey extends string>(
  group: QuantityUnitGroup<TKey>,
  text: string
): QuantityUnit<TKey> | null {
  const spellings = (unit: QuantityUnit<TKey>) => [unit.symbol, unit.key, ...(unit.aliases ?? [])]

  const exact = group.units.find((unit) => spellings(unit).includes(text))
  if (exact || group.caseSensitive) return exact ?? null

  const lowered = text.toLowerCase()
  const loose = group.units.filter((unit) =>
    spellings(unit).some((spelling) => spelling.toLowerCase() === lowered)
  )
  return loose.length === 1 ? loose[0] : null
}

/**
 * Reads pasted text such as `90 min`, `1.5h`, `1h 30m`, `1,024 MiB`, or `90`.
 * Returns `null` when the text is not a number, names a unit outside the
 * group, mixes parts with and without units, or lists parts out of order.
 */
export function parseQuantityText<TKey extends string>(
  text: string,
  group: QuantityUnitGroup<TKey>,
  separators: NumberSeparators
): ParsedQuantity<TKey> | null {
  let rest = text.replace(SPACE_LIKE, " ").trim()
  // A value copied out of a sentence often brings its closing punctuation along.
  rest = rest.replace(/(?<=\p{L})[.,;]$/u, "")
  if (rest === "") return null

  const sign = /^[+\-−]/.exec(rest)
  const isNegative = sign !== null && sign[0] !== "+"
  if (sign) rest = rest.slice(1).trimStart()

  const partPattern = /^([\d.,'’ ]*\d)\s*([\p{L}µ]*)\s*/u
  const parts: { number: number; unit: QuantityUnit<TKey> | null }[] = []

  while (rest !== "") {
    const match = partPattern.exec(rest)
    if (!match) return null

    const number = parseNumberToken(match[1].trim(), separators)
    if (number === null) return null

    const unit = match[2] === "" ? null : findUnitByText(group, match[2])
    if (match[2] !== "" && unit === null) return null

    parts.push({ number, unit })
    rest = rest.slice(match[0].length)
  }

  if (parts.length === 1 && parts[0].unit === null) {
    return { kind: "number", number: isNegative ? -parts[0].number : parts[0].number }
  }

  let baseValue = 0
  let previousFactor = Infinity
  let smallest: QuantityUnit<TKey> | null = null

  for (const part of parts) {
    // `1h 30` and `30m 1h` are more likely mistakes than quantities.
    if (part.unit === null || part.unit.factor >= previousFactor) return null
    baseValue += part.number * part.unit.factor
    previousFactor = part.unit.factor
    smallest = part.unit
  }

  if (smallest === null) return null

  return {
    kind: "quantity",
    baseValue: trimFloat(isNegative ? -baseValue : baseValue),
    unit: smallest.key,
    isCompound: parts.length > 1,
  }
}

type PasteContext<TKey extends string> = {
  group: QuantityUnitGroup<TKey>
  /** The units the field offers. */
  units: readonly QuantityUnit<TKey>[]
  /** The unit the field shows now. */
  unit: QuantityUnit<TKey>
  valueUnit: QuantityUnit<TKey>
  rounding?: QuantityRounding | undefined
}

/**
 * Fits a pasted quantity to a field. The field switches to the pasted unit
 * when it offers that unit, so `90 min` stays `90 min`. Otherwise the value is
 * converted into the unit already shown and `wasConverted` is set.
 */
export function resolvePaste<TKey extends string>(
  parsed: ParsedQuantity<TKey>,
  { group, units, unit, valueUnit, rounding }: PasteContext<TKey>
): { value: number; unit: QuantityUnit<TKey>; wasConverted: boolean } {
  if (parsed.kind === "number") {
    return {
      value: fromDisplayNumber(parsed.number, unit, valueUnit, rounding),
      unit,
      wasConverted: false,
    }
  }

  const pastedUnit = units.find((candidate) => candidate.key === parsed.unit)
  const value = roundToIncrement(
    convertQuantity(parsed.baseValue, getUnit(group, group.base), valueUnit),
    rounding?.increment
  )

  return {
    value,
    unit: pastedUnit ?? unit,
    wasConverted: parsed.isCompound || pastedUnit === undefined,
  }
}

function formatNumber(value: number, locale: Intl.LocalesArgument | undefined) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 20 }).format(value)
}

/** The stored value as the field shows it in `unit`, such as `1.5 h`. */
export function formatQuantity(
  value: number,
  unit: QuantityUnit,
  valueUnit: QuantityUnit,
  options: { rounding?: QuantityRounding | undefined; locale?: Intl.LocalesArgument | undefined } = {}
) {
  const shown = toDisplayNumber(value, unit, valueUnit, options.rounding)
  return `${formatNumber(shown, options.locale)} ${unit.symbol}`
}

/**
 * The stored value written without rounding: in `preferred` when that unit
 * shows it exactly, otherwise in the largest offered unit that does, and
 * failing that in the unit it is stored in.
 */
export function formatExactQuantity(
  value: number,
  {
    preferred,
    units,
    valueUnit,
    rounding,
    locale,
  }: {
    preferred: QuantityUnit
    units: readonly QuantityUnit[]
    valueUnit: QuantityUnit
    rounding?: QuantityRounding | undefined
    locale?: Intl.LocalesArgument | undefined
  }
) {
  const largestFirst = [...units].sort((a, b) => b.factor - a.factor)
  const exactUnit = [preferred, ...largestFirst].find((unit) =>
    isDisplayExact(value, unit, valueUnit, rounding)
  )

  return exactUnit
    ? formatQuantity(value, exactUnit, valueUnit, { rounding, locale })
    : `${formatNumber(value, locale)} ${valueUnit.symbol}`
}

export const defaultQuantityFieldLabels: QuantityFieldLabels = {
  unit: "unit",
  decrease: "Decrease",
  increase: "Increase",
  belowMin: (limit) => `Enter ${limit} or more.`,
  aboveMax: (limit) => `Enter ${limit} or less.`,
  unreadablePaste: (pasted, units) =>
    `“${pasted}” was not pasted because it could not be read. Use a number with one of these units: ${units.join(", ")}.`,
  pasteConverted: (pasted, shown) => `“${pasted}” was pasted as ${shown}.`,
  unitChanged: (from, to) => `${from} is ${to}.`,
  rounded: (exact) => `Shown rounded. The exact value is ${exact}.`,
}
