"use client"

import * as React from "react"
import {
  Bot as BotIcon,
  ChevronRight as ChevronRightIcon,
  CircleAlert as CircleAlertIcon,
  Database as DatabaseIcon,
  Layers as LayersIcon,
  LoaderCircle as LoaderCircleIcon,
  Sparkles as SparklesIcon,
  Workflow as WorkflowIcon,
  Wrench as WrenchIcon,
  X as XIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"

export type TraceSpanKind = "run" | "llm" | "tool" | "retrieval" | "agent" | "chain"

export type TraceSpanStatus = "running" | "ok" | "error"

export type TraceSpanTokens = {
  input?: number
  output?: number
}

export type TraceSpan = {
  id: string
  name: string
  kind?: TraceSpanKind
  /** Defaults to "running" while `end` is missing, else "ok". */
  status?: TraceSpanStatus
  /** When the span started, in milliseconds. Any clock works if every span uses the same one. */
  start: number
  /** When the span ended. Leave it out while the span is running. */
  end?: number
  /** The model an LLM span called. */
  model?: string
  tokens?: TraceSpanTokens
  /** What the span cost, in the currency `labels.formatCost` writes. */
  cost?: number
  /** What went in, such as a prompt or tool arguments. A string is shown as preformatted text. */
  input?: React.ReactNode
  /** What came out. A string is shown as preformatted text. */
  output?: React.ReactNode
  /** Why the span failed. */
  error?: string
  /** Extra facts, such as a temperature or a document count. */
  attributes?: Record<string, string | number | boolean>
  children?: TraceSpan[]
}

/** A span as most tracing tools export it: flat, pointing at its parent. */
export type FlatTraceSpan = Omit<TraceSpan, "children"> & {
  parentId?: string | null
}

/**
 * Nests flat spans under their parents, keeping each level in start order.
 * A span whose parent is not in the list becomes a root.
 */
export function buildTraceTree(spans: FlatTraceSpan[]): TraceSpan[] {
  const nodes = new Map<string, TraceSpan>()
  for (const { parentId: _parentId, ...span } of spans) {
    void _parentId
    nodes.set(span.id, { ...span, children: [] })
  }
  const roots: TraceSpan[] = []
  for (const span of spans) {
    const node = nodes.get(span.id)!
    const parent = span.parentId ? nodes.get(span.parentId) : undefined
    if (parent && parent !== node) parent.children!.push(node)
    else roots.push(node)
  }
  const sort = (list: TraceSpan[]) => {
    list.sort((a, b) => a.start - b.start)
    for (const node of list) {
      if (node.children?.length) sort(node.children)
      else delete node.children
    }
  }
  sort(roots)
  return roots
}

export type TraceWaterfallLabels = {
  trace: string
  span: string
  timeline: string
  duration: string
  tokens: string
  cost: string
  spans: string
  model: string
  started: string
  inputTokens: string
  outputTokens: string
  input: string
  output: string
  error: string
  attributes: string
  closeDetail: string
  kinds: Record<TraceSpanKind, string>
  statuses: Record<TraceSpanStatus, string>
  formatDuration: (ms: number) => string
  /** Writes a tick on the time axis, such as "2s". */
  formatTick: (ms: number) => string
  formatTokens: (count: number) => string
  formatCost: (amount: number) => string
  /** Read for a row's tokens, such as "812 input tokens, 96 output tokens". */
  tokensDescription: (input: number | undefined, output: number | undefined) => string
}

function defaultFormatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return "0ms"
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 10_000) return `${(ms / 1000).toFixed(2)}s`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.round((ms % 60_000) / 1000)
  return `${minutes}m ${seconds}s`
}

const numberFormat = new Intl.NumberFormat("en-US")
const costFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumSignificantDigits: 3,
})

