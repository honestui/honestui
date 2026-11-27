"use client"

import * as React from "react"
import { Check as CheckIcon, GitMerge as GitMergeIcon } from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"
import { Switch } from "@/registry/default/ui/switch"

import type {
  ConflictEntry,
  ConflictFieldNode,
  ConflictResolution,
  ConflictResolutions,
  ConflictResolverLabels,
  ConflictSide,
} from "./conflict-resolver-types"
import {
  chooseSideForAll,
  countConflicts,
  defaultConflictResolverLabels,
  formatFieldText,
  getConflictEntries,
  getEffectiveResolution,
  isEmptyValue,
  isFieldEditable,
  mergeVersions,
  parseFieldText,
} from "./conflict-resolver-utils"

export type {
  ConflictCounts,
  ConflictEntry,
  ConflictField,
  ConflictFieldGroup,
  ConflictFieldNode,
  ConflictFieldStatus,
  ConflictResolution,
  ConflictResolutions,
  ConflictResolverLabels,
  ConflictSide,
} from "./conflict-resolver-types"
export {
  chooseSideForAll,
  countConflicts,
  defaultConflictResolverLabels,
  getConflictEntries,
  getFieldStatus,
  mergeVersions,
} from "./conflict-resolver-utils"

/** 12px meta: counts, "Was", status lines. */
const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const secondaryText = cn("text-[var(--hui-color-foreground-base-secondary)]", metaText)
/** 13px: field labels and the summary. */
const labelText =
  "[font-size:var(--hui-font-size-control,13px)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:20px]"
/** 14px: the values. */
const bodyText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:20px]"
const hairline = "border-[var(--hui-color-border-base-primary)]"
const divided = "[&>*+*]:border-t-[0.5px] [&>*+*]:border-t-[var(--hui-color-border-base-primary)]"
const forcedColorsBorder = "forced-colors:border forced-colors:border-[ButtonText]"
const stripButton =
  "shadow-none px-[var(--hui-space-4)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] [font-weight:var(--hui-font-weight-medium)]"

type ConflictResolverContextValue = {
  labels: ConflictResolverLabels
  resolutions: ConflictResolutions
  choose: (key: string, resolution: ConflictResolution | null) => void
  disabled: boolean
  hasBase: boolean
  renderValue: ((value: unknown, entry: ConflictEntry) => React.ReactNode) | undefined
  name: string
}

const ConflictResolverContext = React.createContext<ConflictResolverContextValue | null>(null)

function useConflictResolver() {
  const context = React.useContext(ConflictResolverContext)
  if (!context) throw new Error("Conflict Resolver parts must be used inside <ConflictResolver>.")
  return context
}

export type ConflictResolverProps = Omit<React.ComponentProps<"section">, "onChange"> & {
  /** The version both edits started from. Without it, every difference is a conflict. */
  base?: unknown
  /** The version of the person resolving. */
  ours: unknown
  /** The other edit, such as the version saved on the server. */
  theirs: unknown
  fields: ConflictFieldNode[]
  /** Choices keyed by field key. Controlled. */
  resolutions?: ConflictResolutions | undefined
  defaultResolutions?: ConflictResolutions | undefined
  onResolutionsChange?: ((resolutions: ConflictResolutions) => void) | undefined
  /** Shows fields that merged on their own, so their choice can be changed. Controlled. */
  showAll?: boolean | undefined
  defaultShowAll?: boolean | undefined
  onShowAllChange?: ((showAll: boolean) => void) | undefined
  /** Passing this handler shows Apply merge, enabled once every conflict has a choice. */
  onApply?: ((value: unknown, resolutions: ConflictResolutions) => void) | undefined
  disabled?: boolean | undefined
  /** Display for values whose field has no `render` of its own. */
  renderValue?: ((value: unknown, entry: ConflictEntry) => React.ReactNode) | undefined
  labels?: Partial<ConflictResolverLabels> | undefined
}

