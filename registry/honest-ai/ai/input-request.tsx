"use client"

import * as React from "react"
import {
  ArrowRight as ArrowRightIcon,
  CircleAlert as CircleAlertIcon,
  CircleCheck as CircleCheckIcon,
  Clock as ClockIcon,
  LoaderCircle as LoaderCircleIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import {
  ApprovalOptionRow,
  approvalBodyText,
  approvalCardFrame,
  approvalMetaText,
} from "@/registry/honest-ai/ai/approval-card"
import { Button } from "@/registry/default/ui/button"
import { Checkbox } from "@/registry/default/ui/checkbox"
import { Input } from "@/registry/default/ui/input"
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/registry/default/ui/select"
import { Switch } from "@/registry/default/ui/switch"
import { Textarea } from "@/registry/default/ui/textarea"

export type InputRequestOption = {
  value: string
  label: string
}

type FieldBase = {
  id: string
  label: string
  /** A line under the label that says what to enter. */
  help?: string
  /** A required field must have a value before the person can send. */
  required?: boolean
}

export type InputRequestField =
  | (FieldBase & {
      type: "text" | "textarea"
      placeholder?: string
      defaultValue?: string
      minLength?: number
      maxLength?: number
      /** A regular expression the whole value must match. */
      pattern?: string
      /** What to say when `pattern` does not match. */
      patternMessage?: string
    })
  | (FieldBase & {
      type: "number"
      placeholder?: string
      defaultValue?: number
      min?: number
      max?: number
      step?: number
      /** A unit shown after the field, such as "GB" or "days". */
      unit?: string
    })
  | (FieldBase & { type: "select"; options: InputRequestOption[]; placeholder?: string; defaultValue?: string })
  | (FieldBase & { type: "multiselect"; options: InputRequestOption[]; defaultValue?: string[] })
  | (FieldBase & { type: "date"; min?: string; max?: string; defaultValue?: string })
  | (FieldBase & { type: "boolean"; defaultValue?: boolean })

export type InputRequestValue = string | number | boolean | string[] | null

/** Every field's value, keyed by field `id`. Empty text and numbers are `null`. */
export type InputRequestValues = Record<string, InputRequestValue>

export type InputRequestStatus = "pending" | "submitted" | "skipped" | "cancelled" | "expired"

export type InputRequestLabels = {
  /** The line above the question, such as "Research agent needs your input". */
  eyebrow: (agent?: string) => string
  /** The same line once the request is finished, such as "Asked by Research agent". */
  eyebrowDone: (agent?: string) => string
  /** Formats numbers in the summary. */
  number: (value: number) => string
  next: string
  send: string
  sending: string
  skip: string
  cancelRun: string
  required: string
  optional: string
  yes: string
  no: string
  selectPlaceholder: string
  /** Shown in the summary for a field left empty. */
  empty: string
  submitted: string
  skipped: string
  cancelled: string
  expired: string
  error: string
  /** Shown above the fields when Send finds problems. */
  fixErrors: (count: number) => string
  errors: {
    required: string
    minLength: (min: number) => string
    maxLength: (max: number) => string
    pattern: string
    number: string
    min: (min: number) => string
    max: (max: number) => string
    date: string
  }
}

export const defaultInputRequestLabels: InputRequestLabels = {
  eyebrow: (agent) => (agent ? `${agent} needs your input` : "The agent needs your input"),
  eyebrowDone: (agent) => (agent ? `Asked by ${agent}` : "Asked by the agent"),
  number: (value) => new Intl.NumberFormat("en-US").format(value),
  next: "Next",
  send: "Send",
  sending: "Sending…",
  skip: "Skip",
  cancelRun: "Cancel run",
  required: "Required",
  optional: "Optional",
  yes: "Yes",
  no: "No",
  selectPlaceholder: "Choose…",
  empty: "Not given",
  submitted: "Sent. The run continues with these answers.",
  skipped: "Skipped. The run continues without this input.",
  cancelled: "Run cancelled.",
  expired: "This request expired before it was answered. The run did not continue.",
  error: "Your answers were not sent. They are still here, so you can send again.",
  fixErrors: (count) => (count === 1 ? "1 field needs attention." : `${count} fields need attention.`),
  errors: {
    required: "This field is required.",
    minLength: (min) => `Enter at least ${min} characters.`,
    maxLength: (max) => `Enter at most ${max} characters.`,
    pattern: "Enter a value in the expected format.",
    number: "Enter a number.",
    min: (min) => `Enter ${min} or more.`,
    max: (max) => `Enter ${max} or less.`,
    date: "Enter a valid date.",
  },
}

/** The values a form starts with: each field's `defaultValue`, or empty. */
export function getInitialInputValues(fields: InputRequestField[]): InputRequestValues {
  const values: InputRequestValues = {}
  for (const field of fields) {
    if (field.type === "multiselect") values[field.id] = field.defaultValue ?? []
    else if (field.type === "boolean") values[field.id] = field.defaultValue ?? false
    else values[field.id] = field.defaultValue ?? null
  }
  return values
}

function isEmpty(value: InputRequestValue | undefined) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  )
}

