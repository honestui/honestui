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
        "m-0 flex w-full min-w-0 list-none flex-col items-center gap-[var(--hui-space-9)] rounded-[var(--hui-radius-4)] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] bg-[color-mix(in_oklch,var(--hui-color-background-neutral-primary)_60%,var(--hui-color-background-base-primary))] p-[var(--hui-space-7)]",
        className
      )}
      {...props}
    />
  )
}

export type FlowStepProps = Omit<React.ComponentProps<"li">, "title"> & {
  /** The step's role in the flow, such as "Trigger", "Condition", or "Action". */
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
        // A connector with an arrowhead is drawn above every step but the
        // first, pointing into the step it leads to. It stays 1px wide: at
        // the surface hairline width it would disappear on the canvas.
        "relative flex w-full max-w-sm min-w-0 flex-col before:absolute before:bottom-full before:left-1/2 before:h-[var(--hui-space-9)] before:w-px before:-translate-x-1/2 before:bg-[var(--hui-color-foreground-base-tertiary)] after:absolute after:bottom-full after:left-1/2 after:mb-[var(--hui-space-1)] after:size-[var(--hui-space-3)] after:-translate-x-1/2 after:rotate-45 after:border-e after:border-b after:border-[var(--hui-color-foreground-base-tertiary)] first:before:hidden first:after:hidden forced-colors:before:bg-[CanvasText] forced-colors:after:border-[CanvasText]",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-[var(--hui-space-3)] rounded-[var(--hui-radius-4)] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-panel)] p-[var(--hui-space-5)] [--hui-color-background-field:var(--hui-color-background-panel)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)] [font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]">
        <div className="flex min-w-0 flex-col gap-[var(--hui-space-1)]">
          <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
            {kind}
          </p>
          {title && <p className="m-0 break-words [font-weight:var(--hui-font-weight-medium)]">{title}</p>}
          {caption && (
            <p className="m-0 break-words text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
              {caption}
            </p>
          )}
        </div>
        {children}
      </div>
    </li>
  )
}

export { Flowchart, FlowStep }
