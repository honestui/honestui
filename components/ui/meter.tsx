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
        "group/meter flex w-full flex-col gap-[var(--rs-space-3)]",
        variant === "circular" &&
          "relative items-center justify-center",
        className
      )}
      max={max}
      min={min}
      style={(state) =>
        ({
          ...(typeof style === "function" ? style(state) : style),
          "--rs-meter-percentage": percentage,
        }) as React.CSSProperties & { "--rs-meter-percentage": number }
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
        "text-[var(--rs-color-foreground-base-primary)] [font-family:var(--rs-font-body)] [font-size:var(--rs-font-size-mini)] [font-weight:var(--rs-font-weight-medium)] [letter-spacing:var(--rs-letter-spacing-mini)] [line-height:var(--rs-line-height-mini)]",
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
        "relative block h-[var(--rs-space-2)] w-full overflow-clip rounded-[1px] bg-[var(--rs-color-background-neutral-secondary)]",
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
        "h-full origin-left bg-[var(--rs-color-background-accent-emphasis)] [transform:scaleX(calc(var(--rs-meter-percentage,0)/100))] motion-safe:[transition:transform_var(--rs-duration-moderate)_linear]",
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
        "text-right text-[var(--rs-color-foreground-base-primary)] tabular-nums [font-family:var(--rs-font-body)] [font-size:var(--rs-font-size-mini)] [font-weight:var(--rs-font-weight-regular)] [letter-spacing:var(--rs-letter-spacing-mini)] [line-height:var(--rs-line-height-mini)] group-data-[variant=circular]/meter:absolute group-data-[variant=circular]/meter:top-1/2 group-data-[variant=circular]/meter:left-1/2 group-data-[variant=circular]/meter:-translate-x-1/2 group-data-[variant=circular]/meter:-translate-y-1/2 group-data-[variant=circular]/meter:whitespace-nowrap group-data-[variant=circular]/meter:text-center group-data-[variant=circular]/meter:[font-weight:var(--rs-font-weight-medium)]",
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
        "aspect-square h-[var(--rs-space-14)] w-[var(--rs-space-14)] -rotate-90 [--rs-meter-circumference:calc(2*3.14159265*var(--rs-meter-radius))] [--rs-meter-radius:calc((var(--rs-space-14)-var(--rs-meter-track-size)*2)/2)] [--rs-meter-track-size:var(--rs-space-2)]",
        className
      )}
      {...props}
    >
      <circle
        data-slot="meter-circular-track-circle"
        className="fill-none stroke-[var(--rs-color-background-neutral-secondary)] [cx:50%] [cy:50%] [r:var(--rs-meter-radius)] [stroke-width:var(--rs-meter-track-size)]"
      />
      <circle
        data-slot="meter-circular-indicator-circle"
        className="fill-none stroke-[var(--rs-color-background-accent-emphasis)] [cx:50%] [cy:50%] [r:var(--rs-meter-radius)] [stroke-dasharray:var(--rs-meter-circumference)] [stroke-dashoffset:calc(var(--rs-meter-circumference)*(1-var(--rs-meter-percentage,0)/100))] [stroke-linecap:butt] [stroke-width:var(--rs-meter-track-size)] motion-safe:[transition:stroke-dashoffset_var(--rs-duration-moderate)_linear]"
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
