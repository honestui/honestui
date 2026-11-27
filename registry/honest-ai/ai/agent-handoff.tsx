"use client"

import * as React from "react"
import {
  ArrowRight as ArrowRightIcon,
  Ban as BanIcon,
  ChevronDown as ChevronDownIcon,
  CircleCheck as CircleCheckIcon,
  LoaderCircle as LoaderCircleIcon,
  Paperclip as PaperclipIcon,
  Undo2 as Undo2Icon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

export type HandoffStatus = "pending" | "accepted" | "declined" | "returned"

export type HandoffAgent = {
  name: string
  /** What the agent does, such as "Billing" or "Refunds specialist". */
  role?: string
  /** An image URL. Without it, the agent's initials are shown. */
  avatar?: string
}

export type HandoffFact = {
  label: string
  value: React.ReactNode
}

export type HandoffItem = {
  name: string
  /** A short type or size, such as "PDF · 240 KB". */
  meta?: string
}

export type AgentHandoffLabels = {
  /** The card's heading for each status. */
  title: (status: HandoffStatus, from: HandoffAgent, to: HandoffAgent) => string
  statuses: Record<HandoffStatus, string>
  reason: string
  context: string
  /** The inline variant's toggle. */
  contextButton: string
  summary: string
  facts: string
  items: string
  tokens: (count: number) => string
  showContext: string
  hideContext: string
  viewFullContext: string
  accept: string
  decline: string
}

const numberFormat = new Intl.NumberFormat("en-US")

export const defaultAgentHandoffLabels: AgentHandoffLabels = {
  title: (status, from, to) =>
    status === "pending"
      ? `Handing off to ${to.name}`
      : status === "accepted"
        ? `Handed off to ${to.name}`
        : status === "declined"
          ? `${to.name} declined the handoff`
          : `${to.name} handed back to ${from.name}`,
  statuses: {
    pending: "Waiting",
    accepted: "Accepted",
    declined: "Declined",
    returned: "Returned",
  },
  reason: "Reason",
  context: "Context passed",
  contextButton: "Context",
  summary: "Summary",
  facts: "Facts",
  items: "Attached",
  tokens: (count) => `${numberFormat.format(count)} tokens`,
  showContext: "Show context",
  hideContext: "Hide context",
  viewFullContext: "View full context",
  accept: "Accept",
  decline: "Decline",
}

const rowText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"
const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

const statusIcon: Record<HandoffStatus, { Icon: typeof CircleCheckIcon; className: string }> = {
  pending: {
    Icon: LoaderCircleIcon,
    className: "text-[var(--hui-color-foreground-base-secondary)] motion-safe:animate-spin",
  },
  accepted: { Icon: CircleCheckIcon, className: "text-[var(--hui-color-foreground-base-secondary)]" },
  declined: { Icon: BanIcon, className: "text-[var(--hui-color-foreground-danger-primary)]" },
  returned: { Icon: Undo2Icon, className: "text-[var(--hui-color-foreground-base-secondary)]" },
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words.at(-1)![0] : "")).toUpperCase()
}

function AgentAvatar({ agent, size = "md" }: { agent: HandoffAgent; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      data-slot="agent-handoff-avatar"
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hui-color-background-neutral-secondary)] text-[var(--hui-color-foreground-base-primary)] outline-[0.5px] outline-[var(--hui-color-border-base-primary)] outline-offset-[-0.5px] [font-weight:var(--hui-font-weight-medium)]",
        size === "sm" ? "size-5 text-[8px]" : "size-8 text-[11px] tracking-wide"
      )}
    >
      {agent.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={agent.avatar} alt="" className="size-full object-cover" />
      ) : (
        initials(agent.name)
      )}
    </span>
  )
}

