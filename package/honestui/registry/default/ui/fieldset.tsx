"use client"

import { Fieldset as FieldsetPrimitive } from "@base-ui-components/react/fieldset"

import { cn } from "@/lib/utils"

function Fieldset({ className, ...props }: FieldsetPrimitive.Root.Props) {
  return (
    <FieldsetPrimitive.Root
      data-slot="fieldset"
      className={cn(
        "m-0 flex flex-col gap-[var(--hui-space-4)] border-0 p-0",
        className
      )}
      {...props}
    />
  )
}
function FieldsetLegend({
  className,
  ...props
}: FieldsetPrimitive.Legend.Props) {
  return (
    <FieldsetPrimitive.Legend
      data-slot="fieldset-legend"
      className={cn(
        "mb-[var(--hui-space-2)] p-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-base)] [font-weight:var(--hui-font-weight-semibold)] [letter-spacing:var(--hui-letter-spacing-base)] [line-height:var(--hui-line-height-base)]",
        className
      )}
      {...props}
    />
  )
}

export { Fieldset, FieldsetLegend }
