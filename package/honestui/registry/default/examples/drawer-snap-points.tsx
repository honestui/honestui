"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/registry/default/ui/drawer"

// A short peek that shows the summary, then the full height of the screen.
const SNAP_POINTS = ["220px", 1]

const STOPS = [
  { time: "08:12", name: "Depot", detail: "Loaded 14 parcels" },
  { time: "08:40", name: "Market Street", detail: "3 parcels, signature required" },
  { time: "09:05", name: "Harbor Lofts", detail: "2 parcels, leave at concierge" },
  { time: "09:31", name: "Elm & 4th", detail: "1 parcel" },
  { time: "09:58", name: "Riverside Clinic", detail: "4 parcels, cold chain" },
  { time: "10:20", name: "Oak Terrace", detail: "2 parcels" },
  { time: "10:47", name: "North Library", detail: "1 parcel, returns pickup" },
  { time: "11:15", name: "Depot", detail: "End of route" },
]

export default function DrawerSnapPoints() {
  const [snapPoint, setSnapPoint] = React.useState<string | number | null>(
    SNAP_POINTS[0]
  )

  return (
    <Drawer
      snapPoints={SNAP_POINTS}
      snapPoint={snapPoint}
      onSnapPointChange={setSnapPoint}
    >
      <DrawerTrigger
        render={(props) => (
          <Button {...props} variant="outline">
            View route
          </Button>
        )}
      />
      <DrawerPopup>
        <DrawerHeader>
          <DrawerTitle>Route 12 · 8 stops</DrawerTitle>
          <DrawerDescription>
            {snapPoint === 1
              ? "Drag down to return to the summary."
              : "Drag up to see every stop."}
          </DrawerDescription>
        </DrawerHeader>
        <ol className="m-0 flex list-none flex-col px-4 pb-4">
          {STOPS.map((stop, index) => (
            <li
              key={`${stop.name}-${index}`}
              className="flex gap-[var(--hui-space-4)] border-b-[0.5px] border-[var(--hui-color-border-overlay)] py-[var(--hui-space-3)] last:border-b-0"
            >
              <span className="w-12 shrink-0 text-[var(--hui-color-foreground-base-secondary)] tabular-nums [font-size:var(--hui-font-size-small)]">
                {stop.time}
              </span>
              <span className="flex flex-col gap-[var(--hui-space-1)]">
                <span className="[font-size:var(--hui-font-size-control,13px)] [font-weight:var(--hui-font-weight-medium)]">
                  {stop.name}
                </span>
                <span className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]">
                  {stop.detail}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </DrawerPopup>
    </Drawer>
  )
}
