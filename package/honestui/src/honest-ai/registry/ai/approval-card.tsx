"use client"

import * as React from "react"
import {
  CircleAlert as CircleAlertIcon,
  CircleCheck as CircleCheckIcon,
  LoaderCircle as LoaderCircleIcon,
  X as CloseIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"
import { Checkbox } from "../../components/ui/checkbox.js"
import { Input } from "../../components/ui/input.js"
import { Radio, RadioGroup } from "../../components/ui/radio-group.js"

export type ApprovalOption = {
  value: string
  label: string
}

export type ApprovalQuestion = {
  id: string
  /** The question, in the agent's words. */
  prompt: string
  /** "single" offers one choice. "multiple" offers any number. */
  type: "single" | "multiple"
  options: ApprovalOption[]
  /** Adds a text field for an answer that is not among the options. */
  allowCustom?: boolean
  /** A required question cannot be skipped, and Send waits for it. */
  required?: boolean
}

export type ApprovalAnswer = {
  /** The `value` of each chosen option. */
  selected: string[]
  /** The typed answer, trimmed. Empty when nothing was typed. */
  custom: string
}

/** Every question's answer, keyed by question `id`. Skipped questions are present and empty. */
export type ApprovalAnswers = Record<string, ApprovalAnswer>

export type ApprovalCardLabels = {
  back: string
  skip: string
  continue: string
  send: string
  sending: string
  dismiss: string
  customAnswer: string
  customPlaceholder: string
  step: (current: number, total: number) => string
  /** Shown beside a disabled Send, so the reason is never a guess. */
  incomplete: string
  submitted: string
  error: string
}

export const defaultApprovalCardLabels: ApprovalCardLabels = {
  back: "Back",
  skip: "Skip",
  continue: "Continue",
  send: "Send",
  sending: "Sending…",
  dismiss: "Dismiss",
  customAnswer: "Another answer",
  customPlaceholder: "Something else…",
  step: (current, total) => `Question ${current} of ${total}`,
  incomplete: "Answer at least one question to send.",
  submitted: "Answers sent.",
  error: "The answers were not sent. Your choices are still here, so you can send again.",
}

const bodyText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

const emptyAnswer: ApprovalAnswer = { selected: [], custom: "" }

function isAnswered(answer: ApprovalAnswer | undefined) {
  return Boolean(answer && (answer.selected.length > 0 || answer.custom.trim() !== ""))
}

export type ApprovalCardProps = Omit<React.ComponentProps<"div">, "children" | "onSubmit"> & {
  questions: ApprovalQuestion[]
  /**
   * Receives every answer when the person presses Send. Return a promise to
   * show progress; if it rejects, the card keeps the answers and offers Send again.
   */
  onSubmit: (answers: ApprovalAnswers) => void | Promise<void>
  /** Called when the person closes the card. Without it, no close button is shown. */
  onDismiss?: () => void
  labels?: Partial<ApprovalCardLabels>
}

/**
 * Questions an agent asks before it acts, one at a time. Nothing is sent
 * until the person presses Send on the last question.
 */
function ApprovalCard({
  questions,
  onSubmit,
  onDismiss,
  labels: labelsProp,
  className,
  ...props
}: ApprovalCardProps) {
  const labels = React.useMemo(
    () => ({ ...defaultApprovalCardLabels, ...labelsProp }),
    [labelsProp]
  )
  const [index, setIndex] = React.useState(0)
  const [answers, setAnswers] = React.useState<ApprovalAnswers>({})
  const [phase, setPhase] = React.useState<"editing" | "submitting" | "submitted" | "error">(
    "editing"
  )
  const rootRef = React.useRef<HTMLDivElement>(null)
  const promptId = React.useId()

  const question = questions[Math.min(index, questions.length - 1)]
  const isLast = index >= questions.length - 1
  const answer = (question && answers[question.id]) ?? emptyAnswer
  const answered = isAnswered(answer)
  const isSubmitting = phase === "submitting"
  const canSend =
    questions.some((item) => isAnswered(answers[item.id])) &&
    questions.every((item) => !item.required || isAnswered(answers[item.id]))

  // Sending removes the focused button. Hold focus on the card so it does not
  // fall back to the top of the page.
  React.useEffect(() => {
    if (phase === "submitted") rootRef.current?.focus()
  }, [phase])

  if (!question) return null

  const updateAnswer = (next: ApprovalAnswer) => {
    setAnswers((current) => ({ ...current, [question.id]: next }))
    if (phase === "error") setPhase("editing")
  }

  const submit = async () => {
    const result: ApprovalAnswers = {}
    for (const item of questions) {
      const given = answers[item.id] ?? emptyAnswer
      result[item.id] = { selected: given.selected, custom: given.custom.trim() }
    }

    setPhase("submitting")
    try {
      await onSubmit(result)
      setPhase("submitted")
    } catch {
      setPhase("error")
    }
  }

  const cardFrame =
    "w-full min-w-0 rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-soft)] outline-none focus-visible:[outline:var(--hui-focus-ring)]"

  if (phase === "submitted") {
    return (
      <div
        ref={rootRef}
        tabIndex={-1}
        data-slot="approval-card"
        data-phase={phase}
        className={cn(cardFrame, "p-[var(--hui-space-5)]", bodyText, className)}
        {...props}
      >
        <p role="status" className="m-0 flex items-center gap-[var(--hui-space-3)]">
          <CircleCheckIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-[var(--hui-color-foreground-success-primary)]"
          />
          {labels.submitted}
        </p>
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      data-slot="approval-card"
      data-phase={phase}
      className={cn(cardFrame, bodyText, className)}
      {...props}
    >
      <div className="flex flex-col gap-[var(--hui-space-4)] p-[var(--hui-space-5)]">
        <div className="flex items-start gap-[var(--hui-space-3)]">
          <div className="flex min-w-0 flex-1 flex-col gap-[var(--hui-space-2)]">
            {questions.length > 1 && (
              <p
                aria-live="polite"
                className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [line-height:var(--hui-line-height-mini)]"
              >
                {labels.step(index + 1, questions.length)}
              </p>
            )}
            <p
              id={promptId}
              className="m-0 break-words [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"
            >
              {question.prompt}
            </p>
          </div>
          {onDismiss && (
            <Button
              variant="link"
              size="icon-sm"
              aria-label={labels.dismiss}
              onClick={onDismiss}
              className="-me-[var(--hui-space-2)] -mt-[var(--hui-space-2)]"
            >
              <CloseIcon aria-hidden="true" />
            </Button>
          )}
        </div>

        {question.type === "single" ? (
          <RadioGroup
            key={`${question.id}-options`}
            aria-labelledby={promptId}
            disabled={isSubmitting}
            value={answer.selected[0] ?? ""}
            onValueChange={(value) => updateAnswer({ selected: [String(value)], custom: "" })}
            className="gap-[var(--hui-space-1)]"
          >
            {question.options.map((option) => (
              <OptionRow key={option.value} label={option.label}>
                {(labelId) => <Radio value={option.value} aria-labelledby={labelId} />}
              </OptionRow>
            ))}
          </RadioGroup>
        ) : (
          <div
            key={`${question.id}-options`}
            role="group"
            aria-labelledby={promptId}
            className="flex flex-col gap-[var(--hui-space-1)]"
          >
            {question.options.map((option) => (
              <OptionRow key={option.value} label={option.label}>
                {(labelId) => (
                  <Checkbox
                    size="small"
                    aria-labelledby={labelId}
                    disabled={isSubmitting}
                    checked={answer.selected.includes(option.value)}
                    onCheckedChange={(checked) =>
                      updateAnswer({
                        ...answer,
                        selected: checked
                          ? [...answer.selected, option.value]
                          : answer.selected.filter((value) => value !== option.value),
                      })
                    }
                  />
                )}
              </OptionRow>
            ))}
          </div>
        )}

        {question.allowCustom && (
          <Input
            key={`${question.id}-custom`}
            size="sm"
            aria-label={labels.customAnswer}
            placeholder={labels.customPlaceholder}
            disabled={isSubmitting}
            value={answer.custom}
            onChange={(event) =>
              updateAnswer({
                // A single-choice question holds one answer: typed or picked, not both.
                selected: question.type === "single" ? [] : answer.selected,
                custom: event.target.value,
              })
            }
          />
        )}

        {phase === "error" && (
          <p role="alert" className="m-0 flex items-start gap-[var(--hui-space-3)]">
            <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round"
              aria-hidden="true"
              className="mt-px size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
            />
            <span className="min-w-0 break-words">{labels.error}</span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-[var(--hui-space-3)] border-t border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-3)]">
        {isLast && !canSend && (
          <p className="m-0 me-auto min-w-0 text-[var(--hui-color-foreground-base-secondary)]">
            {labels.incomplete}
          </p>
        )}
        {index > 0 && (
          <Button
            variant="link"
            size="sm"
            disabled={isSubmitting}
            onClick={() => setIndex(index - 1)}
          >
            {labels.back}
          </Button>
        )}
        {isLast ? (
          <Button size="sm" disabled={!canSend || isSubmitting} onClick={() => void submit()}>
            {isSubmitting && (
              <LoaderCircleIcon aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />
            )}
            {isSubmitting ? labels.sending : labels.send}
          </Button>
        ) : answered || question.required ? (
          <Button size="sm" disabled={!answered} onClick={() => setIndex(index + 1)}>
            {labels.continue}
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setIndex(index + 1)}>
            {labels.skip}
          </Button>
        )}
      </div>
    </div>
  )
}

function OptionRow({
  label,
  children,
}: {
  label: string
  /** Renders the control. It is named by `labelId`, because the label alone does not name it. */
  children: (labelId: string) => React.ReactNode
}) {
  const labelId = React.useId()

  return (
    <label className="-mx-[var(--hui-space-2)] flex min-w-0 cursor-pointer items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] px-[var(--hui-space-2)] py-[var(--hui-space-2)] motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] has-disabled:cursor-not-allowed has-data-disabled:cursor-not-allowed">
      {children(labelId)}
      <span id={labelId} className="min-w-0 break-words">
        {label}
      </span>
    </label>
  )
}

export { ApprovalCard }
