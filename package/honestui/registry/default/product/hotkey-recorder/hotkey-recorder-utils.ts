import type {
  Hotkey,
  HotkeyBinding,
  HotkeyConflict,
  HotkeyPlatform,
  HotkeyRecorderLabels,
  ParsedHotkey,
} from "./hotkey-recorder-types"

/* -------------------------------------------------------------------------- */
/* Keys                                                                       */
/* -------------------------------------------------------------------------- */

/** Physical key codes for keys whose character changes with layout or modifiers. */
const CODE_KEYS: Record<string, string> = {
  Space: "Space",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Backquote: "`",
  Comma: ",",
  Period: ".",
  Slash: "/",
  NumpadAdd: "Plus",
  NumpadSubtract: "-",
  NumpadMultiply: "*",
  NumpadDivide: "/",
  NumpadDecimal: ".",
  NumpadEnter: "Enter",
}

const NAMED_KEYS = new Set([
  "Enter",
  "Tab",
  "Backspace",
  "Delete",
  "Escape",
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Insert",
  "Plus",
])

const KEY_ALIASES: Record<string, string> = {
  esc: "Escape",
  escape: "Escape",
  return: "Enter",
  enter: "Enter",
  del: "Delete",
  delete: "Delete",
  backspace: "Backspace",
  tab: "Tab",
  space: "Space",
  spacebar: "Space",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
  pgup: "PageUp",
  pgdn: "PageDown",
  insert: "Insert",
  plus: "Plus",
}

const MODIFIER_CODES = new Set([
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "MetaLeft",
  "MetaRight",
  "OSLeft",
  "OSRight",
])

function normalizeKey(raw: string): string | null {
  if (raw.length === 1) return raw === "+" ? "Plus" : raw.toUpperCase()
  const alias = KEY_ALIASES[raw.toLowerCase()]
  if (alias) return alias
  const fn = /^f(\d{1,2})$/i.exec(raw)
  if (fn && Number(fn[1]) >= 1 && Number(fn[1]) <= 24) return `F${Number(fn[1])}`
  return NAMED_KEYS.has(raw) ? raw : null
}

/* -------------------------------------------------------------------------- */
/* Parsing and writing                                                        */
/* -------------------------------------------------------------------------- */

const MODIFIER_ALIASES: Record<string, keyof Omit<ParsedHotkey, "key">> = {
  mod: "mod",
  cmd: "mod",
  command: "mod",
  "⌘": "mod",
  ctrl: "ctrl",
  control: "ctrl",
  "⌃": "ctrl",
  meta: "meta",
  win: "meta",
  super: "meta",
  alt: "alt",
  option: "alt",
  opt: "alt",
  "⌥": "alt",
  shift: "shift",
  "⇧": "shift",
}

/** Reads a shortcut string. Returns `null` when it has no key, two keys, or a name it does not know. */
export function parseHotkey(hotkey: Hotkey): ParsedHotkey | null {
  const parts = hotkey.split("+").map((part) => part.trim())
  // "Mod++" ends in an empty part for the plus key.
  if (parts.length > 1 && parts[parts.length - 1] === "" && parts[parts.length - 2] === "") {
    parts.splice(parts.length - 2, 2, "Plus")
  }
  const parsed: ParsedHotkey = { mod: false, ctrl: false, meta: false, alt: false, shift: false, key: "" }

  for (const [index, part] of parts.entries()) {
    if (part === "") return null
    const modifier = MODIFIER_ALIASES[part.toLowerCase()]
    if (modifier && index < parts.length - 1) {
      parsed[modifier] = true
      continue
    }
    if (index !== parts.length - 1) return null
    const key = normalizeKey(part)
    if (!key) return null
    parsed.key = key
  }

  return parsed.key ? parsed : null
}

/** Writes a shortcut in its one canonical spelling: `Mod`, `Ctrl`, `Meta`, `Alt`, `Shift`, then the key. */
export function stringifyHotkey(parsed: ParsedHotkey): Hotkey {
  return [
    parsed.mod && "Mod",
    parsed.ctrl && "Ctrl",
    parsed.meta && "Meta",
    parsed.alt && "Alt",
    parsed.shift && "Shift",
    parsed.key,
  ]
    .filter(Boolean)
    .join("+")
}

/** The canonical spelling of a shortcut string, or `null` if it cannot be read. */
export function normalizeHotkey(hotkey: Hotkey): Hotkey | null {
  const parsed = parseHotkey(hotkey)
  return parsed ? stringifyHotkey(parsed) : null
}

type KeyEventLike = Pick<
  KeyboardEvent,
  "key" | "code" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey"
