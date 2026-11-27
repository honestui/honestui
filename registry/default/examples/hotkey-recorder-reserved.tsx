"use client"

import * as React from "react"

import { ToggleGroup, Toggle } from "@/registry/default/ui/toggle"
import {
  HotkeyRecorder,
  HotkeyRecorderControl,
  HotkeyRecorderLabel,
  HotkeyRecorderStatus,
  browserReservedHotkeys,
  type HotkeyPlatform,
} from "@/registry/default/product/hotkey-recorder/hotkey-recorder"

/**
 * Browser shortcuts are refused instead of saved, so try ⌘T or Ctrl+T. The
 * stored string stays the same when the keyboard changes; only the keycaps do.
 */
export default function HotkeyRecorderReserved() {
  const [hotkey, setHotkey] = React.useState<string | null>("Mod+Shift+Space")
  const [platform, setPlatform] = React.useState<HotkeyPlatform>("mac")

  return (
    <div className="flex w-full max-w-sm min-w-0 flex-col gap-[var(--hui-space-5)]">
      <ToggleGroup
        aria-label="Keyboard"
        value={[platform]}
        onValueChange={(next: unknown[]) => next[0] && setPlatform(next[0] as HotkeyPlatform)}
        size="sm"
      >
        <Toggle value="mac">Mac</Toggle>
        <Toggle value="other">Windows and Linux</Toggle>
      </ToggleGroup>
      <HotkeyRecorder
        className="w-full"
        value={hotkey}
        onValueChange={setHotkey}
        reserved={browserReservedHotkeys}
        conflicts="block"
        platform={platform}
      >
        <HotkeyRecorderLabel>Quick capture</HotkeyRecorderLabel>
        <HotkeyRecorderControl />
        <HotkeyRecorderStatus />
      </HotkeyRecorder>
      <p className="m-0 flex items-center justify-between gap-[var(--hui-space-4)] border-t-[0.5px] border-t-[var(--hui-color-border-base-primary)] pt-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
        <span>Stored value</span>
        <code className="font-mono text-[var(--hui-color-foreground-base-primary)]">{hotkey ?? "null"}</code>
      </p>
    </div>
  )
}
