"use client"

import * as React from "react"
import {
  ArrowRight as ArrowRightIcon,
  Check as CheckIcon,
  Minus as MinusIcon,
  Pencil as PencilIcon,
  Plus as PlusIcon,
  X as CloseIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Switch } from "@/registry/default/ui/switch"

import {
  ChangeReviewControllerContext,
  useChangeReviewController,
} from "./change-review-context"
import type {
  ChangeReviewChange,
  ChangeReviewControllerValue,
  ChangeReviewDecision,
  ChangeReviewDecisions,
  ChangeReviewFieldNode,
  ChangeReviewGroupNode,
  ChangeReviewLabels,
  ChangeReviewListChange,
  ChangeReviewValueChange,
} from "./change-review-types"
import {
  countChanges,
  decideAllChanges,
  defaultChangeReviewLabels,
  getChangeStatus,
  getChanges,
  groupChanges,
  isEmptyValue,
} from "./change-review-utils"

export type {
  ChangeReviewChange,
  ChangeReviewControllerValue,
  ChangeReviewCounts,
  ChangeReviewDecision,
  ChangeReviewDecisions,
  ChangeReviewField,
  ChangeReviewFieldGroup,
  ChangeReviewFieldNode,
  ChangeReviewLabels,
  ChangeReviewListChange,
  ChangeReviewListField,
  ChangeReviewStatus,
  ChangeReviewValueChange,
  ChangeReviewValueField,
} from "./change-review-types"
export {
  applyAcceptedChanges,
  defaultChangeReviewLabels,
  getChangeStatus,
  getChanges,
} from "./change-review-utils"
export { useChangeReviewController } from "./change-review-context"

/** 12px meta: counts, "No change", helper lines. */
const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const secondaryText = cn("text-[var(--hui-color-foreground-base-secondary)]", metaText)
/** 13px: field labels and the header summary. */
const labelText =
  "[font-size:var(--hui-font-size-control,13px)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:20px]"
/** 14px: the values themselves. */
const bodyText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:20px]"
const hairline = "border-[var(--hui-color-border-base-primary)]"

type ChangeReviewSource =
  | {
      /** The saved version of the object. */
      before: unknown
      /** The proposed or resulting version of the object. */
      after: unknown
      /** Which fields to compare, how to label them, and how to group them. */
      fields: ChangeReviewFieldNode[]
      changes?: never
    }
  | {
      /** Change records your application already holds, such as an audit entry. */
      changes: ChangeReviewChange[]
      before?: never
      after?: never
      fields?: never
    }

export type ChangeReviewProps = Omit<React.ComponentProps<"section">, "onChange"> &
  ChangeReviewSource & {
    /** Hides fields that did not change. Controlled. */
    changedOnly?: boolean | undefined
    defaultChangedOnly?: boolean
    onChangedOnlyChange?: ((changedOnly: boolean) => void) | undefined
    /** Accept and reject choices keyed by change id. Controlled. */
    decisions?: ChangeReviewDecisions | undefined
    defaultDecisions?: ChangeReviewDecisions | undefined
    /** Passing this handler shows the accept and reject controls. */
    onDecisionsChange?: ((decisions: ChangeReviewDecisions) => void) | undefined
    /** Keeps the controls visible but inactive, for example while saving. */
    disabled?: boolean
    /** Display for any value whose field has no `render` of its own. */
    renderValue?: ((value: unknown, change: ChangeReviewValueChange) => React.ReactNode) | undefined
    labels?: Partial<ChangeReviewLabels> | undefined
    /** List items shown before the rest collapse behind a button. */
    maxListItems?: number
  }