/**
 * Checks every field and returns a message for each one that fails, keyed by
 * field `id`. An empty object means the values can be sent.
 */
export function validateInputRequest(
  fields: InputRequestField[],
  values: InputRequestValues,
  messages: InputRequestLabels["errors"] = defaultInputRequestLabels.errors
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    const value = values[field.id]
    if (field.type === "boolean") continue
    if (isEmpty(value)) {
      if (field.required) errors[field.id] = messages.required
      continue
    }
    if (field.type === "text" || field.type === "textarea") {
      const text = String(value).trim()
      if (field.minLength !== undefined && text.length < field.minLength) errors[field.id] = messages.minLength(field.minLength)
      else if (field.maxLength !== undefined && text.length > field.maxLength) errors[field.id] = messages.maxLength(field.maxLength)
      else if (field.pattern && !new RegExp(`^(?:${field.pattern})$`).test(text))
        errors[field.id] = field.patternMessage ?? messages.pattern
    } else if (field.type === "number") {
      const number = typeof value === "number" ? value : Number(value)
      if (!Number.isFinite(number)) errors[field.id] = messages.number
      else if (field.min !== undefined && number < field.min) errors[field.id] = messages.min(field.min)
      else if (field.max !== undefined && number > field.max) errors[field.id] = messages.max(field.max)
    } else if (field.type === "date") {
      const text = String(value)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text))) errors[field.id] = messages.date
      else if (field.min && text < field.min) errors[field.id] = messages.date
      else if (field.max && text > field.max) errors[field.id] = messages.date
    }
  }
  return errors
}

/** Values ready to send: text trimmed, empty text and numbers as `null`. */
function normalizeValues(fields: InputRequestField[], values: InputRequestValues): InputRequestValues {
  const result: InputRequestValues = {}
  for (const field of fields) {
    const value = values[field.id]
    if (field.type === "text" || field.type === "textarea" || field.type === "date" || field.type === "select") {
      const text = typeof value === "string" ? value.trim() : ""
      result[field.id] = text === "" ? null : text
    } else if (field.type === "number") {
      result[field.id] = isEmpty(value) ? null : Number(value)
    } else if (field.type === "multiselect") {
      result[field.id] = Array.isArray(value) ? value : []
    } else {
      result[field.id] = Boolean(value)
    }
  }
  return result
}

function displayValue(field: InputRequestField, value: InputRequestValue | undefined, labels: InputRequestLabels) {
  if (field.type === "boolean") return value ? labels.yes : labels.no
  if (isEmpty(value)) return null
  if (field.type === "select") return field.options.find((option) => option.value === value)?.label ?? String(value)
  if (field.type === "multiselect" && Array.isArray(value))
    return value.map((item) => field.options.find((option) => option.value === item)?.label ?? item).join(", ")
  if (field.type === "number") {
    const text = typeof value === "number" ? labels.number(value) : String(value)
    return field.unit ? `${text} ${field.unit}` : text
  }
  return String(value)
}

export type InputRequestProps = Omit<React.ComponentProps<"div">, "children" | "onSubmit" | "title"> & {
  /** What the agent asks for, in its words. */
  title: string
  /** Why the agent needs it. */
  reason?: React.ReactNode
  /** What the agent does once it has the answers. */
  nextStep?: React.ReactNode
  /** The agent's name, used in the line above the question. */
  agent?: string
  fields: InputRequestField[]
  /**
   * Receives the values when the person presses Send. Return a promise to show
   * progress; if it rejects, the form keeps the values and offers Send again.
   */
  onSubmit: (values: InputRequestValues) => void | Promise<void>
  /** Lets the run continue without the input. Without it, no Skip is shown. */
  onSkip?: () => void
  /** Stops the run. Without it, no Cancel run is shown. */
  onCancelRun?: () => void
  /**
   * Shows a finished request. Use "submitted" with `submittedValues` to show
   * what was sent, such as when a conversation is reloaded.
   */
  status?: InputRequestStatus
  submittedValues?: InputRequestValues
  /** A line about the deadline, such as "The run waits until 3:40 PM." */
  deadline?: React.ReactNode
  labels?: Partial<InputRequestLabels>
}

