import { describe, expect, it } from "vitest"

import {
  applyDisplayChange,
  convertQuantity,
  defaultQuantityFieldLabels,
  durationUnits,
  formatExactQuantity,
  formatQuantity,
  fromDisplayNumber,
  getFractionDigits,
  getNumberSeparators,
  getRangeError,
  getUnit,
  isDisplayExact,
  parseQuantityText,
  resolvePaste,
  roundToIncrement,
  storageUnits,
  toDisplayNumber,
} from "../../registry/default/product/quantity-field/quantity-field-utils"

const ms = getUnit(durationUnits, "ms")
const s = getUnit(durationUnits, "s")
const min = getUnit(durationUnits, "min")
const h = getUnit(durationUnits, "h")
const d = getUnit(durationUnits, "d")
const B = getUnit(storageUnits, "B")
const MB = getUnit(storageUnits, "MB")
const KiB = getUnit(storageUnits, "KiB")
const MiB = getUnit(storageUnits, "MiB")
const GiB = getUnit(storageUnits, "GiB")
const TiB = getUnit(storageUnits, "TiB")

const english = { decimal: ".", group: "," }
const german = { decimal: ",", group: "." }

describe("getUnit", () => {
  it("throws for a key the group does not define", () => {
    expect(() => getUnit(durationUnits, "month" as "s")).toThrow(/"month" is not a unit/)
  })
})

describe("convertQuantity", () => {
  it("converts between units of one group", () => {
    expect(convertQuantity(90, min, h)).toBe(1.5)
    expect(convertQuantity(1024, MiB, GiB)).toBe(1)
    expect(convertQuantity(512, MB, B)).toBe(512_000_000)
  })

  it("leaves no binary noise in a result that should be whole", () => {
    expect(convertQuantity(0.1, min, s)).toBe(6)
  })

  it("keeps every digit of a large byte count", () => {
    expect(convertQuantity(1, TiB, B)).toBe(1_099_511_627_776)
    expect(convertQuantity(8191, TiB, B)).toBe(8191 * 1024 ** 4)
  })
})

describe("roundToIncrement", () => {
  it("rounds half away from zero", () => {
    expect(roundToIncrement(0.5)).toBe(1)
    expect(roundToIncrement(-0.5)).toBe(-1)
    expect(roundToIncrement(1.49)).toBe(1)
  })

  it("rounds to increments other than one", () => {
    expect(roundToIncrement(7, 5)).toBe(5)
    expect(roundToIncrement(8, 5)).toBe(10)
    expect(roundToIncrement(1.2345, 0.001)).toBe(1.235)
  })
})

describe("getFractionDigits", () => {
  it("gives the stored unit no decimals when whole values are stored", () => {
    expect(getFractionDigits(s, s)).toBe(0)
    expect(getFractionDigits(B, B)).toBe(0)
  })

  it("gives larger units decimals, up to the maximum", () => {
    expect(getFractionDigits(min, s)).toBe(2)
    expect(getFractionDigits(GiB, B)).toBe(2)
    expect(getFractionDigits(h, s, { maximumFractionDigits: 3 })).toBe(3)
    expect(getFractionDigits(h, s, { maximumFractionDigits: 0 })).toBe(0)
  })

  it("never gives a unit more decimals than the stored increment can tell apart", () => {
    expect(getFractionDigits(d, h, { maximumFractionDigits: 4 })).toBe(2)
    expect(getFractionDigits(s, s, { increment: 0.1 })).toBe(1)
  })

  it("gives units smaller than the stored unit no decimals", () => {
    expect(getFractionDigits(ms, s)).toBe(0)
  })
})

