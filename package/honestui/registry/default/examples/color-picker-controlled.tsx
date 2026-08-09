"use client"

import * as React from "react"

import { ColorPicker } from "@/registry/default/ui/color-picker"

export default function ColorPickerControlled() {
  const [color, setColor] = React.useState("#DD3E8B")

  return (
    <div className="flex w-full max-w-[12rem] flex-col gap-[var(--rs-space-4)]">
      <div className="flex items-center gap-[var(--rs-space-3)]">
        <span
          aria-hidden="true"
          className="size-[var(--rs-space-7)] rounded-[var(--rs-radius-2)] border-[0.5px] border-[var(--rs-color-border-base-primary)]"
          style={{ backgroundColor: color }}
        />
        <span className="text-[length:var(--rs-font-size-small)] text-[var(--rs-color-foreground-base-secondary)]">
          {color}
        </span>
      </div>
      <ColorPicker
        value={color}
        onValueChange={setColor}
        className="w-full gap-[var(--rs-space-3)]"
      >
        <ColorPicker.Area />
        <ColorPicker.Hue />
        <ColorPicker.Alpha />
        <div className="flex items-center gap-[var(--rs-space-3)]">
          <ColorPicker.Input copyable />
          <ColorPicker.Mode />
        </div>
      </ColorPicker>
    </div>
  )
}