>

/**
 * The shortcut a key press makes. Keys are read by their physical position,
 * so Option+K on a Mac is `Alt+K`, not `Alt+˚`. Returns `null` while only
 * modifiers are held.
 */
export function hotkeyFromEvent(event: KeyEventLike, platform: HotkeyPlatform): ParsedHotkey | null {
  if (MODIFIER_CODES.has(event.code) || ["Shift", "Control", "Alt", "Meta", "OS"].includes(event.key)) {
    return null
  }

  let key: string | null = null
  const code = event.code
  if (/^Key[A-Z]$/.test(code)) key = code.slice(3)
  else if (/^Digit\d$/.test(code)) key = code.slice(5)
  else if (/^Numpad\d$/.test(code)) key = code.slice(6)
  else if (CODE_KEYS[code]) key = CODE_KEYS[code]
  else key = normalizeKey(event.key)
  if (!key) return null

  return {
    mod: platform === "mac" ? event.metaKey : event.ctrlKey,
    ctrl: platform === "mac" ? event.ctrlKey : false,
    meta: platform === "mac" ? false : event.metaKey,
    alt: event.altKey,
    shift: event.shiftKey,
    key,
  }
}

/** The modifiers held during a key event, for showing a combination while it is being pressed. */
export function modifiersFromEvent(
  event: Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "altKey" | "shiftKey">,
  platform: HotkeyPlatform
): Omit<ParsedHotkey, "key"> {
  return {
    mod: platform === "mac" ? event.metaKey : event.ctrlKey,
    ctrl: platform === "mac" ? event.ctrlKey : false,
    meta: platform === "mac" ? false : event.metaKey,
    alt: event.altKey,
    shift: event.shiftKey,
  }
}

/** Whether a shortcut holds a modifier that keeps it from firing while someone types. Shift alone does not count. */
export function hasCommandModifier(parsed: Omit<ParsedHotkey, "key">): boolean {
  return parsed.mod || parsed.ctrl || parsed.meta || parsed.alt
}

export function isFunctionKey(key: string): boolean {
  return /^F\d{1,2}$/.test(key)
}

/* -------------------------------------------------------------------------- */
/* Comparing                                                                  */
/* -------------------------------------------------------------------------- */

/** The keys physically pressed on a platform, so `Mod+K` and `Ctrl+K` compare equal outside a Mac. */
function physical(parsed: ParsedHotkey, platform: HotkeyPlatform) {
  return platform === "mac"
    ? { command: parsed.mod || parsed.meta, control: parsed.ctrl }
    : { command: parsed.meta, control: parsed.mod || parsed.ctrl }
}

export function hotkeysEqual(a: Hotkey, b: Hotkey, platform: HotkeyPlatform): boolean {
  const left = parseHotkey(a)
  const right = parseHotkey(b)
  if (!left || !right) return false
  const l = physical(left, platform)
  const r = physical(right, platform)
  return (
    left.key === right.key &&
    left.alt === right.alt &&
    left.shift === right.shift &&
    l.command === r.command &&
    l.control === r.control
  )
}

/** Shortcuts browsers keep for themselves. A page usually never sees them. */
export const browserReservedHotkeys: readonly HotkeyBinding[] = [
  { id: "browser:new-tab", label: "New tab", hotkey: "Mod+T" },
  { id: "browser:close-tab", label: "Close tab", hotkey: "Mod+W" },
  { id: "browser:new-window", label: "New window", hotkey: "Mod+N" },
  { id: "browser:private-window", label: "New private window", hotkey: "Mod+Shift+N" },
  { id: "browser:reopen-tab", label: "Reopen closed tab", hotkey: "Mod+Shift+T" },
  { id: "browser:address-bar", label: "Address bar", hotkey: "Mod+L" },
  { id: "browser:reload", label: "Reload", hotkey: "Mod+R" },
  { id: "browser:quit", label: "Quit", hotkey: "Mod+Q" },
]

export type FindConflictOptions = {
  bindings?: readonly HotkeyBinding[] | undefined
  /** The binding being edited, which does not conflict with itself. */
  excludeId?: string | undefined
  /** Shortcuts the app cannot use, checked after `bindings`. */
  reserved?: readonly HotkeyBinding[] | undefined
  platform: HotkeyPlatform
}

