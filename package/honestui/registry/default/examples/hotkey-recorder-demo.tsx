"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import {
  HotkeyRecorder,
  HotkeyRecorderControl,
  HotkeyRecorderLabel,
  HotkeyRecorderStatus,
  type HotkeyBinding,
} from "@/registry/default/product/hotkey-recorder/hotkey-recorder"

const defaults: HotkeyBinding[] = [
  { id: "search", label: "Open search", hotkey: "Mod+K" },
  { id: "new-issue", label: "New issue", hotkey: "Mod+Shift+I" },
  { id: "sidebar", label: "Toggle sidebar", hotkey: "Mod+B" },
  { id: "inbox", label: "Go to inbox", hotkey: "Alt+1" },
]

/**
 * Every shortcut in an app, each checked against the others. Click one and
 * press a new combination; set two to the same keys to see the conflict.
 */
export default function HotkeyRecorderDemo() {
  const [bindings, setBindings] = React.useState(defaults)
  const changed = bindings.some((binding, index) => binding.hotkey !== defaults[index].hotkey)

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-3)]">
      <ul className="m-0 flex list-none flex-col overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-0">
        {bindings.map((binding, index) => (
          <li
            key={binding.id}
            className="border-t-[0.5px] border-t-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] first:border-t-0"
          >
            <HotkeyRecorder
              value={binding.hotkey || null}
              onValueChange={(hotkey) =>
                setBindings((current) =>
                  current.map((item, i) => (i === index ? { ...item, hotkey: hotkey ?? "" } : item))
                )
              }
              bindings={bindings.filter((item) => item.hotkey)}
              bindingId={binding.id}
              className="grid w-full grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)] items-center gap-x-[var(--hui-space-5)]"
            >
              <HotkeyRecorderLabel className="mb-0">{binding.label}</HotkeyRecorderLabel>
              <HotkeyRecorderControl />
              <HotkeyRecorderStatus className="col-span-2" />
            </HotkeyRecorder>
          </li>
        ))}
      </ul>
      <div>
        <Button size="sm" variant="ghost" disabled={!changed} onClick={() => setBindings(defaults)}>
          Restore defaults
        </Button>
      </div>
    </div>
  )
}
