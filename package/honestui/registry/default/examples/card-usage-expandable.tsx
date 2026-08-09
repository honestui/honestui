"use client"

import { useState } from "react"
import { ChevronDown as ChevronDownIcon } from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/registry/default/ui/progress"

export default function CardUsageExpandable() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="relative w-full max-w-md gap-6 overflow-visible pb-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>3 days remaining in cycle</CardTitle>
        <CardAction>
          <Button variant="secondary" size="sm">
            Billing
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent
        className={cn(
          "relative space-y-5 overflow-hidden transition-all duration-500 ease-in-out",
          isOpen ? "max-h-[500px]" : "max-h-48"
        )}
      >
        <div className="space-y-3 rounded-lg bg-muted/60 p-4">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>Included Credit</span>
            <span>On-Demand Charges</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>$18.08 / $20</span>
            <span>$0</span>
          </div>
          <Progress value={90}>
            <ProgressTrack className="h-2">
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
        </div>

        <div className="flex flex-col gap-4">
          {[
            ["Requests", "$210.84"],
            ["Active CPU", "$21.95"],
            ["Events", "$21.20"],
            ["Storage Usage", "$20.45"],
            ["Bandwidth", "$0.00"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="font-medium text-foreground">{label}</span>
              <span className="text-muted-foreground">{value}</span>
            </div>
          ))}
        </div>

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-20 rounded-b-lg bg-linear-to-t from-background to-transparent transition-opacity duration-300",
            isOpen ? "opacity-0" : "opacity-100"
          )}
        />
      </CardContent>

      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
        <Button
          variant="secondary"
          size="icon-sm"
          className="rounded-full bg-background shadow-sm hover:bg-background"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              "transition-transform duration-300",
              isOpen && "rotate-180"
            )}
          />
          <span className="sr-only">Toggle card</span>
        </Button>
      </div>
    </Card>
  )
}
