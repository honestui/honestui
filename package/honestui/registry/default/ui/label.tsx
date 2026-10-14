import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "inline-flex items-center gap-2 leading-4 text-foreground [font-size:var(--hui-font-size-control,13px)]",
        className
      )}
      {...props}
    />
  )
}

export { Label }
