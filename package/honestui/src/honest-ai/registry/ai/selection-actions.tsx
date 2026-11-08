"use client"

import * as React from "react"
import { ArrowUp as ArrowUpIcon, CircleAlert as CircleAlertIcon } from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { TextShimmer } from "../../components/animated/text-shimmer.js"
import { Button } from "../../components/ui/button.js"
import { Input } from "../../components/ui/input.js"

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

const controlText =
  "[font-size:var(--hui-font-size-control)] [letter-spacing:var(--hui-letter-spacing-control)] [line-height:var(--hui-line-height-control)]"

// Controls sit inside the frame padding, so their corners follow the frame's.
const insetControl = "rounded-[var(--hui-radius-frame-panel)]"

// Both layers occupy the bar's single grid cell.
const layer =
  "col-start-1 row-start-1 flex min-w-0 flex-wrap items-center gap-[var(--hui-space-1)]"

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
  ref,
  onFocus,
  onBlur,
  ...props
}: SelectionActionsProps) {
  const labels = { ...defaultSelectionActionsLabels, ...labelsProp }
  const [instruction, setInstruction] = React.useState("")
  const trimmed = instruction.trim()
  const isIdle = status === "idle"

  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const keepRef = React.useRef<HTMLButtonElement>(null)
  const retryRef = React.useRef<HTMLButtonElement>(null)
  const discardRef = React.useRef<HTMLButtonElement>(null)
  const setRootRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  // A status change hides or removes the control the person just pressed. If
  // focus was in the bar, move it to what replaced that control instead of
  // letting it fall to the page. Focus elsewhere on the page is left alone.
  const focusInside = React.useRef(false)
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !focusInside.current) return
    const active = document.activeElement
    // Focus on the bar itself is where the working status left it; hand it on too.
    const lost =
      !active || active === document.body || active === root || !root.contains(active) || active.closest("[inert]")
    if (!lost) return
    const target =
      status === "result" ? keepRef.current : status === "error" ? (retryRef.current ?? discardRef.current) : root
    target?.focus()
  }, [status])

  // The actions and the status content share one grid cell. The actions stay
  // laid out, hidden and inert, while a status shows, so the floating bar keeps
  // its idle width without measuring it, even as labels or actions change.
  return (
    <div
      ref={setRootRef}
      tabIndex={-1}
      onFocus={(event) => {
        focusInside.current = true
        onFocus?.(event)
      }}
      onBlur={(event) => {
        onBlur?.(event)
        // A null target means focus went nowhere (the control was hidden or
        // removed), so keep treating the bar as focused until a status settles it.
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) focusInside.current = false
      }}
      role="toolbar"
      aria-label={labels.toolbar}
      data-slot="selection-actions"
      data-status={status}
      className={cn(
        "inline-grid w-fit max-w-full min-w-0 outline-none focus-visible:[outline:var(--hui-focus-ring)] rounded-[var(--hui-radius-frame)] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-overlay)] bg-[var(--hui-color-background-overlay)] p-[var(--hui-frame-padding)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-overlay)]",
        controlText,
        className
      )}
      {...props}
    >
      <div
        inert={!isIdle}
        aria-hidden={isIdle ? undefined : true}
        className={cn(layer, !isIdle && "invisible")}
      >
        {actions.map((action) => (
          <Button key={action.id} variant="ghost" size="sm" className={insetControl} onClick={() => onAction(action.id)}>
            {action.icon}
            {action.label}
          </Button>
        ))}
        {onPrompt && (
          <>
            {actions.length > 0 && (
              <span
                aria-hidden="true"
                className="mx-[var(--hui-space-1)] h-[var(--hui-space-6)] w-[length:var(--hui-border-width-surface)] shrink-0 self-center bg-[var(--hui-color-border-base-primary)] max-sm:hidden"
              />
            )}
            {/* The field and Send never wrap apart; on small screens they take
                their own row instead of trailing a divider. Inside the bar the
                field is borderless, so the bar's own edge is the only outline. */}
            <form
              className="flex min-w-0 items-center gap-[var(--hui-space-2)] max-sm:basis-full"
              onSubmit={(event) => {
                event.preventDefault()
                if (trimmed === "") return
                onPrompt(trimmed)
                setInstruction("")
              }}
            >
              <Input
                size="sm"
                variant="borderless"
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                aria-label={labels.prompt}
                placeholder={labels.promptPlaceholder}
                className={cn(
                  "w-48 min-w-0 bg-transparent focus-within:bg-transparent max-sm:flex-1 [&_input]:placeholder:text-[var(--hui-color-foreground-base-secondary)]",
                  insetControl
                )}
              />
              <Button type="submit" size="icon-sm" className={insetControl} disabled={trimmed === ""} aria-label={labels.send}>
                <ArrowUpIcon aria-hidden="true" strokeWidth={2} />
              </Button>
            </form>
          </>
        )}
      </div>

      <div className={cn(layer, isIdle && "pointer-events-none")}>
        {/* Always mounted, so each change of status is announced. */}
        <span role="status" className={cn(status === "working" || status === "error" ? "contents" : "sr-only")}>
          {status === "working" && (
            <TextShimmer duration={1.6} className="inline-flex min-h-[var(--hui-control-height-sm,28px)] items-center px-[var(--hui-space-3)] [font-weight:var(--hui-font-weight-medium)]">
              {labels.working}
            </TextShimmer>
          )}
          {status === "error" && (
            <span className="flex min-h-[var(--hui-control-height-sm,28px)] items-center gap-[var(--hui-space-2)] px-[var(--hui-space-3)]">
              <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round"
                aria-hidden="true"
                className="size-4 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
              />
              {labels.error}
            </span>
          )}
        </span>

        {status === "result" && (
          <>
            <Button ref={keepRef} size="sm" className={insetControl} onClick={onKeep}>
              {labels.keep}
            </Button>
            <Button variant="secondary" size="sm" className={insetControl} onClick={onDiscard}>
              {labels.discard}
            </Button>
            {onRetry && (
              <Button variant="ghost" size="sm" className={insetControl} onClick={onRetry}>
                {labels.retry}
              </Button>
            )}
          </>
        )}

        {/* After an error, another attempt is the recovery, so it leads. */}
        {status === "error" && (
          <>
            {onRetry && (
              <Button ref={retryRef} variant="secondary" size="sm" className={insetControl} onClick={onRetry}>
                {labels.retry}
              </Button>
            )}
            <Button ref={discardRef} variant={onRetry ? "ghost" : "secondary"} size="sm" className={insetControl} onClick={onDiscard}>
              {labels.discard}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export { SelectionActions }
