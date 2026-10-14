import * as React from "react"

import { cn } from "../../lib/utils.js"

export type FlowchartProps = React.ComponentProps<"ol"> & {
  /** Names the workflow for screen readers. */
  label: string
}

/**
 * A workflow as a top-to-bottom sequence of steps joined by connectors. The
 * steps are an ordered list, so the order is available without the lines.
 */
function Flowchart({ label, className, ...props }: FlowchartProps) {
  return (
    <ol
      role="list"
      aria-label={label}
      data-slot="flowchart"
      className={cn(
        "m-0 flex w-full min-w-0 list-none flex-col items-center gap-[var(--hui-space-9)] rounded-[var(--hui-radius-4)] bg-[var(--hui-color-background-base-secondary)] bg-[radial-gradient(var(--hui-color-border-base-secondary)_1px,transparent_1px)] p-[var(--hui-space-7)] [background-size:16px_16px]",
        className
      )}
      {...props}
    />
  )
}

export type FlowStepProps = Omit<React.ComponentProps<"li">, "title"> & {
  /** The step's role in the flow, such as "Trigger" or "If / Else". */
  kind: string
  title?: React.ReactNode
  /** One line under the title. */
  caption?: React.ReactNode
}

/** One step. Put controls for the step, such as a condition's fields, in its children. */
function FlowStep({ kind, title, caption, className, children, ...props }: FlowStepProps) {
  return (
    <li
      data-slot="flow-step"
      className={cn(
        // The connector is drawn above every step but the first.
        "relative flex w-full max-w-sm min-w-0 flex-col gap-[var(--hui-space-2)] before:absolute before:bottom-full before:left-1/2 before:h-[var(--hui-space-9)] before:w-px before:bg-[var(--hui-color-border-base-emphasis)] first:before:hidden",
        className
      )}
      {...props}
    >
      <span className="w-fit rounded-[var(--hui-radius-full)] bg-[var(--hui-color-background-neutral-secondary)] px-[var(--hui-space-3)] py-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-medium)] [line-height:var(--hui-line-height-mini)]">
        {kind}
      </span>
      <div className="flex min-w-0 flex-col gap-[var(--hui-space-3)] rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-soft)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
        {(title || caption) && (
          <div className="flex min-w-0 flex-col gap-[var(--hui-space-1)]">
            {title && (
              <p className="m-0 break-words [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [line-height:var(--hui-line-height-regular)]">
                {title}
              </p>
            )}
            {caption && (
              <p className="m-0 break-words text-[var(--hui-color-foreground-base-secondary)]">{caption}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </li>
  )
}

export { Flowchart, FlowStep }
