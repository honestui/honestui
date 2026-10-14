import type { ComponentPropsWithoutRef } from "react"

import { cn } from "../../lib/utils.js"

function Skeleton({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-skeleton rounded-[var(--hui-radius-1)] [--skeleton-highlight:--alpha(var(--color-white)/64%)] [background:linear-gradient(120deg,transparent_40%,var(--skeleton-highlight),transparent_60%)_var(--hui-color-background-neutral-secondary)_0_0_/_200%_100%_fixed] dark:[--skeleton-highlight:--alpha(var(--color-white)/4%)]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
