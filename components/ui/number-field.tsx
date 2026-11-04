"use client"

import * as React from "react"
import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field"
import { Minus as MinusIcon, Plus as PlusIcon } from "honestui/icons"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const NumberFieldContext = React.createContext<{
  fieldId: string
} | null>(null)

function NumberField({
  id,
  className,
  size = "default",
  ...props
}: NumberFieldPrimitive.Root.Props & {
  size?: "sm" | "default" | "lg"
}) {
  const generatedId = React.useId()
  const fieldId = id ?? generatedId

  return (
    <NumberFieldContext.Provider value={{ fieldId }}>
      <NumberFieldPrimitive.Root
        id={fieldId}
        className={cn(
          "group/number-field flex flex-col items-start gap-[var(--hui-space-2)]",
          className
        )}
        data-slot="number-field"
        data-size={size}
        {...props}
      />
    </NumberFieldContext.Provider>
  )
}

function NumberFieldGroup({
  className,
  ...props
}: NumberFieldPrimitive.Group.Props) {
  return (
    <NumberFieldPrimitive.Group
      className={cn(
        "group/number-field-group inline-flex items-center rounded-[var(--hui-radius-2)] [&:not(:has(input:focus,input:read-only,[data-invalid],[aria-invalid=true],[data-disabled])):hover>*]:border-[var(--hui-color-border-field-hover,var(--hui-color-border-field,var(--hui-color-border-base-tertiary)))] has-[input:focus]:outline-2 has-[input:focus]:outline-solid has-[input:focus]:outline-transparent has-[input:focus]:shadow-[var(--hui-focus-ring-field)] has-[input:is([data-invalid],[aria-invalid=true]):focus]:shadow-[var(--hui-focus-ring-field-danger)]",
        className
      )}
      data-hui=""
      data-slot="number-field-group"
      {...props}
    />
  )
}

