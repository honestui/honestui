import * as React from "react"

import { cn } from "../../lib/utils.js"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("inline-flex items-center gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-control,13px)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:var(--hui-line-height-control,16px)]", className)}
      {...props}
    />
  )
}

export { Label }