export const defaultTraceWaterfallLabels: TraceWaterfallLabels = {
  trace: "Trace",
  span: "Span",
  timeline: "Timeline",
  duration: "Duration",
  tokens: "Tokens",
  cost: "Cost",
  spans: "Spans",
  model: "Model",
  started: "Started",
  inputTokens: "Input tokens",
  outputTokens: "Output tokens",
  input: "Input",
  output: "Output",
  error: "Error",
  attributes: "Attributes",
  closeDetail: "Close span details",
  kinds: {
    run: "Run",
    llm: "LLM call",
    tool: "Tool call",
    retrieval: "Retrieval",
    agent: "Agent",
    chain: "Step",
  },
  statuses: {
    running: "Running",
    ok: "Completed",
    error: "Failed",
  },
  formatDuration: defaultFormatDuration,
  formatTick: (ms) => (ms === 0 ? "0" : ms < 1000 ? `${Math.round(ms)}ms` : `${Number((ms / 1000).toFixed(2))}s`),
  formatTokens: (count) => numberFormat.format(count),
  formatCost: (amount) => (amount > 0 && amount < 0.01 ? `$${amount.toPrecision(2)}` : costFormat.format(amount)),
  tokensDescription: (input, output) =>
    [
      input !== undefined ? `${numberFormat.format(input)} input tokens` : null,
      output !== undefined ? `${numberFormat.format(output)} output tokens` : null,
    ]
      .filter(Boolean)
      .join(", "),
}

const kindIcon: Record<TraceSpanKind, typeof BotIcon> = {
  run: LayersIcon,
  llm: SparklesIcon,
  tool: WrenchIcon,
  retrieval: DatabaseIcon,
  agent: BotIcon,
  chain: WorkflowIcon,
}

const rowText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"
const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const monoText =
  "font-mono [font-size:var(--hui-font-size-mono-small)] [line-height:var(--hui-line-height-mono-small)]"

// Name, timeline, duration, tokens. Narrow traces drop tokens, then the timeline.
const columns =
  "grid grid-cols-[minmax(0,1fr)_4rem] @min-[28rem]/trace:grid-cols-[minmax(8.5rem,36%)_minmax(0,1fr)_4rem] @min-[34rem]/trace:grid-cols-[minmax(9rem,38%)_minmax(0,1fr)_4rem_5.5rem]"
const timelineCell = "hidden @min-[28rem]/trace:block"
const tokensCell = "hidden @min-[34rem]/trace:block"

type FlatItem = {
  span: TraceSpan
  level: number
  parentId: string | null
  setSize: number
  posInSet: number
  hasChildren: boolean
}

function flatten(spans: TraceSpan[], level = 1, parentId: string | null = null, out: FlatItem[] = []) {
  spans.forEach((span, index) => {
    const hasChildren = Boolean(span.children?.length)
    out.push({ span, level, parentId, setSize: spans.length, posInSet: index + 1, hasChildren })
    if (span.children) flatten(span.children, level + 1, span.id, out)
  })
  return out
}

function statusOf(span: TraceSpan): TraceSpanStatus {
  return span.status ?? (span.end === undefined ? "running" : "ok")
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (value: T) => void) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const current = value !== undefined ? value : uncontrolled
  const set = React.useCallback(
    (next: T) => {
      if (value === undefined) setUncontrolled(next)
      onChange?.(next)
    },
    [value, onChange]
  )
  return [current, set] as const
}

/** A tick step of 1, 2, or 5 times a power of ten that gives about four ticks. */
function tickStep(total: number) {
  if (total <= 0) return 1
  const rough = total / 4
  const power = 10 ** Math.floor(Math.log10(rough))
  const scaled = rough / power
  return (scaled < 1.5 ? 1 : scaled < 3.5 ? 2 : scaled < 7.5 ? 5 : 10) * power
}

export type TraceWaterfallProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The trace's top-level spans, nested through `children`. Use `buildTraceTree` for flat spans. */
  spans: TraceSpan[]
  /** A heading above the totals, such as the run's name. */
  title?: React.ReactNode
  /** The current time on the spans' clock. Running spans extend to it. */
  now?: number
  /** The ids of open spans. Every span with children starts open. */
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
  /** The id of the span whose details are shown. */
  selectedId?: string | null
  defaultSelectedId?: string | null
  onSelectedIdChange?: (id: string | null, span: TraceSpan | null) => void
  /** Replaces the built-in detail panel. Return null to show nothing. */
  renderDetail?: (span: TraceSpan) => React.ReactNode
  labels?: Partial<Omit<TraceWaterfallLabels, "kinds" | "statuses">> & {
    kinds?: Partial<TraceWaterfallLabels["kinds"]>
    statuses?: Partial<TraceWaterfallLabels["statuses"]>
  }
}

