import * as React from "react"
import { LoaderCircle as LoaderCircleIcon } from "honestui/icons"

import { cn } from "@/lib/utils"

const sizes = {
  sm: "size-3.5",
  default: "size-4",
  lg: "size-5",
} as const

type SpinnerProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** Announced to assistive technology. Ignored when `decorative`. */
  label?: string
  /**
   * Hides the spinner from assistive technology. Use it when nearby text
   * already says what is loading, such as a button that reads "Saving…".
   */
  decorative?: boolean
  size?: keyof typeof sizes | number
}

function Spinner({
  className,
  label = "Loading",
  decorative = false,
  size = "default",
  style,
  ...props
}: SpinnerProps) {
  const numeric = typeof size === "number"

  return (
    <span
      data-slot="spinner"
      role={decorative ? undefined : "status"}
      aria-hidden={decorative ? true : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-current",
        !numeric && sizes[size],
        className
      )}
      style={numeric ? { width: size, height: size, ...style } : style}
      {...props}
    >
      <LoaderCircleIcon
        aria-hidden="true"
        // The spin carries meaning, so reduced motion slows it rather than
        // stopping it: a frozen arc reads as a broken icon.
        className="size-full motion-safe:animate-spin motion-reduce:animate-[spin_2.4s_linear_infinite] forced-colors:text-[CanvasText]"
      />
      {!decorative && <span className="sr-only">{label}</span>}
    </span>
  )
}

export { Spinner }
