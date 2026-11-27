import { describe, expect, it } from "vitest"

import {
  browserReservedHotkeys,
  describeHotkey,
  findHotkeyConflict,
  hasCommandModifier,
  hotkeyFromEvent,
  hotkeyKeycaps,
  hotkeysEqual,
  modifiersFromEvent,
  normalizeHotkey,
  parseHotkey,
  stringifyHotkey,
} from "../../registry/default/product/hotkey-recorder/hotkey-recorder-utils"

const press = (code: string, key: string, mods: Partial<Record<"metaKey" | "ctrlKey" | "altKey" | "shiftKey", boolean>> = {}) => ({
  code,
  key,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
})

describe("parseHotkey", () => {
  it("reads modifiers in any order and spelling", () => {
    expect(parseHotkey("shift+cmd+k")).toEqual({ mod: true, ctrl: false, meta: false, alt: false, shift: true, key: "K" })
    expect(parseHotkey("Control+Option+Delete")).toMatchObject({ ctrl: true, alt: true, key: "Delete" })
    expect(parseHotkey("Win+Up")).toMatchObject({ meta: true, key: "ArrowUp" })
    expect(parseHotkey("Mod+f5")).toMatchObject({ mod: true, key: "F5" })
    expect(parseHotkey("Mod++")).toMatchObject({ mod: true, key: "Plus" })
    expect(parseHotkey("/")).toMatchObject({ key: "/" })
  })

  it("refuses empty, unknown, and doubled keys", () => {
    for (const bad of ["", "Mod+", "Mod+Shift", "K+J", "Mod+Banana", "F25", "Mod+ +K"]) {
      expect(parseHotkey(bad)).toBeNull()
    }
  })

  it("writes one canonical spelling", () => {
    expect(normalizeHotkey("shift+alt+mod+ctrl+k")).toBe("Mod+Ctrl+Alt+Shift+K")
    expect(normalizeHotkey("esc")).toBe("Escape")
    expect(stringifyHotkey({ mod: false, ctrl: false, meta: true, alt: false, shift: false, key: "Space" })).toBe("Meta+Space")
  })
})

describe("hotkeyFromEvent", () => {
  it("reads ⌘ as Mod on a Mac and Ctrl as Mod elsewhere", () => {
    expect(stringifyHotkey(hotkeyFromEvent(press("KeyK", "k", { metaKey: true }), "mac")!)).toBe("Mod+K")
    expect(stringifyHotkey(hotkeyFromEvent(press("KeyK", "k", { ctrlKey: true }), "mac")!)).toBe("Ctrl+K")
    expect(stringifyHotkey(hotkeyFromEvent(press("KeyK", "k", { ctrlKey: true }), "other")!)).toBe("Mod+K")
    expect(stringifyHotkey(hotkeyFromEvent(press("KeyK", "k", { metaKey: true }), "other")!)).toBe("Meta+K")
  })

  it("reads the physical key, not the character a modifier makes", () => {
    expect(stringifyHotkey(hotkeyFromEvent(press("KeyK", "˚", { altKey: true }), "mac")!)).toBe("Alt+K")
    expect(stringifyHotkey(hotkeyFromEvent(press("Digit2", "@", { shiftKey: true, ctrlKey: true }), "other")!)).toBe("Mod+Shift+2")
    expect(stringifyHotkey(hotkeyFromEvent(press("Slash", "?", { shiftKey: true, metaKey: true }), "mac")!)).toBe("Mod+Shift+/")
    expect(hotkeyFromEvent(press("ArrowUp", "ArrowUp"), "mac")?.key).toBe("ArrowUp")
    expect(hotkeyFromEvent(press("F7", "F7"), "mac")?.key).toBe("F7")
    expect(hotkeyFromEvent(press("Numpad4", "4"), "mac")?.key).toBe("4")
  })

  it("returns null while only modifiers are held", () => {
    expect(hotkeyFromEvent(press("ShiftLeft", "Shift", { shiftKey: true }), "mac")).toBeNull()
    expect(hotkeyFromEvent(press("MetaLeft", "Meta", { metaKey: true }), "mac")).toBeNull()
    expect(modifiersFromEvent(press("MetaLeft", "Meta", { metaKey: true, shiftKey: true }), "mac")).toEqual({
      mod: true,
      ctrl: false,
      meta: false,
      alt: false,
      shift: true,
    })
  })

  it("knows which modifiers keep a shortcut from firing while typing", () => {
    expect(hasCommandModifier(parseHotkey("Shift+K")!)).toBe(false)
    expect(hasCommandModifier(parseHotkey("Alt+K")!)).toBe(true)
  })
})

describe("comparing", () => {
  it("treats Mod and Ctrl as one key outside a Mac only", () => {
    expect(hotkeysEqual("Mod+K", "Ctrl+K", "other")).toBe(true)
    expect(hotkeysEqual("Mod+K", "Ctrl+K", "mac")).toBe(false)
    expect(hotkeysEqual("Mod+K", "Meta+K", "mac")).toBe(true)
    expect(hotkeysEqual("Mod+K", "Mod+Shift+K", "mac")).toBe(false)
    expect(hotkeysEqual("Mod+K", "nonsense", "mac")).toBe(false)
  })

  it("finds a conflicting binding, skipping the one being edited", () => {
    const bindings = [
      { id: "search", label: "Open search", hotkey: "Mod+K" },
      { id: "palette", label: "Command palette", hotkey: "Mod+Shift+P" },
    ]
    expect(findHotkeyConflict("ctrl+k", { bindings, platform: "other" })).toEqual({
      kind: "binding",
      binding: bindings[0],
    })
    expect(findHotkeyConflict("Mod+K", { bindings, excludeId: "search", platform: "mac" })).toBeNull()
  })

  it("checks reserved shortcuts after bindings", () => {
    expect(findHotkeyConflict("Mod+T", { reserved: browserReservedHotkeys, platform: "mac" })).toMatchObject({
      kind: "reserved",
      binding: { label: "New tab" },
    })
    const bindings = [{ id: "tab", label: "New task", hotkey: "Mod+T" }]
    expect(
      findHotkeyConflict("Mod+T", { bindings, reserved: browserReservedHotkeys, platform: "mac" })
    ).toMatchObject({ kind: "binding" })
  })
})

describe("showing", () => {
  it("draws keycaps in each platform's order", () => {
    const parsed = parseHotkey("Mod+Ctrl+Alt+Shift+ArrowUp")!
    expect(hotkeyKeycaps(parsed, "mac").map((cap) => cap.text)).toEqual(["⌃", "⌥", "⇧", "⌘", "↑"])
    expect(hotkeyKeycaps(parseHotkey("Mod+Meta+Alt+Shift+Delete")!, "other").map((cap) => cap.text)).toEqual([
      "Ctrl",
      "Win",
      "Alt",
      "Shift",
      "Del",
    ])
    expect(hotkeyKeycaps(parseHotkey("Mod+Enter")!, "mac").map((cap) => cap.text)).toEqual(["⌘", "↩"])
  })

  it("reads shortcuts aloud", () => {
    expect(describeHotkey(parseHotkey("Mod+Shift+K")!, "mac")).toBe("Shift Command K")
    expect(describeHotkey(parseHotkey("Mod+Shift+K")!, "other")).toBe("Control Shift K")
    expect(describeHotkey(parseHotkey("Alt+ArrowLeft")!, "mac")).toBe("Option Left Arrow")
    expect(describeHotkey(parseHotkey("Mod+/")!, "other")).toBe("Control Slash")
  })
})
