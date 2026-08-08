"use client"

import { Field as FieldPrimitive } from "@base-ui-components/react/field"

import { cn } from "@/lib/utils"

function Field({ className, ...props }: FieldPrimitive.Root.Props) {
  return (
    <FieldPrimitive.Root
      data-slot="field"
      className={cn(
        "flex w-full flex-col gap-[var(--rs-space-2)]",
        className
      )}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn("inline-flex items-center gap-2 text-sm/4", className)}
      {...props}
    />
  )
}

function FieldControl({
  className,
  size = "default",
  ...props
}: Omit<FieldPrimitive.Control.Props, "size"> & {
  size?: "sm" | "default" | "lg" | number
}) {
  if (props.render) {
    return (
      <FieldPrimitive.Control
        data-slot="field-control"
        className={className}
        {...props}
      />
    )
  }

  return (
    <span
      data-slot="field-control"
      className={cn(
        "flex w-full flex-col",
        className
      )}
    >
      <FieldPrimitive.Control
        data-slot="field-control"
        className={cn(
          "box-border h-[var(--rs-space-9)] w-full min-w-0 rounded-[var(--rs-radius-2)] border-[0.5px] border-[var(--rs-color-border-base-tertiary)] bg-[var(--rs-color-background-base-primary)] px-[var(--rs-space-3)] text-[var(--rs-color-foreground-base-primary)] outline-none [font-size:var(--rs-font-size-small)] [font-weight:var(--rs-font-weight-regular)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)] [transition:var(--rs-transition-interactive)] placeholder:text-[var(--rs-color-foreground-base-tertiary)] focus:border-[var(--rs-color-border-accent-emphasis)] data-disabled:cursor-not-allowed data-disabled:opacity-40 data-invalid:border-[var(--rs-color-border-danger-emphasis)] data-invalid:focus:border-[var(--rs-color-border-danger-emphasis-hover)]",
          size === "sm" && "h-[var(--rs-space-8)]",
          size === "lg" && "h-[var(--rs-space-10)]",
          props.type === "search" &&
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
          props.type === "file" &&
            "text-muted-foreground file:me-3 file:bg-transparent file:text-sm file:font-medium file:text-foreground"
        )}
        {...props}
      />
    </span>
  )
}

function FieldDescription({
  className,
  ...props
}: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn(
        "m-0 text-[var(--rs-color-foreground-base-secondary)] [font-size:var(--rs-font-size-mini)] [font-weight:var(--rs-font-weight-regular)] [letter-spacing:var(--rs-letter-spacing-mini)] [line-height:var(--rs-line-height-mini)]",
        className
      )}
      {...props}
    />
  )
}

function FieldError({ className, ...props }: FieldPrimitive.Error.Props) {
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      className={cn(
        "m-0 text-[var(--rs-color-foreground-danger-primary)] [font-size:var(--rs-font-size-mini)] [font-weight:var(--rs-font-weight-regular)] [letter-spacing:var(--rs-letter-spacing-mini)] [line-height:var(--rs-line-height-mini)] starting:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function FieldHelperSlot({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-helper-slot"
      className={cn(
        "grid [&>*]:[grid-area:1/1] [&>[data-slot=field-description][data-invalid]]:invisible [&>[data-slot=field-description][data-invalid]]:opacity-0 motion-safe:[&>*]:[transition:opacity_var(--rs-duration-fast)_var(--rs-ease-out),visibility_var(--rs-duration-fast)_var(--rs-ease-out)]",
        className
      )}
      {...props}
    />
  )
}

const FieldValidity = FieldPrimitive.Validity

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function FieldSeparator({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-separator"
      className={cn("relative flex items-center gap-2 py-2", className)}
      {...props}
    >
      <div className="h-px flex-1 bg-border" />
      {children && (
        <span className="text-xs text-muted-foreground">{children}</span>
      )}
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

export {
  Field,
  FieldLabel,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldHelperSlot,
  FieldValidity,
  FieldGroup,
  FieldSeparator,
}