describe("showing a stored value", () => {
  it("shows a value exactly when the unit allows it", () => {
    expect(toDisplayNumber(5400, h, s)).toBe(1.5)
    expect(isDisplayExact(5400, h, s)).toBe(true)
    expect(toDisplayNumber(1024 ** 3, GiB, B)).toBe(1)
    expect(isDisplayExact(1024 ** 3, GiB, B)).toBe(true)
  })

  it("rounds a value the unit cannot show and reports it as inexact", () => {
    expect(toDisplayNumber(6000, h, s)).toBe(1.67)
    expect(isDisplayExact(6000, h, s)).toBe(false)
    expect(isDisplayExact(6000, min, s)).toBe(true)
  })

  it("reports a value as inexact even when typing the shown number would store it again", () => {
    // 0.01 KiB is 10.24 bytes; 10 bytes are stored.
    expect(fromDisplayNumber(0.01, KiB, B)).toBe(10)
    expect(toDisplayNumber(10, KiB, B)).toBe(0.01)
    expect(isDisplayExact(10, KiB, B)).toBe(false)
  })

  it("rounds a half away from zero", () => {
    expect(toDisplayNumber(45, min, s, { maximumFractionDigits: 1 })).toBe(0.8)
    expect(toDisplayNumber(-45, min, s, { maximumFractionDigits: 1 })).toBe(-0.8)
  })
})

describe("fromDisplayNumber", () => {
  it("stores the entered number in the value unit", () => {
    expect(fromDisplayNumber(1.5, h, s)).toBe(5400)
    expect(fromDisplayNumber(1, GiB, MiB)).toBe(1024)
  })

  it("rounds to the stored increment", () => {
    expect(fromDisplayNumber(0.01, min, s)).toBe(1)
    expect(fromDisplayNumber(1500, ms, s)).toBe(2)
    expect(fromDisplayNumber(1.234, s, s, { increment: 0.01 })).toBe(1.23)
  })
})

describe("applyDisplayChange", () => {
  const hours = { unit: h, valueUnit: s }

  it("stores a typed number", () => {
    expect(applyDisplayChange({ ...hours, value: 5400, next: 2, isStep: false })).toBe(7200)
  })

  it("clears the value", () => {
    expect(applyDisplayChange({ ...hours, value: 5400, next: null, isStep: false })).toBeNull()
  })

  it("keeps the exact value when the number field reports the rounded number it already shows", () => {
    expect(applyDisplayChange({ ...hours, value: 6000, next: 1.67, isStep: false })).toBe(6000)
  })

  it("adds a step to the exact value, not to the rounded number", () => {
    // 100 minutes shows as 1.67 h. One hour more is 160 minutes, not 2.67 h.
    expect(applyDisplayChange({ ...hours, value: 6000, next: 2.67, isStep: true })).toBe(9600)
    expect(applyDisplayChange({ ...hours, value: 6000, next: 0.67, isStep: true })).toBe(2400)
  })

  it("keeps a step inside the limits", () => {
    expect(
      applyDisplayChange({ ...hours, value: 6000, next: 2.67, isStep: true, max: 7200 })
    ).toBe(7200)
    expect(
      applyDisplayChange({ ...hours, value: 6000, next: 0, isStep: true, min: 60 })
    ).toBe(60)
  })

  it("does not clamp a typed number", () => {
    expect(
      applyDisplayChange({ ...hours, value: 5400, next: 30, isStep: false, max: 86_400 })
    ).toBe(108_000)
  })

  it("starts a step from an empty field at the nearest limit", () => {
    expect(applyDisplayChange({ ...hours, value: null, next: 0, isStep: true, min: 60 })).toBe(60)
  })

  it("brings an out-of-range value back inside the limits on a step", () => {
    expect(
      applyDisplayChange({ ...hours, value: 108_000, next: 29, isStep: true, max: 86_400 })
    ).toBe(86_400)
  })
})

describe("getRangeError", () => {
  it("reports which limit a value is outside", () => {
    expect(getRangeError(30, 60, 3600)).toBe("belowMin")
    expect(getRangeError(7200, 60, 3600)).toBe("aboveMax")
  })

  it("accepts the limits themselves, an empty value, and missing limits", () => {
    expect(getRangeError(60, 60, 3600)).toBeNull()
    expect(getRangeError(3600, 60, 3600)).toBeNull()
    expect(getRangeError(null, 60, 3600)).toBeNull()
    expect(getRangeError(-5, undefined, undefined)).toBeNull()
  })
})

