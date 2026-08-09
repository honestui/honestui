"use client"

import { ColorPicker } from "@/registry/default/ui/color-picker"

export default function ColorPickerDemo() {
  return (
    <ColorPicker
      defaultValue="#3E63DD"
      className="w-full max-w-[12rem] gap-[var(--rs-space-3)]"
    >
      <ColorPicker.Area />
      <ColorPicker.Hue />
      <ColorPicker.Alpha />
      <div className="flex items-center gap-[var(--rs-space-3)]">
        <ColorPicker.Input copyable />
        <ColorPicker.Mode />
      </div>
    </ColorPicker>
  )
}
