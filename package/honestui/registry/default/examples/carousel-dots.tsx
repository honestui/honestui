"use client"

import * as React from "react"

import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/registry/default/ui/carousel"

const steps = [
  "Connect your data source",
  "Choose the columns to import",
  "Map columns to fields",
  "Review rows that failed validation",
  "Fix or skip each failing row",
  "Preview the final import",
  "Confirm and run the import",
  "Share the import report",
]

export default function CarouselWithDots() {
  const [api, setApi] = React.useState<CarouselApi | null>(null)

  return (
    <Carousel aria-label="Import walkthrough" setApi={setApi} className="w-full max-w-sm">
      <CarouselContent>
        {steps.map((step, index) => (
          <CarouselItem key={step}>
            <div className="flex aspect-video flex-col justify-between rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-5)]">
              <span className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] tabular-nums">
                Step {index + 1}
              </span>
              <p className="m-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-large)] [font-weight:var(--hui-font-weight-medium)] [line-height:var(--hui-line-height-large)]">
                {step}
              </p>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-[var(--hui-space-3)] flex items-center justify-between gap-[var(--hui-space-3)]">
        <CarouselPrevious />
        <div className="flex flex-col items-center gap-[var(--hui-space-1)]">
          <CarouselDots />
          <p
            aria-hidden="true"
            className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] tabular-nums"
          >
            {api ? `${api.index + 1} / ${api.count}` : `1 / ${steps.length}`}
          </p>
        </div>
        <CarouselNext />
      </div>
    </Carousel>
  )
}
