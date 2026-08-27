"use client"

import * as React from "react"

import { LoaderCircle as LoaderCircleIcon } from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Checkbox } from "@/registry/default/ui/checkbox"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/registry/default/ui/empty"
import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"
import {
  NumberField,
  NumberFieldInput,
} from "@/registry/default/ui/number-field"
import { Radio, RadioGroup } from "@/registry/default/ui/radio-group"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import { Skeleton } from "@/registry/default/ui/skeleton"
import { Switch } from "@/registry/default/ui/switch"

import {
  DateRangePicker,
  getDateRangePresets,
} from "../date-range-picker/date-range-picker"
// Type-only import through the sibling component's barrel keeps the served
// registry dependency list limited to whole components.
import type { DateRange } from "../date-range-picker/date-range-picker"

import { useFilterBarContext } from "./filter-bar-context"
import type {
  FilterDefinition,
  FilterOption,
  FilterValue,
} from "./filter-bar-types"
import {
  getOperatorsFor,
  isSameDay,
  OPERATOR_LABELS,
  resolveDefaultOperator,
  resolveFilterOptionValue,
} from "./filter-bar-utils"

function optionKey(option: FilterOption) {
  return String(option.value)
}

interface FilterFieldScopeValue {
  scopeId: string
}

const FilterFieldScope = React.createContext<FilterFieldScopeValue | null>(null)

/**
 * Wraps every filter control with its group label. Choice groups reference
 * the label through aria-labelledby; form widgets receive an explicit id.
 */
export function FilterField({
  definition,
  children,
  hideLabel = false,
}: {
  definition: FilterDefinition
  children: React.ReactNode
  /** For controls whose own row carries the visible label. */
  hideLabel?: boolean
}) {
  const scopeId = React.useId()
  const { disabled } = useFilterBarContext("FilterField")

  return (
    <div
      data-slot="filter-bar-field"
      data-disabled={definition.disabled || disabled || undefined}
      className="flex w-full min-w-0 flex-col gap-(--hui-space-2)"
    >
      <span
        id={`${scopeId}-label`}
        data-slot="filter-bar-field-label"
        className={cn(
          "[font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]",
          hideLabel && "sr-only"
        )}
      >
        {definition.label}
      </span>
      <FilterFieldScope.Provider value={{ scopeId }}>
        {children}
      </FilterFieldScope.Provider>
    </div>
  )
}

/** Returns ids that connect controls back to their field label. */
export function useFilterFieldIds() {
  const scope = React.useContext(FilterFieldScope)

  if (!scope) {
    throw new Error(
      "Filter field controls must be rendered inside FilterField"
    )
  }

  return {
    label: `${scope.scopeId}-label`,
    control: `${scope.scopeId}-control`,
    description: `${scope.scopeId}-description`,
  }
}

function DisabledReasonNotice({ definition }: { definition: FilterDefinition }) {
  const { description } = useFilterFieldIds()

  if (!definition.disabledReason) return null

  return (
    <p
      id={description}
      data-slot="filter-bar-field-disabled-reason"
      className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [line-height:var(--hui-line-height-mini)]"
    >
      {definition.disabledReason}
    </p>
  )
}

/** Renders the built-in control matching one definition's type. */
export function renderFilterControl(
  definition: FilterDefinition,
  entry?: FilterValue
) {
  switch (definition.type) {
    case "text":
      return <FilterText definition={definition} entry={entry} />
    case "select":
      return <FilterSelect definition={definition} entry={entry} />
    case "multi-select":
      return <FilterMultiSelect definition={definition} entry={entry} />
    case "number":
      return <FilterNumber definition={definition} entry={entry} />
    case "date":
      return <FilterDate definition={definition} entry={entry} />
    case "date-range":
      return <FilterDateRange definition={definition} entry={entry} />
    case "boolean":
      return <FilterBoolean definition={definition} entry={entry} />
    case "custom":
      return <FilterCustom definition={definition} entry={entry} />
    default:
      return null
  }
}

/* ------------------------------------------------------------------ */
/* Operators                                                           */
/* ------------------------------------------------------------------ */

const OPERATOR_ARIA_SUFFIX = " rule"

