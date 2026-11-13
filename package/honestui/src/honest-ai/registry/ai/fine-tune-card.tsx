"use client"

import * as React from "react"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldScrubArea,
} from "../../components/ui/number-field.js"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js"
import { Toggle, ToggleGroup } from "../../components/ui/toggle.js"

type ControlOption = { value: string; label: string }

export type FineTuneControl =
  | { type: "number"; id: string; label: string; min?: number; max?: number; step?: number }
  | { type: "select"; id: string; label: string; options: ControlOption[] }
  | { type: "segment"; id: string; label: string; options: ControlOption[] }

export type FineTuneValues = Record<string, number | string>

export type FineTuneCardLabels = {
  edited: string
  reset: string
}

export const defaultFineTuneCardLabels: FineTuneCardLabels = {
  edited: "Edited",
  reset: "Reset",
}

const regularText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

/** Every control shares one width, so the column keeps a clean left and right edge. */
const controlWidth = "w-36 shrink-0"

/** One label role for every row: the scrub label of a number field matches the others. */
const labelText =
  "text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

export type FineTuneCardProps = Omit<React.ComponentProps<"div">, "children" | "title"> & {
  /** What is being adjusted, such as "Chart" or "Reply style". */
  title: string
  controls: FineTuneControl[]
  /** The starting value for every control `id`. Reset returns to these. */
  defaultValues: FineTuneValues
  /** Runs with every value whenever one changes. */
  onValuesChange?: (values: FineTuneValues) => void
  labels?: Partial<FineTuneCardLabels>
}

/**
 * A compact panel of controls for adjusting something an agent produced.
 * Number fields can be typed into, stepped with the arrow keys, or scrubbed
 * by dragging their label.
 */
function FineTuneCard({
  title,
  controls,
  defaultValues,
  onValuesChange,
  labels: labelsProp,
  className,
  ...props
}: FineTuneCardProps) {
  const labels = { ...defaultFineTuneCardLabels, ...labelsProp }
  const [values, setValues] = React.useState(defaultValues)
  const titleId = React.useId()
  const isEdited = controls.some((control) => values[control.id] !== defaultValues[control.id])

  const update = (next: FineTuneValues) => {
    setValues(next)
    onValuesChange?.(next)
  }
  const setValue = (id: string, value: number | string) => update({ ...values, [id]: value })

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      data-slot="fine-tune-card"
      className={cn(
        "w-full min-w-0 rounded-[var(--hui-radius-4)] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        regularText,
        className
      )}
      {...props}
    >
      <div className="flex min-h-[var(--hui-space-11)] min-w-0 items-center gap-[var(--hui-space-3)] border-b-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] py-[var(--hui-space-2)] ps-[var(--hui-space-5)] pe-[var(--hui-space-3)]">
        <p id={titleId} className="m-0 min-w-0 flex-1 truncate [font-weight:var(--hui-font-weight-medium)]">
          {title}
        </p>
        <span role="status" className={cn("shrink-0 text-[var(--hui-color-foreground-base-secondary)]", smallText)}>
          {isEdited ? labels.edited : ""}
        </span>
        {/* Always mounted, so pressing it keeps focus and the header keeps its shape.
            With nothing edited it is aria-disabled: still focusable, does nothing. */}
        <Button
          variant="ghost"
          size="sm"
          aria-disabled={!isEdited || undefined}
          className="aria-disabled:pointer-events-none aria-disabled:text-[var(--hui-color-foreground-base-tertiary)]"
          onClick={() => {
            if (isEdited) update(defaultValues)
          }}
        >
          {labels.reset}
        </Button>
      </div>

      <div className="flex flex-col gap-[var(--hui-space-4)] p-[var(--hui-space-5)]">
        {controls.map((control) => (
          <FineTuneField
            key={control.id}
            control={control}
            value={values[control.id]}
            onChange={(value) => setValue(control.id, value)}
          />
        ))}
      </div>
    </div>
  )
}

/** Tabular figures on the digits only, since the tabular feature can also widen letters and dashes. */
function TabularDigits({ text }: { text: string }) {
  return text.split(/(\d[\d.,]*)/).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="tabular-nums">
        {part}
      </span>
    ) : (
      part
    )
  )
}

function FineTuneField({
  control,
  value,
  onChange,
}: {
  control: FineTuneControl
  value: number | string | undefined
  onChange: (value: number | string) => void
}) {
  const labelId = React.useId()

  if (control.type === "number") {
    // The range, when both ends are known, says what a bare number like "40" means.
    const range =
      control.min !== undefined && control.max !== undefined ? `${control.min}–${control.max}` : undefined

    return (
      <NumberField
        size="sm"
        className="w-full flex-row items-center justify-between gap-[var(--hui-space-4)]"
        min={control.min}
        max={control.max}
        step={control.step}
        value={typeof value === "number" ? value : null}
        onValueChange={(next) => {
          if (next !== null) onChange(next)
        }}
      >
        <span className="flex min-w-0 flex-col">
          <NumberFieldScrubArea
            label={control.label}
            className={cn("[&_[data-slot=label]]:[font-weight:var(--hui-font-weight-regular)]", labelText)}
          />
          {range && (
            <span aria-hidden="true" className={cn("text-[var(--hui-color-foreground-base-secondary)]", smallText)}>
              <TabularDigits text={range} />
            </span>
          )}
        </span>
        <NumberFieldGroup className={controlWidth}>
          <NumberFieldInput className="px-[var(--hui-field-padding-inline,var(--hui-space-4))] text-end" />
        </NumberFieldGroup>
      </NumberField>
    )
  }

  const label = (
    <span id={labelId} className={cn("min-w-0", labelText)}>
      {control.label}
    </span>
  )

  if (control.type === "segment") {
    return (
      <div className="flex min-w-0 items-center justify-between gap-[var(--hui-space-4)]">
        {label}
        <ToggleGroup
          size="sm"
          className={controlWidth}
          aria-labelledby={labelId}
          value={typeof value === "string" ? [value] : []}
          onValueChange={(next) => {
            // Pressing the active segment would clear it; one segment always stays chosen.
            const chosen = next[0]
            if (typeof chosen === "string") onChange(chosen)
          }}
        >
          {control.options.map((option) => (
            <Toggle key={option.value} value={option.value} className="min-w-0 flex-1">
              {option.label}
            </Toggle>
          ))}
        </ToggleGroup>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 items-center justify-between gap-[var(--hui-space-4)]">
      {label}
      <Select
        items={control.options}
        value={typeof value === "string" ? value : null}
        onValueChange={(next) => {
          if (typeof next === "string") onChange(next)
        }}
      >
        <SelectTrigger size="sm" aria-labelledby={labelId} className={controlWidth}>
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {control.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </div>
  )
}

export { FineTuneCard }