function ConflictResolver({
  base,
  ours,
  theirs,
  fields,
  resolutions: resolutionsProp,
  defaultResolutions,
  onResolutionsChange,
  showAll: showAllProp,
  defaultShowAll = false,
  onShowAllChange,
  onApply,
  disabled = false,
  renderValue,
  labels: labelsProp,
  className,
  ...props
}: ConflictResolverProps) {
  const labels = React.useMemo(
    () => ({
      ...defaultConflictResolverLabels,
      ...labelsProp,
      status: {
        ...defaultConflictResolverLabels.status,
        ...labelsProp?.status,
      },
    }),
    [labelsProp]
  )
  const entries = React.useMemo(
    () => getConflictEntries({ base, ours, theirs }, fields),
    [base, ours, theirs, fields]
  )

  const [internalResolutions, setInternalResolutions] = React.useState<ConflictResolutions>(
    defaultResolutions ?? {}
  )
  const resolutions = resolutionsProp ?? internalResolutions
  const commit = React.useCallback(
    (next: ConflictResolutions) => {
      setInternalResolutions(next)
      onResolutionsChange?.(next)
    },
    [onResolutionsChange]
  )

  const [internalShowAll, setInternalShowAll] = React.useState(defaultShowAll)
  const showAll = showAllProp ?? internalShowAll
  const setShowAll = (next: boolean) => {
    setInternalShowAll(next)
    onShowAllChange?.(next)
  }

  const counts = countConflicts(entries, resolutions)
  const visible = entries.filter((entry) =>
    showAll ? entry.status !== "unchanged" : entry.status === "conflict"
  )
  const name = React.useId()

  const context = React.useMemo(
    (): ConflictResolverContextValue => ({
      labels,
      resolutions,
      choose: (key, resolution) => {
        const next = { ...resolutions }
        if (resolution) next[key] = resolution
        else delete next[key]
        commit(next)
      },
      disabled,
      hasBase: base !== undefined,
      renderValue,
      name,
    }),
    [labels, resolutions, commit, disabled, base, renderValue, name]
  )

  const sections = groupBySection(visible)
  const complete = counts.resolved === counts.conflicts
  const progress = counts.conflicts === 0 ? 1 : counts.resolved / counts.conflicts

  return (
    <ConflictResolverContext.Provider value={context}>
      <section
        data-slot="conflict-resolver"
        data-complete={complete ? "" : undefined}
        className={cn(
          "@container flex w-full min-w-0 flex-col overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)]",
          hairline,
          divided,
          className
        )}
        {...props}
      >
        <div
          data-slot="conflict-resolver-header"
          className="flex min-h-12 flex-wrap items-center justify-between gap-x-[var(--hui-space-5)] gap-y-[var(--hui-space-3)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-5)] py-[var(--hui-space-3)]"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-2)]">
            <p
              role="status"
              data-slot="conflict-resolver-summary"
              className={cn(
                "m-0 flex flex-wrap items-baseline gap-x-[var(--hui-space-3)] tabular-nums [font-weight:var(--hui-font-weight-medium)]",
                labelText
              )}
            >
              {labels.summary(counts)}
              {counts.merged > 0 && (
                <>
                  <span className="sr-only">. </span>
                  <span
                    className={cn("[font-weight:var(--hui-font-weight-regular)]", secondaryText)}
                  >
                    {labels.merged(counts.merged)}
                  </span>
                </>
              )}
            </p>
            {counts.conflicts > 0 && (
              <span
                aria-hidden="true"
                data-slot="conflict-resolver-progress"
                className="relative h-1 w-16 overflow-hidden rounded-full bg-[var(--hui-color-background-neutral-secondary)] forced-colors:border forced-colors:border-[CanvasText]"
              >
                <span
                  className="absolute inset-y-0 start-0 rounded-full bg-[var(--hui-color-foreground-base-primary)] motion-safe:[transition:width_var(--hui-duration-normal)_var(--hui-ease-out)] forced-colors:bg-[CanvasText]"
                  style={{ width: `${progress * 100}%` }}
                />
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-[var(--hui-space-5)] gap-y-[var(--hui-space-3)]">
            {counts.merged > 0 && (
              <ShowAllSwitch
                checked={showAll}
                onCheckedChange={setShowAll}
                label={labels.showAll}
              />
            )}
            {counts.conflicts > 0 && (
              <div className="flex items-center gap-[var(--hui-space-2)]">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  className={cn(stripButton, forcedColorsBorder)}
                  onClick={() => commit(chooseSideForAll(entries, resolutions, "ours"))}
                >
                  {labels.keepAllOurs}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  className={cn(stripButton, forcedColorsBorder)}
                  onClick={() => commit(chooseSideForAll(entries, resolutions, "theirs"))}
                >
                  {labels.takeAllTheirs}
                </Button>
              </div>
            )}
          </div>
        </div>

        {visible.length === 0 ? (
          <p
            data-slot="conflict-resolver-empty"
            className={cn(
              "m-0 flex items-center justify-center gap-[var(--hui-space-3)] px-[var(--hui-space-5)] py-[var(--hui-space-7)] text-center text-[var(--hui-color-foreground-base-secondary)]",
              labelText
            )}
          >
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-[var(--hui-radius-1)] border-[0.5px] border-[var(--hui-color-border-base-primary)]"
            >
              <GitMergeIcon className="size-3.5" />
            </span>
            {labels.empty}
          </p>
        ) : (
          <div data-slot="conflict-resolver-list" className={divided}>
            {sections.map((section) => (
              <ConflictSection key={section.id} label={section.label} entries={section.entries} />
            ))}
          </div>
        )}

        {onApply && (
          <div
            data-slot="conflict-resolver-footer"
            className="flex flex-wrap items-center justify-end gap-x-[var(--hui-space-5)] gap-y-[var(--hui-space-3)] px-[var(--hui-space-5)] py-[var(--hui-space-4)]"
          >
            {!complete && (
              <p className={cn("m-0 min-w-0 flex-1", secondaryText)}>{labels.applyHint}</p>
            )}
            <Button
              size="sm"
              disabled={disabled || !complete}
              className={cn(stripButton, forcedColorsBorder)}
              onClick={() => onApply(mergeVersions(ours, entries, resolutions).value, resolutions)}
            >
              {labels.apply}
            </Button>
          </div>
        )}
      </section>
    </ConflictResolverContext.Provider>
  )
}