describe("getNumberSeparators", () => {
  it("reads the separators a locale writes numbers with", () => {
    expect(getNumberSeparators("en-US")).toEqual(english)
    expect(getNumberSeparators("de-DE")).toEqual(german)
  })
})

describe("parseQuantityText", () => {
  it.each([
    ["90 min", 5400, "min"],
    ["90min", 5400, "min"],
    ["1.5h", 5400, "h"],
    ["1.5 hours", 5400, "h"],
    ["90 Minutes", 5400, "min"],
    ["2 d", 172_800, "d"],
    ["250ms", 0.25, "ms"],
    [".5 h", 1800, "h"],
    ["1,440 min", 86_400, "min"],
    ["1 440 min", 86_400, "min"],
    ["90 min", 5400, "min"],
    ["90 min.", 5400, "min"],
    ["+90 min", 5400, "min"],
    ["-90 min", -5400, "min"],
    ["−90 min", -5400, "min"],
  ])("reads the duration %s", (text, baseValue, unit) => {
    expect(parseQuantityText(text, durationUnits, english)).toEqual({
      kind: "quantity",
      baseValue,
      unit,
      isCompound: false,
    })
  })

  it.each([
    ["1h 30m", 5400, "min"],
    ["1h30m", 5400, "min"],
    ["2 d 4 h 30 min", 189_000, "min"],
    ["1 min 30 s", 90, "s"],
  ])("adds up the parts of %s and names the smallest unit", (text, baseValue, unit) => {
    expect(parseQuantityText(text, durationUnits, english)).toEqual({
      kind: "quantity",
      baseValue,
      unit,
      isCompound: true,
    })
  })

  it.each([
    ["1024 MiB", 1024 ** 3, "MiB"],
    ["1,024 MiB", 1024 ** 3, "MiB"],
    ["512 MB", 512_000_000, "MB"],
    ["512 KB", 512_000, "kB"],
    ["2 gibibytes", 2 * 1024 ** 3, "GiB"],
    ["1.5GiB", 1.5 * 1024 ** 3, "GiB"],
  ])("reads the size %s", (text, baseValue, unit) => {
    expect(parseQuantityText(text, storageUnits, english)).toEqual({
      kind: "quantity",
      baseValue,
      unit,
      isCompound: false,
    })
  })

  it("reads a number without a unit as a number", () => {
    expect(parseQuantityText("90", durationUnits, english)).toEqual({ kind: "number", number: 90 })
    expect(parseQuantityText(" 1,024.5 ", storageUnits, english)).toEqual({
      kind: "number",
      number: 1024.5,
    })
    expect(parseQuantityText("-3", durationUnits, english)).toEqual({ kind: "number", number: -3 })
  })

  it("reads the separators of the stated locale", () => {
    expect(parseQuantityText("1,5 h", durationUnits, german)).toMatchObject({ baseValue: 5400 })
    expect(parseQuantityText("1.024 MiB", storageUnits, german)).toMatchObject({
      baseValue: 1024 ** 3,
    })
    expect(parseQuantityText("1.024 MiB", storageUnits, english)).toMatchObject({
      baseValue: 1.024 * 1024 ** 2,
    })
  })

  it("never reads a number written for the other separator", () => {
    expect(parseQuantityText("1,5 h", durationUnits, english)).toBeNull()
    expect(parseQuantityText("1.5 h", durationUnits, german)).toBeNull()
  })

  it("matches storage symbols exactly, so megabits are not read as megabytes", () => {
    expect(parseQuantityText("512 Mb", storageUnits, english)).toBeNull()
    expect(parseQuantityText("512 mb", storageUnits, english)).toBeNull()
    expect(parseQuantityText("512 gib", storageUnits, english)).toBeNull()
  })

  it.each([
    "",
    "   ",
    "soon",
    "min",
    "90 fortnights",
    "5 GB",
    "1:30:00",
    "1h 30",
    "30m 1h",
    "1h 2h",
    "1.2.3 h",
    "1e3 s",
    "90 min or so",
    "1h -30m",
  ])("refuses %s as a duration", (text) => {
    expect(parseQuantityText(text, durationUnits, english)).toBeNull()
  })
})