function AgentChip({ agent }: { agent: HandoffAgent }) {
  return (
    <span className="flex min-w-0 items-center gap-[var(--hui-space-3)]">
      <AgentAvatar agent={agent} />
      <span className="flex min-w-0 flex-col">
        <span className={cn("truncate [font-weight:var(--hui-font-weight-medium)]", rowText)}>{agent.name}</span>
        {agent.role && (
          <span className={cn("truncate text-[var(--hui-color-foreground-base-secondary)]", metaText)}>{agent.role}</span>
        )}
      </span>
    </span>
  )
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

export type AgentHandoffProps = Omit<React.ComponentProps<"div">, "children"> & {
  from: HandoffAgent
  to: HandoffAgent
  status: HandoffStatus
  /** Why the first agent handed the conversation over. */
  reason?: React.ReactNode
  /** What the receiving agent was told, in a sentence or two. */
  summary?: React.ReactNode
  /** Named values passed along, such as an order number or the customer's plan. */
  facts?: HandoffFact[]
  /** Files or records passed along. */
  items?: HandoffItem[]
  /** The size of the handoff payload, in tokens. */
  tokens?: number
  /** When the handoff happened, as shown text, such as "2:14 PM". */
  time?: React.ReactNode
  /** "card" is a plate in the conversation. "inline" is one line between messages. */
  variant?: "card" | "inline"
  /** Whether the context is shown. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Shows a "View full context" button, such as to open the payload in a panel. */
  onViewContext?: () => void
  /** Shows Accept and Decline while the handoff is pending. */
  onAccept?: () => void
  onDecline?: () => void
  labels?: Partial<Omit<AgentHandoffLabels, "statuses">> & { statuses?: Partial<AgentHandoffLabels["statuses"]> }
}

/**
 * The moment one agent hands a conversation to another: who handed it over,
 * who took it, why, and the context that went with it.
 */
function AgentHandoff({
  from,
  to,
  status,
  reason,
  summary,
  facts,
  items,
  tokens,
  time,
  variant = "card",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onViewContext,
  onAccept,
  onDecline,
  labels: labelsProp,
  className,
  ...props
}: AgentHandoffProps) {
  const labels = React.useMemo<AgentHandoffLabels>(
    () => ({
      ...defaultAgentHandoffLabels,
      ...labelsProp,
      statuses: { ...defaultAgentHandoffLabels.statuses, ...labelsProp?.statuses },
    }),
    [labelsProp]
  )
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange)
  const panelId = React.useId()
  const titleId = React.useId()
  const title = labels.title(status, from, to)
  const { Icon: StatusIcon, className: statusClassName } = statusIcon[status]
  const hasContext = Boolean(summary || facts?.length || items?.length)
  const showDecision = status === "pending" && (onAccept || onDecline)

  const context = hasContext && (
    <div
      id={panelId}
      data-slot="agent-handoff-context"
      className="flex min-w-0 flex-col gap-[var(--hui-space-5)]"
    >
      {summary && (
        <div className="flex min-w-0 flex-col gap-[var(--hui-space-2)]">
          <span className={cn("text-[var(--hui-color-foreground-base-secondary)]", metaText)}>{labels.summary}</span>
          <p className={cn("m-0 text-pretty", rowText)}>{summary}</p>
        </div>
      )}
      {facts && facts.length > 0 && (
        <div className="flex min-w-0 flex-col gap-[var(--hui-space-2)]">
          <span className={cn("text-[var(--hui-color-foreground-base-secondary)]", metaText)}>{labels.facts}</span>
          <dl className="m-0 flex min-w-0 flex-col overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)]">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex min-w-0 items-baseline gap-[var(--hui-space-4)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)] last:border-b-0"
              >
                <dt className={cn("w-2/5 shrink-0 truncate text-[var(--hui-color-foreground-base-secondary)]", metaText)}>
                  {fact.label}
                </dt>
                <dd className={cn("m-0 min-w-0 break-words tabular-nums", metaText, "text-[var(--hui-color-foreground-base-primary)]")}>
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      {items && items.length > 0 && (
        <div className="flex min-w-0 flex-col gap-[var(--hui-space-2)]">
          <span className={cn("text-[var(--hui-color-foreground-base-secondary)]", metaText)}>{labels.items}</span>
          <ul role="list" className="m-0 flex min-w-0 list-none flex-wrap gap-[var(--hui-space-2)] p-0">
            {items.map((item) => (
              <li
                key={item.name}
                className={cn(
                  "flex max-w-full min-w-0 items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-3)] py-[var(--hui-space-1)]",
                  metaText
                )}
              >
                <PaperclipIcon aria-hidden="true" className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]" />
                <span className="min-w-0 truncate">{item.name}</span>
                {item.meta && <span className="shrink-0 text-[var(--hui-color-foreground-base-secondary)] tabular-nums">{item.meta}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  const toggle = hasContext && (
    <Button
      variant="ghost"
      size={variant === "inline" ? "xs" : "sm"}
      aria-expanded={open}
      aria-controls={open ? panelId : undefined}
      onClick={() => setOpen(!open)}
      className="text-[var(--hui-color-foreground-base-secondary)]"
    >
      {variant === "inline" ? labels.contextButton : open ? labels.hideContext : labels.showContext}
      <ChevronDownIcon aria-hidden="true" className={cn("motion-safe:transition-transform", open && "rotate-180")} />
    </Button>
  )

  if (variant === "inline") {
    return (
      <div
        role="group"
        aria-labelledby={titleId}
        data-slot="agent-handoff"
        data-variant="inline"
        data-status={status}
        className={cn("not-prose flex w-full min-w-0 flex-col gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)]", className)}
        {...props}
      >
        <div className="flex min-w-0 items-center gap-[var(--hui-space-4)]">
          <span aria-hidden="true" className="h-0 min-w-[var(--hui-space-5)] flex-1 border-t-[0.5px] border-[var(--hui-color-border-base-primary)]" />
          <span className="flex min-w-0 items-center gap-[var(--hui-space-2)]">
            <AgentAvatar agent={from} size="sm" />
            <ArrowRightIcon aria-hidden="true" className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)] rtl:-scale-x-100" />
            <AgentAvatar agent={to} size="sm" />
            <span id={titleId} className={cn("ms-[var(--hui-space-1)] min-w-0 truncate text-[var(--hui-color-foreground-base-secondary)]", metaText)}>
              {title}
              {time && <span className="tabular-nums"> · {time}</span>}
            </span>
            {status === "declined" && <span className="sr-only">, {labels.statuses.declined}</span>}
            {status === "declined" && (
              <BanIcon aria-hidden="true" className="size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]" />
            )}
          </span>
          {toggle && <span className="shrink-0">{toggle}</span>}
          <span aria-hidden="true" className="h-0 min-w-[var(--hui-space-5)] flex-1 border-t-[0.5px] border-[var(--hui-color-border-base-primary)]" />
        </div>
        {open && hasContext && (
          <div className="mx-auto w-full max-w-md min-w-0 rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-5)] shadow-[var(--hui-shadow-feather)]">
            {reason && (
              <p className={cn("m-0 mb-[var(--hui-space-5)] text-pretty text-[var(--hui-color-foreground-base-secondary)]", rowText)}>{reason}</p>
            )}
            {context}
          </div>
        )}
      </div>
    )
  }

  return (
    <section
      aria-labelledby={titleId}
      data-slot="agent-handoff"
      data-variant="card"
      data-status={status}
      className={cn(
        "not-prose w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-[var(--hui-space-3)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)]">
        <span id={titleId} className={cn("min-w-0 flex-1 truncate [font-weight:var(--hui-font-weight-medium)]", rowText)}>
          {title}
        </span>
        <span
          data-slot="agent-handoff-status"
          className={cn(
            "flex shrink-0 items-center gap-[var(--hui-space-2)] tabular-nums",
            metaText,
            status === "declined" ? "text-[var(--hui-color-foreground-danger-primary)]" : "text-[var(--hui-color-foreground-base-secondary)]"
          )}
        >
          <StatusIcon aria-hidden="true" className={cn("size-3.5", statusClassName)} />
          {labels.statuses[status]}
          {time && <span className="text-[var(--hui-color-foreground-base-secondary)]">· {time}</span>}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-[var(--hui-space-5)] p-[var(--hui-space-5)]">
        <div className="flex min-w-0 flex-wrap items-center gap-x-[var(--hui-space-5)] gap-y-[var(--hui-space-3)]">
          <AgentChip agent={from} />
          <ArrowRightIcon aria-hidden="true" className="size-4 shrink-0 text-[var(--hui-color-foreground-base-tertiary)] rtl:-scale-x-100" />
          <AgentChip agent={to} />
        </div>

        {reason && (
          <div className="flex min-w-0 flex-col gap-[var(--hui-space-2)]">
            <span className={cn("text-[var(--hui-color-foreground-base-secondary)]", metaText)}>{labels.reason}</span>
            <p className={cn("m-0 text-pretty", rowText)}>{reason}</p>
          </div>
        )}

        {open && context}
      </div>

      {(hasContext || onViewContext || showDecision || tokens !== undefined) && (
        <div className="flex min-w-0 flex-wrap items-center gap-[var(--hui-space-3)] border-t-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]">
          {toggle}
          {tokens !== undefined && (
            <span className={cn("text-[var(--hui-color-foreground-base-secondary)] tabular-nums", metaText)}>
              {labels.context} · {labels.tokens(tokens)}
            </span>
          )}
          <span className="flex-1" />
          {onViewContext && (
            <Button variant="ghost" size="sm" onClick={onViewContext}>
              {labels.viewFullContext}
            </Button>
          )}
          {showDecision && onDecline && (
            <Button variant="secondary" size="sm" onClick={onDecline}>
              {labels.decline}
            </Button>
          )}
          {showDecision && onAccept && (
            <Button size="sm" onClick={onAccept}>
              {labels.accept}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}

export { AgentHandoff }
