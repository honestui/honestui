"use client"

import * as React from "react"
import {
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  CircleDashed as CircleDashedIcon,
  X as CloseIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"

import type {
  OnboardingChecklistLabels,
  OnboardingStep,
} from "./onboarding-checklist-types"
import {
  defaultOnboardingChecklistLabels,
  getOnboardingProgress,
  toggleStepId,
} from "./onboarding-checklist-utils"

export type {
  OnboardingChecklistLabels,
  OnboardingProgress,
  OnboardingStep,
  OnboardingStepAction,
} from "./onboarding-checklist-types"
export {
  defaultOnboardingChecklistLabels,
  getOnboardingProgress,
  toggleStepId,
} from "./onboarding-checklist-utils"

const titleText =
  "[font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:20px]"
const bodyText =
  "[font-size:var(--hui-font-size-control,13px)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:20px]"
const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

const smallButton =
  "min-h-7 gap-[6px] px-[var(--hui-space-3)] shadow-none [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] [font-weight:var(--hui-font-weight-medium)] [&_svg]:size-3.5"

const iconButton =
  "size-7 min-h-7 rounded-[var(--hui-radius-1)] text-[var(--hui-color-foreground-base-secondary)] shadow-none not-disabled:hover:text-[var(--hui-color-foreground-base-primary)] [&_svg]:size-3.5"

/** Filled buttons lose their fill in forced colors, so they get an edge instead. */
const forcedColorsBorder = "forced-colors:border forced-colors:border-[ButtonText]"

export type OnboardingChecklistProps = Omit<React.ComponentProps<"section">, "title"> & {
  steps: readonly OnboardingStep[]
  /** Ids of the steps that are done. Store them with the person's account. */
  completed: readonly string[]
  /** Called when the person ticks a manual step on or off. */
  onCompletedChange?: ((completed: string[], step: OnboardingStep, done: boolean) => void) | undefined
  /** Ids of optional steps the person skipped. */
  skipped?: readonly string[] | undefined
  onSkippedChange?: ((skipped: string[], step: OnboardingStep, isSkipped: boolean) => void) | undefined
  title: React.ReactNode
  description?: React.ReactNode
  /** The title's heading level. Match it to where the guide sits in the page. */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined
  /** The whole guide was dismissed. While true, only a small Restore button is shown. */
  dismissed?: boolean | undefined
  /** Passing it offers Dismiss, and Restore afterwards. */
  onDismissedChange?: ((dismissed: boolean) => void) | undefined
  /** Hide even the Restore button while dismissed, when your app restores it from elsewhere. */
  hideRestore?: boolean | undefined
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  labels?: Partial<OnboardingChecklistLabels> | undefined
}

/**
 * A setup guide: the steps a new account should take, how many are done, and
 * a button into each. The next step opens on its own. Everything it shows
 * comes from props, so the progress can live with the account.
 */
function OnboardingChecklist({
  steps,
  completed,
  onCompletedChange,
  skipped = [],
  onSkippedChange,
  title,
  description,
  headingLevel = 2,
  dismissed = false,
  onDismissedChange,
  hideRestore = false,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  labels: labelsProp,
  className,
  ...props
}: OnboardingChecklistProps) {
  const labels = React.useMemo(
    () => ({ ...defaultOnboardingChecklistLabels, ...labelsProp }),
    [labelsProp]
  )
  const baseId = React.useId()
  const headingId = `${baseId}-title`
  const bodyId = `${baseId}-body`

  const [openState, setOpenState] = React.useState(defaultOpen)
  const open = openProp ?? openState
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next)
    onOpenChange?.(next)
  }

  const progress = getOnboardingProgress(steps, completed, skipped)
  const done = React.useMemo(() => new Set(completed), [completed])
  const skippedSet = React.useMemo(() => new Set(skipped), [skipped])
  const visibleSteps = steps.filter((step) => !skippedSet.has(step.id))
  const skippedSteps = steps.filter((step) => skippedSet.has(step.id))

  // `undefined` follows the next step; a click pins another one open.
  const [expandedChoice, setExpandedChoice] = React.useState<string | null | undefined>(undefined)
  const expandedId = expandedChoice === undefined ? progress.nextId : expandedChoice
  const [showSkipped, setShowSkipped] = React.useState(false)

  const restoreRef = React.useRef<HTMLButtonElement>(null)
  const rootRef = React.useRef<HTMLElement>(null)
  const focusAfterDismiss = React.useRef<"restore" | "root" | null>(null)
  React.useEffect(() => {
    if (focusAfterDismiss.current === "restore") restoreRef.current?.focus()
    if (focusAfterDismiss.current === "root") rootRef.current?.focus()
    focusAfterDismiss.current = null
  }, [dismissed])

  const setDone = (step: OnboardingStep, isDone: boolean) => {
    onCompletedChange?.(toggleStepId(completed, step.id, isDone, steps), step, isDone)
    // Finishing the open step moves on to the next one.
    if (isDone && expandedId === step.id) setExpandedChoice(undefined)
  }

  const setSkipped = (step: OnboardingStep, isSkipped: boolean) => {
    onSkippedChange?.(toggleStepId(skipped, step.id, isSkipped, steps), step, isSkipped)
    if (isSkipped && expandedId === step.id) setExpandedChoice(undefined)
  }

  if (dismissed) {
    if (hideRestore || !onDismissedChange) return null
    return (
      <Button
        ref={restoreRef}
        variant="outline"
        size="sm"
        data-slot="onboarding-checklist-restore"
        className={cn(smallButton, "self-start tabular-nums", className)}
        onClick={() => {
          focusAfterDismiss.current = "root"
          onDismissedChange(false)
        }}
      >
        <ProgressRing value={progress.total === 0 ? 1 : progress.done / progress.total} />
        {labels.restore(progress.done, progress.total)}
      </Button>
    )
  }

  const Heading = `h${headingLevel}` as const
  const percent = progress.total === 0 ? 100 : Math.round((progress.done / progress.total) * 100)

  return (
    <section
      ref={rootRef}
      tabIndex={-1}
      aria-labelledby={headingId}
      data-slot="onboarding-checklist"
      data-complete={progress.complete ? "" : undefined}
      data-open={open ? "" : undefined}
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)] outline-none focus-visible:[outline:var(--hui-focus-ring)]",
        className
      )}
      {...props}
    >
      <header className="flex flex-col gap-[var(--hui-space-4)] px-[var(--hui-space-5)] pt-[var(--hui-space-5)] pb-[var(--hui-space-4)]">
        <div className="flex min-w-0 items-start gap-[var(--hui-space-3)]">
          <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <Heading id={headingId} className={cn("m-0 flex items-center gap-[var(--hui-space-2)]", titleText)}>
              {progress.complete ? labels.completeTitle : title}
            </Heading>
            {(progress.complete || description) && (
              <p className={cn("m-0 text-[var(--hui-color-foreground-base-secondary)]", metaText)}>
                {progress.complete ? labels.completeDescription : description}
              </p>
            )}
          </div>
          <span
            data-slot="onboarding-checklist-count"
            className={cn(
              "mt-[2px] shrink-0 text-[var(--hui-color-foreground-base-secondary)] tabular-nums",
              metaText
            )}
          >
            {labels.progress(progress.done, progress.total)}
          </span>
          <div className="-me-[var(--hui-space-2)] -mt-[4px] flex shrink-0 items-center">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-expanded={open}
              aria-controls={bodyId}
              aria-label={open ? labels.collapse : labels.expand}
              className={iconButton}
              onClick={() => setOpen(!open)}
            >
              <ChevronDownIcon
                aria-hidden="true"
                className={cn(
                  "motion-safe:[transition:transform_var(--hui-duration-fast)_var(--hui-ease-out)]",
                  open && "rotate-180"
                )}
              />
            </Button>
            {onDismissedChange && progress.complete ? (
              <Button
                variant="outline"
                size="sm"
                className={cn(smallButton, forcedColorsBorder, "ms-[var(--hui-space-2)]")}
                onClick={() => {
                  focusAfterDismiss.current = "restore"
                  onDismissedChange(true)
                }}
              >
                {labels.completeDismiss}
              </Button>
            ) : onDismissedChange && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={labels.dismiss}
                className={iconButton}
                onClick={() => {
                  focusAfterDismiss.current = "restore"
                  onDismissedChange(true)
                }}
              >
                <CloseIcon aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        <div
          role="progressbar"
          aria-label={labels.progressBar}
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
          aria-valuetext={labels.progress(progress.done, progress.total)}
          data-slot="onboarding-checklist-progress"
          className="h-1 w-full overflow-hidden rounded-full bg-[var(--hui-color-background-neutral-secondary)] forced-colors:border forced-colors:border-[CanvasText]"
        >
          <div
            className="h-full rounded-full bg-[var(--hui-color-foreground-base-primary)] motion-safe:[transition:width_var(--hui-duration-slow,400ms)_var(--hui-ease-out)] forced-colors:bg-[CanvasText]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </header>

      <div id={bodyId} hidden={!open} data-slot="onboarding-checklist-body">
        <ol className="m-0 list-none border-t-[0.5px] border-[var(--hui-color-border-base-primary)] p-0 [&>*+*]:border-t-[0.5px] [&>*+*]:border-t-[var(--hui-color-border-base-primary)]">
          {visibleSteps.map((step) => (
            <StepItem
              key={step.id}
              step={step}
              baseId={baseId}
              isDone={done.has(step.id)}
              isNext={progress.nextId === step.id}
              isExpanded={expandedId === step.id}
              canToggle={onCompletedChange !== undefined}
              canSkip={onSkippedChange !== undefined}
              labels={labels}
              onExpandedChange={(expanded) => setExpandedChoice(expanded ? step.id : null)}
              onDoneChange={(isDone) => setDone(step, isDone)}
              onSkip={() => setSkipped(step, true)}
            />
          ))}
        </ol>

        {skippedSteps.length > 0 && (
          <div className="border-t-[0.5px] border-[var(--hui-color-border-base-primary)]">
            <div
              className={cn(
                "flex min-h-10 items-center gap-[var(--hui-space-2)] px-[var(--hui-space-5)] text-[var(--hui-color-foreground-base-secondary)] tabular-nums",
                metaText
              )}
            >
              <span>{labels.skipped(skippedSteps.length)}</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                aria-expanded={showSkipped}
                aria-controls={`${baseId}-skipped`}
                className="cursor-pointer rounded-[var(--hui-radius-1)] text-[var(--hui-color-foreground-base-primary)] underline decoration-[var(--hui-color-border-base-primary)] underline-offset-2 outline-none hover:decoration-current focus-visible:[outline:var(--hui-focus-ring)] [font-weight:var(--hui-font-weight-medium)]"
                onClick={() => setShowSkipped((current) => !current)}
              >
                {showSkipped ? labels.hideSkipped : labels.showSkipped}
              </button>
            </div>
            <ul
              id={`${baseId}-skipped`}
              hidden={!showSkipped}
              aria-label={labels.skipped(skippedSteps.length)}
              className="m-0 list-none p-0 pb-[var(--hui-space-2)]"
            >
              {skippedSteps.map((step) => (
                <li
                  key={step.id}
                  className={cn(
                    "flex min-h-10 items-center justify-between gap-[var(--hui-space-4)] px-[var(--hui-space-5)]",
                    bodyText
                  )}
                >
                  <span className="min-w-0 truncate text-[var(--hui-color-foreground-base-secondary)]">
                    {step.title}
                  </span>
                  {onSkippedChange && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`${labels.restoreStep}: ${step.title}`}
                      className={cn(smallButton, forcedColorsBorder)}
                      onClick={() => setSkipped(step, false)}
                    >
                      {labels.restoreStep}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Step                                                                       */
/* -------------------------------------------------------------------------- */

function StepItem({
  step,
  baseId,
  isDone,
  isNext,
  isExpanded,
  canToggle,
  canSkip,
  labels,
  onExpandedChange,
  onDoneChange,
  onSkip,
}: {
  step: OnboardingStep
  baseId: string
  isDone: boolean
  isNext: boolean
  isExpanded: boolean
  canToggle: boolean
  canSkip: boolean
  labels: OnboardingChecklistLabels
  onExpandedChange: (expanded: boolean) => void
  onDoneChange: (done: boolean) => void
  onSkip: () => void
}) {
  const detailId = `${baseId}-${step.id}-detail`
  const titleId = `${baseId}-${step.id}-title`
  const hasDetail = Boolean(step.description || step.action || (step.optional && canSkip && !isDone))
  const isManual = step.completion !== "auto" && canToggle

  return (
    <li
      data-slot="onboarding-checklist-step"
      data-done={isDone ? "" : undefined}
      data-next={isNext ? "" : undefined}
      className="flex flex-col px-[var(--hui-space-5)] py-[var(--hui-space-3)]"
    >
      <div className="flex min-h-7 min-w-0 items-center gap-[var(--hui-space-4)]">
        {isManual ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={isDone}
            aria-label={labels.markDone(step.title)}
            data-slot="onboarding-checklist-mark"
            className={cn(
              "relative flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:[outline:var(--hui-focus-ring)] pointer-coarse:after:absolute pointer-coarse:after:size-11",
              "motion-safe:[transition:background-color_var(--hui-duration-fast)_var(--hui-ease-out),border-color_var(--hui-duration-fast)_var(--hui-ease-out)]",
              isDone
                ? "bg-[var(--hui-color-foreground-base-primary)] text-[var(--hui-color-background-base-primary)] forced-colors:bg-[CanvasText] forced-colors:text-[Canvas]"
                : "border-[1.5px] border-[var(--hui-color-border-base-primary)] hover:border-[var(--hui-color-foreground-base-secondary)] forced-colors:border-[CanvasText]"
            )}
            onClick={() => onDoneChange(!isDone)}
          >
            {isDone && (
              <CheckIcon
                aria-hidden="true"
                strokeWidth={2.5}
                className="size-3 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:fade-in-0 motion-safe:duration-200"
              />
            )}
          </button>
        ) : (
          <span
            role="img"
            aria-label={isDone ? labels.autoDone : labels.autoPending}
            data-slot="onboarding-checklist-mark"
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full",
              isDone
                ? "bg-[var(--hui-color-foreground-base-primary)] text-[var(--hui-color-background-base-primary)] forced-colors:bg-[CanvasText] forced-colors:text-[Canvas]"
                : "text-[var(--hui-color-foreground-base-secondary)]"
            )}
          >
            {isDone ? (
              <CheckIcon aria-hidden="true" strokeWidth={2.5} className="size-3" />
            ) : (
              <CircleDashedIcon aria-hidden="true" className="size-5" />
            )}
          </span>
        )}

        {hasDetail ? (
          <button
            type="button"
            id={titleId}
            aria-expanded={isExpanded}
            aria-controls={detailId}
            className={cn(
              "group/step flex min-h-7 min-w-0 flex-1 cursor-pointer items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-1)] text-start outline-none focus-visible:[outline:var(--hui-focus-ring)]",
              bodyText
            )}
            onClick={() => onExpandedChange(!isExpanded)}
          >
            <StepTitle step={step} isDone={isDone} isNext={isNext} labels={labels} />
            <ChevronDownIcon
              aria-hidden="true"
              className={cn(
                "ms-auto size-3.5 shrink-0 text-[var(--hui-color-foreground-base-secondary)] opacity-0 group-hover/step:opacity-100 group-focus-visible/step:opacity-100 motion-safe:[transition:transform_var(--hui-duration-fast)_var(--hui-ease-out),opacity_var(--hui-duration-fast)_var(--hui-ease-out)]",
                isExpanded && "rotate-180 opacity-100"
              )}
            />
          </button>
        ) : (
          <span id={titleId} className={cn("flex min-w-0 flex-1 items-center gap-[var(--hui-space-3)]", bodyText)}>
            <StepTitle step={step} isDone={isDone} isNext={isNext} labels={labels} />
          </span>
        )}
      </div>

      {hasDetail && (
        <div
          id={detailId}
          role="group"
          aria-labelledby={titleId}
          hidden={!isExpanded}
          className="flex flex-col gap-[var(--hui-space-3)] ps-[calc(20px+var(--hui-space-4))] pt-[var(--hui-space-1)] pb-[var(--hui-space-2)]"
        >
          {step.description && (
            <p className={cn("m-0 max-w-[60ch] text-[var(--hui-color-foreground-base-secondary)]", bodyText)}>
              {step.description}
            </p>
          )}
          {(step.action || (step.optional && canSkip && !isDone)) && (
            <div className="flex flex-wrap items-center gap-[var(--hui-space-2)]">
              {step.action &&
                (step.action.href ? (
                  <Button
                    size="sm"
                    variant={isDone || !isNext ? "outline" : "default"}
                    className={cn(smallButton, forcedColorsBorder)}
                    render={<a href={step.action.href} />}
                    onClick={step.action.onClick}
                  >
                    {step.action.label}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={isDone || !isNext ? "outline" : "default"}
                    className={cn(smallButton, forcedColorsBorder)}
                    onClick={step.action.onClick}
                  >
                    {step.action.label}
                  </Button>
                ))}
              {step.optional && canSkip && !isDone && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`${labels.skip}: ${step.title}`}
                  className={cn(smallButton, forcedColorsBorder, "text-[var(--hui-color-foreground-base-secondary)]")}
                  onClick={onSkip}
                >
                  {labels.skip}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  )
}

function StepTitle({
  step,
  isDone,
  isNext,
  labels,
}: {
  step: OnboardingStep
  isDone: boolean
  isNext: boolean
  labels: OnboardingChecklistLabels
}) {
  return (
    <>
      <span
        className={cn(
          "min-w-0 truncate",
          isDone
            ? "text-[var(--hui-color-foreground-base-secondary)]"
            : "text-[var(--hui-color-foreground-base-primary)]",
          isNext && "[font-weight:var(--hui-font-weight-medium)]"
        )}
      >
        {step.title}
      </span>
      {step.optional && (
        <Badge variant="secondary" size="sm" className="shrink-0">
          {labels.optional}
        </Badge>
      )}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Ring                                                                       */
/* -------------------------------------------------------------------------- */

function ProgressRing({ value }: { value: number }) {
  const radius = 6
  const length = 2 * Math.PI * radius
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0 -rotate-90">
      <circle cx="8" cy="8" r={radius} fill="none" strokeWidth="2" className="stroke-[var(--hui-color-border-base-primary)]" />
      <circle
        cx="8"
        cy="8"
        r={radius}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - Math.min(1, Math.max(0, value)))}
        className="stroke-[var(--hui-color-foreground-base-primary)] forced-colors:stroke-[CanvasText]"
      />
    </svg>
  )
}

export { OnboardingChecklist }