function ChangeReview({
  before,
  after,
  fields,
  changes: changesProp,
  changedOnly: changedOnlyProp,
  defaultChangedOnly = true,
  onChangedOnlyChange,
  decisions: decisionsProp,
  defaultDecisions,
  onDecisionsChange,
  disabled = false,
  renderValue,
  labels: labelsProp,
  maxListItems = 5,
  className,
  children,
  ...props
}: ChangeReviewProps) {
  const changes = React.useMemo(
    () => changesProp ?? getChanges(before, after, fields ?? []),
    [changesProp, before, after, fields]
  )

  const [internalChangedOnly, setInternalChangedOnly] = React.useState(defaultChangedOnly)
  const changedOnly = changedOnlyProp ?? internalChangedOnly
  const setChangedOnly = React.useCallback(
    (next: boolean) => {
      setInternalChangedOnly(next)
      onChangedOnlyChange?.(next)
    },
    [onChangedOnlyChange]
  )

  const [internalDecisions, setInternalDecisions] = React.useState<ChangeReviewDecisions>(
    defaultDecisions ?? {}
  )
  const decisions = decisionsProp ?? internalDecisions
  const commitDecisions = React.useCallback(
    (next: ChangeReviewDecisions) => {
      setInternalDecisions(next)
      onDecisionsChange?.(next)
    },
    [onDecisionsChange]
  )

  const labels = React.useMemo(
    () => ({ ...defaultChangeReviewLabels, ...labelsProp }),
    [labelsProp]
  )

  const controller = React.useMemo((): ChangeReviewControllerValue => {
    const counts = countChanges(changes, decisions)

    return {
      changes,
      visibleChanges: changedOnly
        ? changes.filter((change) => getChangeStatus(change) !== "unchanged")
        : changes,
      counts,
      hasUnchanged: counts.changed < counts.total,
      changedOnly,
      setChangedOnly,
      canDecide: onDecisionsChange !== undefined,
      disabled,
      decisions,
      decide: (id, decision) => {
        const next = { ...decisions }
        if (decision === null) delete next[id]
        else next[id] = decision
        commitDecisions(next)
      },
      decideAll: (decision) => commitDecisions(decideAllChanges(changes, decision)),
      labels,
      renderValue,
      maxListItems,
    }
  }, [
    changes,
    decisions,
    changedOnly,
    setChangedOnly,
    onDecisionsChange,
    disabled,
    commitDecisions,
    labels,
    renderValue,
    maxListItems,
  ])

  return (
    <ChangeReviewControllerContext.Provider value={controller}>
      <section
        data-slot="change-review-root"
        className={cn(
          "@container flex w-full min-w-0 flex-col overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)]",
          hairline,
          "[&>*+*]:border-t-[0.5px] [&>*+*]:border-t-[var(--hui-color-border-base-primary)]",
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            <ChangeReviewHeader />
            <ChangeReviewList />
          </>
        )}
      </section>
    </ChangeReviewControllerContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

/** Summary on the left; the filter and bulk actions on the right when they apply. */
function ChangeReviewHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="change-review-header"
      className={cn(
        "flex min-h-12 flex-wrap items-center justify-between gap-x-[var(--hui-space-5)] gap-y-[var(--hui-space-3)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-5)] py-[var(--hui-space-3)]",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <ChangeReviewSummary />
          <div className="flex flex-wrap items-center gap-x-[var(--hui-space-5)] gap-y-[var(--hui-space-3)]">
            <ChangeReviewFilter />
            <ChangeReviewBulkActions />
          </div>
        </>
      )}
    </div>
  )
}

/** Counts of changes and decisions. Announced politely as decisions are made. */
function ChangeReviewSummary({ className, ...props }: React.ComponentProps<"p">) {
  const { counts, canDecide, labels } = useChangeReviewController("ChangeReviewSummary")

  return (
    <p
      data-slot="change-review-summary"
      role="status"
      className={cn(
        "m-0 flex flex-wrap items-baseline gap-x-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] tabular-nums [font-weight:var(--hui-font-weight-medium)]",
        labelText,
        className
      )}
      {...props}
    >
      {labels.summary(counts)}
      {canDecide && counts.changed > 0 && (
        <>
          {/* A real separator, so the two counts do not run together when read aloud. */}
          <span className="sr-only">. </span>
          <span
            className={cn("[font-weight:var(--hui-font-weight-regular)]", secondaryText)}
          >
            {labels.decisionSummary(counts)}
          </span>
        </>
      )}
    </p>
  )
}

