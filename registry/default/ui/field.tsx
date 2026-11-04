"use client"

import { Field as FieldPrimitive } from "@base-ui/react/field"

import { cn } from "@/lib/utils"

function Field({ className, ...props }: FieldPrimitive.Root.Props) {
  return (
    <FieldPrimitive.Root
      data-slot="field"
      className={cn(
        "flex w-full flex-col gap-[var(--hui-space-2)]",
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
      className={cn(
        "inline-flex items-center gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)] [font-size:var(--hui-font-size-control,13px)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:var(--hui-line-height-control,16px)] data-disabled:text-[var(--hui-color-foreground-base-tertiary)]",
        className
      )}
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
        data-hui=""
        data-slot="field-control"
        className={cn(
          "box-border h-[var(--hui-density-control-height,36px)] w-full min-w-0 rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-field,var(--hui-color-border-base-tertiary))] bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] px-[var(--hui-field-padding-inline,var(--hui-space-3))] text-[var(--hui-color-foreground-base-primary)] outline-none [font-size:var(--hui-font-size-control,13px)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:var(--hui-line-height-control,16px)] motion-safe:[transition:var(--hui-transition-interactive)] not-focus:not-data-disabled:not-data-invalid:not-aria-invalid:not-read-only:hover:border-[var(--hui-color-border-field-hover,var(--hui-color-border-field,var(--hui-color-border-base-tertiary)))] placeholder:text-[var(--hui-color-foreground-base-tertiary)] focus:border-[var(--hui-color-border-accent-emphasis)] focus:outline-2 focus:outline-solid focus:outline-transparent focus:shadow-[var(--hui-focus-ring-field)] focus:outline-offset-[var(--hui-focus-ring-offset-inset-border)] data-disabled:cursor-not-allowed data-disabled:border-[var(--hui-color-border-base-primary)] read-only:bg-[var(--hui-color-background-base-secondary)] data-disabled:bg-[var(--hui-color-background-base-secondary)] data-disabled:text-[var(--hui-color-foreground-base-tertiary)] data-invalid:border-[var(--hui-color-border-danger-emphasis)] data-invalid:focus:border-[var(--hui-color-border-danger-emphasis-hover)] data-invalid:focus:shadow-[var(--hui-focus-ring-field-danger)] aria-invalid:border-[var(--hui-color-border-danger-emphasis)] aria-invalid:focus:border-[var(--hui-color-border-danger-emphasis-hover)] aria-invalid:focus:shadow-[var(--hui-focus-ring-field-danger)]",
          size === "sm" && "h-[var(--hui-control-height-sm,var(--hui-space-8))]",
          size === "lg" && "h-[var(--hui-control-height-lg,44px)]",
          props.type === "search" &&
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
          props.type === "file" &&
            "text-[var(--hui-color-foreground-base-secondary)] file:me-3 file:bg-transparent file:[font-size:var(--hui-font-size-control,13px)] file:[line-height:var(--hui-line-height-regular)] file:font-medium file:text-[var(--hui-color-foreground-base-primary)]"
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
        "m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]",
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
        "m-0 text-[var(--hui-color-foreground-danger-primary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] starting:opacity-0",
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
        "grid [&>*]:[grid-area:1/1] [&:has(>[data-slot=field-error])>[data-slot=field-description]]:invisible [&:has(>[data-slot=field-error])>[data-slot=field-description]]:opacity-0 motion-safe:[&>*]:[transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out),visibility_var(--hui-duration-fast)_var(--hui-ease-out)]",
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
      <div className="h-[0.5px] flex-1 bg-[var(--hui-color-border-base-primary)]" />
      {children && (
        <span className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">{children}</span>
      )}
      <div className="h-[0.5px] flex-1 bg-[var(--hui-color-border-base-primary)]" />
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
