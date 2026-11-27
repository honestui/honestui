"use client"

import * as React from "react"
import { Plus as PlusIcon, Trash2 as TrashIcon, X as CloseIcon } from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/registry/default/ui/select"

import { isValuelessOperator, needsTwoValues } from "../filter-bar/filter-bar-utils"
import type {
  QueryBuilderLabels,
  QueryCombinator,
  QueryCondition,
  QueryField,
  QueryGroup,
  QueryNode,
} from "./query-builder-types"
import {
  countQuery,
  createQueryCondition,
  createQueryGroup,
  defaultQueryBuilderLabels,
  getEmptyConditionValue,
  getQueryOperators,
  insertQueryNode,
  removeQueryNode,
  updateQueryNode,
} from "./query-builder-utils"

export type {
  QueryBuilderLabels,
  QueryCombinator,
  QueryCondition,
  QueryField,
  QueryGroup,
  QueryNode,
} from "./query-builder-types"
export {
  countQuery,
  createQueryCondition,
  createQueryGroup,
  createQueryId,
  defaultQueryBuilderLabels,
  filtersToQuery,
  findQueryNode,
  formatQuery,
  fromQueryDate,
  getQueryOperators,
  insertQueryNode,
  isQueryConditionComplete,
  matchesQuery,
  pruneQuery,
  queryToFilters,
  removeQueryNode,
  toQueryDate,
  updateQueryNode,
} from "./query-builder-utils"

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

/** Height of one condition row: a small control plus the row's 2px inset and hairline border. */
const rowHeight = "h-[calc(var(--hui-control-height-sm,var(--hui-space-8))+5px)]"

/** A borderless part of a condition row: field, operator, or value. */
const segment = "h-[var(--hui-control-height-sm,var(--hui-space-8))] min-h-0 rounded-[calc(var(--hui-radius-2)-2px)]"

function SegmentDivider() {
  return <span aria-hidden="true" className="h-4 w-[0.5px] shrink-0 bg-[var(--hui-color-border-base-primary)]" />
}

export type QueryBuilderProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** The fields a condition can test. Filter Bar definitions work unchanged. */
  fields: QueryField[]
  /** Controlled query. The root is a group. */
  value?: QueryGroup | undefined
  /** Initial query when uncontrolled. Defaults to an empty "and" group. */
  defaultValue?: QueryGroup | undefined
  onValueChange?: ((value: QueryGroup) => void) | undefined
  /** How many levels of groups may sit inside the root. `0` allows no groups. */
  maxDepth?: number
  disabled?: boolean
  labels?: Partial<QueryBuilderLabels> | undefined
}

type BuilderContextValue = {
  fields: QueryField[]
  labels: QueryBuilderLabels
  maxDepth: number
  disabled: boolean
  change: (update: (root: QueryGroup) => QueryGroup, focus?: string) => void
}

const BuilderContext = React.createContext<BuilderContextValue | null>(null)

function useBuilder() {
  const context = React.useContext(BuilderContext)
  if (!context) throw new Error("QueryBuilder parts must be used inside QueryBuilder")
  return context
}

/**
 * Nested AND/OR conditions over a set of fields: the advanced mode of Filter
 * Bar. The builder owns no data; read the tree from `onValueChange` and query
 * with it, or evaluate rows with `matchesQuery`.
 */