function groupBySection(entries: ConflictEntry[]) {
  const sections: {
    id: string
    path: string
    label: string
    entries: ConflictEntry[]
  }[] = []
  for (const entry of entries) {
    const path = entry.groups.join("\u0000")
    const last = sections[sections.length - 1]
    if (last && last.path === path) last.entries.push(entry)
    else
      sections.push({
        id: `${sections.length}:${path}`,
        path,
        label: entry.groups.join(" / "),
        entries: [entry],
      })
  }
  return sections
}

function ShowAllSwitch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
}) {
  const labelId = React.useId()
  return (
    <div
      data-slot="conflict-resolver-show-all"
      className={cn(
        "inline-flex min-h-6 items-center gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)] select-none",
        metaText
      )}
    >
      <Switch
        aria-labelledby={labelId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          "h-4 w-7 [&>[data-slot=switch-thumb]]:size-3.5 [&>[data-slot=switch-thumb]]:group-active/switch:w-3.5",
          forcedColorsBorder,
          "forced-colors:box-content forced-colors:[&>span]:bg-[ButtonText]"
        )}
      />
      <span
        id={labelId}
        className="cursor-pointer hover:text-[var(--hui-color-foreground-base-primary)]"
        onClick={() => onCheckedChange(!checked)}
      >
        {label}
      </span>
    </div>
  )
}

function ConflictSection({ label, entries }: { label: string; entries: ConflictEntry[] }) {
  const headingId = React.useId()
  const rows = (
    <div className={divided}>
      {entries.map((entry) => (
        <ConflictRow key={entry.key} entry={entry} />
      ))}
    </div>
  )
  if (!label) return rows
  return (
    <div role="group" aria-labelledby={headingId} data-slot="conflict-resolver-group">
      <div
        id={headingId}
        className={cn(
          "border-b-[0.5px] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-5)] py-[var(--hui-space-2)] [font-weight:var(--hui-font-weight-medium)]",
          hairline,
          secondaryText
        )}
      >
        {label}
      </div>
      {rows}
    </div>
  )
}

