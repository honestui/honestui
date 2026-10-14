import * as React from "react"

import { cn } from "../../lib/utils.js"

function Textarea({
  className,
  size = "large",
  variant = "default",
  ...props
}: React.ComponentProps<"textarea"> & {
  size?: "sm" | "small" | "default" | "lg" | "large" | number
  variant?: "default" | "borderless"
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "m-0 box-border h-auto w-full appearance-none overflow-auto rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-tertiary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] outline-none [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-control,16px)] placeholder:text-[var(--hui-color-foreground-base-tertiary)] placeholder:[font-size:var(--hui-font-size-control,13px)] placeholder:[font-weight:var(--hui-font-weight-regular)] placeholder:[line-height:var(--hui-line-height-control,16px)] read-only:bg-[var(--hui-color-background-base-secondary)] disabled:cursor-not-allowed disabled:border-[var(--hui-color-border-base-primary)] disabled:bg-[var(--hui-color-background-base-secondary)] disabled:text-[var(--hui-color-foreground-base-tertiary)] data-disabled:cursor-not-allowed data-disabled:border-[var(--hui-color-border-base-primary)] data-disabled:bg-[var(--hui-color-background-base-secondary)] data-disabled:text-[var(--hui-color-foreground-base-tertiary)] data-invalid:border-[var(--hui-color-border-danger-emphasis)] aria-invalid:border-[var(--hui-color-border-danger-emphasis)] [&:focus:not(:disabled)]:border-[var(--hui-color-border-accent-emphasis)] [&:focus:not(:disabled)]:bg-[var(--hui-color-background-base-primary)] [&:focus:not(:disabled)]:[outline:var(--hui-focus-ring)] [&:focus:not(:disabled)]:outline-offset-[var(--hui-focus-ring-offset-inset-border)] data-invalid:focus:[outline-color:var(--hui-color-border-danger-emphasis)] aria-invalid:focus:[outline-color:var(--hui-color-border-danger-emphasis)] data-invalid:focus:border-[var(--hui-color-border-danger-emphasis-hover)] aria-invalid:focus:border-[var(--hui-color-border-danger-emphasis-hover)] motion-safe:[transition:var(--hui-transition-interactive)]",
        (size === "large" || size === "lg" || size === "default") &&
          "p-[var(--hui-space-3)]",
        (size === "small" || size === "sm") && "p-[var(--hui-space-2)]",
        variant === "borderless" &&
          "border-transparent [&:focus:not(:disabled)]:border-transparent! [&:focus:not(:disabled)]:outline-none! [&:focus-visible:not(:disabled)]:shadow-[var(--hui-focus-ring-shadow)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