function QueryBuilder({
  fields,
  value: valueProp,
  defaultValue,
  onValueChange,
  maxDepth = 2,
  disabled = false,
  labels: labelsProp,
  className,
  ...props
}: QueryBuilderProps) {
  const labels = React.useMemo(() => ({ ...defaultQueryBuilderLabels, ...labelsProp }), [labelsProp])
  const [uncontrolled, setUncontrolled] = React.useState<QueryGroup>(() => defaultValue ?? createQueryGroup("and"))
  const value = valueProp ?? uncontrolled
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [focusRequest, setFocusRequest] = React.useState<{
    target: string
  } | null>(null)

  // Read the latest tree inside callbacks without re-creating the context on every keystroke.
  const valueRef = React.useRef(value)
  React.useEffect(() => {
    valueRef.current = value
  }, [value])

  React.useEffect(() => {
    if (!focusRequest) return
    rootRef.current?.querySelector<HTMLElement>(`[data-focus="${focusRequest.target}"]`)?.focus()
  }, [focusRequest])

  const change = React.useCallback(
    (update: (root: QueryGroup) => QueryGroup, focus?: string) => {
      const next = update(valueRef.current)
      valueRef.current = next
      if (valueProp === undefined) setUncontrolled(next)
      onValueChange?.(next)
      if (focus) setFocusRequest({ target: focus })
    },
    [onValueChange, valueProp],
  )

  const context = React.useMemo(
    () => ({ fields, labels, maxDepth, disabled, change }),
    [fields, labels, maxDepth, disabled, change],
  )
  const counts = countQuery(value)

  return (
    <BuilderContext.Provider value={context}>
      <div
        ref={rootRef}
        role="group"
        aria-label={props["aria-labelledby"] ? undefined : labels.rootGroup(value.combinator)}
        data-slot="query-builder"
        className={cn(
          "@container flex w-full min-w-0 flex-col gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-secondary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-4)]",
          className,
        )}
        {...props}
      >
        <GroupBody group={value} path="" depth={0} />
        <p role="status" className="sr-only">
          {labels.summary(counts)}
        </p>
      </div>
    </BuilderContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Groups                                                                     */
/* -------------------------------------------------------------------------- */

function childPath(path: string, index: number) {
  return path ? `${path}.${index + 1}` : String(index + 1)
}

function GroupBody({
  group,
  path,
  depth,
  onRemove,
}: {
  group: QueryGroup
  path: string
  depth: number
  /** Nested groups put their Remove button at the end of the add row. */
  onRemove?: () => void
}) {
  const { fields, labels, maxDepth, disabled, change } = useBuilder()
  const canAddGroup = depth < maxDepth && fields.length > 0

  function addCondition() {
    const condition = createQueryCondition(fields[0])
    change((root) => insertQueryNode(root, group.id, condition), condition.id)
  }

  function addGroup() {
    const condition = createQueryCondition(fields[0])
    const nested = createQueryGroup(group.combinator === "and" ? "or" : "and", [condition])
    change((root) => insertQueryNode(root, group.id, nested), condition.id)
  }

  function remove(index: number) {
    const child = group.children[index]
    const neighbour = group.children[index - 1] ?? group.children[index + 1]
    const focus = neighbour ? focusTargetFor(neighbour) : `add-${group.id}`
    change((root) => removeQueryNode(root, child.id), focus)
  }

  return (
    <div data-slot="query-builder-group-body" className="flex min-w-0 flex-col gap-[var(--hui-space-2)]">
      {group.children.length === 0 && depth === 0 && (
        <p className={cn("m-0 px-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)]", smallText)}>
          {labels.empty}
        </p>
      )}
      {group.children.length > 0 && (
        <ul className="m-0 flex min-w-0 list-none flex-col gap-[var(--hui-space-2)] p-0">
          {group.children.map((child, index) => (
            <li key={child.id} className="flex min-w-0 items-start gap-[var(--hui-space-2)]">
              <Joiner group={group} index={index} path={path} />
              <div className="min-w-0 flex-1">
                {child.kind === "condition" ? (
                  <ConditionRow condition={child} path={childPath(path, index)} onRemove={() => remove(index)} />
                ) : (
                  <NestedGroup
                    group={child}
                    path={childPath(path, index)}
                    depth={depth + 1}
                    onRemove={() => remove(index)}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-[var(--hui-space-1)] ps-[calc(3rem+var(--hui-space-2))]">
        <Button
          variant="ghost"
          size="sm"
          data-focus={`add-${group.id}`}
          className={cn("-ms-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-base-primary)]", smallText)}
          disabled={disabled || fields.length === 0}
          onClick={addCondition}
        >
          <PlusIcon aria-hidden="true" />
          {labels.addCondition}
        </Button>
        {canAddGroup && (
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-base-primary)]", smallText)}
            disabled={disabled}
            onClick={addGroup}
          >
            <PlusIcon aria-hidden="true" />
            {labels.addGroup}
          </Button>
        )}
        {onRemove && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="ms-auto text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-danger-primary)]"
            aria-label={labels.removeGroup(path)}
            disabled={disabled}
            onClick={onRemove}
          >
            <TrashIcon aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  )
}

function focusTargetFor(node: QueryNode): string {
  if (node.kind === "condition") return node.id
  const first = node.children[0]
  return first ? focusTargetFor(first) : `add-${node.id}`
}

/** The word before each row: "Where", then the and/or choice, then the same word repeated. */
function Joiner({ group, index, path }: { group: QueryGroup; index: number; path: string }) {
  const { labels, disabled, change } = useBuilder()
  const base = cn("flex w-12 shrink-0 items-center", rowHeight)

  if (index === 0) {
    return (
      <span
        className={cn(base, "text-[var(--hui-color-foreground-base-secondary)]", smallText)}
      >
        {labels.where}
      </span>
    )
  }

  if (index === 1) {
    const items = (["and", "or"] as const).map((combinator) => ({
      label: labels.combinators[combinator],
      value: combinator,
    }))
    return (
      <span className={base}>
        <Select
          items={items}
          value={group.combinator}
          onValueChange={(next) =>
            change((root) =>
              updateQueryNode(root, group.id, (node) =>
                node.kind === "group" ? { ...node, combinator: next as QueryCombinator } : node,
              ),
            )
          }
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            variant="text"
            aria-label={labels.combinatorLabel(path)}
            className={cn("-ms-[var(--hui-space-2)] w-auto gap-[var(--hui-space-1)] px-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]", smallText)}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </span>
    )
  }

  return (
    <span className={cn(base, "text-[var(--hui-color-foreground-base-secondary)]", smallText)}>
      {labels.combinators[group.combinator]}
    </span>
  )
}

function NestedGroup({
  group,
  path,
  depth,
  onRemove,
}: {
  group: QueryGroup
  path: string
  depth: number
  onRemove: () => void
}) {
  const { labels } = useBuilder()

  return (
    <div
      role="group"
      aria-label={labels.group({ path, combinator: group.combinator })}
      data-slot="query-builder-group"
      data-depth={depth}
      className="flex min-w-0 flex-col border-s border-[var(--hui-color-border-base-primary)] ps-[var(--hui-space-4)]"
    >
      <GroupBody group={group} path={path} depth={depth} onRemove={onRemove} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Conditions                                                                 */
/* -------------------------------------------------------------------------- */

function ConditionRow({
  condition,
  path,
  onRemove,
}: {
  condition: QueryCondition
  path: string
  onRemove: () => void
}) {
  const { fields, labels, disabled, change } = useBuilder()
  const field = fields.find((candidate) => candidate.key === condition.field) ?? fields[0]
  const operators = field ? getQueryOperators(field) : []

  function update(patch: Partial<QueryCondition>) {
    change((root) => updateQueryNode(root, condition.id, (node) => ({ ...node, ...patch }) as QueryNode))
  }

  const fieldItems = fields.map((candidate) => ({
    label: candidate.label,
    value: candidate.key,
  }))
  // Filter Bar's "Is" reads as "any of" for a list of choices, so say so here.
  const operatorLabel = (operator: string) =>
    (field?.type === "multi-select" ? labels.operatorLabels[`multi-${operator}`] : undefined) ??
    labels.operatorLabels[operator] ??
    operator
  const operatorItems = operators.map((operator) => ({
    label: operatorLabel(operator),
    value: operator,
  }))

  return (
    <div
      role="group"
      aria-label={labels.condition(path)}
      data-slot="query-builder-condition"
      className={cn(
        "flex min-w-0 items-center gap-[var(--hui-space-1)] rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-field,var(--hui-color-border-base-tertiary))] bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] p-[2px]",
        rowHeight,
      )}
    >
      <Select
        items={fieldItems}
        value={field?.key ?? null}
        onValueChange={(next) => {
          const nextField = fields.find((candidate) => candidate.key === next)
          if (!nextField) return
          const fresh = createQueryCondition(nextField, condition.id)
          update({
            field: fresh.field,
            operator: fresh.operator,
            value: fresh.value,
          })
        }}
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          variant="text"
          aria-label={labels.field(path)}
          className={cn(segment, "w-auto max-w-[11rem] shrink-0 gap-[var(--hui-space-2)] font-medium")}
          data-focus={condition.id}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {fieldItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
      {operatorItems.length === 1 ? (
        <span
          aria-label={`${labels.operator(path)}: ${operatorItems[0].label}`}
          role="note"
          className={cn(
            "flex shrink-0 items-center px-[var(--hui-space-2)] whitespace-nowrap text-[var(--hui-color-foreground-base-secondary)]",
            smallText,
          )}
        >
          {operatorItems[0].label}
        </span>
      ) : (
        <Select
          items={operatorItems}
          value={condition.operator}
          onValueChange={(next) => {
            if (!field || typeof next !== "string") return
            // Moving in or out of a range changes the value's shape, so start that value over.
            const reshaped = needsTwoValues(next) !== needsTwoValues(condition.operator)
            update({
              operator: next,
              ...(reshaped ? { value: getEmptyConditionValue(field, next) } : {}),
            })
          }}
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            variant="text"
            aria-label={labels.operator(path)}
            className={cn(segment, "w-auto shrink-0 gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]", smallText)}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {operatorItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      )}
      {field && !isValuelessOperator(condition.operator) ? (
        <>
          <SegmentDivider />
          <div className="min-w-0 flex-1">
            <ValueEditor field={field} condition={condition} path={path} onChange={(value) => update({ value })} />
          </div>
        </>
      ) : (
        <span className="flex-1" />
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn(segment, "aspect-square shrink-0 p-0 text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-base-primary)]")}
        aria-label={labels.removeCondition(path)}
        disabled={disabled}
        onClick={onRemove}
      >
        <CloseIcon aria-hidden="true" />
      </Button>
    </div>
  )
}

function ValueEditor({
  field,
  condition,
  path,
  onChange,
}: {
  field: QueryField
  condition: QueryCondition
  path: string
  onChange: (value: unknown) => void
}) {
  const { labels, disabled } = useBuilder()
  const { value, operator } = condition

  switch (field.type) {
    case "select":
    case "multi-select": {
      const multiple = field.type === "multi-select"
      const items = (field.options ?? []).map((option) => ({
        label: option.label,
        value: String(option.value),
      }))
      const current = multiple
        ? (Array.isArray(value) ? value : []).map(String)
        : value == null || value === ""
          ? null
          : String(value)
      const toOption = (key: string) => field.options?.find((option) => String(option.value) === key)?.value ?? key

      return (
        <Select
          items={items}
          multiple={multiple}
          value={current as never}
          onValueChange={(next: unknown) =>
            onChange(
              Array.isArray(next)
                ? next.map((entry) => toOption(String(entry)))
                : next == null
                  ? null
                  : toOption(String(next)),
            )
          }
          disabled={disabled}
        >
          <SelectTrigger size="sm" variant="text" aria-label={labels.value(path)} className={cn(segment, "w-full")}>
            <SelectValue placeholder={labels.choosePlaceholder} />
          </SelectTrigger>
          <SelectPopup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      )
    }
    case "boolean": {
      const items = [
        { label: labels.yes, value: "true" },
        { label: labels.no, value: "false" },
      ]
      return (
        <Select
          items={items}
          value={value === false ? "false" : "true"}
          onValueChange={(next) => onChange(next === "true")}
          disabled={disabled}
        >
          <SelectTrigger size="sm" variant="text" aria-label={labels.value(path)} className={cn(segment, "w-full")}>
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      )
    }
    case "number": {
      const toNumber = (raw: string) => (raw.trim() === "" || Number.isNaN(Number(raw)) ? null : Number(raw))
      if (operator === "between") {
        const range = (value ?? {}) as {
          min?: number | null
          max?: number | null
        }
        return (
          <RangeInputs
            type="number"
            from={range.min == null ? "" : String(range.min)}
            to={range.max == null ? "" : String(range.max)}
            fromLabel={labels.rangeFrom(path)}
            toLabel={labels.rangeTo(path)}
            onChange={(from, to) => onChange({ min: toNumber(from), max: toNumber(to) })}
          />
        )
      }
      return (
        <Input
          size="sm"
          variant="borderless"
          className={cn(segment, "bg-transparent")}
          type="number"
          inputMode="decimal"
          min={field.meta?.min}
          max={field.meta?.max}
          step={field.meta?.step ?? "any"}
          aria-label={labels.value(path)}
          placeholder={field.placeholder ?? labels.valuePlaceholder}
          value={typeof value === "number" ? String(value) : ""}
          disabled={disabled}
          onChange={(event) => onChange(toNumber(event.currentTarget.value))}
        />
      )
    }
    case "date":
      return (
        <Input
          size="sm"
          variant="borderless"
          className={cn(segment, "bg-transparent")}
          type="date"
          aria-label={labels.value(path)}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      )
    case "date-range": {
      const range = (value ?? {}) as { from?: string; to?: string }
      return (
        <RangeInputs
          type="date"
          from={range.from ?? ""}
          to={range.to ?? ""}
          fromLabel={labels.rangeFrom(path)}
          toLabel={labels.rangeTo(path)}
          onChange={(from, to) => onChange({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}
        />
      )
    }
    default:
      return (
        <Input
          size="sm"
          variant="borderless"
          className={cn(segment, "bg-transparent")}
          aria-label={labels.value(path)}
          placeholder={field.placeholder ?? field.meta?.placeholder ?? labels.valuePlaceholder}
          value={typeof value === "string" ? value : value == null ? "" : String(value)}
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      )
  }
}

function RangeInputs({
  type,
  from,
  to,
  fromLabel,
  toLabel,
  onChange,
}: {
  type: "number" | "date"
  from: string
  to: string
  fromLabel: string
  toLabel: string
  onChange: (from: string, to: string) => void
}) {
  const { disabled } = useBuilder()
  return (
    <span className="flex min-w-0 items-center gap-[var(--hui-space-2)]">
      <Input
        size="sm"
        variant="borderless"
        className={cn(segment, "bg-transparent")}
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        aria-label={fromLabel}
        value={from}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value, to)}
      />
      <span aria-hidden="true" className="shrink-0 text-[var(--hui-color-foreground-base-secondary)]">
        –
      </span>
      <Input
        size="sm"
        variant="borderless"
        className={cn(segment, "bg-transparent")}
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        aria-label={toLabel}
        value={to}
        disabled={disabled}
        onChange={(event) => onChange(from, event.currentTarget.value)}
      />
    </span>
  )
}

export { QueryBuilder }