function ConflictRow({ entry }: { entry: ConflictEntry }) {
  const { labels, resolutions, choose, disabled, hasBase, name } = useConflictResolver()
  const labelId = React.useId()
  const effective = getEffectiveResolution(entry, resolutions)
  const isConflict = entry.status === "conflict"
  const editable = isFieldEditable(entry)
  const groupName = `${name}-${entry.key}`

  return (
    <div
      data-slot="conflict-resolver-row"
      data-status={entry.status}
      data-resolved={effective ? "" : undefined}
      className="grid grid-cols-1 gap-x-[var(--hui-space-5)] gap-y-[var(--hui-space-3)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] @2xl:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]"
    >
      <div className="flex min-w-0 flex-col gap-[var(--hui-space-1)] @2xl:pt-[var(--hui-space-3)]">
        <span className="flex min-w-0 items-center gap-[var(--hui-space-3)]">
          <span
            id={labelId}
            data-slot="conflict-resolver-label"
            className={cn(
              "min-w-0 break-words [font-weight:var(--hui-font-weight-medium)]",
              labelText
            )}
          >
            {entry.label}
          </span>
          {isConflict && <ResolutionMark resolved={effective !== null} />}
        </span>
        {isConflict ? (
          hasBase && (
            <span className={cn("min-w-0 break-words", secondaryText)}>
              {labels.base} <DisplayValue entry={entry} value={entry.base} />
            </span>
          )
        ) : (
          <span className={secondaryText}>
            {labels.status[entry.status as Exclude<typeof entry.status, "conflict">]}
          </span>
        )}
      </div>

      {entry.status === "both" ? (
        <p
          data-slot="conflict-resolver-agreed"
          className={cn(
            "m-0 min-w-0 break-words rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]",
            bodyText
          )}
        >
          <DisplayValue entry={entry} value={entry.ours} />
        </p>
      ) : (
        <div
          role="radiogroup"
          aria-label={labels.choiceFor(entry.label)}
          data-slot="conflict-resolver-choices"
          className="grid min-w-0 grid-cols-1 gap-[var(--hui-space-3)] @md:grid-cols-2"
        >
          {(["ours", "theirs"] as const).map((side) => (
            <SideOption
              key={side}
              entry={entry}
              side={side}
              name={groupName}
              checked={effective?.source === side}
              dimmed={effective !== null && effective.source !== side}
              disabled={disabled}
              onSelect={() => choose(entry.key, { source: side })}
            />
          ))}
          {editable && isConflict && (
            <CustomOption
              entry={entry}
              name={groupName}
              resolution={effective}
              disabled={disabled}
              onChange={(value) => choose(entry.key, { source: "custom", value })}
            />
          )}
        </div>
      )}
    </div>
  )
}

function ResolutionMark({ resolved }: { resolved: boolean }) {
  return resolved ? (
    <CheckIcon
      aria-hidden="true"
      data-slot="conflict-resolver-resolved"
      className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-secondary)]"
    />
  ) : (
    <span
      aria-hidden="true"
      data-slot="conflict-resolver-unresolved"
      className="size-1.5 shrink-0 rounded-full bg-[var(--hui-color-background-attention-emphasis,var(--hui-color-foreground-attention-primary))] forced-colors:bg-[Highlight]"
    />
  )
}

function DisplayValue({ entry, value }: { entry: ConflictEntry; value: unknown }) {
  const { labels, renderValue } = useConflictResolver()
  if (isEmptyValue(value)) {
    return (
      <span className="text-[var(--hui-color-foreground-base-secondary)] italic">
        {labels.notSet}
      </span>
    )
  }
  if (entry.field.render) return <>{entry.field.render(value)}</>
  if (renderValue) return <>{renderValue(value, entry)}</>
  if (typeof value === "boolean") return <>{value ? labels.enabled : labels.disabled}</>
  if (typeof value === "number") return <>{value.toLocaleString()}</>
  if (value instanceof Date) return <>{value.toLocaleDateString()}</>
  if (Array.isArray(value)) return <>{value.map(String).join(", ")}</>
  if (typeof value === "object") return <code className="break-all">{JSON.stringify(value)}</code>
  return <>{String(value)}</>
}

