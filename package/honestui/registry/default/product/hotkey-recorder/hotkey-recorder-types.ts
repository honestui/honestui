/** Which keyboard the shortcut is shown for. `Mod` is ⌘ on a Mac and Ctrl elsewhere. */
export type HotkeyPlatform = "mac" | "other"

/**
 * A shortcut written as modifiers and one key joined by `+`, such as
 * `Mod+Shift+K`. `Mod` is ⌘ on a Mac and Ctrl elsewhere, so one string works
 * on both. `Ctrl` is the Control key on a Mac; `Meta` is the Windows key elsewhere.
 */
export type Hotkey = string

export type ParsedHotkey = {
  /** ⌘ on a Mac, Ctrl elsewhere. */
  mod: boolean
  /** The Control key on a Mac. Elsewhere Ctrl is read as `mod`. */
  ctrl: boolean
  /** The Windows or Super key, outside a Mac. On a Mac it is read as `mod`. */
  meta: boolean
  alt: boolean
  shift: boolean
  /** A key name such as `K`, `7`, `F5`, `ArrowUp`, `Enter`, or `/`. */
  key: string
}

/** A shortcut already in use, checked for conflicts. */
export type HotkeyBinding = {
  id: string
  /** What the shortcut does, such as "Open search". */
  label: string
  hotkey: Hotkey
}

export type HotkeyConflict =
  | { kind: "binding"; binding: HotkeyBinding }
  | { kind: "reserved"; binding: HotkeyBinding }

export type HotkeyRecorderLabels = {
  placeholder: string
  recording: string
  /** Read while recording. */
  recordingHint: string
  clear: string
  /** Read after the current shortcut, as the button's action. */
  change: string
  needsModifier: (platform: HotkeyPlatform) => string
  conflict: (binding: HotkeyBinding) => string
  reserved: (binding: HotkeyBinding) => string
  /** Spoken names, such as "Command" and "Up Arrow". */
  keyName: (key: string, platform: HotkeyPlatform) => string
}
