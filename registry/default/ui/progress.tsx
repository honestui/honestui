"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "@base-ui-components/react/progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  children,
  max = 100,
  min = 0,
  style,
  value,
  variant = "linear",
  ...props
}: ProgressPrimitive.Root.Props & {
  variant?: "linear" | "circular"
}) {
  const percentage =
    value !== null && Number.isFinite(value) && max > min
      ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
      : 0

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-variant={variant}
      className={cn(
        "group/progress flex w-full flex-col gap-[var(--hui-space-3)]",
        variant === "circular" && "relative items-center justify-center",
        className
      )}
      max={max}
      min={min}
      style={(state) =>
        ({
          ...(typeof style === "function" ? style(state) : style),
          "--hui-progress-percentage": percentage,
        }) as React.CSSProperties & { "--hui-progress-percentage": number }
      }
      value={value}
      {...props}
    >
      {children ? (
        children
      ) : variant === "circular" ? (
        <>
          <ProgressCircularTrack />
          <ProgressValue />
        </>
      ) : (
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      )}
    </ProgressPrimitive.Root>
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      data-slot="progress-label"
      className={cn(
        "text-[var(--hui-color-foreground-base-primary)] [font-family:var(--hui-font-body)] [font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]",
        className
      )}
      {...props}
    />
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      data-slot="progress-track"
      className={cn(
        "relative block h-[var(--hui-space-2)] w-full overflow-clip rounded-[1px] bg-[var(--hui-color-background-neutral-secondary)]",
        className
      )}
      {...props}
    />
  )
}

function ProgressIndicator({
  className,
  style,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(
        "h-full origin-left bg-[var(--hui-color-background-accent-emphasis)] [transform:scaleX(calc(var(--hui-progress-percentage,0)/100))] data-indeterminate:origin-center data-indeterminate:opacity-60 data-indeterminate:[transform:scaleX(0.4)] motion-safe:[transition:transform_var(--hui-duration-moderate)_linear] motion-safe:data-indeterminate:origin-left motion-safe:data-indeterminate:opacity-100 motion-safe:data-indeterminate:[animation:progress-indeterminate-sweep_1.2s_var(--hui-ease-in-out)_infinite] motion-safe:data-indeterminate:[transition:none]",
        className
      )}
      style={(state) => ({
        ...(typeof style === "function" ? style(state) : style),
        width: "100%",
      })}
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      data-slot="progress-value"
      className={cn(
        "text-right text-[var(--hui-color-foreground-base-primary)] tabular-nums [font-family:var(--hui-font-body)] [font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)] group-data-[variant=circular]/progress:absolute group-data-[variant=circular]/progress:top-1/2 group-data-[variant=circular]/progress:left-1/2 group-data-[variant=circular]/progress:-translate-x-1/2 group-data-[variant=circular]/progress:-translate-y-1/2 group-data-[variant=circular]/progress:whitespace-nowrap group-data-[variant=circular]/progress:text-center group-data-[variant=circular]/progress:[font-weight:var(--hui-font-weight-medium)]",
        className
      )}
      {...props}
    />
  )
}

function ProgressCircularTrack({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      aria-hidden="true"
      data-slot="progress-circular-track"
      viewBox="0 0 72 72"
      className={cn(
        "aspect-square h-[var(--hui-space-14)] w-[var(--hui-space-14)] -rotate-90 [--hui-progress-circumference:calc(2*3.14159265*var(--hui-progress-radius))] [--hui-progress-radius:calc((var(--hui-space-14)-var(--hui-progress-track-size)*2)/2)] [--hui-progress-track-size:var(--hui-space-2)] motion-safe:group-data-[indeterminate]/progress:[animation:progress-indeterminate-rotate_1.2s_linear_infinite]",
        className
      )}
      {...props}
    >
      <circle
        data-slot="progress-circular-track-circle"
        className="fill-none stroke-[var(--hui-color-background-neutral-secondary)] [cx:50%] [cy:50%] [r:var(--hui-progress-radius)] [stroke-width:var(--hui-progress-track-size)]"
      />
      <circle
        data-slot="progress-circular-indicator-circle"
        className="fill-none stroke-[var(--hui-color-background-accent-emphasis)] [cx:50%] [cy:50%] [r:var(--hui-progress-radius)] [stroke-dasharray:var(--hui-progress-circumference)] [stroke-dashoffset:calc(var(--hui-progress-circumference)*(1-var(--hui-progress-percentage,0)/100))] [stroke-linecap:butt] [stroke-width:var(--hui-progress-track-size)] group-data-[indeterminate]/progress:opacity-60 group-data-[indeterminate]/progress:[stroke-dashoffset:calc(var(--hui-progress-circumference)*0.75)] motion-safe:[transition:stroke-dashoffset_var(--hui-duration-moderate)_linear] motion-safe:group-data-[indeterminate]/progress:opacity-100"
      />
    </svg>
  )
}

export {
  Progress,
  ProgressLabel,
  ProgressTrack,
  ProgressIndicator,
  ProgressValue,
  ProgressCircularTrack,
}