/**
 * The spans of an agent run on one time axis: each row a model call, tool
 * call, retrieval, or sub-agent, with its latency and tokens. Choosing a span
 * shows what went in and what came out.
 */
function TraceWaterfall({
  spans,
  title,
  now,
  expanded: expandedProp,
  defaultExpanded,
  onExpandedChange,
  selectedId: selectedProp,
  defaultSelectedId = null,
  onSelectedIdChange,
  renderDetail,
  labels: labelsProp,
  className,
  ...props
}: TraceWaterfallProps) {
  const labels = React.useMemo<TraceWaterfallLabels>(
    () => ({
      ...defaultTraceWaterfallLabels,
      ...labelsProp,
      kinds: { ...defaultTraceWaterfallLabels.kinds, ...labelsProp?.kinds },
      statuses: { ...defaultTraceWaterfallLabels.statuses, ...labelsProp?.statuses },
    }),
    [labelsProp]
  )

  const all = React.useMemo(() => flatten(spans), [spans])
  const byId = React.useMemo(() => new Map(all.map((item) => [item.span.id, item])), [all])
  const parentIds = React.useMemo(() => all.filter((item) => item.hasChildren).map((item) => item.span.id), [all])

  const [expandedList, setExpandedList] = useControllable(expandedProp, defaultExpanded ?? parentIds, onExpandedChange)
  const expanded = React.useMemo(() => new Set(expandedList), [expandedList])
  const [selectedId, setSelectedId] = useControllable<string | null>(selectedProp, defaultSelectedId)
  const selectedSpan = selectedId ? byId.get(selectedId)?.span ?? null : null

  // The axis runs from the first start to the last end, or to now while spans run.
  const { origin, total } = React.useMemo(() => {
    if (all.length === 0) return { origin: 0, total: 0 }
    let first = Infinity
    let last = -Infinity
    for (const { span } of all) {
      first = Math.min(first, span.start)
      last = Math.max(last, span.end ?? span.start, span.end === undefined && now !== undefined ? now : -Infinity)
    }
    return { origin: first, total: Math.max(0, last - first) }
  }, [all, now])
  const endOf = (span: TraceSpan) => span.end ?? Math.max(span.start, now ?? origin + total)

  const totals = React.useMemo(() => {
    let input = 0
    let output = 0
    let cost = 0
    let hasTokens = false
    let hasCost = false
    let running = false
    let failed = false
    for (const { span, hasChildren } of all) {
      const status = statusOf(span)
      if (status === "running") running = true
      if (status === "error") failed = true
      // Parents usually report their children's sum, so only leaves are counted.
      if (hasChildren) continue
      if (span.tokens) {
        hasTokens = true
        input += span.tokens.input ?? 0
        output += span.tokens.output ?? 0
      }
      if (span.cost !== undefined) {
        hasCost = true
        cost += span.cost
      }
    }
    const status: TraceSpanStatus = running ? "running" : failed ? "error" : "ok"
    return { input, output, cost, hasTokens, hasCost, status }
  }, [all])

  const ticks = React.useMemo(() => {
    if (total <= 0) return []
    const step = tickStep(total)
    const out: number[] = []
    for (let value = 0; value <= total + step * 0.001; value += step) out.push(value)
    return out
  }, [total])

  const visible = React.useMemo(
    () =>
      all.filter((item) => {
        let parent = item.parentId
        while (parent) {
          if (!expanded.has(parent)) return false
          parent = byId.get(parent)?.parentId ?? null
        }
        return true
      }),
    [all, byId, expanded]
  )

  const [activeId, setActiveId] = React.useState<string | null>(null)
  const tabId =
    (activeId && visible.some((item) => item.span.id === activeId) && activeId) ||
    (selectedId && visible.some((item) => item.span.id === selectedId) && selectedId) ||
    visible[0]?.span.id
  const itemRefs = React.useRef(new Map<string, HTMLLIElement>())
  const focusItem = (id: string | undefined) => {
    if (!id) return
    setActiveId(id)
    itemRefs.current.get(id)?.focus()
  }

  const setOpen = (id: string, open: boolean) => {
    if (expanded.has(id) === open) return
    setExpandedList(open ? [...expandedList, id] : expandedList.filter((value) => value !== id))
  }
  const select = (id: string | null) => {
    setSelectedId(id)
    onSelectedIdChange?.(id, id ? byId.get(id)?.span ?? null : null)
  }

  const onKeyDown = (event: React.KeyboardEvent, item: FlatItem) => {
    const index = visible.findIndex((entry) => entry.span.id === item.span.id)
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
    const forward = rtl ? "ArrowLeft" : "ArrowRight"
    const back = rtl ? "ArrowRight" : "ArrowLeft"
    let handled = true
    switch (event.key) {
      case "ArrowDown":
        focusItem(visible[index + 1]?.span.id)
        break
      case "ArrowUp":
        focusItem(visible[index - 1]?.span.id)
        break
      case "Home":
        focusItem(visible[0]?.span.id)
        break
      case "End":
        focusItem(visible.at(-1)?.span.id)
        break
      case forward:
        if (item.hasChildren) {
          if (!expanded.has(item.span.id)) setOpen(item.span.id, true)
          else focusItem(visible[index + 1]?.span.id)
        }
        break
      case back:
        if (item.hasChildren && expanded.has(item.span.id)) setOpen(item.span.id, false)
        else if (item.parentId) focusItem(item.parentId)
        break
      case "Enter":
      case " ":
        select(selectedId === item.span.id ? null : item.span.id)
        break
      case "Escape":
        if (selectedId) select(null)
        else handled = false
        break
      case "*": {
        const closed = all.filter((entry) => entry.parentId === item.parentId && entry.hasChildren && !expanded.has(entry.span.id))
        if (closed.length) setExpandedList([...expandedList, ...closed.map((entry) => entry.span.id)])
        break
      }
      default:
        handled = false
    }
    if (handled) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const titleId = React.useId()
  const percent = (value: number) => (total > 0 ? (value / total) * 100 : 0)

  const renderRows = (list: TraceSpan[]): React.ReactNode =>
    list.map((span) => {
      const item = byId.get(span.id)
      if (!item) return null
      const open = item.hasChildren && expanded.has(span.id)
      const isSelected = selectedId === span.id
      const status = statusOf(span)
      const kind = span.kind ?? "chain"
      const Icon = kindIcon[kind]
      const end = endOf(span)
      const duration = Math.max(0, end - span.start)
      const left = percent(span.start - origin)
      const width = percent(duration)
      // The chosen row's fill is darker, so its numbers move to the primary color to keep their contrast.
      const rowMeta = isSelected
        ? "text-[var(--hui-color-foreground-base-primary)]"
        : "text-[var(--hui-color-foreground-base-secondary)]"
      const tokensText = span.tokens ? labels.tokensDescription(span.tokens.input, span.tokens.output) : ""

      return (
        <li
          key={span.id}
          ref={(element) => {
            if (element) itemRefs.current.set(span.id, element)
            else itemRefs.current.delete(span.id)
          }}
          role="treeitem"
          data-slot="trace-waterfall-span"
          data-kind={kind}
          data-status={status}
          aria-level={item.level}
          aria-setsize={item.setSize}
          aria-posinset={item.posInSet}
          aria-selected={isSelected}
          aria-expanded={item.hasChildren ? open : undefined}
          tabIndex={tabId === span.id ? 0 : -1}
          onFocus={(event) => {
            if (event.target === event.currentTarget) setActiveId(span.id)
          }}
          onKeyDown={(event) => {
            if (event.target === event.currentTarget) onKeyDown(event, item)
          }}
          onClick={(event) => {
            event.stopPropagation()
            focusItem(span.id)
            select(isSelected ? null : span.id)
          }}
          className="group/span list-none outline-none"
        >
          <div
            className={cn(
              columns,
              "relative min-h-9 cursor-pointer items-center gap-x-[var(--hui-space-4)] px-[var(--hui-space-5)] select-none",
              "hover:bg-[var(--hui-color-background-base-primary-hover)]",
              isSelected && "bg-[var(--hui-color-background-neutral-secondary)] hover:bg-[var(--hui-color-background-neutral-secondary-hover)]",
              "group-focus-visible/span:[outline:var(--hui-focus-ring)] group-focus-visible/span:outline-offset-[var(--hui-focus-ring-offset-inset)]"
            )}
          >
            <div
              className="flex min-w-0 items-center gap-[var(--hui-space-2)]"
              style={{ paddingInlineStart: `${(item.level - 1) * 14}px` }}
            >
              <span
                aria-hidden="true"
                onClick={(event) => {
                  if (!item.hasChildren) return
                  event.stopPropagation()
                  focusItem(span.id)
                  setOpen(span.id, !open)
                }}
                className={cn(
                  "-ms-1 flex size-5 shrink-0 items-center justify-center rounded-[var(--hui-radius-1)]",
                  item.hasChildren && "hover:bg-[var(--hui-color-background-neutral-tertiary)]"
                )}
              >
                {item.hasChildren && (
                  <ChevronRightIcon
                    className={cn(
                      "size-3.5 text-[var(--hui-color-foreground-base-tertiary)] motion-safe:transition-transform rtl:-scale-x-100",
                      open && "rotate-90 rtl:scale-x-100"
                    )}
                  />
                )}
              </span>
              {status === "error" ? (
                <CircleAlertIcon aria-hidden="true" className="size-4 shrink-0 text-[var(--hui-color-foreground-danger-primary)]" />
              ) : status === "running" ? (
                <LoaderCircleIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-[var(--hui-color-foreground-base-secondary)] motion-safe:animate-spin"
                />
              ) : (
                <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]" />
              )}
              <span title={span.name} className={cn("min-w-0 truncate", rowText, item.level === 1 && "[font-weight:var(--hui-font-weight-medium)]")}>
                {span.name}
              </span>
              <span className="sr-only">
                , {labels.kinds[kind]}
                {status !== "ok" ? `, ${labels.statuses[status]}` : ""}
              </span>
            </div>

            <div aria-hidden="true" className={cn(timelineCell, "relative h-5 min-w-0")}>
              {ticks.slice(1).map((tick) => (
                <span
                  key={tick}
                  className="absolute inset-y-[-8px] w-0 border-s-[0.5px] border-dashed border-[var(--hui-color-border-base-primary)]"
                  style={{ insetInlineStart: `${percent(tick)}%` }}
                />
              ))}
              <span
                data-slot="trace-waterfall-bar"
                className={cn(
                  "absolute top-1/2 h-2 min-w-[3px] -translate-y-1/2 rounded-full",
                  status === "error"
                    ? "bg-[var(--hui-color-foreground-danger-primary)]"
                    : isSelected
                      ? "bg-[var(--hui-color-foreground-base-primary)]"
                      : item.level === 1
                        ? "bg-[var(--hui-color-foreground-base-tertiary)] opacity-60"
                        : "bg-[var(--hui-color-foreground-base-secondary)] opacity-80",
                  status === "running" && "motion-safe:animate-pulse"
                )}
                style={{ insetInlineStart: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
              />
            </div>

            <span className={cn("text-end tabular-nums", rowMeta, metaText)}>
              {labels.formatDuration(duration)}
            </span>
            <span className={cn(tokensCell, "text-end tabular-nums", rowMeta, metaText)}>
              {span.tokens ? (
                <>
                  <span aria-hidden="true">
                    {span.tokens.input !== undefined ? labels.formatTokens(span.tokens.input) : "–"}
                    <span className="px-1 opacity-70">/</span>
                    {span.tokens.output !== undefined ? labels.formatTokens(span.tokens.output) : "–"}
                  </span>
                  <span className="sr-only">, {tokensText}</span>
                </>
              ) : null}
            </span>
          </div>
          {open && span.children && (
            <ul role="group" className="m-0 p-0">
              {renderRows(span.children)}
            </ul>
          )}
        </li>
      )
    })

  const stats: { label: string; value: string }[] = [
    { label: labels.duration, value: labels.formatDuration(total) },
    ...(totals.hasTokens
      ? [{ label: labels.tokens, value: labels.formatTokens(totals.input + totals.output) }]
      : []),
    ...(totals.hasCost ? [{ label: labels.cost, value: labels.formatCost(totals.cost) }] : []),
    { label: labels.spans, value: labels.formatTokens(all.length) },
  ]

  const detail = selectedSpan
    ? renderDetail
      ? renderDetail(selectedSpan)
      : <TraceSpanDetail span={selectedSpan} origin={origin} end={endOf(selectedSpan)} labels={labels} onClose={() => select(null)} />
    : null

  return (
    <div
      data-slot="trace-waterfall"
      data-status={totals.status}
      className={cn(
        "@container/trace not-prose w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-[var(--hui-space-4)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] pt-[var(--hui-space-5)] pb-[var(--hui-space-4)]">
        <div className="flex min-w-0 items-center gap-[var(--hui-space-3)]">
          <span id={titleId} className={cn("min-w-0 flex-1 truncate [font-weight:var(--hui-font-weight-medium)]", rowText)}>
            {title ?? labels.trace}
          </span>
          <span
            data-slot="trace-waterfall-status"
            className={cn(
              "flex shrink-0 items-center gap-[var(--hui-space-2)]",
              metaText,
              totals.status === "error" ? "text-[var(--hui-color-foreground-danger-primary)]" : "text-[var(--hui-color-foreground-base-secondary)]"
            )}
          >
            {totals.status === "running" && (
              <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--hui-color-foreground-base-secondary)] motion-safe:animate-pulse" />
            )}
            {totals.status === "error" && <CircleAlertIcon aria-hidden="true" className="size-3.5" />}
            {labels.statuses[totals.status]}
          </span>
        </div>
        <dl data-slot="trace-waterfall-totals" className="m-0 flex min-w-0 flex-wrap gap-x-[var(--hui-space-7)] gap-y-[var(--hui-space-3)]">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-w-0 flex-col gap-[var(--hui-space-1)]">
              <dt className={cn("text-[var(--hui-color-foreground-base-secondary)]", metaText)}>{stat.label}</dt>
              <dd className={cn("m-0 [font-weight:var(--hui-font-weight-medium)] tabular-nums", rowText)}>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div
        aria-hidden="true"
        className={cn(
          columns,
          "min-h-8 items-center gap-x-[var(--hui-space-4)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] text-[var(--hui-color-foreground-base-secondary)]",
          metaText
        )}
      >
        <span>{labels.span}</span>
        <span className={cn(timelineCell, "relative h-4 min-w-0")}>
          {ticks.map((tick, index) => (
            <span
              key={tick}
              className={cn(
                "absolute top-0 tabular-nums whitespace-nowrap",
                index === 0 ? "" : index === ticks.length - 1 && percent(tick) > 92 ? "-translate-x-full rtl:translate-x-full" : "-translate-x-1/2 rtl:translate-x-1/2"
              )}
              style={{ insetInlineStart: `${percent(tick)}%` }}
            >
              {labels.formatTick(tick)}
            </span>
          ))}
        </span>
        <span className="text-end">{labels.duration}</span>
        <span className={cn(tokensCell, "text-end")}>{labels.tokens}</span>
      </div>

      <ul role="tree" aria-labelledby={titleId} className="m-0 p-0 py-[var(--hui-space-2)]">
        {renderRows(spans)}
      </ul>

      {detail && (
        <div data-slot="trace-waterfall-detail" className="border-t-[0.5px] border-[var(--hui-color-border-base-primary)]">
          {detail}
        </div>
      )}
    </div>
  )
}

function Preview({ value }: { value: React.ReactNode }) {
  if (typeof value === "string") {
    return (
      <pre
        className={cn(
          "m-0 max-h-40 overflow-auto rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)] whitespace-pre-wrap break-words text-[var(--hui-color-foreground-base-primary)]",
          monoText
        )}
      >
        {value}
      </pre>
    )
  }
  return <div className="min-w-0">{value}</div>
}

function TraceSpanDetail({
  span,
  origin,
  end,
  labels,
  onClose,
}: {
  span: TraceSpan
  origin: number
  end: number
  labels: TraceWaterfallLabels
  onClose: () => void
}) {
  const status = statusOf(span)
  const kind = span.kind ?? "chain"
  const Icon = kindIcon[kind]
  const headingId = React.useId()

  const facts: { label: string; value: string }[] = [
    { label: labels.started, value: `+${labels.formatDuration(span.start - origin)}` },
    { label: labels.duration, value: labels.formatDuration(Math.max(0, end - span.start)) },
    ...(span.model ? [{ label: labels.model, value: span.model }] : []),
    ...(span.tokens?.input !== undefined ? [{ label: labels.inputTokens, value: labels.formatTokens(span.tokens.input) }] : []),
    ...(span.tokens?.output !== undefined ? [{ label: labels.outputTokens, value: labels.formatTokens(span.tokens.output) }] : []),
    ...(span.cost !== undefined ? [{ label: labels.cost, value: labels.formatCost(span.cost) }] : []),
  ]
  const attributes = Object.entries(span.attributes ?? {})

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-[var(--hui-space-5)] p-[var(--hui-space-5)]">
      <div className="flex min-w-0 items-center gap-[var(--hui-space-3)]">
        <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]" />
        <span id={headingId} className={cn("min-w-0 flex-1 truncate [font-weight:var(--hui-font-weight-medium)]", rowText)}>
          {span.name}
        </span>
        <span
          className={cn(
            "shrink-0",
            metaText,
            status === "error" ? "text-[var(--hui-color-foreground-danger-primary)]" : "text-[var(--hui-color-foreground-base-secondary)]"
          )}
        >
          {labels.kinds[kind]} · {labels.statuses[status]}
        </span>
        <Button variant="ghost" size="icon-sm" aria-label={labels.closeDetail} onClick={onClose} className="-me-1 shrink-0">
          <XIcon aria-hidden="true" />
        </Button>
      </div>

      <dl className="m-0 grid min-w-0 grid-cols-2 gap-x-[var(--hui-space-6)] gap-y-[var(--hui-space-4)] @min-[28rem]/trace:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="flex min-w-0 flex-col gap-[var(--hui-space-1)]">
            <dt className={cn("text-[var(--hui-color-foreground-base-secondary)]", metaText)}>{fact.label}</dt>
            <dd className={cn("m-0 truncate tabular-nums", rowText)} title={fact.value}>
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>

      {span.error && (
        <div className="flex min-w-0 flex-col gap-[var(--hui-space-2)]">
          <span className={cn("text-[var(--hui-color-foreground-danger-primary)]", metaText)}>{labels.error}</span>
          <pre
            className={cn(
              "m-0 overflow-auto rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-danger-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)] whitespace-pre-wrap break-words text-[var(--hui-color-foreground-base-primary)]",
              monoText
            )}
          >
            {span.error}
          </pre>
        </div>
      )}

      {span.input !== undefined && (
        <div className="flex min-w-0 flex-col gap-[var(--hui-space-2)]">
          <span className={cn("text-[var(--hui-color-foreground-base-secondary)]", metaText)}>{labels.input}</span>
          <Preview value={span.input} />
        </div>
      )}
      {span.output !== undefined && (
        <div className="flex min-w-0 flex-col gap-[var(--hui-space-2)]">
          <span className={cn("text-[var(--hui-color-foreground-base-secondary)]", metaText)}>{labels.output}</span>
          <Preview value={span.output} />
        </div>
      )}

      {attributes.length > 0 && (
        <div className="flex min-w-0 flex-col gap-[var(--hui-space-2)]">
          <span className={cn("text-[var(--hui-color-foreground-base-secondary)]", metaText)}>{labels.attributes}</span>
          <dl className="m-0 flex min-w-0 flex-col">
            {attributes.map(([key, value]) => (
              <div
                key={key}
                className="flex min-w-0 items-baseline gap-[var(--hui-space-4)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] py-[var(--hui-space-2)] last:border-b-0"
              >
                <dt className={cn("w-2/5 shrink-0 truncate text-[var(--hui-color-foreground-base-secondary)]", monoText)}>{key}</dt>
                <dd className={cn("m-0 min-w-0 break-words", monoText)}>{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}

export { TraceWaterfall }