function OperatorChoice({
  definition,
  current,
  onSelect,
}: {
  definition: FilterDefinition
  current: string | undefined
  onSelect: (operator: string) => void
}) {
  const { disabled } = useFilterBarContext("OperatorChoice")
  const operators = getOperatorsFor(definition)
  const resolved = current ?? resolveDefaultOperator(definition)

  // A rule picker adds nothing until one value can mean several things.
  if (operators.length <= 1) return null

  return (
    <Select
      value={resolved}
      disabled={disabled || definition.disabled}
      onValueChange={(next) => {
        if (next != null) onSelect(next)
      }}
    >
      <SelectTrigger
        size="small"
        aria-label={`${definition.label}${OPERATOR_ARIA_SUFFIX}`}
      />
      <SelectContent>
        {operators.map((operator) => (
          <SelectItem key={operator} value={operator}>
            {OPERATOR_LABELS[operator] ?? operator}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/* ------------------------------------------------------------------ */
/* Text                                                                */
/* ------------------------------------------------------------------ */

function FilterText({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  return (
    <FilterField definition={definition} hideLabel>
      <FilterTextControl definition={definition} entry={entry} />
    </FilterField>
  )
}

function FilterTextControl({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  const { setEntry, removeEditing, disabled } =
    useFilterBarContext("FilterText")
  const { control, label, description } = useFilterFieldIds()
  const operator = entry?.operator ?? resolveDefaultOperator(definition)
  const hidesInput = operator === "is-empty" || operator === "is-not-empty"
  const value = typeof entry?.value === "string" ? entry.value : ""

  return (
    <>
      <OperatorChoice
        definition={definition}
        current={entry?.operator}
        onSelect={(next) =>
          setEntry(definition.key, hidesInput ? undefined : value, next)
        }
      />
      {hidesInput ? (
        // "Is empty" alone states the whole filter; keep the box away.
        <ControlEmptySlot />
      ) : (
        <Input
          id={control}
          aria-labelledby={label}
          aria-describedby={
            definition.disabledReason ? description : undefined
          }
          type="text"
          value={value}
          placeholder={
            definition.meta?.placeholder ??
            definition.placeholder ??
            "Search value..."
          }
          onChange={(event) =>
            event.target.value.trim() === ""
              ? removeEditing(definition.key)
              : setEntry(definition.key, event.target.value)
          }
          disabled={disabled || definition.disabled}
        />
      )}
      <DisabledReasonNotice definition={definition} />
    </>
  )
}

function ControlEmptySlot() {
  return <div className="min-h-(--hui-space-7)" aria-hidden="true" />
}

/* ------------------------------------------------------------------ */
/* Single choice                                                       */
/* ------------------------------------------------------------------ */

function FilterSelect({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  return (
    <FilterField definition={definition} hideLabel>
      <FilterSelectControl definition={definition} entry={entry} />
    </FilterField>
  )
}

function FilterSelectControl({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  const { setEntry, removeEditing, disabled } =
    useFilterBarContext("FilterSelect")
  const { description } = useFilterFieldIds()
  const hasSelection = entry?.value != null && entry.value !== ""
  const selected = hasSelection ? String(entry?.value) : null

  return (
    <>
      <OperatorChoice
        definition={definition}
        current={entry?.operator}
        onSelect={(next) =>
          setEntry(definition.key, hasSelection ? entry?.value : undefined, next)
        }
      />
      <Select
        value={selected}
        disabled={disabled || definition.disabled}
        onValueChange={(value) => {
          if (value == null) {
            removeEditing(definition.key)
            return
          }

          setEntry(definition.key, resolveFilterOptionValue(definition, value))
        }}
      >
        <SelectTrigger
          size="small"
          aria-label={definition.label}
          aria-describedby={
            definition.disabledReason ? description : undefined
          }
        >
          <SelectValue placeholder={`Any ${definition.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {(definition.options ?? []).map((option) => (
            <SelectItem
              key={optionKey(option)}
              value={optionKey(option)}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DisabledReasonNotice definition={definition} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Multi choice                                                        */
/* ------------------------------------------------------------------ */

interface AsyncListSnapshot {
  options: FilterOption[]
  query: string
  status: "idle" | "loading" | "error"
}

const ASYNC_REQUEST_DEBOUNCE_MS = 250

/**
 * Checkbox list behind multi-select filters. Search runs locally until a
 * loader exists, selected values survive filtering, and failures never wipe
 * what the user already sees.
 */
function MultiChoiceList({
  definition,
  selectedValues,
  onToggle,
}: {
  definition: FilterDefinition
  selectedValues: Set<string>
  onToggle: (option: FilterOption, checked: boolean) => void
}) {
  const { labels, searchThreshold, showOptionCounts, disabled } =
    useFilterBarContext("FilterMultiSelect")
  const { label, description } = useFilterFieldIds()
  const isDisabled = disabled || Boolean(definition.disabled)
  const EMPTY_OPTIONS: FilterOption[] = []
  const staticOptions = definition.options ?? EMPTY_OPTIONS
  const loadOptions = definition.loadOptions

  const searchesLocally =
    definition.searchable ??
    (!loadOptions && staticOptions.length > Math.max(searchThreshold, 0))

  const [query, setQuery] = React.useState("")
  const [retryToken, setRetryToken] = React.useState(0)
  const requestCounter = React.useRef(0)
  const debounceTimerRef = React.useRef<number | undefined>(undefined)
  const [snapshot, setSnapshot] = React.useState<AsyncListSnapshot>({
    options: [],
    query: "",
    status: "idle",
  })

  React.useEffect(() => {
    if (!loadOptions) return

    // Requests cancel by comparing nonces; aborting fetches the app owns
    // stays out of scope here.
    const nonce = ++requestCounter.current

    debounceTimerRef.current = window.setTimeout(() => {
      setSnapshot((current) => ({ ...current, status: "loading" }))
      loadOptions(query)
        .then((options) => {
          if (requestCounter.current !== nonce) return
          setSnapshot({ options, query, status: "idle" })
        })
        .catch(() => {
          if (requestCounter.current !== nonce) return
          // Previous results stay on screen; only status changes.
          setSnapshot((current) => ({ ...current, status: "error" }))
        })
    }, ASYNC_REQUEST_DEBOUNCE_MS)

    return () => window.clearTimeout(debounceTimerRef.current)
  }, [query, retryToken, loadOptions])

  const baseOptions = loadOptions ? snapshot.options : staticOptions

  const matched = React.useMemo(() => {
    if (loadOptions) {
      return baseOptions
    }

    const needle = query.trim().toLowerCase()

    if (!searchesLocally || !needle) return baseOptions

    return baseOptions.filter((option) =>
      option.label.toLowerCase().includes(needle)
    )
  }, [baseOptions, query, searchesLocally, loadOptions])

  // Selected values filtered out of view stay listed so users find them.
  const visible = React.useMemo(() => {
    const matchedKeys = new Set(matched.map(optionKey))
    const missingSelected = [...selectedValues]
      .filter((key) => !matchedKeys.has(key))
      .map((key) =>
        [...staticOptions, ...matched].find(
          (option) => optionKey(option) === key
        )
      )
      .filter((option): option is FilterOption => option != null)

    return [...missingSelected, ...matched]
  }, [matched, selectedValues, staticOptions])

  const isLoading = Boolean(loadOptions) && snapshot.status === "loading"
  const isError = Boolean(loadOptions) && snapshot.status === "error"
  const emptyResult =
    !isLoading && (searchesLocally || loadOptions) && visible.length === 0
  const scrollable = visible.length > 6

  return (
    <div
      className="flex min-w-0 flex-col gap-(--hui-space-2)"
      data-slot="filter-bar-option-list-root"
    >
      {searchesLocally || loadOptions ? (
        <Input
          type="search"
          value={query}
          placeholder={
            definition.placeholder ?? `Search ${definition.label.toLowerCase()}...`
          }
          aria-label={`Search ${definition.label}`}
          aria-describedby={
            definition.disabledReason ? description : undefined
          }
          onChange={(event) => setQuery(event.target.value)}
          disabled={isDisabled}
        />
      ) : null}

      <ScrollArea
        className={cn(
          scrollable && "max-h-[calc(var(--hui-space-9)*4)]"
        )}
      >
        <ul
          className="flex w-full flex-col gap-px pb-1"
          aria-labelledby={label}
          aria-describedby={
            definition.disabledReason ? description : undefined
          }
          aria-busy={isLoading || undefined}
          data-slot="filter-bar-option-list"
        >
          {visible.map((option) => {
            const checked = selectedValues.has(optionKey(option))

            return (
              <li key={optionKey(option)}>
                <Label
                  className="flex! min-h-(--hui-space-8) cursor-pointer items-center justify-between gap-(--hui-space-2) rounded-[var(--hui-radius-2)] px-(--hui-space-2) py-(--hui-space-2) text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] hover:bg-[var(--hui-color-background-base-primary-hover)] data-checked:bg-[var(--hui-color-background-neutral-secondary)] data-disabled:cursor-not-allowed data-disabled:opacity-50"
                  data-slot="filter-bar-option-row"
                  data-checked={checked || undefined}
                  data-disabled={
                    option.disabled || isDisabled || undefined
                  }
                >
                  <span className="flex min-w-0 items-center gap-(--hui-space-3)">
                    <Checkbox
                      aria-label={option.label}
                      checked={checked}
                      disabled={option.disabled || isDisabled}
                      onCheckedChange={(checked) =>
                        onToggle(option, checked === true)
                      }
                    />
                    <span className="truncate">{option.label}</span>
                  </span>
                  {showOptionCounts && option.count != null ? (
                    <span
                      className="shrink-0 tabular-nums text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-mini)]"
                      data-slot="filter-bar-option-count"
                    >
                      {option.count.toLocaleString()}
                    </span>
                  ) : null}
                </Label>
              </li>
            )
          })}

          {isLoading && snapshot.options.length === 0
            ? [
                { width: "100%", key: "row-1" },
                { width: "72%", key: "row-2" },
                { width: "46%", key: "row-3" },
              ].map((row) => (
                <li
                  key={row.key}
                  aria-hidden="true"
                  className="py-[calc(var(--hui-space-1)+2px)]"
                >
                  <Skeleton className="h-5" style={{ width: row.width }} />
                </li>
              ))
            : null}
        </ul>

        {isLoading && snapshot.options.length > 0 ? (
          <p
            role="status"
            className="mt-1 flex items-center gap-(--hui-space-2) text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-micro)]"
          >
            <LoaderCircleIcon aria-hidden className="size-3 animate-spin" />
            {labels.loadingOptions}
          </p>
        ) : null}
      </ScrollArea>

      {isError ? (
        <p className="flex flex-col gap-(--hui-space-1)">
          <span className="text-[var(--hui-color-foreground-danger-primary)] [font-size:var(--hui-font-size-micro)]">
            {labels.optionsError}
          </span>
          <Button
            variant="link"
            size="sm"
            disabled={isDisabled}
            onClick={() => setRetryToken((token) => token + 1)}
          >
            {labels.retryOptions}
          </Button>
        </p>
      ) : null}

      {emptyResult ? (
        <Empty className="border-0 bg-transparent py-(--hui-space-3)">
          <EmptyHeader>
            <EmptyTitle>No matches</EmptyTitle>
            <EmptyDescription>{labels.noMatches(query)}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      <DisabledReasonNotice definition={definition} />
    </div>
  )
}

function FilterMultiSelect({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  const { setEntry } = useFilterBarContext("FilterMultiSelect")

  const selectedEntries = Array.isArray(entry?.value) ? entry.value : []
  const selectedValues = new Set(selectedEntries.map(String))

  function toggleOption(option: FilterOption, checked: boolean) {
    const nextValues = new Map(
      selectedEntries.map((selected) => [String(selected), selected])
    )

    if (checked) {
      nextValues.set(optionKey(option), option.value)
    } else {
      nextValues.delete(optionKey(option))
    }

    setEntry(definition.key, [...nextValues.values()], "is")
  }

  return (
    <FilterField definition={definition} hideLabel>
      <MultiChoiceList
        definition={definition}
        selectedValues={selectedValues}
        onToggle={toggleOption}
      />
    </FilterField>
  )
}

/* ------------------------------------------------------------------ */
/* Number                                                              */
/* ------------------------------------------------------------------ */

function finiteNumber(input: unknown): number | undefined {
  return typeof input === "number" && Number.isFinite(input) ? input : undefined
}

function AmountInput({
  definition,
  idSuffix,
  amount,
  onAmountChange,
}: {
  definition: FilterDefinition
  idSuffix: string
  amount: number | undefined
  onAmountChange: (amount: number | undefined) => void
}) {
  const { control, description } = useFilterFieldIds()
  const { disabled } = useFilterBarContext("AmountInput")
  const { prefix, suffix, min, max, step, maximumFractionDigits } =
    definition.meta ?? {}

  return (
    <NumberField
      id={`${control}-${idSuffix}`}
      value={amount ?? null}
      min={min}
      max={max}
      step={step}
      format={{
        maximumFractionDigits: maximumFractionDigits ?? 2,
      }}
      onValueChange={(next) => onAmountChange(finiteNumber(next))}
      disabled={disabled || definition.disabled}
      className="w-full min-w-0"
    >
      <div className="flex h-(--hui-space-10) w-full min-w-0 items-center overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-tertiary)] bg-[var(--hui-color-background-base-primary)] focus-within:border-[var(--hui-color-border-accent-emphasis)]">
        {prefix ? (
          <span
            aria-hidden="true"
            className="pl-(--hui-space-2) text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]"
          >
            {prefix}
          </span>
        ) : null}
        <NumberFieldInput
          aria-label={
            idSuffix === "from"
              ? `${definition.label} minimum`
              : idSuffix === "to"
                ? `${definition.label} maximum`
                : definition.label
          }
          aria-describedby={
            definition.disabledReason ? description : undefined
          }
          className="h-full min-w-0 rounded-none border-0 bg-transparent px-(--hui-space-2)"
        />
        {suffix ? (
          <span
            aria-hidden="true"
            className="pr-(--hui-space-2) text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]"
          >
            {suffix}
          </span>
        ) : null}
      </div>
    </NumberField>
  )
}

function FilterNumber({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  const { setEntry } = useFilterBarContext("FilterNumber")
  const operator = entry?.operator ?? resolveDefaultOperator(definition)
  const between = operator === "between"
  const hidesInput = operator === "is-empty" || operator === "is-not-empty"
  const range =
    between && typeof entry?.value === "object" && entry.value != null
      ? (entry.value as { min?: number; max?: number })
      : {}

  function writeRange(part: "min" | "max", amount: number | undefined) {
    const merged = { ...range, [part]: amount }

    if (merged.min == null && merged.max == null) {
      setEntry(definition.key, null)
      return
    }

    setEntry(definition.key, merged, "between")
  }

  return (
    <FilterField definition={definition} hideLabel>
      <OperatorChoice
        definition={definition}
        current={entry?.operator}
        onSelect={(next) =>
          setEntry(definition.key, entry?.value ?? undefined, next)
        }
      />
      {between ? (
        <div className="flex w-full min-w-0 items-center gap-(--hui-space-2)">
          <AmountInput
            definition={definition}
            idSuffix="from"
            amount={finiteNumber(range.min)}
            onAmountChange={(amount) => writeRange("min", amount)}
          />
          <span
            aria-hidden="true"
            className="shrink-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-micro)]"
          >
            to
          </span>
          <AmountInput
            definition={definition}
            idSuffix="to"
            amount={finiteNumber(range.max)}
            onAmountChange={(amount) => writeRange("max", amount)}
          />
        </div>
      ) : hidesInput ? (
        <ControlEmptySlot />
      ) : (
        <AmountInput
          definition={definition}
          idSuffix="amount"
          amount={finiteNumber(entry?.value)}
          onAmountChange={(amount) =>
            setEntry(definition.key, amount ?? null)
          }
        />
      )}
      <DisabledReasonNotice definition={definition} />
    </FilterField>
  )
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

function toDateInputString(date: unknown): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return ""

  const year = String(date.getFullYear()).padStart(4, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${year}-${month}-${String(date.getDate()).padStart(2, "0")}`
}

function fromDateInputString(input: string): Date | undefined {
  if (!input) return undefined

  const [year, month, day] = input.split("-").map(Number)

  if (!year || !month || !day) return undefined

  return new Date(year, month - 1, day)
}

function FilterDate({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  return (
    <FilterField definition={definition} hideLabel>
      <FilterDateControl definition={definition} entry={entry} />
    </FilterField>
  )
}

function FilterDateControl({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  const { setEntry, disabled } = useFilterBarContext("FilterDate")
  const { control, label, description } = useFilterFieldIds()
  const operator = entry?.operator ?? resolveDefaultOperator(definition)
  const presets = definition.meta?.datePresets
  const pickedDay = entry?.value instanceof Date ? entry.value : undefined
  const activePresetLabel =
    pickedDay != null && presets
      ? presets.find((preset) => {
          const resolved = preset.value()

          if (resolved.to != null) {
            // Range presets belong to FilterDateRange.
            return false
          }

          return resolved.from != null && isSameDay(resolved.from, pickedDay)
        })?.label ?? ""
      : ""

  return (
    <>
      <OperatorChoice
        definition={definition}
        current={entry?.operator}
        onSelect={(next) =>
          setEntry(definition.key, pickedDay ?? undefined, next)
        }
      />
      {presets && presets.length > 0 ? (
        <RadioGroup
          aria-labelledby={label}
          aria-describedby={
            definition.disabledReason ? description : undefined
          }
          disabled={disabled || definition.disabled}
          value={activePresetLabel}
          onValueChange={(next) => {
            const preset = presets.find((candidate) => candidate.label === next)

            if (!preset) {
              setEntry(definition.key, null)
              return
            }

            const resolved = preset.value()

            if (resolved.from) {
              setEntry(definition.key, resolved.from)
            }
          }}
          className="gap-y-0.5"
        >
          {presets.map((preset) => (
            <Label
              key={preset.label}
              className="-mx-(--hui-space-2) rounded-[var(--hui-radius-2)] px-(--hui-space-2) py-(--hui-space-1) hover:bg-[var(--hui-color-background-base-primary-hover)]"
            >
              <Radio
                value={preset.label}
                disabled={disabled || definition.disabled}
              />
              {preset.label}
            </Label>
          ))}
        </RadioGroup>
      ) : null}
      <Input
        id={control}
        type="date"
        value={toDateInputString(pickedDay)}
        onChange={(event) => {
          const date = fromDateInputString(event.target.value)

          setEntry(definition.key, date ?? null)
        }}
        disabled={disabled || definition.disabled}
        aria-describedby={
          definition.disabledReason ? description : undefined
        }
        aria-label={
          presets && presets.length > 0
            ? `${definition.label}, exact date`
            : `${definition.label} ${operator.replace(/-/g, " ")}`
        }
      />
      <DisabledReasonNotice definition={definition} />
    </>
  )
}

type PickerPresets = NonNullable<
  React.ComponentProps<typeof DateRangePicker>["presets"]
>



function adaptDateRangePresets(
  presets: NonNullable<FilterDefinition["meta"]>["datePresets"]
): PickerPresets {
  if (!presets) {
    return getDateRangePresets() as unknown as PickerPresets
  }

  const source = presets

  return source.map((preset) => ({
    label: preset.label,
    getValue: () => {
      const resolved = preset.value()

      return {
        from: resolved.from instanceof Date ? resolved.from : undefined,
        to: resolved.to instanceof Date ? resolved.to : undefined,
      } as DateRange
    },
  }))
}

function FilterDateRange({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  return (
    <FilterField definition={definition} hideLabel>
      <FilterDateRangeControl definition={definition} entry={entry} />
    </FilterField>
  )
}

function FilterDateRangeControl({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  const { setEntry, removeEditing, disabled } =
    useFilterBarContext("FilterDateRange")
  const { description } = useFilterFieldIds()
  const raw = (entry?.value ?? {}) as { from?: Date; to?: Date }
  const value: DateRange = {
    from: raw.from instanceof Date ? raw.from : undefined,
    to: raw.to instanceof Date ? raw.to : undefined,
  }
  const complete = value.from != null && value.to != null
  const pickerPresets = React.useMemo(
    () => adaptDateRangePresets(definition.meta?.datePresets),
    [definition.meta?.datePresets]
  )

  return (
    <>
      <DateRangePicker
        value={complete ? value : undefined}
        onValueChange={(next) => {
          if (next?.from && next.to) {
            setEntry(definition.key, { from: next.from, to: next.to })
            return
          }

          removeEditing(definition.key)
        }}
        presets={pickerPresets}
        confirmMode
        numberOfMonths={1}
        clearable={false}
        disabled={disabled || definition.disabled}
        aria-label={definition.label}
        aria-describedby={
          definition.disabledReason ? description : undefined
        }
      />
      <DisabledReasonNotice definition={definition} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Boolean                                                             */
/* ------------------------------------------------------------------ */

const BOOLEAN_CHOICES = [
  { label: "Any", stored: "any" },
  { label: "Yes", stored: "yes" },
  { label: "No", stored: "no" },
] as const

function BooleanRadioChoice({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  const { setEntry, removeEditing, disabled } =
    useFilterBarContext("FilterBoolean")
  const { label, description } = useFilterFieldIds()

  return (
    <RadioGroup
      aria-labelledby={label}
      aria-describedby={
        definition.disabledReason ? description : undefined
      }
      disabled={disabled || definition.disabled}
      value={
        entry?.value === true ? "yes" : entry?.value === false ? "no" : "any"
      }
      onValueChange={(next) => {
        if (next === "any") {
          removeEditing(definition.key)
          return
        }

        setEntry(definition.key, next === "yes")
      }}
      className="gap-y-0.5"
    >
      {BOOLEAN_CHOICES.map((choice) => (
        <Label
          key={choice.stored}
          className="-mx-(--hui-space-2) rounded-[var(--hui-radius-2)] px-(--hui-space-2) py-(--hui-space-1) hover:bg-[var(--hui-color-background-base-primary-hover)]"
        >
          <Radio
            value={choice.stored}
            disabled={disabled || definition.disabled}
          />
          {choice.label}
        </Label>
      ))}
    </RadioGroup>
  )
}

function BooleanSwitchChoice({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  const { setEntry, disabled } = useFilterBarContext("FilterBoolean")
  const { label, description } = useFilterFieldIds()

  // The switch keeps Yes/No meaning even when off, so the chip reports state
  // while the filter being present means active.
  return (
    <div className="flex items-center justify-end">
      <Switch
        aria-labelledby={label}
        aria-describedby={
          definition.disabledReason ? description : undefined
        }
        checked={entry?.value === true}
        onCheckedChange={(checked) => setEntry(definition.key, checked, "is")}
        disabled={disabled || definition.disabled}
      />
    </div>
  )
}

function FilterBoolean({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  const style = definition.meta?.booleanStyle ?? "radio"

  const control =
    style === "switch" ? (
      <BooleanSwitchChoice definition={definition} entry={entry} />
    ) : (
      <BooleanRadioChoice definition={definition} entry={entry} />
    )

  return (
    <FilterField definition={definition} hideLabel>
      {control}
      <DisabledReasonNotice definition={definition} />
    </FilterField>
  )
}

/* ------------------------------------------------------------------ */
/* Custom renderer                                                     */
/* ------------------------------------------------------------------ */

function FilterCustom({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  return (
    <FilterField definition={definition} hideLabel>
      <FilterCustomControl definition={definition} entry={entry} />
    </FilterField>
  )
}

function FilterCustomControl({
  definition,
  entry,
}: {
  definition: FilterDefinition
  entry?: FilterValue
}) {
  const { setEntry, removeEditing, disabled } =
    useFilterBarContext("FilterCustom")
  const { label, description } = useFilterFieldIds()

  if (!definition.render) return null

  return (
    <>
      {definition.render({
        value: entry?.value,
        operator: entry?.operator,
        onChange: (next) =>
          next == null
            ? removeEditing(definition.key)
            : setEntry(definition.key, next),
        clear: () => removeEditing(definition.key),
        disabled: disabled || Boolean(definition.disabled),
        definition,
        labelId: label,
        descriptionId: definition.disabledReason ? description : undefined,
      })}
      <DisabledReasonNotice definition={definition} />
    </>
  )
}
