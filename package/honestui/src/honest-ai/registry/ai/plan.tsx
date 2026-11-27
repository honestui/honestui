"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import {
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  ListOrdered as ListOrderedIcon,
  Pencil as PencilIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { TextShimmer } from "../../components/animated/text-shimmer.js"
import { Button } from "../../components/ui/button.js"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "../../components/ui/collapsible.js"

export type PlanStep = {
  id: string
  title: string
  /** A line or two on how the step will be done. */
  detail?: React.ReactNode
}

/**
 * "streaming" while the agent is still writing the plan, "proposed" once it
 * waits on the person, and "approved" or "revising" after they answer.
 */
export type PlanStatus = "streaming" | "proposed" | "approved" | "revising"

export type PlanLabels = {
  approve: string
  revise: string
  streaming: string
  approved: string
  revising: string
  /** The step count in the header, such as "4 steps". */
  stepCount: (count: number) => string
  /** Names a step for screen readers, such as "Step 2". */
  step: (index: number) => string
}

export const defaultPlanLabels: PlanLabels = {
  approve: "Approve plan",
  revise: "Revise",
  streaming: "Planning",
  approved: "Approved",
  revising: "Revising",
  stepCount: (count) => `${count} ${count === 1 ? "step" : "steps"}`,
  step: (index) => `Step ${index}`,
}

export type PlanProps = Omit<React.ComponentProps<"section">, "title" | "children"> & {
  title: React.ReactNode
  /** What the plan sets out to do, in a sentence or two. */
  summary?: React.ReactNode
  /** The steps, in order. Append to the array as the plan streams in. */
  steps: PlanStep[]
  status?: PlanStatus
  /** Passing it shows Approve while the plan is proposed. */
  onApprove?: () => void
  /** Passing it shows Revise while the plan is proposed. */
  onRevise?: () => void
  /** Whether the steps start open. */
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  labels?: Partial<PlanLabels>
}

const regularText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

/**
 * A plan the agent proposes before it acts: a title, a summary, and ordered
 * steps, with Approve and Revise. It shows the plan and status you pass; use
 * Task Rows to track the work once it runs.
 */
function Plan({
  title,
  summary,
  steps,
  status = "proposed",
  onApprove,
  onRevise,
  defaultOpen = true,
  open,
  onOpenChange,
  labels: labelsProp,
  className,
  ...props
}: PlanProps) {
  const labels = { ...defaultPlanLabels, ...labelsProp }
  const titleId = React.useId()
  const reduceMotion = useReducedMotion()
  const isStreaming = status === "streaming"
  const showActions = status === "proposed" && (onApprove || onRevise)

  // Steps present on the first render appear at once; later ones fade in as they stream.
  const [initialIds] = React.useState(() => new Set(steps.map((step) => step.id)))

  const meta = isStreaming
    ? labels.streaming
    : status === "approved"
      ? labels.approved
      : status === "revising"
        ? labels.revising
        : labels.stepCount(steps.length)

  return (
    <section
      aria-labelledby={titleId}
      aria-busy={isStreaming || undefined}
      data-slot="plan"
      data-status={status}
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        regularText,
        className
      )}
      {...props}
    >
      <Collapsible defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger
          data-slot="plan-trigger"
          className="group/plan flex min-h-12 w-full min-w-0 items-center gap-[var(--hui-space-4)] rounded-none border-0 bg-transparent px-[var(--hui-space-5)] py-[var(--hui-space-3)] text-left outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]"
        >
          <ListOrderedIcon
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-4 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]"
          />
          <span id={titleId} className="min-w-0 flex-1 truncate [font-weight:var(--hui-font-weight-medium)]">
            {title}
          </span>
          <span
            data-slot="plan-meta"
            className={cn("flex shrink-0 items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]", metaText)}
          >
            {status === "approved" && <CheckIcon aria-hidden="true" className="size-3.5" />}
            {isStreaming ? (
              <TextShimmer duration={1.6}>{meta}</TextShimmer>
            ) : (
              <span className="tabular-nums">{meta}</span>
            )}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)] motion-safe:transition-transform motion-safe:duration-200 group-data-panel-open/plan:rotate-180"
          />
        </CollapsibleTrigger>

        <CollapsiblePanel>
          <div className="border-t-[0.5px] border-[var(--hui-color-border-base-primary)]">
            {summary && (
              <p
                data-slot="plan-summary"
                className="m-0 px-[var(--hui-space-5)] pt-[var(--hui-space-4)] text-pretty text-[var(--hui-color-foreground-base-secondary)]"
              >
                {summary}
              </p>
            )}
            <ol
              data-slot="plan-steps"
              className="m-0 flex list-none flex-col gap-[var(--hui-space-4)] px-[var(--hui-space-5)] py-[var(--hui-space-5)]"
            >
              {steps.map((step, index) => {
                const isNew = !initialIds.has(step.id) && !reduceMotion
                return (
                  <motion.li
                    key={step.id}
                    data-slot="plan-step"
                    initial={isNew ? { opacity: 0, y: 4 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
                    className="flex min-w-0 gap-[var(--hui-space-4)]"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full border-[0.5px] border-[var(--hui-color-border-base-secondary)] text-[var(--hui-color-foreground-base-secondary)] tabular-nums [font-size:var(--hui-font-size-micro)] [line-height:1]",
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 break-words [font-weight:var(--hui-font-weight-medium)]">
                        <span className="sr-only">{labels.step(index + 1)}: </span>
                        {step.title}
                      </p>
                      {step.detail && (
                        <div className="mt-[var(--hui-space-1)] break-words text-[var(--hui-color-foreground-base-secondary)]">
                          {step.detail}
                        </div>
                      )}
                    </div>
                  </motion.li>
                )
              })}
              {isStreaming && (
                <li aria-hidden="true" data-slot="plan-step-pending" className="flex min-w-0 items-center gap-[var(--hui-space-4)]">
                  <span className="size-[18px] shrink-0 rounded-full border-[0.5px] border-dashed border-[var(--hui-color-border-base-secondary)]" />
                  <span className="h-2 w-40 max-w-[60%] rounded-full bg-[var(--hui-color-background-neutral-secondary)] motion-safe:animate-pulse" />
                </li>
              )}
            </ol>
          </div>
        </CollapsiblePanel>
      </Collapsible>

      {showActions && (
        <div
          data-slot="plan-actions"
          className="flex flex-wrap items-center justify-end gap-[var(--hui-space-3)] border-t-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)]"
        >
          {onRevise && (
            <Button variant="ghost" size="sm" onClick={onRevise}>
              <PencilIcon aria-hidden="true" />
              {labels.revise}
            </Button>
          )}
          {onApprove && (
            <Button size="sm" onClick={onApprove}>
              {labels.approve}
            </Button>
          )}
        </div>
      )}

      {/* Announces when the plan finishes streaming and when it is decided. */}
      <span role="status" className="sr-only">
        {isStreaming ? labels.streaming : status === "proposed" ? labels.stepCount(steps.length) : meta}
      </span>
    </section>
  )
}

export { Plan }
