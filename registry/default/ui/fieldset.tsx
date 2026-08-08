"use client"

import { Fieldset as FieldsetPrimitive } from "@base-ui-components/react/fieldset"

import { cn } from "@/lib/utils"

function Fieldset({ className, ...props }: FieldsetPrimitive.Root.Props) {
  return (
    <FieldsetPrimitive.Root
      data-slot="fieldset"
      className={cn(
        "m-0 flex flex-col gap-[var(--rs-space-4)] border-0 p-0",
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
        "mb-[var(--rs-space-2)] p-0 text-[var(--rs-color-foreground-base-primary)] [font-size:var(--rs-font-size-base)] [font-weight:var(--rs-font-weight-semibold)] [letter-spacing:var(--rs-letter-spacing-base)] [line-height:var(--rs-line-height-base)]",
        className
      )}
      {...props}
    />
  )
}

export { Fieldset, FieldsetLegend }
