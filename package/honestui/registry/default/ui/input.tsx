"use client"

import { Input as InputPrimitive } from "@base-ui-components/react/input"

import { cn } from "@/lib/utils"

function Input({
  className,
  size = "default",
  variant = "default",
  ...props
}: Omit<InputPrimitive.Props, "size"> & {
  size?: "sm" | "default" | "lg" | number
  variant?: "default" | "borderless"
}) {
  return (
    <span
      data-slot="input-control"
      data-disabled={props.disabled ? "" : undefined}
      data-variant={variant}
      className={cn(
        "relative flex min-h-[var(--hui-space-9)] w-full items-center overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-tertiary)] bg-[var(--hui-color-background-base-primary)] [transition:var(--hui-transition-interactive)] focus-within:border-[var(--hui-color-border-accent-emphasis)] focus-within:bg-[var(--hui-color-background-base-primary)] focus-within:outline-none has-[[data-slot=input][data-active=true]]:border-[var(--hui-color-border-accent-emphasis)] has-[[data-slot=input][data-invalid]]:border-[var(--hui-color-border-danger-emphasis)] has-[[data-slot=input][data-invalid]]:focus-within:border-[var(--hui-color-border-danger-emphasis-hover)] has-[[data-slot=input][aria-invalid=true]]:border-[var(--hui-color-border-danger-emphasis)] has-[[data-slot=input][aria-invalid=true]]:focus-within:border-[var(--hui-color-border-danger-emphasis-hover)] has-[[data-slot=input][data-disabled]]:cursor-not-allowed has-[[data-slot=input][data-disabled]]:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        size === "sm" && "min-h-[var(--hui-space-7)]",
        size === "lg" && "min-h-[var(--hui-space-10)]",
        variant === "borderless" &&
          "border-transparent focus-within:border-transparent has-[[data-slot=input]:focus-visible]:shadow-[var(--hui-focus-ring-shadow)]",
        className
      )}
    >
      <InputPrimitive
        data-slot="input"
        className={cn(
          "m-0 box-border h-[var(--hui-space-9)] w-full min-w-0 rounded-none border-0 bg-transparent pe-[var(--hui-space-2)] ps-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] outline-none [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-t2)] placeholder:text-[var(--hui-color-foreground-base-tertiary)] placeholder:[font-size:var(--hui-font-size-small)] placeholder:[font-weight:var(--hui-font-weight-regular)] placeholder:[letter-spacing:var(--hui-letter-spacing-small)] placeholder:[line-height:var(--hui-line-height-t2)] focus:border-[var(--hui-color-border-accent-emphasis)] data-disabled:cursor-not-allowed data-disabled:text-[var(--hui-color-foreground-base-tertiary)]",
          size === "sm" &&
            "h-[var(--hui-space-7)] [line-height:var(--hui-line-height-large)]",
          size === "lg" && "h-[var(--hui-space-10)]",
          props.type === "search" &&
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
          props.type === "file" &&
            "text-muted-foreground file:me-3 file:bg-transparent file:text-sm file:font-medium file:text-foreground"
        )}
        size={typeof size === "number" ? size : undefined}
        {...props}
      />
    </span>
  )
}

export { Input }