/** The first binding or reserved shortcut that uses the same keys, or `null`. */
export function findHotkeyConflict(
  hotkey: Hotkey,
  { bindings = [], excludeId, reserved = [], platform }: FindConflictOptions
): HotkeyConflict | null {
  const binding = bindings.find(
    (candidate) => candidate.id !== excludeId && hotkeysEqual(candidate.hotkey, hotkey, platform)
  )
  if (binding) return { kind: "binding", binding }
  const kept = reserved.find((candidate) => hotkeysEqual(candidate.hotkey, hotkey, platform))
  return kept ? { kind: "reserved", binding: kept } : null
}

/* -------------------------------------------------------------------------- */
/* Showing                                                                    */
/* -------------------------------------------------------------------------- */

const MAC_KEY_SYMBOLS: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Enter: "↩",
  Backspace: "⌫",
  Delete: "⌦",
  Escape: "esc",
  Tab: "⇥",
  Space: "Space",
  PageUp: "⇞",
  PageDown: "⇟",
  Home: "↖",
  End: "↘",
  Plus: "+",
}

const OTHER_KEY_NAMES: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Escape: "Esc",
  Delete: "Del",
  PageUp: "PgUp",
  PageDown: "PgDn",
  Insert: "Ins",
  Plus: "+",
}

/**
 * The keycaps to draw, in the platform's order: ⌃ ⌥ ⇧ ⌘ then the key on a
 * Mac, and Ctrl, Win, Alt, Shift, then the key elsewhere.
 */
export function hotkeyKeycaps(
  parsed: Partial<ParsedHotkey>,
  platform: HotkeyPlatform
): { id: string; text: string }[] {
  const caps: { id: string; text: string }[] = []
  if (platform === "mac") {
    if (parsed.ctrl) caps.push({ id: "ctrl", text: "⌃" })
    if (parsed.alt) caps.push({ id: "alt", text: "⌥" })
    if (parsed.shift) caps.push({ id: "shift", text: "⇧" })
    if (parsed.mod || parsed.meta) caps.push({ id: "mod", text: "⌘" })
  } else {
    if (parsed.mod || parsed.ctrl) caps.push({ id: "mod", text: "Ctrl" })
    if (parsed.meta) caps.push({ id: "meta", text: "Win" })
    if (parsed.alt) caps.push({ id: "alt", text: "Alt" })
    if (parsed.shift) caps.push({ id: "shift", text: "Shift" })
  }
  if (parsed.key) {
    const table = platform === "mac" ? MAC_KEY_SYMBOLS : OTHER_KEY_NAMES
    caps.push({ id: "key", text: table[parsed.key] ?? parsed.key })
  }
  return caps
}

const SPOKEN_KEYS: Record<string, string> = {
  ArrowUp: "Up Arrow",
  ArrowDown: "Down Arrow",
  ArrowLeft: "Left Arrow",
  ArrowRight: "Right Arrow",
  PageUp: "Page Up",
  PageDown: "Page Down",
  "-": "Minus",
  "=": "Equals",
  "[": "Left Bracket",
  "]": "Right Bracket",
  "\\": "Backslash",
  ";": "Semicolon",
  "'": "Quote",
  "`": "Backtick",
  ",": "Comma",
  ".": "Period",
  "/": "Slash",
  "*": "Asterisk",
}

export const defaultHotkeyRecorderLabels: HotkeyRecorderLabels = {
  placeholder: "Not set",
  recording: "Press keys…",
  recordingHint: "Press the new shortcut. Escape cancels; Backspace clears it.",
  clear: "Clear shortcut",
  change: "press to change",
  needsModifier: (platform) =>
    platform === "mac"
      ? "Add ⌘, ⌃, or ⌥, so the shortcut does not fire while someone types."
      : "Add Ctrl or Alt, so the shortcut does not fire while someone types.",
  conflict: (binding) => `Also used by “${binding.label}”. Both will fire.`,
  reserved: (binding) => `The browser uses this for “${binding.label}”, so the page may never see it.`,
  keyName: (key, platform) => {
    if (key === "mod") return platform === "mac" ? "Command" : "Control"
    if (key === "ctrl") return "Control"
    if (key === "meta") return platform === "mac" ? "Command" : "Windows"
    if (key === "alt") return platform === "mac" ? "Option" : "Alt"
    if (key === "shift") return "Shift"
    return SPOKEN_KEYS[key] ?? key
  },
}

/** The shortcut read aloud, such as "Command Shift K". */
export function describeHotkey(
  parsed: ParsedHotkey,
  platform: HotkeyPlatform,
  keyName: HotkeyRecorderLabels["keyName"] = defaultHotkeyRecorderLabels.keyName
): string {
  return hotkeyKeycaps(parsed, platform)
    .map((cap) => (cap.id === "key" ? keyName(parsed.key, platform) : keyName(cap.id, platform)))
    .join(" ")
}
