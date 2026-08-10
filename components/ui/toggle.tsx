"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "@base-ui-components/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui-components/react/toggle-group"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const toggleVariants = cva(
  "box-border inline-flex w-auto shrink-0 cursor-pointer items-center justify-center rounded-[var(--hui-radius-1)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)] outline-none [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] [transition:color_var(--hui-duration-normal)_var(--hui-ease-out)] hover:text-[var(--hui-color-foreground-base-primary)] data-pressed:text-[var(--hui-color-foreground-base-primary)] data-disabled:pointer-events-auto data-disabled:cursor-not-allowed data-disabled:opacity-50 focus-visible:[outline:var(--hui-focus-ring)] [&:hover>[data-slot=toggle-content]]:bg-[var(--hui-color-background-base-primary-hover)] data-pressed:[&>[data-slot=toggle-content]]:bg-[var(--hui-color-background-neutral-secondary)] data-pressed:[&>[data-slot=toggle-content]]:shadow-[var(--hui-shadow-inset)] data-pressed:[&:hover>[data-slot=toggle-content]]:bg-[var(--hui-color-background-neutral-secondary-hover)] [&[data-disabled]:not([data-pressed]):hover]:text-[var(--hui-color-foreground-base-secondary)] [&[data-disabled]:not([data-pressed]):hover>[data-slot=toggle-content]]:bg-transparent [&[data-disabled]:not([data-pressed]):hover>[data-slot=toggle-content]]:shadow-none [&[data-disabled][data-pressed]:hover>[data-slot=toggle-content]]:bg-[var(--hui-color-background-neutral-secondary)]",
  {
    variants: {
      variant: {
        default: null,
        outline: null,
      },
      size: {
        "1": "h-[var(--hui-space-4)] min-w-[var(--hui-space-4)]",
        "2": "h-[var(--hui-space-5)] min-w-[var(--hui-space-5)]",
        "3": "h-[var(--hui-space-6)] min-w-[var(--hui-space-6)]",
        "4": "h-[var(--hui-space-7)] min-w-[var(--hui-space-7)]",
        sm: "h-[var(--hui-space-6)] min-w-[var(--hui-space-6)]",
        default: "h-[var(--hui-space-7)] min-w-[var(--hui-space-7)]",
        lg: "h-[var(--hui-space-7)] min-w-[var(--hui-space-7)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const ToggleGroupContext =
  React.createContext<VariantProps<typeof toggleVariants> | null>(null)

function Toggle({
  className,
  children,
  variant,
  size,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  const resolvedVariant = context?.variant ?? variant
  const resolvedSize = context?.size ?? size

  return (
    <TogglePrimitive
      data-slot="toggle"
      data-variant={resolvedVariant}
      data-size={resolvedSize}
      className={cn(
        toggleVariants({ variant: resolvedVariant, size: resolvedSize }),
        context &&
          "rounded-none border-0 bg-transparent focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset-border)] hover:bg-[var(--hui-color-background-base-primary-hover)] data-pressed:bg-[var(--hui-color-background-base-primary)] data-pressed:shadow-[var(--hui-shadow-inset)] data-pressed:[&>[data-slot=toggle-content]]:bg-transparent data-pressed:[&>[data-slot=toggle-content]]:shadow-none data-pressed:[&:hover>[data-slot=toggle-content]]:bg-transparent data-disabled:not-data-pressed:hover:bg-transparent data-disabled:not-data-pressed:hover:shadow-none motion-safe:[transition:color_var(--hui-duration-normal)_var(--hui-ease-out),background-color_var(--hui-duration-fast)_var(--hui-ease-out),box-shadow_var(--hui-duration-fast)_var(--hui-ease-out)]",
        className
      )}
      {...props}
    >
      <span
        data-slot="toggle-content"
        className="flex h-full min-w-0 flex-1 items-center justify-center rounded-[var(--hui-radius-1)] motion-safe:[transition:background-color_var(--hui-duration-fast)_var(--hui-ease-out),box-shadow_var(--hui-duration-fast)_var(--hui-ease-out)] [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:shrink-0"
      >
        {children}
      </span>
    </TogglePrimitive>
  )
}

function ToggleGroup({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: ToggleGroupPrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        "inline-flex w-fit items-center gap-px overflow-clip rounded-[var(--hui-radius-1)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-1)] data-[orientation=vertical]:flex-col data-disabled:pointer-events-auto data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

function ToggleGroupSeparator({ className, ...props }: { className?: string }) {
  return <Separator orientation="vertical" className={className} {...props} />
}

export {
  Toggle,
  ToggleGroup,
  Toggle as ToggleGroupItem,
  ToggleGroupSeparator,
  toggleVariants,
}
