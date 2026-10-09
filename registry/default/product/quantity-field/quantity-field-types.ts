export type QuantityUnit<TKey extends string = string> = {
  /** The stable id used by `unit`, `valueUnit`, and `units`. */
  key: TKey
  /** Shown beside the number, such as `min` or `GiB`. */
  symbol: string
  /** The plural name read by screen readers and listed in the unit menu, such as `Minutes`. */
  name: string
  /** How many of the group's base unit make one of this unit. */
  factor: number
  /** Other spellings accepted when a value is pasted. */
  aliases?: readonly string[] | undefined
}

/** Units that measure the same thing, so a value in one converts to any other. */
export type QuantityUnitGroup<TKey extends string = string> = {
  /** The unit every `factor` is counted in. `value` uses it unless `valueUnit` says otherwise. */
  base: TKey
  units: readonly QuantityUnit<TKey>[]
  /**
   * Set when two spellings that differ only by case mean different things,
   * as `MB` (megabytes) and `Mb` (megabits) do. Pasted units must then match exactly.
   */
  caseSensitive?: boolean | undefined
}

export type QuantityRounding = {
  /** The most decimal places shown and accepted in any unit. Defaults to 2. */
  maximumFractionDigits?: number | undefined
  /**
   * The smallest step the stored value can take, counted in `valueUnit`.
   * Defaults to 1, so a value stored in seconds or bytes is a whole number.
   */
  increment?: number | undefined
}

export type QuantityRangeError = "belowMin" | "aboveMax"

export type QuantityFieldChangeDetails<TKey extends string = string> = {
  /** The unit shown beside the number when the value changed. */
  unit: TKey
  /** The unit the value is counted in. */
  valueUnit: TKey
  /** Set when the value is outside `min` and `max`. Typed and pasted values are reported, not clamped. */
  rangeError: QuantityRangeError | null
}

export type NumberSeparators = {
  decimal: string
  group: string
}

/** What a pasted string says, before it is fitted to a field. */
export type ParsedQuantity<TKey extends string = string> =
  /** A number with no unit, to be read in the field's current unit. */
  | { kind: "number"; number: number }
  | {
      kind: "quantity"
      /** The total, counted in the group's base unit. */
      baseValue: number
      /** The smallest unit named, which shows the total without a remainder. */
      unit: TKey
      /** More than one part was given, as in `1h 30m`. */
      isCompound: boolean
    }

export type QuantityFieldLabels = {
  /** Completes the unit menu's name after the field's label, as in "Session timeout unit". */
  unit: string
  decrease: string
  increase: string
  belowMin: (limit: string) => string
  aboveMax: (limit: string) => string
  /** `pasted` is what was on the clipboard. `units` are the symbols this field offers. */
  unreadablePaste: (pasted: string, units: readonly string[]) => string
  /** Shown when a pasted value was converted or combined, so the field no longer shows the pasted text. */
  pasteConverted: (pasted: string, shown: string) => string
  unitChanged: (from: string, to: string) => string
  /** Shown while the number in the field is a rounded view of the stored value. */
  rounded: (exact: string) => string
}