/**
 * A form an agent shows when it pauses mid-run for structured input. It says
 * why the agent asks and what it will do next, checks the fields, and sends
 * nothing until the person presses Send.
 */
function InputRequest({
  title,
  reason,
  nextStep,
  agent,
  fields,
  onSubmit,
  onSkip,
  onCancelRun,
  status: statusProp,
  submittedValues,
  deadline,
  labels: labelsProp,
  className,
  ...props
}: InputRequestProps) {
  const labels = { ...defaultInputRequestLabels, ...labelsProp }
  const [values, setValues] = React.useState<InputRequestValues>(() => getInitialInputValues(fields))
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [phase, setPhase] = React.useState<"editing" | "submitting" | "error" | InputRequestStatus>("editing")
  const [sent, setSent] = React.useState<InputRequestValues | null>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const titleId = React.useId()
  const reasonId = React.useId()
  const baseId = React.useId()

  const status: InputRequestStatus | "editing" | "submitting" | "error" =
    statusProp && statusProp !== "pending" ? statusProp : phase
  const isSubmitting = status === "submitting"

  React.useEffect(() => {
    if (phase === "submitted" || phase === "skipped" || phase === "cancelled") rootRef.current?.focus()
  }, [phase])

  const fieldId = (id: string) => `${baseId}-${id}`

  const setValue = (id: string, value: InputRequestValue) => {
    setValues((current) => ({ ...current, [id]: value }))
    if (errors[id])
      setErrors((current) => {
        const next = { ...current }
        delete next[id]
        return next
      })
    if (phase === "error") setPhase("editing")
  }

  const submit = async () => {
    const found = validateInputRequest(fields, values, labels.errors)
    setErrors(found)
    const firstInvalid = fields.find((field) => found[field.id])
    if (firstInvalid) {
      const target = rootRef.current?.querySelector<HTMLElement>(`[data-field-id="${CSS.escape(firstInvalid.id)}"]`)
      target?.focus()
      return
    }
    const normalized = normalizeValues(fields, values)
    setPhase("submitting")
    try {
      await onSubmit(normalized)
      setSent(normalized)
      setPhase("submitted")
    } catch {
      setPhase("error")
    }
  }

  const isOpen = status === "editing" || status === "submitting" || status === "error"
  const header = (
    <div className="flex flex-col gap-[var(--hui-space-2)]">
      <p className={cn("m-0 flex items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]", approvalMetaText)}>
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            isOpen
              ? "bg-[var(--hui-color-foreground-attention-primary)] motion-safe:animate-pulse"
              : "bg-[color-mix(in_oklch,var(--hui-color-foreground-base-primary)_35%,transparent)]"
          )}
        />
        {isOpen ? labels.eyebrow(agent) : labels.eyebrowDone(agent)}
      </p>
      <p
        id={titleId}
        className="m-0 break-words text-[var(--hui-color-foreground-base-primary)] [font-size:15px] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:-0.01em] [line-height:22px]"
      >
        {title}
      </p>
      {reason && (
        <div id={reasonId} className="m-0 break-words text-[var(--hui-color-foreground-base-secondary)]">
          {reason}
        </div>
      )}
    </div>
  )

  // A finished request: what was sent, or what happened instead.
  if (status === "submitted" || status === "skipped" || status === "cancelled" || status === "expired") {
    const shown = status === "submitted" ? (sent ?? submittedValues) : null
    const Icon = status === "submitted" ? CircleCheckIcon : status === "expired" ? ClockIcon : CircleAlertIcon
    const message =
      status === "submitted"
        ? labels.submitted
        : status === "skipped"
          ? labels.skipped
          : status === "cancelled"
            ? labels.cancelled
            : labels.expired
    return (
      <div
        ref={rootRef}
        tabIndex={-1}
        role="group"
        aria-labelledby={titleId}
        data-slot="input-request"
        data-status={status}
        className={cn(approvalCardFrame, approvalBodyText, className)}
        {...props}
      >
        <div className="flex flex-col gap-[var(--hui-space-4)] p-[var(--hui-space-5)]">
          {header}
          {shown && (
            <dl
              data-slot="input-request-summary"
              className="m-0 grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-2)] rounded-[var(--hui-radius-3)] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-4)]"
            >
              {fields.map((field) => {
                const text = displayValue(field, shown[field.id], labels)
                return (
                  <React.Fragment key={field.id}>
                    <dt className="min-w-0 break-words text-[var(--hui-color-foreground-base-secondary)]">{field.label}</dt>
                    <dd
                      className={cn(
                        "m-0 min-w-0 whitespace-pre-wrap break-words tabular-nums",
                        text === null && "text-[var(--hui-color-foreground-base-secondary)]"
                      )}
                    >
                      {text ?? labels.empty}
                    </dd>
                  </React.Fragment>
                )
              })}
            </dl>
          )}
        </div>
        <p
          role="status"
          className={cn(
            "m-0 flex items-center gap-[var(--hui-space-3)] border-t-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-secondary)]",
            approvalMetaText
          )}
        >
          <Icon
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
            className={cn("size-4 shrink-0", status === "submitted" && "text-[var(--hui-color-foreground-success-primary)]")}
          />
          {message}
        </p>
      </div>
    )
  }

  const errorCount = Object.keys(errors).length

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={reason ? reasonId : undefined}
      data-slot="input-request"
      data-status={status}
      className={cn(approvalCardFrame, approvalBodyText, className)}
      {...props}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (!isSubmitting) void submit()
        }}
      >
        <div className="flex flex-col gap-[var(--hui-space-5)] p-[var(--hui-space-5)]">
          {header}

          {errorCount > 0 && (
            <p role="alert" className={cn("m-0 flex items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-danger-primary)]", approvalMetaText)}>
              <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" className="size-3.5 shrink-0" />
              {labels.fixErrors(errorCount)}
            </p>
          )}

          <div data-slot="input-request-fields" className="flex flex-col gap-[var(--hui-space-5)]">
            {fields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                id={fieldId(field.id)}
                value={values[field.id]}
                error={errors[field.id]}
                disabled={isSubmitting}
                labels={labels}
                onChange={(value) => setValue(field.id, value)}
              />
            ))}
          </div>

          {nextStep && (
            <div
              data-slot="input-request-next"
              className={cn(
                "flex items-start gap-[var(--hui-space-3)] rounded-[var(--hui-radius-3)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]",
                approvalMetaText
              )}
            >
              <ArrowRightIcon
                strokeWidth={1.5}
                aria-hidden="true"
                className="mt-[2px] size-3.5 shrink-0 text-[var(--hui-color-foreground-base-secondary)]"
              />
              <p className="m-0 min-w-0 break-words">
                <span className="[font-weight:var(--hui-font-weight-medium)]">{labels.next}: </span>
                <span className="text-[var(--hui-color-foreground-base-secondary)]">{nextStep}</span>
              </p>
            </div>
          )}

          {status === "error" && (
            <p role="alert" className="m-0 flex items-start gap-[var(--hui-space-3)]">
              <CircleAlertIcon
                strokeWidth={1.5}
                strokeLinecap="round"
                aria-hidden="true"
                className="mt-[var(--hui-space-1)] size-4 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
              />
              <span className="min-w-0 break-words">{labels.error}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-[var(--hui-space-3)] border-t-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)]">
          {deadline && (
            <p
              className={cn(
                "m-0 me-auto flex min-w-0 items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]",
                approvalMetaText
              )}
            >
              <ClockIcon strokeWidth={1.5} aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="min-w-0 tabular-nums">{deadline}</span>
            </p>
          )}
          {onCancelRun && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => {
                setPhase("cancelled")
                onCancelRun()
              }}
            >
              {labels.cancelRun}
            </Button>
          )}
          {onSkip && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isSubmitting}
              onClick={() => {
                setPhase("skipped")
                onSkip()
              }}
            >
              {labels.skip}
            </Button>
          )}
          {/* aria-disabled while sending, so the pressed button keeps focus. */}
          <Button
            type="submit"
            size="sm"
            aria-disabled={isSubmitting || undefined}
            className="aria-disabled:cursor-progress"
          >
            {isSubmitting && <LoaderCircleIcon aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />}
            {isSubmitting ? labels.sending : labels.send}
          </Button>
        </div>
      </form>
    </div>
  )
}

