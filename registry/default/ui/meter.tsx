"use client"

import * as React from "react"
import { Meter as MeterPrimitive } from "@base-ui/react/meter"

import { cn } from "@/lib/utils"

function Meter({
  className,
  children,
  max = 100,
  min = 0,
  style,
  value,
  variant = "linear",
  ...props
}: MeterPrimitive.Root.Props & {
  variant?: "linear" | "circular"
}) {
  const percentage =
    max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0

  return (
    <MeterPrimitive.Root
      data-slot="meter"
      data-variant={variant}
      className={cn(
        "group/meter flex w-full flex-col gap-[var(--hui-space-3)]",
        variant === "circular" &&
          "relative items-center justify-center",
        className
      )}
      max={max}
      min={min}
      style={(state) =>
        ({
          ...(typeof style === "function" ? style(state) : style),
          "--hui-meter-percentage": percentage,
        }) as React.CSSProperties & { "--hui-meter-percentage": number }
      }
      value={value}
      {...props}
    >
      {children ? (
        children
      ) : variant === "circular" ? (
        <>
          <MeterCircularTrack />
          <MeterValue />
        </>
      ) : (
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      )}
    </MeterPrimitive.Root>
  )
}

function MeterLabel({ className, ...props }: MeterPrimitive.Label.Props) {
  return (
    <MeterPrimitive.Label
      data-slot="meter-label"
      className={cn(
        "text-[var(--hui-color-foreground-base-primary)] [font-family:var(--hui-font-body)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]",
        className
      )}
      {...props}
    />
  )
}

function MeterTrack({ className, ...props }: MeterPrimitive.Track.Props) {
  return (
    <MeterPrimitive.Track
      data-slot="meter-track"
      className={cn(
        "relative block h-[var(--hui-space-2)] w-full overflow-clip rounded-[var(--hui-radius-full)] bg-[var(--hui-color-background-neutral-secondary)]",
        className
      )}
      {...props}
    />
  )
}

function MeterIndicator({
  className,
  style,
  ...props
}: MeterPrimitive.Indicator.Props) {
  return (
    <MeterPrimitive.Indicator
      data-slot="meter-indicator"
      className={cn(
        "h-full rounded-[inherit] bg-[var(--hui-color-background-accent-emphasis)] [transform:translateX(calc((var(--hui-meter-percentage,0)-100)*1%))] rtl:[transform:translateX(calc((100-var(--hui-meter-percentage,0))*1%))] motion-safe:[transition:transform_var(--hui-duration-moderate)_var(--hui-ease-out)]",
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

function MeterValue({ className, ...props }: MeterPrimitive.Value.Props) {
  return (
    <MeterPrimitive.Value
      data-slot="meter-value"
      className={cn(
        "text-end text-[var(--hui-color-foreground-base-primary)] tabular-nums [font-family:var(--hui-font-body)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] group-data-[variant=circular]/meter:absolute group-data-[variant=circular]/meter:top-1/2 group-data-[variant=circular]/meter:left-1/2 group-data-[variant=circular]/meter:-translate-x-1/2 group-data-[variant=circular]/meter:-translate-y-1/2 group-data-[variant=circular]/meter:whitespace-nowrap group-data-[variant=circular]/meter:text-center group-data-[variant=circular]/meter:[font-weight:var(--hui-font-weight-medium)]",
        className
      )}
      {...props}
    />
  )
}

function MeterCircularTrack({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      aria-hidden="true"
      data-slot="meter-circular-track"
      viewBox="0 0 72 72"
      className={cn(
        "aspect-square h-[var(--hui-meter-size)] w-[var(--hui-meter-size)] -rotate-90 [--hui-meter-size:var(--hui-space-14)] [--hui-meter-track-size:var(--hui-space-2)]",
        className
      )}
      {...props}
    >
      <circle
        cx="36"
        cy="36"
        data-slot="meter-circular-track-circle"
        r="32"
        className="fill-none stroke-[var(--hui-color-background-neutral-secondary)] [stroke-width:var(--hui-meter-track-size)]"
      />
      <circle
        cx="36"
        cy="36"
        data-slot="meter-circular-indicator-circle"
        pathLength="100"
        r="32"
        strokeDasharray="100"
        className="fill-none stroke-[var(--hui-color-background-accent-emphasis)] [stroke-dashoffset:calc(100-var(--hui-meter-percentage,0))] [stroke-linecap:butt] [stroke-width:var(--hui-meter-track-size)] motion-safe:[transition:stroke-dashoffset_var(--hui-duration-moderate)_var(--hui-ease-out)]"
      />
    </svg>
  )
}

export {
  Meter,
  MeterLabel,
  MeterTrack,
  MeterIndicator,
  MeterValue,
  MeterCircularTrack,
}