/** The card's radio is the real input; the dot beside the side's name only draws its state. */
const optionCard = cn(
  "group/option relative flex min-w-0 cursor-pointer flex-col gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]",
  "motion-safe:[transition:background-color_var(--hui-duration-fast)_var(--hui-ease-out),box-shadow_var(--hui-duration-fast)_var(--hui-ease-out)]",
  "hover:bg-[var(--hui-color-background-base-primary-hover)]",
  "has-[:checked]:shadow-[inset_0_0_0_1px_var(--hui-color-foreground-base-primary)] has-[:checked]:hover:bg-[var(--hui-color-background-base-primary)]",
  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--hui-color-border-accent-emphasis)] has-[:focus-visible]:outline-solid",
  "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
  "forced-colors:border-[CanvasText] forced-colors:has-[:checked]:border-2 forced-colors:has-[:checked]:border-[Highlight]"
)

function RadioDot() {
  return (
    <span
      aria-hidden="true"
      className="flex size-3.5 shrink-0 items-center justify-center rounded-full border-[0.5px] border-[var(--hui-color-border-base-tertiary)] bg-[var(--hui-color-background-base-primary)] group-has-[:checked]/option:border-transparent group-has-[:checked]/option:bg-[var(--hui-color-background-neutral-emphasis)] forced-colors:border-[CanvasText]"
    >
      <span className="size-1.5 rounded-full bg-[var(--hui-color-foreground-base-emphasis)] opacity-0 group-has-[:checked]/option:opacity-100 forced-colors:bg-[Highlight]" />
    </span>
  )
}

function SideOption({
  entry,
  side,
  name,
  checked,
  dimmed,
  disabled,
  onSelect,
}: {
  entry: ConflictEntry
  side: ConflictSide
  name: string
  checked: boolean
  dimmed: boolean
  disabled: boolean
  onSelect: () => void
}) {
  const { labels } = useConflictResolver()
  return (
    <label data-slot="conflict-resolver-option" data-side={side} className={optionCard}>
      <input
        type="radio"
        name={name}
        value={side}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={cn(
          "flex items-center gap-[var(--hui-space-3)] [font-weight:var(--hui-font-weight-medium)]",
          secondaryText
        )}
      >
        <RadioDot />
        {labels[side]}
      </span>
      <span
        data-slot="conflict-resolver-value"
        className={cn(
          "min-w-0 break-words",
          bodyText,
          dimmed
            ? "text-[var(--hui-color-foreground-base-secondary)]"
            : "text-[var(--hui-color-foreground-base-primary)]"
        )}
      >
        <DisplayValue entry={entry} value={side === "ours" ? entry.ours : entry.theirs} />
      </span>
    </label>
  )
}

function CustomOption({
  entry,
  name,
  resolution,
  disabled,
  onChange,
}: {
  entry: ConflictEntry
  name: string
  resolution: ConflictResolution | null
  disabled: boolean
  onChange: (value: unknown) => void
}) {
  const { labels } = useConflictResolver()
  const checked = resolution?.source === "custom"
  const [text, setText] = React.useState(() =>
    formatFieldText(entry.field, checked ? resolution.value : entry.ours)
  )
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div
      data-slot="conflict-resolver-custom"
      className="flex min-w-0 flex-col gap-[var(--hui-space-2)] @md:col-span-2"
    >
      <label
        className={cn(
          "group/option inline-flex w-fit cursor-pointer items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-1)] py-[var(--hui-space-1)] hover:text-[var(--hui-color-foreground-base-primary)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--hui-color-border-accent-emphasis)] has-[:focus-visible]:outline-solid",
          secondaryText
        )}
      >
        <input
          type="radio"
          name={name}
          value="custom"
          checked={checked}
          disabled={disabled}
          className="sr-only"
          onChange={() => {
            onChange(parseFieldText(entry, entry.field, text))
            requestAnimationFrame(() => inputRef.current?.focus())
          }}
        />
        <RadioDot />
        {labels.custom}
      </label>
      {checked && (
        <Input
          ref={inputRef}
          size="sm"
          value={text}
          disabled={disabled}
          aria-label={labels.customValueFor(entry.label)}
          className="max-w-md"
          onChange={(event) => {
            setText(event.target.value)
            onChange(parseFieldText(entry, entry.field, event.target.value))
          }}
        />
      )}
    </div>
  )
}

export { ConflictResolver }
