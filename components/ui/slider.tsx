"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui-components/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  children,
  defaultValue,
  value,
  min = 0,
  max = 100,
  showValue = false,
  size = "large",
  ...props
}: SliderPrimitive.Root.Props & {
  showValue?: boolean
  size?: "small" | "large"
}) {
  const _values = React.useMemo(() => {
    if (value !== undefined) {
      return Array.isArray(value) ? value : [value]
    }
    if (defaultValue !== undefined) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue]
    }
    return [min]
  }, [value, defaultValue, min])

  return (
    <SliderPrimitive.Root
      thumbAlignment="center"
      data-size={size}
      data-variant={_values.length > 1 ? "range" : "single"}
      className={cn(
        "relative flex touch-none p-0 select-none data-disabled:opacity-50 data-[orientation=horizontal]:w-full data-[orientation=horizontal]:min-w-[var(--rs-space-15)] data-[orientation=horizontal]:flex-col data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-[var(--rs-space-15)]",
        !children &&
          "data-[orientation=horizontal]:h-[var(--rs-space-8)] data-[orientation=horizontal]:items-center data-[orientation=vertical]:w-[var(--rs-space-8)]",
        className
      )}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      {...props}
    >
      {children}
      <SliderPrimitive.Control
        data-slot="slider-control"
        className="relative flex items-center data-disabled:pointer-events-none data-[orientation=horizontal]:h-[var(--rs-space-8)] data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-[var(--rs-space-8)] data-[orientation=vertical]:flex-col"
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow rounded-[var(--rs-radius-full)] bg-[var(--rs-color-background-neutral-secondary)] data-[orientation=horizontal]:mx-[var(--rs-space-4)] data-[orientation=horizontal]:h-[var(--rs-space-2)] data-[orientation=vertical]:my-[var(--rs-space-4)] data-[orientation=vertical]:w-[var(--rs-space-2)]"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-indicator"
            className="!absolute rounded-[var(--rs-radius-full)] bg-[var(--rs-color-background-accent-emphasis)] data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          />
          {Array.from({ length: _values.length }, (_, index) => (
            <SliderPrimitive.Thumb
              data-slot="slider-thumb"
              data-size={size}
              index={index}
              key={index}
              className="group/slider-thumb absolute flex cursor-grab items-center justify-center outline-none active:cursor-grabbing active:outline-none has-focus-visible:[&_[data-slot=slider-thumb-visual]]:[outline:var(--rs-focus-ring)] hover:[&_[data-slot=slider-thumb-visual]]:bg-[var(--rs-color-background-base-secondary)] active:[&_[data-slot=slider-thumb-visual]]:scale-[1.08] active:[&_[data-slot=slider-thumb-visual]]:shadow-[var(--rs-shadow-lifted)] data-dragging:[&_[data-slot=slider-thumb-visual]]:scale-[1.08] data-dragging:[&_[data-slot=slider-thumb-visual]]:shadow-[var(--rs-shadow-lifted)] [&_input:focus-visible]:outline-none"
            >
              <span
                data-slot="slider-thumb-visual"
                className={cn(
                  "relative flex items-center justify-center border-[0.5px] border-[var(--rs-color-border-base-tertiary)] bg-[var(--rs-color-background-base-primary)] shadow-[var(--rs-shadow-soft)] motion-safe:[transition:transform_var(--rs-duration-press)_var(--rs-ease-out),box-shadow_var(--rs-duration-press)_var(--rs-ease-out)]",
                  size === "large"
                    ? "h-[var(--rs-space-6)] w-[var(--rs-space-7)] gap-[3px] rounded-[var(--rs-radius-2)]"
                    : "h-[var(--rs-space-5)] w-[var(--rs-space-3)] rounded-[var(--rs-radius-full)]"
                )}
              >
                {size === "large" && (
                  <>
                    <span className="h-[6px] w-px rounded-[var(--rs-radius-1)] bg-[var(--rs-color-border-base-tertiary)]" />
                    <span className="h-[6px] w-px rounded-[var(--rs-radius-1)] bg-[var(--rs-color-border-base-tertiary)]" />
                  </>
                )}
              </span>
              {showValue && (
                <SliderPrimitive.Value
                  data-slot="slider-thumb-label"
                  className={cn(
                    "absolute top-[calc(-1*(var(--rs-space-8)+1px))] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[var(--rs-radius-2)] border-[0.5px] border-[var(--rs-color-border-base-primary)] bg-[var(--rs-color-background-base-primary)] p-[var(--rs-space-2)] text-[var(--rs-color-foreground-base-primary)] shadow-[var(--rs-shadow-soft)]",
                    size === "small" && "top-[calc(-1*var(--rs-space-7))]"
                  )}
                >
                  {(formattedValues) => formattedValues[index]}
                </SliderPrimitive.Value>
              )}
            </SliderPrimitive.Thumb>
          ))}
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

function SliderValue({ className, ...props }: SliderPrimitive.Value.Props) {
  return (
    <SliderPrimitive.Value
      data-slot="slider-value"
      className={cn("flex justify-end text-sm", className)}
      {...props}
    />
  )
}

export { Slider, SliderValue }