/** Switch that hides unchanged fields. Absent when every field changed. */
function ChangeReviewFilter({ className, ...props }: React.ComponentProps<"div">) {
  const { hasUnchanged, changedOnly, setChangedOnly, labels } =
    useChangeReviewController("ChangeReviewFilter")
  const labelId = React.useId()

  if (!hasUnchanged) return null

  return (
    <div
      data-slot="change-review-filter"
      className={cn(
        "inline-flex min-h-6 items-center gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)] select-none",
        metaText,
        className
      )}
      {...props}
    >
      {/* The switch is not a form control a <label> can name, so it is named by reference. */}
      <Switch
        aria-labelledby={labelId}
        checked={changedOnly}
        onCheckedChange={setChangedOnly}
        // Forced colors removes the track and thumb fills, so draw both with system colors.
        className={cn(
          // A compact 28 × 16 switch: it filters the list, it is not the page's main control.
          "h-4 w-7 [&>[data-slot=switch-thumb]]:size-3.5 [&>[data-slot=switch-thumb]]:group-active/switch:w-3.5",
          forcedColorsBorder,
          "forced-colors:box-content forced-colors:[&>span]:bg-[ButtonText]"
        )}
      />
      <span
        id={labelId}
        className="cursor-pointer hover:text-[var(--hui-color-foreground-base-primary)]"
        onClick={() => setChangedOnly(!changedOnly)}>
        {labels.changedOnly}
      </span>
    </div>
  )
}

/** Filled buttons lose their fill in forced colors, so they get an edge instead. */
const forcedColorsBorder = "forced-colors:border forced-colors:border-[ButtonText]"

/** Flat: no feather shadow on the strip, and the 12px label the rest of the header uses. */
const bulkButton =
  "shadow-none px-[var(--hui-space-4)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] [font-weight:var(--hui-font-weight-medium)]"

