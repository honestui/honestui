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

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

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
        "w-full min-w-0 rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-soft)]",
        smallText,
        className
      )}
      {...props}
    >
      <div className="flex min-h-[var(--hui-space-10)] items-center gap-[var(--hui-space-3)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] py-[var(--hui-space-2)] ps-[var(--hui-space-4)] pe-[var(--hui-space-2)]">
        <p id={titleId} className="m-0 min-w-0 flex-1 truncate [font-weight:var(--hui-font-weight-medium)]">
          {title}
        </p>
        <span role="status" className="shrink-0 text-[var(--hui-color-foreground-base-secondary)]">
          {isEdited ? labels.edited : ""}
        </span>
        {isEdited && (
          <Button variant="link" size="sm" onClick={() => update(defaultValues)}>
            {labels.reset}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-[var(--hui-space-4)] p-[var(--hui-space-4)]">
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
        <NumberFieldScrubArea label={control.label} />
        <NumberFieldGroup className="w-24">
          <NumberFieldInput />
        </NumberFieldGroup>
      </NumberField>
    )
  }

  const label = (
    <span id={labelId} className="shrink-0 text-[var(--hui-color-foreground-base-secondary)]">
      {control.label}
    </span>
  )

  if (control.type === "segment") {
    return (
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-[var(--hui-space-3)]">
        {label}
        <ToggleGroup
          size="sm"
          aria-labelledby={labelId}
          value={typeof value === "string" ? [value] : []}
          onValueChange={(next) => {
            // Pressing the active segment would clear it; one segment always stays chosen.
            const chosen = next[0]
            if (typeof chosen === "string") onChange(chosen)
          }}
        >
          {control.options.map((option) => (
            <Toggle key={option.value} value={option.value}>
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
        <SelectTrigger size="sm" aria-labelledby={labelId} className="w-36">
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
