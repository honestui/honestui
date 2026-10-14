"use client"

import * as React from "react"
import { ArrowUp as ArrowUpIcon, CircleAlert as CircleAlertIcon } from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { TextShimmer } from "../../components/animated/text-shimmer.js"
import { Button } from "../../components/ui/button.js"

export type SelectionAction = {
  id: string
  label: string
  icon?: React.ReactNode
}

export type SelectionActionsStatus = "idle" | "working" | "result" | "error"

export type SelectionActionsLabels = {
  toolbar: string
  prompt: string
  promptPlaceholder: string
  send: string
  working: string
  keep: string
  discard: string
  retry: string
  error: string
}

export const defaultSelectionActionsLabels: SelectionActionsLabels = {
  toolbar: "Edit selection",
  prompt: "Describe an edit",
  promptPlaceholder: "Describe an edit…",
  send: "Send",
  working: "Working…",
  keep: "Keep",
  discard: "Discard",
  retry: "Try again",
  error: "The edit did not finish.",
}

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

export type SelectionActionsProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** One button each, such as Improve and Shorten. */
  actions: SelectionAction[]
  /** Where the edit stands. Your application sets it. */
  status?: SelectionActionsStatus
  onAction: (actionId: string) => void
  /** Passing it adds a field for a typed instruction. */
  onPrompt?: (instruction: string) => void
  /** Accepts the result. */
  onKeep: () => void
  /** Rejects the result, or dismisses an error. */
  onDiscard: () => void
  /** Passing it offers another attempt on a result or an error. */
  onRetry?: () => void
  labels?: Partial<SelectionActionsLabels>
}

/**
 * A bar of AI edits for a piece of selected text. It offers the actions,
 * shows progress, and then asks the person to keep or discard the result.
 * Tracking the selection, placing the bar, and making the edit are yours.
 */
function SelectionActions({
  actions,
  status = "idle",
  onAction,
  onPrompt,
  onKeep,
  onDiscard,
  onRetry,
  labels: labelsProp,
  className,
  ...props
}: SelectionActionsProps) {
  const labels = { ...defaultSelectionActionsLabels, ...labelsProp }
  const [instruction, setInstruction] = React.useState("")
  const trimmed = instruction.trim()

  return (
    <div
      role="toolbar"
      aria-label={labels.toolbar}
      data-slot="selection-actions"
      data-status={status}
      className={cn(
        "inline-flex w-fit max-w-full min-w-0 flex-wrap items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-lifted)]",
        smallText,
        className
      )}
      {...props}
    >
      {/* Always mounted, so each change of status is announced. */}
      <span role="status" className={cn(status === "working" || status === "error" ? "contents" : "sr-only")}>
        {status === "working" && (
          <TextShimmer duration={1.6} className="px-[var(--hui-space-3)] py-[var(--hui-space-2)] [font-weight:var(--hui-font-weight-medium)]">
            {labels.working}
          </TextShimmer>
        )}
        {status === "error" && (
          <span className="flex items-center gap-[var(--hui-space-2)] px-[var(--hui-space-3)] py-[var(--hui-space-2)]">
            <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round"
              aria-hidden="true"
              className="size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
            />
            {labels.error}
          </span>
        )}
      </span>

      {status === "idle" && (
        <>
          {actions.map((action) => (
            <Button key={action.id} variant="link" size="sm" onClick={() => onAction(action.id)}>
              {action.icon}
              {action.label}
            </Button>
          ))}
          {onPrompt && (
            <form
              className="flex min-w-0 items-center gap-[var(--hui-space-2)]"
              onSubmit={(event) => {
                event.preventDefault()
                if (trimmed === "") return
                onPrompt(trimmed)
                setInstruction("")
              }}
            >
              <input
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                aria-label={labels.prompt}
                placeholder={labels.promptPlaceholder}
                className={cn(
                  "h-[var(--hui-space-7)] w-40 min-w-0 rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-tertiary)] bg-transparent px-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] outline-none placeholder:text-[var(--hui-color-foreground-base-tertiary)] focus:border-[var(--hui-color-border-accent-emphasis)]",
                  smallText
                )}
              />
              <Button type="submit" size="icon-sm" disabled={trimmed === ""} aria-label={labels.send}>
                <ArrowUpIcon aria-hidden="true" strokeWidth={2} />
              </Button>
            </form>
          )}
        </>
      )}

      {(status === "result" || status === "error") && (
        <>
          {status === "result" && (
            <Button size="sm" onClick={onKeep}>
              {labels.keep}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onDiscard}>
            {labels.discard}
          </Button>
          {onRetry && (
            <Button variant="link" size="sm" onClick={onRetry}>
              {labels.retry}
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export { SelectionActions }