function FieldRow({
  field,
  id,
  value,
  error,
  disabled,
  labels,
  onChange,
}: {
  field: InputRequestField
  id: string
  value: InputRequestValue | undefined
  error?: string
  disabled: boolean
  labels: InputRequestLabels
  onChange: (value: InputRequestValue) => void
}) {
  const labelId = `${id}-label`
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const describedBy = [field.help ? helpId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined
  const invalid = error ? true : undefined
  const common = {
    "data-field-id": field.id,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    "aria-required": field.required || undefined,
  } as const

  const label = (
    <div className="flex items-baseline justify-between gap-[var(--hui-space-3)]">
      <label
        id={labelId}
        htmlFor={field.type === "multiselect" || field.type === "select" ? undefined : id}
        className="min-w-0 break-words [font-weight:var(--hui-font-weight-medium)]"
      >
        {field.label}
      </label>
      <span className={cn("shrink-0 text-[var(--hui-color-foreground-base-secondary)]", approvalMetaText)}>
        {field.required ? labels.required : field.type === "boolean" ? null : labels.optional}
      </span>
    </div>
  )

  const help = field.help && (
    <p id={helpId} className={cn("m-0 break-words text-[var(--hui-color-foreground-base-secondary)]", approvalMetaText)}>
      {field.help}
    </p>
  )
  const errorLine = error && (
    <p
      id={errorId}
      className={cn("m-0 flex items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-danger-primary)]", approvalMetaText)}
    >
      <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" className="size-3.5 shrink-0" />
      {error}
    </p>
  )

  if (field.type === "boolean") {
    return (
      <div data-slot="input-request-field" data-type={field.type} className="flex flex-col gap-[var(--hui-space-2)]">
        <div className="flex items-center justify-between gap-[var(--hui-space-4)]">
          <div className="flex min-w-0 flex-col gap-[var(--hui-space-1)]">
            <label id={labelId} htmlFor={id} className="min-w-0 break-words [font-weight:var(--hui-font-weight-medium)]">
              {field.label}
            </label>
            {help}
          </div>
          <Switch
            id={id}
            {...common}
            aria-labelledby={labelId}
            disabled={disabled}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(Boolean(checked))}
          />
        </div>
        {errorLine}
      </div>
    )
  }

  let control: React.ReactNode
  if (field.type === "textarea") {
    control = (
      <Textarea
        id={id}
        {...common}
        rows={3}
        disabled={disabled}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className="resize-y"
      />
    )
  } else if (field.type === "text") {
    control = (
      <Input
        id={id}
        {...common}
        disabled={disabled}
        placeholder={field.placeholder}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  } else if (field.type === "number") {
    control = (
      <div className="flex items-center gap-[var(--hui-space-3)]">
        <Input
          id={id}
          {...common}
          type="number"
          inputMode="decimal"
          disabled={disabled}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(event) => onChange(event.target.value === "" ? null : event.target.value)}
          className="max-w-40 tabular-nums"
        />
        {field.unit && <span className="text-[var(--hui-color-foreground-base-secondary)]">{field.unit}</span>}
      </div>
    )
  } else if (field.type === "date") {
    control = (
      <Input
        id={id}
        {...common}
        type="date"
        disabled={disabled}
        min={field.min}
        max={field.max}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value === "" ? null : event.target.value)}
        className="max-w-48 tabular-nums"
      />
    )
  } else if (field.type === "select") {
    control = (
      <Select
        value={typeof value === "string" ? value : null}
        onValueChange={(next) => onChange(next === null || next === undefined ? null : String(next))}
        disabled={disabled}
      >
        <SelectTrigger id={id} {...common} aria-labelledby={labelId} className="w-full">
          {/* The placeholder is real text, not an attribute, so it takes the secondary color to stay readable. */}
          <SelectValue
            placeholder={field.placeholder ?? labels.selectPlaceholder}
            className="data-placeholder:text-[var(--hui-color-foreground-base-secondary)]"
          />
        </SelectTrigger>
        <SelectPopup>
          {field.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    )
  } else if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value : []
    control = (
      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        className="flex flex-col gap-[var(--hui-space-1)] ps-[var(--hui-space-3)] pe-[var(--hui-space-3)]"
      >
        {field.options.map((option, index) => (
          <ApprovalOptionRow key={option.value} label={option.label}>
            {(optionLabelId) => (
              <Checkbox
                aria-labelledby={optionLabelId}
                data-field-id={index === 0 ? field.id : undefined}
                disabled={disabled}
                checked={selected.includes(option.value)}
                onCheckedChange={(checked) =>
                  onChange(
                    checked
                      ? [...selected, option.value]
                      : selected.filter((item) => item !== option.value)
                  )
                }
              />
            )}
          </ApprovalOptionRow>
        ))}
      </div>
    )
  }

  return (
    <div data-slot="input-request-field" data-type={field.type} className="flex flex-col gap-[var(--hui-space-2)]">
      {label}
      {help}
      {control}
      {errorLine}
    </div>
  )
}

export { InputRequest }
