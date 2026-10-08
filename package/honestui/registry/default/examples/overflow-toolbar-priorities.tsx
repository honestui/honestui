"use client"

import * as React from "react"

import {
  OverflowToolbar,
  OverflowToolbarGroup,
  OverflowToolbarItem,
  OverflowToolbarMore,
} from "@/registry/default/product/overflow-toolbar/overflow-toolbar"
import { Slider } from "@/registry/default/ui/slider"

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

const minWidth = 160
const maxWidth = 640

/**
 * The slider sets the width of the box around the toolbar, so the collapse
 * order can be followed with the keyboard. The actions do nothing here.
 */
export default function OverflowToolbarPriorities() {
  const [width, setWidth] = React.useState(maxWidth)
  const labelId = React.useId()

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-[var(--hui-space-4)]">
      <div className={`flex flex-col gap-[var(--hui-space-2)] ${smallText}`}>
        <span id={labelId} className="text-[var(--hui-color-foreground-base-primary)]">
          Container width: {width}px
        </span>
        <Slider
          aria-labelledby={labelId}
          className="max-w-80"
          min={minWidth}
          max={maxWidth}
          step={10}
          value={width}
          onValueChange={(next) => setWidth(Array.isArray(next) ? next[0] : next)}
        />
      </div>
      <div className="max-w-full" style={{ width }}>
        <OverflowToolbar aria-label="Report">
          <OverflowToolbarItem priority="always" label="Save" />
          <OverflowToolbarGroup label="Distribute">
            <OverflowToolbarItem priority={4} label="Share" />
            <OverflowToolbarItem priority={3} label="Export" />
          </OverflowToolbarGroup>
          <OverflowToolbarGroup label="Manage">
            <OverflowToolbarItem priority={2} label="Duplicate" />
            <OverflowToolbarItem priority={1} label="Archive" disabled />
            <OverflowToolbarItem priority={0} label="Delete" />
          </OverflowToolbarGroup>
          <OverflowToolbarMore />
        </OverflowToolbar>
      </div>
      <p className={`m-0 text-[var(--hui-color-foreground-base-secondary)] ${smallText}`}>
        Save is pinned. The others collapse in this order: Delete, Archive, Duplicate, Export,
        Share. Archive is disabled in both places.
      </p>
    </div>
  )
}
