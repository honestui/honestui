"use client"

import { Switch as SwitchPrimitive } from "@base-ui-components/react/switch"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "group/switch inline-flex h-[18px] w-[30px] shrink-0 cursor-pointer items-center rounded-[var(--hui-radius-full)] bg-[var(--hui-color-background-neutral-secondary-hover)] p-px shadow-[var(--hui-shadow-inset)] outline-none motion-safe:[transition:background-color_var(--hui-duration-normal)_var(--hui-ease-out)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)] data-checked:bg-[var(--hui-color-background-accent-emphasis)] not-data-disabled:data-checked:hover:bg-[var(--hui-color-background-accent-emphasis-hover)] data-invalid:focus-visible:[outline-color:var(--hui-color-border-danger-emphasis)] data-disabled:cursor-not-allowed data-disabled:bg-[var(--hui-color-background-neutral-secondary)] data-disabled:shadow-none data-disabled:data-checked:bg-[var(--hui-color-background-neutral-tertiary)] data-readonly:cursor-default",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-[var(--hui-radius-full)] bg-[var(--hui-color-foreground-accent-emphasis)] shadow-[var(--hui-shadow-key,var(--hui-shadow-feather))] motion-safe:[transition:translate_var(--hui-duration-normal)_var(--hui-ease-out),width_var(--hui-duration-press)_var(--hui-ease-out)] group-not-data-disabled/switch:group-active/switch:w-[18px] data-checked:translate-x-3 group-not-data-disabled/switch:data-checked:group-active/switch:translate-x-2.5 data-unchecked:translate-x-0 group-data-disabled/switch:bg-[var(--hui-color-background-base-primary)] group-data-disabled/switch:shadow-none"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