/** Accept all and Reject all. Absent unless the application handles decisions. */
function ChangeReviewBulkActions({ className, ...props }: React.ComponentProps<"div">) {
  const { canDecide, counts, disabled, decideAll, labels } =
    useChangeReviewController("ChangeReviewBulkActions")

  if (!canDecide || counts.changed === 0) return null

  return (
    <div
      data-slot="change-review-bulk-actions"
      className={cn("flex items-center gap-[var(--hui-space-2)]", className)}
      {...props}
    >
      <Button
        variant="outline"
        size="sm"
        className={cn(bulkButton, forcedColorsBorder)}
        disabled={disabled || counts.rejected === counts.changed}
        onClick={() => decideAll("rejected")}
      >
        {labels.rejectAll}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={cn(bulkButton, forcedColorsBorder)}
        disabled={disabled || counts.accepted === counts.changed}
        onClick={() => decideAll("accepted")}
      >
        {labels.acceptAll}
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* List                                                                       */
/* -------------------------------------------------------------------------- */

/** Bordered list of changes, nested under their groups. */
function ChangeReviewList({ className, ...props }: React.ComponentProps<"div">) {
  const { visibleChanges, changes, labels } = useChangeReviewController("ChangeReviewList")
  const tree = React.useMemo(() => groupChanges(visibleChanges), [visibleChanges])

  if (visibleChanges.length === 0) {
    return (
      <p
        data-slot="change-review-empty"
        className={cn(
          "m-0 flex items-center justify-center gap-[var(--hui-space-3)] px-[var(--hui-space-5)] py-[var(--hui-space-7)] text-center text-[var(--hui-color-foreground-base-secondary)]",
          labelText
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded-[var(--hui-radius-1)] border-[0.5px] border-[var(--hui-color-border-base-primary)] text-[var(--hui-color-foreground-base-secondary)]"
        >
          <CheckIcon className="size-3.5" />
        </span>
        {changes.length === 0 ? labels.empty : labels.emptyFiltered}
      </p>
    )
  }

  return (
    <div
      data-slot="change-review-list"
      className={cn(
        "w-full min-w-0 overflow-hidden",
        className
      )}
      {...props}
    >
      <GroupBody node={tree} depth={0} />
    </div>
  )
}

const divided =
  "[&>*+*]:border-t-[0.5px] [&>*+*]:border-t-[var(--hui-color-border-base-primary)]"

function GroupBody({ node, depth }: { node: ChangeReviewGroupNode; depth: number }) {
  return (
    <div className={divided}>
      {node.changes.length > 0 && (
        <dl className={cn("m-0", divided)}>
          {node.changes.map((change) => (
            <ChangeRow key={change.id} change={change} depth={depth} />
          ))}
        </dl>
      )}
      {node.groups.map((group) => (
        <Group key={group.id} node={group} depth={depth} />
      ))}
    </div>
  )
}

/** Each level of nesting indents its heading and labels by one step; values stay aligned. */
function indent(depth: number): React.CSSProperties {
  return { paddingInlineStart: `calc(var(--hui-space-5) * ${depth})` }
}

function Group({ node, depth }: { node: ChangeReviewGroupNode; depth: number }) {
  const headingId = React.useId()

  return (
    <div data-slot="change-review-group" role="group" aria-labelledby={headingId}>
      <div
        id={headingId}
        data-slot="change-review-group-label"
        className={cn(
          "bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-5)] py-[var(--hui-space-2)] [font-weight:var(--hui-font-weight-medium)]",
          secondaryText
        )}
      >
        <span className="block" style={indent(depth)}>
          {node.label}
        </span>
      </div>
      <div className="border-t-[0.5px] border-t-[var(--hui-color-border-base-primary)]">
        <GroupBody node={node} depth={depth + 1} />
      </div>
    </div>
  )
}

function ChangeRow({ change, depth }: { change: ChangeReviewChange; depth: number }) {
  const { canDecide } = useChangeReviewController("ChangeReviewRow")
  const status = getChangeStatus(change)

  return (
    <div
      data-slot="change-review-row"
      data-status={status}
      className="grid grid-cols-1 items-start gap-x-[var(--hui-space-5)] gap-y-[var(--hui-space-2)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] motion-safe:[transition:background-color_var(--hui-duration-fast)_var(--hui-ease-out)] hover:bg-[color-mix(in_oklch,var(--hui-color-background-base-primary-hover)_60%,transparent)] @lg:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] @lg:items-center"
    >
      <dt
        data-slot="change-review-label"
        style={indent(depth)}
        className={cn(
          "min-w-0 self-start break-words text-[var(--hui-color-foreground-base-secondary)] @lg:py-[2px]",
          labelText
        )}
      >
        {change.label}
      </dt>
      <dd
        data-slot="change-review-value"
        className={cn(
          "m-0 min-w-0 text-[var(--hui-color-foreground-base-primary)] @lg:self-start @lg:py-[2px]",
          bodyText
        )}
      >
        {change.kind === "list" ? (
          <ListChange change={change} />
        ) : (
          <ValueChange change={change} status={status} />
        )}
      </dd>
      {canDecide && status !== "unchanged" && (
        <dd className="m-0 @lg:col-start-3 @lg:-my-[var(--hui-space-1)] @lg:self-start">
          <DecisionControls change={change} />
        </dd>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Values                                                                     */
/* -------------------------------------------------------------------------- */

function DisplayValue({ change, value }: { change: ChangeReviewValueChange; value: unknown }) {
  const { labels, renderValue } = useChangeReviewController("ChangeReviewValue")

  if (isEmptyValue(value)) {
    return (
      <span className="text-[var(--hui-color-foreground-base-secondary)] italic">{labels.notSet}</span>
    )
  }
  if (change.render) return <>{change.render(value)}</>
  if (renderValue) return <>{renderValue(value, change)}</>
  if (typeof value === "boolean") return <>{value ? labels.enabled : labels.disabled}</>
  if (typeof value === "number") return <>{value.toLocaleString()}</>
  if (value instanceof Date) return <>{value.toLocaleDateString()}</>
  if (Array.isArray(value)) return <>{value.map(String).join(", ")}</>
  // No renderer was given for a structured value, so show it as written.
  if (typeof value === "object") return <code className="break-all">{JSON.stringify(value)}</code>
  return <>{String(value)}</>
}

function ValueChange({
  change,
  status,
}: {
  change: ChangeReviewValueChange
  status: ReturnType<typeof getChangeStatus>
}) {
  const { labels } = useChangeReviewController("ChangeReviewValue")

  if (status === "unchanged") {
    return (
      <span className="flex flex-wrap items-baseline gap-x-[var(--hui-space-3)]">
        <span className="min-w-0 break-words text-[var(--hui-color-foreground-base-secondary)]">
          <DisplayValue change={change} value={change.after} />
        </span>
        <span className={cn("text-[var(--hui-color-foreground-base-secondary)]", metaText)}>
          {labels.noChange}
        </span>
      </span>
    )
  }

  return (
    <span className="flex flex-wrap items-center gap-x-[var(--hui-space-3)] gap-y-[var(--hui-space-1)] tabular-nums">
      <span className="sr-only">{labels.was} </span>
      <span
        data-slot="change-review-before"
        className={cn(
          "min-w-0 break-words text-[var(--hui-color-foreground-base-secondary)]",
          // "Not set" is a statement about the old value, not the old value itself.
          !isEmptyValue(change.before) &&
            "line-through decoration-[var(--hui-color-foreground-base-tertiary)] decoration-1"
        )}
      >
        <DisplayValue change={change} value={change.before} />
      </span>
      {/* The arrow travels with the new value, so a wrap never strands it at a line end. */}
      <span className="inline-flex min-w-0 items-center gap-x-[var(--hui-space-3)]">
        <ArrowRightIcon
          aria-hidden="true"
          className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)] rtl:rotate-180"
        />
        <span className="sr-only">, {labels.now} </span>
        <span
          data-slot="change-review-after"
          className="min-w-0 break-words text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)]"
        >
          <DisplayValue change={change} value={change.after} />
        </span>
      </span>
    </span>
  )
}

type ListEntry = { tone: "added" | "removed" | "changed"; item: unknown }

const entryIcon = { added: PlusIcon, removed: MinusIcon, changed: PencilIcon }
/** A 16px tile per entry: the sign carries the meaning, the tint only reinforces it. */
const entryTone = {
  added:
    "bg-[var(--hui-color-background-success-primary)] text-[var(--hui-color-foreground-success-primary)]",
  removed:
    "bg-[var(--hui-color-background-danger-primary)] text-[var(--hui-color-foreground-danger-primary)]",
  changed:
    "bg-[var(--hui-color-background-neutral-secondary)] text-[var(--hui-color-foreground-base-secondary)]",
}

function ListChange({ change }: { change: ChangeReviewListChange }) {
  const { labels, maxListItems } = useChangeReviewController("ChangeReviewValue")
  const [expanded, setExpanded] = React.useState(false)
  const listId = React.useId()

  const entries: ListEntry[] = [
    ...change.added.map((item) => ({ tone: "added" as const, item })),
    ...change.removed.map((item) => ({ tone: "removed" as const, item })),
    ...(change.changed ?? []).map((item) => ({ tone: "changed" as const, item })),
  ]

  if (entries.length === 0) {
    return <span className={secondaryText}>{labels.noChange}</span>
  }

  const overflow = entries.length - maxListItems
  const shown = expanded || overflow <= 0 ? entries : entries.slice(0, maxListItems)
  const itemLabel = change.itemLabel as ((item: unknown) => React.ReactNode) | undefined

  return (
    <div className="flex min-w-0 flex-col gap-[var(--hui-space-3)]">
      <span
        data-slot="change-review-list-summary"
        className="tabular-nums [font-weight:var(--hui-font-weight-medium)]"
      >
        {labels.listSummary({
          added: change.added.length,
          removed: change.removed.length,
          changed: change.changed?.length ?? 0,
        })}
      </span>
      <ul
        id={listId}
        className="m-0 flex list-none flex-col overflow-hidden rounded-[var(--hui-radius-1)] border-[0.5px] border-[var(--hui-color-border-base-primary)] p-0 [&>*+*]:border-t-[0.5px] [&>*+*]:border-t-[var(--hui-color-border-base-primary)]"
      >
        {shown.map((entry, index) => {
          const Icon = entryIcon[entry.tone]
          return (
            <li
              key={index}
              data-slot="change-review-list-item"
              data-change={entry.tone}
              className={cn(
                "flex min-w-0 items-center gap-[var(--hui-space-3)] px-[var(--hui-space-3)] py-[6px]",
                metaText,
                "[font-size:var(--hui-font-size-control,13px)]"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-[4px]",
                  entryTone[entry.tone]
                )}
              >
                <Icon className="size-3" />
              </span>
              <span className="sr-only">{labels[entry.tone]}: </span>
              <span
                className={cn(
                  "min-w-0 break-words",
                  entry.tone === "removed" &&
                    "text-[var(--hui-color-foreground-base-secondary)] line-through decoration-[var(--hui-color-foreground-base-tertiary)]"
                )}
              >
                {itemLabel ? itemLabel(entry.item) : String(entry.item)}
              </span>
            </li>
          )
        })}
      </ul>
      {overflow > 0 && (
        <Button
          variant="link"
          size="sm"
          aria-expanded={expanded}
          aria-controls={listId}
          className="-ml-[var(--hui-space-3)] self-start text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-base-primary)]"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? labels.showFewer : labels.showMore(overflow)}
        </Button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Decisions                                                                  */
/* -------------------------------------------------------------------------- */

// The tinted fills are light, so the label stays in the primary text colour to keep its contrast.
// The chosen side's icon takes the success or danger colour; the label does not.
const decisionTone: Record<ChangeReviewDecision, string> = {
  accepted:
    "bg-[var(--hui-color-background-success-primary)] not-disabled:hover:bg-[var(--hui-color-background-success-primary)] text-[var(--hui-color-foreground-base-primary)] [&_svg]:text-[var(--hui-color-foreground-success-primary)]",
  rejected:
    "bg-[var(--hui-color-background-danger-primary)] not-disabled:hover:bg-[var(--hui-color-background-danger-primary)] text-[var(--hui-color-foreground-base-primary)] [&_svg]:text-[var(--hui-color-foreground-danger-primary)]",
}

/**
 * Two toggle buttons. Pressing the chosen one again returns the change to
 * undecided. The chosen button gains an icon as well as a fill, so the choice
 * does not rest on color.
 */
function DecisionControls({ change }: { change: ChangeReviewChange }) {
  const { decisions, decide, disabled, labels } = useChangeReviewController("ChangeReviewDecision")
  const current = decisions[change.id]

  const toggle = (decision: ChangeReviewDecision) => (
    <Button
      variant="link"
      size="sm"
      disabled={disabled}
      aria-pressed={current === decision}
      aria-label={
        decision === "accepted" ? labels.acceptChange(change.label) : labels.rejectChange(change.label)
      }
      data-decision={decision}
      className={cn(
        "min-h-7 gap-[6px] rounded-none px-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] [font-weight:var(--hui-font-weight-medium)] not-disabled:hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:z-1 focus-visible:outline-offset-[-2px] [&_svg]:text-[var(--hui-color-foreground-base-tertiary)]",
        current === decision && decisionTone[decision]
      )}
      onClick={() => decide(change.id, current === decision ? null : decision)}
    >
      {decision === "accepted" ? (
        <CheckIcon aria-hidden="true" className="size-3.5" />
      ) : (
        <CloseIcon aria-hidden="true" className="size-3.5" />
      )}
      {decision === "accepted" ? labels.accept : labels.reject}
    </Button>
  )

  return (
    <div
      data-slot="change-review-decision"
      className="inline-flex items-stretch overflow-hidden rounded-[var(--hui-radius-1)] border-[0.5px] border-[var(--hui-color-border-base-secondary)] bg-[var(--hui-color-background-base-primary)] [&>*+*]:border-s-[0.5px] [&>*+*]:border-s-[var(--hui-color-border-base-secondary)] forced-colors:border-[ButtonText]"
    >
      {toggle("rejected")}
      {toggle("accepted")}
    </div>
  )
}

export {
  ChangeReview,
  ChangeReviewBulkActions,
  ChangeReviewFilter,
  ChangeReviewHeader,
  ChangeReviewList,
  ChangeReviewSummary,
}
