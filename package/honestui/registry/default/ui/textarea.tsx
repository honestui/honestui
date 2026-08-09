import * as React from "react"

import { cn } from "@/lib/utils"

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
        "m-0 box-border h-auto w-full appearance-none overflow-auto rounded-[var(--rs-radius-2)] border-[0.5px] border-[var(--rs-color-border-base-tertiary)] bg-[var(--rs-color-background-base-primary)] text-[var(--rs-color-foreground-base-primary)] outline-none [font-size:var(--rs-font-size-small)] [line-height:var(--rs-line-height-small)] placeholder:text-[var(--rs-color-foreground-base-tertiary)] placeholder:[font-size:var(--rs-font-size-small)] placeholder:[font-weight:var(--rs-font-weight-regular)] placeholder:[line-height:var(--rs-line-height-small)] read-only:bg-[var(--rs-color-background-base-secondary)] disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-invalid:border-[var(--rs-color-border-danger-emphasis)] aria-invalid:border-[var(--rs-color-border-danger-emphasis)] [&:focus:not(:disabled)]:border-[var(--rs-color-border-accent-emphasis)] [&:focus:not(:disabled)]:bg-[var(--rs-color-background-base-primary)] data-invalid:focus:border-[var(--rs-color-border-danger-emphasis-hover)] aria-invalid:focus:border-[var(--rs-color-border-danger-emphasis-hover)] motion-safe:[transition:var(--rs-transition-interactive)]",
        (size === "large" || size === "lg" || size === "default") &&
          "p-[var(--rs-space-3)]",
        (size === "small" || size === "sm") && "p-[var(--rs-space-2)]",
        variant === "borderless" &&
          "border-transparent [&:focus:not(:disabled)]:border-transparent! [&:focus-visible:not(:disabled)]:shadow-[var(--rs-focus-ring-shadow)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
