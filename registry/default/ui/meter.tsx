"use client"

import * as React from "react"
import { Meter as MeterPrimitive } from "@base-ui-components/react/meter"

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
        "text-[var(--hui-color-foreground-base-primary)] [font-family:var(--hui-font-body)] [font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]",
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
        "relative block h-[var(--hui-space-2)] w-full overflow-clip rounded-[1px] bg-[var(--hui-color-background-neutral-secondary)]",
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
        "h-full origin-left bg-[var(--hui-color-background-accent-emphasis)] [transform:scaleX(calc(var(--hui-meter-percentage,0)/100))] motion-safe:[transition:transform_var(--hui-duration-moderate)_linear]",
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
        "text-right text-[var(--hui-color-foreground-base-primary)] tabular-nums [font-family:var(--hui-font-body)] [font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)] group-data-[variant=circular]/meter:absolute group-data-[variant=circular]/meter:top-1/2 group-data-[variant=circular]/meter:left-1/2 group-data-[variant=circular]/meter:-translate-x-1/2 group-data-[variant=circular]/meter:-translate-y-1/2 group-data-[variant=circular]/meter:whitespace-nowrap group-data-[variant=circular]/meter:text-center group-data-[variant=circular]/meter:[font-weight:var(--hui-font-weight-medium)]",
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
        "aspect-square h-[var(--hui-space-14)] w-[var(--hui-space-14)] -rotate-90 [--hui-meter-circumference:calc(2*3.14159265*var(--hui-meter-radius))] [--hui-meter-radius:calc((var(--hui-space-14)-var(--hui-meter-track-size)*2)/2)] [--hui-meter-track-size:var(--hui-space-2)]",
        className
      )}
      {...props}
    >
      <circle
        data-slot="meter-circular-track-circle"
        className="fill-none stroke-[var(--hui-color-background-neutral-secondary)] [cx:50%] [cy:50%] [r:var(--hui-meter-radius)] [stroke-width:var(--hui-meter-track-size)]"
      />
      <circle
        data-slot="meter-circular-indicator-circle"
        className="fill-none stroke-[var(--hui-color-background-accent-emphasis)] [cx:50%] [cy:50%] [r:var(--hui-meter-radius)] [stroke-dasharray:var(--hui-meter-circumference)] [stroke-dashoffset:calc(var(--hui-meter-circumference)*(1-var(--hui-meter-percentage,0)/100))] [stroke-linecap:butt] [stroke-width:var(--hui-meter-track-size)] motion-safe:[transition:stroke-dashoffset_var(--hui-duration-moderate)_linear]"
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
