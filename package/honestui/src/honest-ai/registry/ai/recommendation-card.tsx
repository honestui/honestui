"use client"

import * as React from "react"
import {
  ChevronDown as ChevronDownIcon,
  CircleAlert as CircleAlertIcon,
  CircleCheck as CircleCheckIcon,
  LoaderCircle as LoaderCircleIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "../../components/ui/collapsible.js"

export type RecommendationOption = {
  id: string
  /** The recommendation in full, shown while this option is selected. */
  body: React.ReactNode
  /** One line for the list of alternatives. */
  summary: string
  /** How strong the evidence is, from 0 (none) to 3 (high). */
  confidence: 0 | 1 | 2 | 3
  /** The confidence in words, such as "High confidence". Always shown beside the meter. */
  confidenceLabel: string
  /** The accept button's text for this option. */
  actionLabel: string
}

export type RecommendationCardLabels = {
  alternatives: string
  otherOptions: string
  /** Marks the agent's first choice once another option is in view. */
  recommended: string
  accepting: string
  accepted: string
  error: string
}

export const defaultRecommendationCardLabels: RecommendationCardLabels = {
  alternatives: "Alternatives",
  otherOptions: "Other options",
  recommended: "Recommended",
  accepting: "Working…",
  accepted: "Accepted.",
  error: "This was not accepted. Try again.",
}

const regularText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

const divider = "border-t-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)]"

// Rising bars, so the scale reads even when every bar is filled.
const meterBars = [
  { level: 1, height: "h-1.5" },
  { level: 2, height: "h-2" },
  { level: 3, height: "h-2.5" },
]

function ConfidenceMeter({ level }: { level: number }) {
  return (
    <span aria-hidden="true" className="flex h-2.5 shrink-0 items-end gap-0.5">
      {meterBars.map((bar) => (
        <span
          key={bar.level}
          className={cn(
            "w-1 rounded-[var(--hui-radius-full)]",
            bar.height,
            bar.level <= level
              ? "bg-[var(--hui-color-foreground-base-secondary)]"
              : "bg-[var(--hui-color-border-base-secondary)]"
          )}
        />
      ))}
    </span>
  )
}

export type RecommendationCardProps = Omit<React.ComponentProps<"div">, "children" | "title"> & {
  /** The question the agent is asking, such as "Place this restock order?". */
  title: string
  /** The first option is the recommendation. The rest are alternatives. */
  options: RecommendationOption[]
  /**
   * Receives the chosen option. Return a promise to show progress; if it
   * rejects, the card shows an error and the choice can be made again.
   */
  onAccept: (option: RecommendationOption) => void | Promise<void>
  labels?: Partial<RecommendationCardLabels>
}

/**
 * One recommended action with its confidence stated, and the alternatives a
 * press away. Nothing happens until the person accepts an option.
 */
function RecommendationCard({
  title,
  options,
  onAccept,
  labels: labelsProp,
  className,
  ...props
}: RecommendationCardProps) {
  const labels = React.useMemo(
    () => ({ ...defaultRecommendationCardLabels, ...labelsProp }),
    [labelsProp]
  )
  const [selectedId, setSelectedId] = React.useState(options[0]?.id)
  const [phase, setPhase] = React.useState<"idle" | "accepting" | "accepted" | "error">("idle")
  const selected = options.find((option) => option.id === selectedId) ?? options[0]
  const others = options.filter((option) => option !== selected)
  const isLocked = phase === "accepting" || phase === "accepted"
  const acceptRef = React.useRef<HTMLButtonElement>(null)
  // Once someone looks at another option, keep the agent's first choice labelled.
  const [hasSwitched, setHasSwitched] = React.useState(false)
  const recommended = options[0]

  if (!selected) return null

  const accept = async () => {
    setPhase("accepting")
    try {
      await onAccept(selected)
      setPhase("accepted")
    } catch {
      setPhase("error")
    }
  }

  return (
    <div
      data-slot="recommendation-card"
      data-phase={phase}
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        regularText,
        className
      )}
      {...props}
    >
      <Collapsible>
        <div className="flex flex-col gap-[var(--hui-space-3)] p-[var(--hui-space-5)]">
          <p className="m-0 break-words [font-weight:var(--hui-font-weight-medium)]">{title}</p>
          <div aria-live="polite" className="break-words text-[var(--hui-color-foreground-base-primary)]">
            {selected.body}
          </div>
          <p className={cn("m-0 flex items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)]", smallText)}>
            <ConfidenceMeter level={selected.confidence} />
            {selected.confidenceLabel}
            {hasSwitched && selected === recommended && (
              <>
                <span aria-hidden="true" className="text-[var(--hui-color-foreground-base-secondary)]">·</span>
                <span className="text-[var(--hui-color-foreground-base-secondary)]">{labels.recommended}</span>
              </>
            )}
          </p>
        </div>

        {others.length > 0 && (
          <CollapsiblePanel>
            <div className={cn(divider, "p-[var(--hui-space-3)]")}>
              <p className={cn("m-0 px-[var(--hui-space-3)] pt-[var(--hui-space-1)] pb-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]", smallText)}>
                {labels.otherOptions}
              </p>
              <ul role="list" className="m-0 flex list-none flex-col p-0">
                {others.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        setSelectedId(option.id)
                        setHasSwitched(true)
                        setPhase("idle")
                        // This row leaves the list. Focus the action for the option now shown.
                        acceptRef.current?.focus()
                      }}
                      className="flex w-full cursor-pointer items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--hui-space-3)] py-[var(--hui-space-3)] text-start text-[var(--hui-color-foreground-base-primary)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] not-disabled:hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] disabled:cursor-not-allowed disabled:text-[var(--hui-color-foreground-base-secondary)]"
                    >
                      <ConfidenceMeter level={option.confidence} />
                      <span className="min-w-0 flex-1 break-words">
                        {option.summary}
                        {option === recommended && (
                          <span className={cn("ms-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]", smallText)}>
                            {labels.recommended}
                          </span>
                        )}
                      </span>
                      <span className={cn("shrink-0 text-[var(--hui-color-foreground-base-secondary)]", smallText)}>
                        {option.confidenceLabel}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </CollapsiblePanel>
        )}

        <div className={cn(divider, "flex flex-wrap items-center justify-end gap-[var(--hui-space-2)] py-[var(--hui-space-3)] ps-[var(--hui-space-5)] pe-[var(--hui-space-3)]")}>
          <p
            role={phase === "error" ? "alert" : "status"}
            className={cn("m-0 me-auto flex min-w-0 items-center gap-[var(--hui-space-2)]", smallText)}
          >
            {phase === "accepted" && (
              <>
                <CircleCheckIcon
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-[var(--hui-color-foreground-success-primary)]"
                />
                {labels.accepted}
              </>
            )}
            {phase === "error" && (
              <>
                <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round"
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
                />
                {labels.error}
              </>
            )}
          </p>
          {others.length > 0 && (
            <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
              {labels.alternatives}
              <ChevronDownIcon
                aria-hidden="true"
                className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-secondary)] motion-safe:transition-transform motion-safe:duration-200 in-data-panel-open:rotate-180"
              />
            </CollapsibleTrigger>
          )}
          {/* aria-disabled while working or done, so the pressed button keeps focus. */}
          <Button
            ref={acceptRef}
            size="sm"
            aria-disabled={isLocked || undefined}
            className={cn(phase === "accepting" && "aria-disabled:cursor-progress", phase === "accepted" && "pointer-events-none bg-[var(--hui-color-background-neutral-secondary)] text-[var(--hui-color-foreground-base-tertiary)] shadow-none")}
            onClick={() => {
              if (!isLocked) void accept()
            }}
          >
            {phase === "accepting" && (
              <LoaderCircleIcon aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />
            )}
            {phase === "accepting" ? labels.accepting : selected.actionLabel}
          </Button>
        </div>
      </Collapsible>
    </div>
  )
}

export { RecommendationCard }
