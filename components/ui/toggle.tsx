"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const toggleVariants = cva(
  "box-border inline-flex w-auto shrink-0 cursor-pointer items-center justify-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--toggle-padding,var(--hui-space-3))] text-[var(--hui-color-foreground-base-secondary)] outline-none h-[var(--toggle-size)] min-w-[var(--toggle-size)] [font-size:var(--hui-font-size-control,13px)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:var(--hui-line-height-control,16px)] motion-safe:[transition:var(--hui-transition-interactive)] motion-safe:not-data-disabled:active:scale-[var(--hui-scale-pressed)] motion-safe:active:[transition:var(--hui-transition-pressed)] hover:bg-[var(--hui-color-background-base-primary-hover)] hover:text-[var(--hui-color-foreground-base-primary)] data-pressed:bg-[var(--hui-color-background-neutral-secondary)] data-pressed:text-[var(--hui-color-foreground-base-primary)] data-pressed:hover:bg-[var(--hui-color-background-neutral-secondary-hover)] data-disabled:pointer-events-auto data-disabled:cursor-not-allowed data-disabled:text-[var(--hui-color-foreground-base-tertiary)] data-disabled:not-data-pressed:hover:bg-transparent focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: null,
        outline: null,
      },
      size: {
        "1": "[--toggle-size:var(--hui-space-4)] [--toggle-padding:0px]",
        "2": "[--toggle-size:var(--hui-space-5)] [--toggle-padding:0px]",
        "3": "[--toggle-size:var(--hui-space-6)] [--toggle-padding:0px]",
        "4": "[--toggle-size:var(--hui-space-7)] [--toggle-padding:0px]",
        sm: "[--toggle-size:var(--hui-control-height-sm,var(--hui-space-8))]",
        default: "[--toggle-size:var(--hui-density-control-height,36px)]",
        lg: "[--toggle-size:var(--hui-control-height-lg,44px)]",
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
        // Group items sit inside the group's padding, so the group matches the
        // height of a standalone control. Pressed items are raised like the
        // active tab rather than inset.
        context &&
          "h-[max(var(--hui-space-4),calc(var(--toggle-size)-2*var(--hui-space-1)))] min-w-[max(var(--hui-space-4),calc(var(--toggle-size)-2*var(--hui-space-1)))] rounded-[calc(var(--hui-radius-2)-var(--hui-space-1))] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset-border)] hover:bg-transparent data-pressed:bg-[var(--hui-color-background-raised,var(--hui-color-background-overlay))] data-pressed:shadow-[var(--hui-shadow-key,var(--hui-shadow-feather))] data-pressed:hover:bg-[var(--hui-color-background-raised,var(--hui-color-background-overlay))]",
        className
      )}
      {...props}
    >
      <span
        data-slot="toggle-content"
        className="flex h-full min-w-0 flex-1 items-center justify-center gap-[inherit] [&>svg]:max-h-full [&>svg]:max-w-full"
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
        "inline-flex w-fit items-center gap-[var(--hui-space-1)] overflow-clip rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-neutral-secondary)] p-[var(--hui-space-1)] shadow-[var(--hui-shadow-inset)] data-[orientation=vertical]:flex-col data-disabled:pointer-events-auto data-disabled:cursor-not-allowed data-disabled:text-[var(--hui-color-foreground-base-tertiary)]",
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

function ToggleGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: {
  className?: string
  orientation?: "horizontal" | "vertical"
}) {
  return (
    <Separator
      orientation={orientation}
      className={cn(
        orientation === "vertical"
          ? "my-[var(--hui-space-2)] h-auto! self-stretch"
          : "mx-[var(--hui-space-2)] w-auto! self-stretch",
        className
      )}
      {...props}
    />
  )
}

export {
  Toggle,
  ToggleGroup,
  Toggle as ToggleGroupItem,
  ToggleGroupSeparator,
  toggleVariants,
}
