"use client"

import * as React from "react"
import { CircleAlert as CircleAlertIcon } from "honestui/icons"

import { cn } from "@/lib/utils"
import { Label } from "@/registry/default/ui/label"
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/registry/default/ui/number-field"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"

import type {
  QuantityFieldChangeDetails,
  QuantityFieldLabels,
  QuantityRounding,
  QuantityUnit,
  QuantityUnitGroup,
} from "./quantity-field-types"
import {
  applyDisplayChange,
  defaultQuantityFieldLabels,
  formatExactQuantity,
  formatQuantity,
  getFractionDigits,
  getNumberSeparators,
  getRangeError,
  getUnit,
  isDisplayExact,
  parseQuantityText,
  resolvePaste,
  toDisplayNumber,
} from "./quantity-field-utils"

export type {
  QuantityFieldChangeDetails,
  QuantityFieldLabels,
  QuantityRangeError,
  QuantityRounding,
  QuantityUnit,
  QuantityUnitGroup,
} from "./quantity-field-types"
export {
  convertQuantity,
  defaultQuantityFieldLabels,
  durationUnits,
  storageUnits,
} from "./quantity-field-utils"

type NumberChangeHandler = NonNullable<React.ComponentProps<typeof NumberField>["onValueChange"]>

/** Changes that move the value by a step. Everything else replaces the number. */
const STEP_REASONS: ReadonlySet<string> = new Set([
  "keyboard",
  "increment-press",
  "decrement-press",
  "wheel",
  "scrub",
])

const PASTED_TEXT_LIMIT = 40

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

type QuantityFieldContextValue = {
  inputId: string
  labelId: string
  statusId: string
  unitNameId: string
  unitLabelId: string
  /** Changes when the number field must be rebuilt to show a pasted value. */
  revision: number
  units: readonly QuantityUnit[]
  unit: QuantityUnit
  value: number | null
  shownNumber: number | null
  fractionDigits: number
  min: number | undefined
  max: number | undefined
  step: number
  locale: Intl.LocalesArgument | undefined
  disabled: boolean
  readOnly: boolean
  required: boolean
  labels: QuantityFieldLabels
  error: string | null
  notes: readonly string[]
  onNumberChange: NumberChangeHandler
  onInputBlur: () => void
  onPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void
  onUnitChange: (key: string | null) => void
}

const QuantityFieldContext = React.createContext<QuantityFieldContextValue | null>(null)

function useQuantityFieldContext(part: string) {
  const context = React.useContext(QuantityFieldContext)
  if (!context) {
    throw new Error(`${part} must be used within a QuantityField.`)
  }
  return context
}

function useControllableState<T>(controlled: T | undefined, initial: T) {
  const [internal, setInternal] = React.useState(initial)
  return [controlled === undefined ? internal : controlled, setInternal] as const
}

function shorten(text: string) {
  const trimmed = text.trim()
  return trimmed.length > PASTED_TEXT_LIMIT ? `${trimmed.slice(0, PASTED_TEXT_LIMIT)}…` : trimmed
}

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

export type QuantityFieldProps<TKey extends string = string> = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> & {
  /** The units this quantity can be measured in, such as `durationUnits`. */
  unitGroup: QuantityUnitGroup<TKey>
  /** The units offered in the menu, in menu order. Defaults to every unit in the group. */
  units?: readonly TKey[] | undefined
  /** The unit `value`, `min`, and `max` are counted in. Defaults to the group's base unit. */
  valueUnit?: TKey | undefined
  /** The quantity, counted in `valueUnit`. `null` is an empty field. */
  value?: number | null | undefined
  defaultValue?: number | null | undefined
  onValueChange?:
    | ((value: number | null, details: QuantityFieldChangeDetails<TKey>) => void)
    | undefined
  /** The unit shown beside the number. Changing it never changes `value`. */
  unit?: TKey | undefined
  defaultUnit?: TKey | undefined
  onUnitChange?: ((unit: TKey) => void) | undefined
  /** The smallest allowed value, in `valueUnit`. Defaults to 0. */
  min?: number | undefined
  /** The largest allowed value, in `valueUnit`. */
  max?: number | undefined
  rounding?: QuantityRounding | undefined
  /** How far a stepper or arrow key moves the number, in the unit shown. Defaults to 1. */
  step?: number | undefined
  locale?: Intl.LocalesArgument | undefined
  /** Submits `value` with a form, counted in `valueUnit`. */
  name?: string | undefined
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  required?: boolean | undefined
  labels?: Partial<QuantityFieldLabels> | undefined
}

