import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "inline-flex items-center gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-control,13px)] [font-weight:var(--hui-font-weight-medium)] [line-height:var(--hui-line-height-control,16px)] has-[:disabled]:text-[var(--hui-color-foreground-base-tertiary)] peer-disabled:text-[var(--hui-color-foreground-base-tertiary)]",
        className
      )}
      {...props}
    />
  )
}

export { Label }
