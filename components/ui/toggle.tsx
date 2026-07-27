"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "@base-ui-components/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui-components/react/toggle-group"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const toggleVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-shadow outline-none select-none before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 data-pressed:bg-accent data-pressed:text-accent-foreground data-pressed:transition-none dark:hover:bg-accent dark:data-pressed:bg-input/80 pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-transparent text-foreground shadow-none data-pressed:border-border data-pressed:bg-accent data-pressed:text-accent-foreground dark:data-pressed:border-transparent dark:data-pressed:bg-input/80",
        outline:
          "border-border bg-clip-padding shadow-xs not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] dark:bg-input/32 dark:not-disabled:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/4%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/8%)] dark:hover:bg-input/64 [&:is(:disabled,:active,[data-pressed])]:shadow-none",
      },
      size: {
        default: "h-8 min-w-8 px-[calc(--spacing(2)-1px)]",
        sm: "h-7 min-w-7 px-[calc(--spacing(1.5)-1px)]",
        lg: "h-9 min-w-9 px-[calc(--spacing(2.5)-1px)]",
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
          resolvedVariant === "outline" &&
          "border-x-0 not-first:rounded-s-none not-last:rounded-e-none before:[clip-path:inset(-1rem_var(--clip-end)_-1rem_var(--clip-start))] not-first:before:-start-0.5 not-first:before:rounded-s-none not-first:before:[--clip-start:2px] not-last:before:-end-0.5 not-last:before:rounded-e-none not-last:before:[--clip-end:2px] first:border-s last:border-e focus-visible:z-10 not-last:has-[+[data-slot=separator]]:before:[--clip-end:1.5px] [[data-slot=separator]+&]:before:[--clip-start:1.5px]",
        className
      )}
      {...props}
    >
      {children}
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
        "flex w-fit *:pointer-coarse:after:min-w-auto",
        variant === "default"
          ? "gap-0.5"
          : "[--clip-end:-1rem] [--clip-start:-1rem]",
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
