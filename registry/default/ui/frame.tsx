import * as React from "react"

import { cn } from "@/lib/utils"

function Frame({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="frame"
      className={cn(
        "relative flex flex-col rounded-[var(--hui-radius-frame,var(--hui-radius-2))] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-frame-padding,--spacing(1))]",
        className
      )}
      {...props}
    />
  )
}

function FramePanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="frame-panel"
      className={cn(
        "relative bg-clip-padding not-has-[table]:rounded-[var(--hui-radius-frame-panel,var(--hui-radius-2))] not-has-[table]:border-[length:var(--hui-border-width-surface,1px)] not-has-[table]:border-[var(--hui-color-border-base-primary)] not-has-[table]:bg-[var(--hui-color-background-panel,var(--hui-color-background-base-primary))] not-has-[table]:p-5 not-has-[table]:shadow-[var(--hui-shadow-feather)]",
        className
      )}
      {...props}
    />
  )
}

function FrameHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="frame-panel-header"
      className={cn("flex flex-col px-5 py-4", className)}
      {...props}
    />
  )
}

function FrameTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="frame-panel-title"
      className={cn("[font-size:var(--hui-font-size-large)] [letter-spacing:var(--hui-letter-spacing-large)] [line-height:var(--hui-line-height-large)] [font-weight:var(--hui-font-weight-medium)]", className)}
      {...props}
    />
  )
}

function FrameDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="frame-panel-description"
      className={cn("[font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)] text-[var(--hui-color-foreground-base-secondary)]", className)}
      {...props}
    />
  )
}

function FrameFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return (
    <footer
      data-slot="frame-panel-footer"
      className={cn("flex flex-col gap-1 px-5 py-4", className)}
      {...props}
    />
  )
}

export {
  Frame,
  FramePanel,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FrameFooter,
}