/**
 * Holds one quantity as a number of `valueUnit` and shows it in whichever
 * unit is selected. The unit is a view: switching it converts the number on
 * screen and leaves the stored value alone.
 */
function QuantityField<TKey extends string = string>({
  unitGroup,
  units: unitKeys,
  valueUnit: valueUnitKey,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  unit: unitProp,
  defaultUnit,
  onUnitChange,
  min = 0,
  max,
  rounding,
  step = 1,
  locale,
  name,
  id,
  disabled = false,
  readOnly = false,
  required = false,
  labels: labelsProp,
  className,
  children,
  ...props
}: QuantityFieldProps<TKey>) {
  const generatedId = React.useId()
  const inputId = id ?? `${generatedId}-input`

  const labels = React.useMemo(
    () => ({ ...defaultQuantityFieldLabels, ...labelsProp }),
    [labelsProp]
  )
  const separators = React.useMemo(() => getNumberSeparators(locale), [locale])

  const valueUnit = getUnit(unitGroup, valueUnitKey ?? unitGroup.base)
  const units = (unitKeys ?? unitGroup.units.map((candidate) => candidate.key)).map((key) =>
    getUnit(unitGroup, key)
  )
  const fallbackUnit = units.find((candidate) => candidate.key === valueUnit.key) ?? units[0]

  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const [unitKey, setUnitKey] = useControllableState(unitProp, defaultUnit ?? fallbackUnit.key)
  const unit = units.find((candidate) => candidate.key === unitKey) ?? fallbackUnit

  // While someone is typing, "1" on the way to "10" is not yet a value to judge against the limits.
  const [isTyping, setIsTyping] = React.useState(false)
  const [pasteError, setPasteError] = React.useState<string | null>(null)
  const [conversionNote, setConversionNote] = React.useState<string | null>(null)
  const [revision, setRevision] = React.useState(0)

  const shownNumber = value === null ? null : toDisplayNumber(value, unit, valueUnit, rounding)

  const describeExactly = (quantity: number) =>
    formatExactQuantity(quantity, { preferred: unit, units, valueUnit, rounding, locale })

  const rangeError = getRangeError(value, min, max)
  let rangeMessage: string | null = null
  if (rangeError === "belowMin") rangeMessage = labels.belowMin(describeExactly(min))
  if (rangeError === "aboveMax" && max !== undefined) {
    rangeMessage = labels.aboveMax(describeExactly(max))
  }

  const error = pasteError ?? (isTyping ? null : rangeMessage)
  const notes: string[] = []
  if (conversionNote !== null) notes.push(conversionNote)
  if (value !== null && !isDisplayExact(value, unit, valueUnit, rounding)) {
    notes.push(labels.rounded(describeExactly(value)))
  }

  // Blocks native form submission with the same message the status shows.
  React.useEffect(() => {
    const input = document.getElementById(inputId)
    if (input instanceof HTMLInputElement) input.setCustomValidity(rangeMessage ?? "")
  }, [inputId, rangeMessage, revision])

  // A paste rebuilds the number field, so focus has to be put back in the new input.
  React.useLayoutEffect(() => {
    if (revision > 0) document.getElementById(inputId)?.focus()
  }, [inputId, revision])

  const commitValue = (next: number | null, shownIn: QuantityUnit<TKey>) => {
    if (next === value) return
    setValue(next)
    onValueChange?.(next, {
      unit: shownIn.key,
      valueUnit: valueUnit.key,
      rangeError: getRangeError(next, min, max),
    })
  }

  const handleNumberChange: NumberChangeHandler = (next, details) => {
    const nextValue = applyDisplayChange({
      value,
      next,
      isStep: STEP_REASONS.has(details.reason),
      unit,
      valueUnit,
      rounding,
      min,
      max,
    })

    setIsTyping(details.reason === "input-change")
    if (nextValue !== value || details.reason === "input-change") {
      setPasteError(null)
      setConversionNote(null)
    }
    commitValue(nextValue, unit)
  }

  const handleUnitChange = (key: string | null) => {
    const nextUnit = units.find((candidate) => candidate.key === key)
    if (!nextUnit || nextUnit.key === unit.key) return

    // "90 min is 1.5 h" is only true when neither side is a rounded view.
    const isExactBothWays =
      value !== null &&
      isDisplayExact(value, unit, valueUnit, rounding) &&
      isDisplayExact(value, nextUnit, valueUnit, rounding)

    setPasteError(null)
    setConversionNote(
      isExactBothWays
        ? labels.unitChanged(
            formatQuantity(value, unit, valueUnit, { rounding, locale }),
            formatQuantity(value, nextUnit, valueUnit, { rounding, locale })
          )
        : null
    )
    setUnitKey(nextUnit.key)
    onUnitChange?.(nextUnit.key)
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return

    const pasted = event.clipboardData.getData("text/plain")
    if (pasted.trim() === "") return

    // The number field would otherwise drop the unit and keep only the digits it recognizes.
    event.preventDefault()

    const parsed = parseQuantityText(pasted, unitGroup, separators)
    if (parsed === null) {
      setConversionNote(null)
      setPasteError(
        labels.unreadablePaste(
          shorten(pasted),
          units.map((candidate) => candidate.symbol)
        )
      )
      return
    }

    const resolved = resolvePaste(parsed, { group: unitGroup, units, unit, valueUnit, rounding })

    setPasteError(null)
    setIsTyping(false)
    setConversionNote(
      resolved.wasConverted
        ? labels.pasteConverted(
            shorten(pasted),
            formatQuantity(resolved.value, resolved.unit, valueUnit, { rounding, locale })
          )
        : null
    )
    if (resolved.unit.key !== unit.key) {
      setUnitKey(resolved.unit.key)
      onUnitChange?.(resolved.unit.key)
    }
    commitValue(resolved.value, resolved.unit)
    // The number field keeps typed text until blur, so it is rebuilt to show the pasted value now.
    setRevision((current) => current + 1)
  }

  const context: QuantityFieldContextValue = {
    inputId,
    labelId: `${generatedId}-label`,
    statusId: `${generatedId}-status`,
    unitNameId: `${generatedId}-unit-name`,
    unitLabelId: `${generatedId}-unit-label`,
    revision,
    units,
    unit,
    value,
    shownNumber,
    fractionDigits: getFractionDigits(unit, valueUnit, rounding),
    min,
    max,
    step,
    locale,
    disabled,
    readOnly,
    required,
    labels,
    error,
    notes,
    onNumberChange: handleNumberChange,
    onInputBlur: () => setIsTyping(false),
    onPaste: handlePaste,
    onUnitChange: handleUnitChange,
  }

  return (
    <QuantityFieldContext.Provider value={context}>
      <div
        data-slot="quantity-field"
        data-invalid={error !== null ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={cn("flex min-w-0 flex-col items-start", className)}
        {...props}
      >
        {children}
        {name !== undefined && (
          <input type="hidden" name={name} value={value ?? ""} disabled={disabled} />
        )}
      </div>
    </QuantityFieldContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Label                                                                      */
/* -------------------------------------------------------------------------- */

function QuantityFieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { inputId, labelId } = useQuantityFieldContext("QuantityFieldLabel")

  return (
    <Label
      id={labelId}
      htmlFor={inputId}
      data-slot="quantity-field-label"
      className={cn("mb-[var(--hui-space-2)]", className)}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Control                                                                    */
/* -------------------------------------------------------------------------- */

export type QuantityFieldControlProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Shows the decrease and increase buttons. Arrow keys step either way. Defaults to `true`. */
  steppers?: boolean | undefined
}

/** The number, its steppers, and the unit. With one unit offered, the unit is text instead of a menu. */
function QuantityFieldControl({ steppers = true, className, ...props }: QuantityFieldControlProps) {
  const context = useQuantityFieldContext("QuantityFieldControl")
  const { unit, units, value, min, max, labels } = context

  return (
    <div
      role="group"
      aria-labelledby={context.labelId}
      data-slot="quantity-field-control"
      className={cn("flex w-full min-w-0 items-center gap-[var(--hui-space-2)]", className)}
      {...props}
    >
      <NumberField
        key={context.revision}
        id={context.inputId}
        value={context.shownNumber}
        onValueChange={context.onNumberChange}
        // Quantities that cannot be negative do not accept a minus sign. The real limits are checked against the stored value.
        min={min !== undefined && min >= 0 ? 0 : undefined}
        step={context.step}
        format={{ maximumFractionDigits: context.fractionDigits }}
        locale={context.locale}
        disabled={context.disabled}
        readOnly={context.readOnly}
        required={context.required}
        className="min-w-0 flex-1"
      >
        <NumberFieldGroup className="w-full">
          {steppers && (
            <NumberFieldDecrement
              aria-label={labels.decrease}
              disabled={value !== null && min !== undefined && value <= min ? true : undefined}
            />
          )}
          <NumberFieldInput
            aria-describedby={`${context.unitNameId} ${context.statusId}`}
            aria-invalid={context.error !== null || undefined}
            onBlur={context.onInputBlur}
            onPaste={context.onPaste}
            className={cn(
              "aria-invalid:border-[var(--hui-color-border-danger-emphasis)]",
              !steppers && "rounded-[var(--hui-radius-1)] text-start"
            )}
          />
          {steppers && (
            <NumberFieldIncrement
              aria-label={labels.increase}
              disabled={value !== null && max !== undefined && value >= max ? true : undefined}
            />
          )}
        </NumberFieldGroup>
      </NumberField>

      {/* Read after the number, so a screen reader says "90, Minutes" and not a bare 90. */}
      <span id={context.unitNameId} hidden>
        {unit.name}
      </span>

      {units.length === 1 ? (
        <span
          data-slot="quantity-field-unit"
          className={cn("shrink-0 text-[var(--hui-color-foreground-base-secondary)]", smallText)}
        >
          {unit.symbol}
        </span>
      ) : (
        <>
          <span id={context.unitLabelId} hidden>
            {labels.unit}
          </span>
          <Select
            value={unit.key}
            onValueChange={context.onUnitChange}
            disabled={context.disabled}
            readOnly={context.readOnly}
          >
            <SelectTrigger
              size="sm"
              aria-labelledby={`${context.labelId} ${context.unitLabelId}`}
              data-slot="quantity-field-unit"
              className="shrink-0"
            >
              <SelectValue>{unit.symbol}</SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {units.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {`${option.name} (${option.symbol})`}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Says what the field cannot show in the number alone: a limit that was
 * passed, a paste that was refused or converted, and that the number is a
 * rounded view. Keep it mounted; it is an empty live region until there is
 * something to say, which is what lets screen readers announce the first message.
 */
function QuantityFieldStatus({
  className,
  ...props
}: Omit<React.ComponentProps<"p">, "children">) {
  const { statusId, error, notes } = useQuantityFieldContext("QuantityFieldStatus")

  let state = "empty"
  if (notes.length > 0) state = "note"
  if (error !== null) state = "error"

  return (
    <p
      id={statusId}
      role="status"
      data-slot="quantity-field-status"
      data-state={state}
      className={cn(
        "m-0 flex min-w-0 items-start gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)] not-empty:mt-[var(--hui-space-2)] data-[state=error]:text-[var(--hui-color-foreground-base-primary)]",
        smallText,
        className
      )}
      {...props}
    >
      {/* The danger color passes contrast for an icon but not for small text, so the sentence stays in the text color. */}
      {error !== null && (
        <CircleAlertIcon
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
        />
      )}
      {state !== "empty" && (
        // Numbers are written for the viewer's locale, which the server may not share.
        <span suppressHydrationWarning className="min-w-0 break-words">
          {error ?? notes.join(" ")}
        </span>
      )}
    </p>
  )
}

export { QuantityField, QuantityFieldControl, QuantityFieldLabel, QuantityFieldStatus }
