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
  type DrawerSide,
} from "@/registry/default/ui/drawer"

const SIDES: DrawerSide[] = ["top", "right", "bottom", "left"]

export default function DrawerSidePlacement() {
  return (
    <div className="grid grid-cols-2 gap-[var(--hui-space-3)]">
      {SIDES.map((side) => (
        <Drawer key={side} side={side}>
          <DrawerTrigger
            render={(props) => (
              <Button {...props} variant="outline" className="capitalize">
                {side}
              </Button>
            )}
          />
          <DrawerPopup>
            <DrawerHeader>
              <DrawerTitle className="capitalize">{side} drawer</DrawerTitle>
              <DrawerDescription>
                Swipe toward the {side} edge to dismiss it.
              </DrawerDescription>
            </DrawerHeader>
            <p className="m-0 px-4 pb-4 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)]">
              The dismiss gesture always points back toward the edge the drawer
              came from, so the direction is predictable on every side.
            </p>
          </DrawerPopup>
        </Drawer>
      ))}
    </div>
  )
}
