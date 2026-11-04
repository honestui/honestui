"use client"

import { Input as InputPrimitive } from "@base-ui/react/input"

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
      data-hui=""
      data-slot="input-control"
      data-disabled={props.disabled ? "" : undefined}
      data-variant={variant}
      className={cn(
        "relative flex min-h-[var(--hui-density-control-height,36px)] w-full items-center overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-field,var(--hui-color-border-base-tertiary))] bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] motion-safe:[transition:var(--hui-transition-interactive)] not-focus-within:not-has-[input:is([data-invalid],[aria-invalid=true],[data-disabled],:read-only)]:not-data-disabled:hover:border-[var(--hui-color-border-field-hover,var(--hui-color-border-field,var(--hui-color-border-base-tertiary)))] focus-within:border-[var(--hui-color-border-accent-emphasis)] focus-within:bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] focus-within:outline-2 focus-within:outline-solid focus-within:outline-transparent focus-within:shadow-[var(--hui-focus-ring-field)] focus-within:outline-offset-[var(--hui-focus-ring-offset-inset-border)] has-[input[data-active=true]]:border-[var(--hui-color-border-accent-emphasis)] has-[input[data-invalid]]:border-[var(--hui-color-border-danger-emphasis)] has-[input[data-invalid]]:focus-within:border-[var(--hui-color-border-danger-emphasis-hover)] has-[input[aria-invalid=true]]:border-[var(--hui-color-border-danger-emphasis)] has-[input[aria-invalid=true]]:focus-within:border-[var(--hui-color-border-danger-emphasis-hover)] has-[input:is([data-invalid],[aria-invalid=true])]:focus-within:shadow-[var(--hui-focus-ring-field-danger)] has-[input[readonly]]:bg-[var(--hui-color-background-base-secondary)] has-[input[data-disabled]]:cursor-not-allowed has-[input[data-disabled]]:border-[var(--hui-color-border-base-primary)] has-[input[data-disabled]]:bg-[var(--hui-color-background-base-secondary)] data-disabled:cursor-not-allowed data-disabled:border-[var(--hui-color-border-base-primary)] data-disabled:bg-[var(--hui-color-background-base-secondary)]",
        size === "sm" && "min-h-[var(--hui-control-height-sm,var(--hui-space-8))]",
        size === "lg" && "min-h-[var(--hui-control-height-lg,44px)]",
        variant === "borderless" &&
          "border-transparent focus-within:border-transparent focus-within:outline-none has-[input:focus-visible]:shadow-[var(--hui-focus-ring-shadow)]",
        className
      )}
    >
      <InputPrimitive
        data-slot="input"
        className={cn(
          "m-0 box-border h-[calc(var(--hui-density-control-height,36px)-2px)] w-full min-w-0 rounded-none border-0 bg-transparent pe-[var(--hui-field-padding-inline,var(--hui-space-3))] ps-[var(--hui-field-padding-inline,var(--hui-space-3))] text-[var(--hui-color-foreground-base-primary)] outline-none [font-size:var(--hui-font-size-control,13px)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:var(--hui-line-height-control,16px)] placeholder:text-[var(--hui-color-foreground-base-tertiary)] placeholder:[font-size:var(--hui-font-size-control,13px)] placeholder:[font-weight:var(--hui-font-weight-regular)] placeholder:[letter-spacing:var(--hui-letter-spacing-control,-0.003em)] placeholder:[line-height:var(--hui-line-height-control,16px)] data-disabled:cursor-not-allowed data-disabled:text-[var(--hui-color-foreground-base-tertiary)]",
          size === "sm" &&
            "h-[calc(var(--hui-control-height-sm,var(--hui-space-8))-2px)]",
          size === "lg" && "h-[calc(var(--hui-control-height-lg,44px)-2px)]",
          props.type === "search" &&
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
          props.type === "file" &&
            "text-[var(--hui-color-foreground-base-secondary)] file:me-3 file:bg-transparent file:[font-size:var(--hui-font-size-control,13px)] file:[line-height:var(--hui-line-height-regular)] file:font-medium file:text-[var(--hui-color-foreground-base-primary)]"
        )}
        size={typeof size === "number" ? size : undefined}
        {...props}
      />
    </span>
  )
}

export { Input }
