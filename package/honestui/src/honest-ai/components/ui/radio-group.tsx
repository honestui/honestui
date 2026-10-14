"use client"

import { Radio as RadioPrimitive } from "@base-ui-components/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui-components/react/radio-group"

import { cn } from "../../lib/utils.js"

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("flex flex-col gap-[var(--hui-space-4)]", className)}
      {...props}
    />
  )
}

function Radio({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio"
      className={cn(
        "relative inline-flex size-[var(--hui-space-5)] shrink-0 cursor-pointer items-center justify-center rounded-[var(--hui-radius-full)] border border-[var(--hui-color-border-base-tertiary)] bg-[var(--hui-color-background-base-primary)] outline-none motion-safe:[transition:background-color_var(--hui-duration-fast)_var(--hui-ease-out),border-color_var(--hui-duration-fast)_var(--hui-ease-out),box-shadow_var(--hui-duration-fast)_var(--hui-ease-out),transform_var(--hui-duration-press)_var(--hui-ease-out)] not-data-disabled:hover:border-[var(--hui-color-border-base-focus)] not-data-disabled:not-data-checked:hover:bg-[var(--hui-color-background-base-primary-hover)] not-data-disabled:not-data-readonly:active:scale-[var(--hui-scale-pressed-strong)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)] data-checked:border-transparent data-checked:bg-[var(--hui-color-background-accent-emphasis)] data-checked:shadow-[var(--hui-shadow-key,var(--hui-shadow-feather))] not-data-disabled:data-checked:hover:bg-[var(--hui-color-background-accent-emphasis-hover)] data-readonly:cursor-default data-invalid:border-[var(--hui-color-border-danger-emphasis)] data-invalid:data-checked:bg-[var(--hui-color-background-danger-emphasis)] data-invalid:focus-visible:[outline-color:var(--hui-color-border-danger-emphasis)] aria-invalid:border-[var(--hui-color-border-danger-emphasis)] aria-invalid:data-checked:bg-[var(--hui-color-background-danger-emphasis)] aria-invalid:focus-visible:[outline-color:var(--hui-color-border-danger-emphasis)] data-disabled:cursor-not-allowed data-disabled:border-[var(--hui-color-border-base-secondary)] data-disabled:bg-[var(--hui-color-background-neutral-primary)] data-disabled:shadow-none data-disabled:data-checked:bg-[var(--hui-color-background-neutral-secondary)]",
        className
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-indicator"
        className="flex size-full items-center justify-center before:size-[6px] before:rounded-[var(--hui-radius-full)] before:bg-[var(--hui-color-foreground-accent-emphasis)] data-disabled:before:bg-[var(--hui-color-foreground-base-tertiary)] data-unchecked:hidden"
      />
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, Radio, Radio as RadioGroupItem }