describe("resolvePaste", () => {
  const minutesAndHours = {
    group: durationUnits,
    units: [min, h],
    unit: h,
    valueUnit: s,
  }

  function paste<TKey extends string>(text: string, context: Parameters<typeof resolvePaste<TKey>>[1]) {
    const parsed = parseQuantityText(text, context.group, english)
    if (parsed === null) throw new Error(`"${text}" did not parse`)
    return resolvePaste(parsed, context)
  }

  it("switches to the pasted unit when the field offers it", () => {
    expect(paste("90 min", minutesAndHours)).toEqual({ value: 5400, unit: min, wasConverted: false })
  })

  it("reads a bare number in the unit already shown", () => {
    expect(paste("2", minutesAndHours)).toEqual({ value: 7200, unit: h, wasConverted: false })
  })

  it("converts a unit the field does not offer into the unit already shown", () => {
    expect(paste("2 d", minutesAndHours)).toEqual({ value: 172_800, unit: h, wasConverted: true })
  })

  it("marks a combined value as converted", () => {
    expect(paste("1h 30m", minutesAndHours)).toEqual({ value: 5400, unit: min, wasConverted: true })
  })

  it("rounds to the stored increment", () => {
    expect(paste("250 ms", minutesAndHours).value).toBe(0)
    expect(paste("1500 ms", minutesAndHours).value).toBe(2)
  })

  it("stores the value in the value unit, whatever the group's base unit is", () => {
    const inMebibytes = {
      group: storageUnits,
      units: [MiB, GiB],
      unit: MiB,
      valueUnit: MiB,
    }
    expect(paste("2 GiB", inMebibytes)).toEqual({ value: 2048, unit: GiB, wasConverted: false })
    expect(paste("512 MB", inMebibytes)).toEqual({ value: 488, unit: MiB, wasConverted: true })
  })
})

describe("formatting", () => {
  it("writes the value as the field shows it", () => {
    expect(formatQuantity(5400, h, s, { locale: "en-US" })).toBe("1.5 h")
    expect(formatQuantity(6000, h, s, { locale: "en-US" })).toBe("1.67 h")
    expect(formatQuantity(86_400, s, s, { locale: "en-US" })).toBe("86,400 s")
    expect(formatQuantity(5400, h, s, { locale: "de-DE" })).toBe("1,5 h")
  })

  it("writes an exact value in the preferred unit when that unit can show it", () => {
    expect(
      formatExactQuantity(5400, { preferred: h, units: [s, min, h], valueUnit: s, locale: "en-US" })
    ).toBe("1.5 h")
  })

  it("falls back to the largest offered unit that is exact", () => {
    expect(
      formatExactQuantity(6000, { preferred: h, units: [s, min, h], valueUnit: s, locale: "en-US" })
    ).toBe("100 min")
    expect(
      formatExactQuantity(6001, { preferred: h, units: [s, min, h], valueUnit: s, locale: "en-US" })
    ).toBe("6,001 s")
  })

  it("falls back to the stored unit when no offered unit is exact", () => {
    expect(
      formatExactQuantity(6001, { preferred: h, units: [min, h], valueUnit: s, locale: "en-US" })
    ).toBe("6,001 s")
  })
})

describe("defaultQuantityFieldLabels", () => {
  it("states the limit, the recovery, and what happened to a paste", () => {
    expect(defaultQuantityFieldLabels.aboveMax("24 h")).toBe("Enter 24 h or less.")
    expect(defaultQuantityFieldLabels.belowMin("1 min")).toBe("Enter 1 min or more.")
    expect(defaultQuantityFieldLabels.unreadablePaste("soon", ["min", "h"])).toBe(
      "“soon” was not pasted because it could not be read. Use a number with one of these units: min, h."
    )
    expect(defaultQuantityFieldLabels.pasteConverted("1h 30m", "90 min")).toBe(
      "“1h 30m” was pasted as 90 min."
    )
    expect(defaultQuantityFieldLabels.unitChanged("90 min", "1.5 h")).toBe("90 min is 1.5 h.")
    expect(defaultQuantityFieldLabels.rounded("100 min")).toBe(
      "Shown rounded. The exact value is 100 min."
    )
  })
})