function NumberFieldDecrement({
  className,
  ...props
}: NumberFieldPrimitive.Decrement.Props) {
  return (
    <NumberFieldPrimitive.Decrement
      className={cn(
        "relative flex size-[var(--hui-density-control-height,36px)] group-data-[size=sm]/number-field:size-[var(--hui-control-height-sm,var(--hui-space-8))] group-data-[size=lg]/number-field:size-[var(--hui-control-height-lg,44px)] shrink-0 cursor-pointer disabled:cursor-default disabled:text-[var(--hui-color-foreground-base-tertiary)] group-has-[input:focus]/number-field-group:border-[var(--hui-color-border-accent-emphasis)] group-has-[input:is([data-invalid],[aria-invalid=true])]/number-field-group:border-[var(--hui-color-border-danger-emphasis)] group-has-[input:is([data-invalid],[aria-invalid=true]):focus]/number-field-group:border-[var(--hui-color-border-danger-emphasis-hover)] items-center justify-center rounded-s-[var(--hui-radius-2)] border-[0.5px] border-e-0 border-[var(--hui-color-border-field,var(--hui-color-border-base-tertiary))] bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] p-0 text-[var(--hui-color-foreground-base-secondary)] motion-safe:[transition:var(--hui-transition-interactive)] not-disabled:hover:bg-[var(--hui-color-background-base-primary-hover)] not-disabled:hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:z-1 focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset-border)] not-disabled:active:bg-[var(--hui-color-background-neutral-secondary)] data-disabled:pointer-events-none data-disabled:cursor-not-allowed group-has-[input[data-disabled]]/number-field-group:border-[var(--hui-color-border-base-primary)] data-disabled:text-[var(--hui-color-foreground-base-tertiary)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      data-slot="number-field-decrement"
      {...props}
    >
      <MinusIcon />
    </NumberFieldPrimitive.Decrement>
  )
}

function NumberFieldIncrement({
  className,
  ...props
}: NumberFieldPrimitive.Increment.Props) {
  return (
    <NumberFieldPrimitive.Increment
      className={cn(
        "relative flex size-[var(--hui-density-control-height,36px)] group-data-[size=sm]/number-field:size-[var(--hui-control-height-sm,var(--hui-space-8))] group-data-[size=lg]/number-field:size-[var(--hui-control-height-lg,44px)] shrink-0 cursor-pointer disabled:cursor-default disabled:text-[var(--hui-color-foreground-base-tertiary)] group-has-[input:focus]/number-field-group:border-[var(--hui-color-border-accent-emphasis)] group-has-[input:is([data-invalid],[aria-invalid=true])]/number-field-group:border-[var(--hui-color-border-danger-emphasis)] group-has-[input:is([data-invalid],[aria-invalid=true]):focus]/number-field-group:border-[var(--hui-color-border-danger-emphasis-hover)] items-center justify-center rounded-e-[var(--hui-radius-2)] border-[0.5px] border-s-0 border-[var(--hui-color-border-field,var(--hui-color-border-base-tertiary))] bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] p-0 text-[var(--hui-color-foreground-base-secondary)] motion-safe:[transition:var(--hui-transition-interactive)] not-disabled:hover:bg-[var(--hui-color-background-base-primary-hover)] not-disabled:hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:z-1 focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset-border)] not-disabled:active:bg-[var(--hui-color-background-neutral-secondary)] data-disabled:pointer-events-none data-disabled:cursor-not-allowed group-has-[input[data-disabled]]/number-field-group:border-[var(--hui-color-border-base-primary)] data-disabled:text-[var(--hui-color-foreground-base-tertiary)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      data-slot="number-field-increment"
      {...props}
    >
      <PlusIcon />
    </NumberFieldPrimitive.Increment>
  )
}

function NumberFieldInput({
  className,
  ...props
}: NumberFieldPrimitive.Input.Props) {
  return (
    <NumberFieldPrimitive.Input
      className={cn(
        "h-[var(--hui-density-control-height,36px)] group-data-[size=sm]/number-field:h-[var(--hui-control-height-sm,var(--hui-space-8))] group-data-[size=lg]/number-field:h-[var(--hui-control-height-lg,44px)] min-w-0 flex-[1_0_0] border-[0.5px] border-[var(--hui-color-border-field,var(--hui-color-border-base-tertiary))] bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] px-[var(--hui-space-2)] text-center text-[var(--hui-color-foreground-base-primary)] tabular-nums outline-none [font-family:var(--hui-font-body)] [font-size:var(--hui-font-size-control,13px)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:var(--hui-line-height-control,16px)] motion-safe:[transition:var(--hui-transition-interactive)] focus:border-y-[var(--hui-color-border-accent-emphasis)] read-only:bg-[var(--hui-color-background-base-secondary)] focus:not-read-only:bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] focus:z-1 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:border-[var(--hui-color-border-base-primary)] data-disabled:bg-[var(--hui-color-background-base-secondary)] data-disabled:text-[var(--hui-color-foreground-base-tertiary)] data-invalid:border-[var(--hui-color-border-danger-emphasis)] aria-invalid:border-[var(--hui-color-border-danger-emphasis)] data-invalid:focus:border-y-[var(--hui-color-border-danger-emphasis-hover)] aria-invalid:focus:border-y-[var(--hui-color-border-danger-emphasis-hover)]",
        className
      )}
      data-slot="number-field-input"
      {...props}
    />
  )
}

function NumberFieldScrubArea({
  className,
  label,
  ...props
}: NumberFieldPrimitive.ScrubArea.Props & {
  label: string
}) {
  const context = React.useContext(NumberFieldContext)

  if (!context) {
    throw new Error(
      "NumberFieldScrubArea must be used within a NumberField component for accessibility."
    )
  }

  return (
    <NumberFieldPrimitive.ScrubArea
      className={cn("flex cursor-ew-resize", className)}
      data-slot="number-field-scrub-area"
      {...props}
    >
      <Label htmlFor={context.fieldId} className="cursor-ew-resize">
        {label}
      </Label>
      <NumberFieldPrimitive.ScrubAreaCursor className="drop-shadow-[0_1px_1px_var(--hui-color-overlay-black-a7)] filter">
        <CursorGrowIcon />
      </NumberFieldPrimitive.ScrubAreaCursor>
    </NumberFieldPrimitive.ScrubArea>
  )
}

function CursorGrowIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="26"
      height="14"
      viewBox="0 0 24 14"
      fill="black"
      stroke="white"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M19.5 5.5L6.49737 5.51844V2L1 6.9999L6.5 12L6.49737 8.5L19.5 8.5V12L25 6.9999L19.5 2V5.5Z" />
    </svg>
  )
}

export {
  NumberField,
  NumberFieldScrubArea,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldGroup,
  NumberFieldInput,
}
