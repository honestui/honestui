"use client"

import * as React from "react"
import { NumberField as NumberFieldPrimitive } from "@base-ui-components/react/number-field"
import { Minus as MinusIcon, Plus as PlusIcon } from "honestui/icons"

import { cn } from "@/lib/utils"
import { Label } from "@/registry/default/ui/label"

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
          "flex flex-col items-start gap-[var(--rs-space-2)]",
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
        "inline-flex items-center",
        className
      )}
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
        "relative flex size-[var(--rs-space-7)] shrink-0 cursor-pointer items-center justify-center rounded-s-[var(--rs-radius-1)] border-[0.5px] border-[var(--rs-color-border-base-tertiary)] bg-[var(--rs-color-background-base-secondary)] p-0 text-[var(--rs-color-foreground-base-primary)] [transition:var(--rs-transition-interactive)] hover:bg-[var(--rs-color-background-base-primary-hover)] focus-visible:[outline:var(--rs-focus-ring)] focus-visible:outline-offset-[var(--rs-focus-ring-offset-inset-border)] not-data-disabled:active:bg-[var(--rs-color-background-neutral-secondary)] data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
        "relative flex size-[var(--rs-space-7)] shrink-0 cursor-pointer items-center justify-center rounded-e-[var(--rs-radius-1)] border-[0.5px] border-[var(--rs-color-border-base-tertiary)] bg-[var(--rs-color-background-base-secondary)] p-0 text-[var(--rs-color-foreground-base-primary)] [transition:var(--rs-transition-interactive)] hover:bg-[var(--rs-color-background-base-primary-hover)] focus-visible:[outline:var(--rs-focus-ring)] focus-visible:outline-offset-[var(--rs-focus-ring-offset-inset-border)] not-data-disabled:active:bg-[var(--rs-color-background-neutral-secondary)] data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
        "h-[var(--rs-space-7)] min-w-0 flex-[1_0_0] border-[0.5px] border-[var(--rs-color-border-base-tertiary)] bg-[var(--rs-color-background-base-primary)] px-[var(--rs-space-2)] text-center text-[var(--rs-color-foreground-base-primary)] tabular-nums outline-none [font-family:var(--rs-font-body)] [font-size:var(--rs-font-size-small)] [font-weight:var(--rs-font-weight-regular)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)] [transition:var(--rs-transition-interactive)] focus:border-[var(--rs-color-border-accent-emphasis)] focus:bg-[var(--rs-color-background-base-primary)] data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-invalid:border-[var(--rs-color-border-danger-emphasis)] data-invalid:focus:border-[var(--rs-color-border-danger-emphasis-hover)]",
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
      <NumberFieldPrimitive.ScrubAreaCursor className="drop-shadow-[0_1px_1px_var(--rs-color-overlay-black-a7)] filter">
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
