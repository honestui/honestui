"use client"

import * as React from "react"
import {
  CircleAlert as CircleAlertIcon,
  TriangleAlert as TriangleAlertIcon,
  X as CloseIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Label } from "@/registry/default/ui/label"

import type {
  Hotkey,
  HotkeyBinding,
  HotkeyConflict,
  HotkeyPlatform,
  HotkeyRecorderLabels,
  ParsedHotkey,
} from "./hotkey-recorder-types"
import {
  defaultHotkeyRecorderLabels,
  describeHotkey,
  findHotkeyConflict,
  hasCommandModifier,
  hotkeyFromEvent,
  hotkeyKeycaps,
  isFunctionKey,
  modifiersFromEvent,
  parseHotkey,
  stringifyHotkey,
} from "./hotkey-recorder-utils"

export type {
  Hotkey,
  HotkeyBinding,
  HotkeyConflict,
  HotkeyPlatform,
  HotkeyRecorderLabels,
  ParsedHotkey,
} from "./hotkey-recorder-types"
export {
  browserReservedHotkeys,
  defaultHotkeyRecorderLabels,
  describeHotkey,
  findHotkeyConflict,
  hotkeyFromEvent,
  hotkeysEqual,
  normalizeHotkey,
  parseHotkey,
  stringifyHotkey,
} from "./hotkey-recorder-utils"

const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

/* -------------------------------------------------------------------------- */
/* Platform                                                                   */
/* -------------------------------------------------------------------------- */

function detectPlatform(): HotkeyPlatform {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  const name = nav.userAgentData?.platform || nav.platform || ""
  return /mac|iphone|ipad|ipod/i.test(name) ? "mac" : "other"
}
const noopSubscribe = () => () => {}

/** The viewer's keyboard. The server renders the non-Mac spelling, and the browser corrects it after hydrating. */
export function useHotkeyPlatform(override?: HotkeyPlatform): HotkeyPlatform {
  const detected = React.useSyncExternalStore(noopSubscribe, detectPlatform, () => "other" as const)
  return override ?? detected
}

/* -------------------------------------------------------------------------- */
/* Keycaps                                                                    */
/* -------------------------------------------------------------------------- */

/** Keycaps drawn like the documentation's `kbd` component. */
const kbdClassName =
  "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center rounded-[calc(var(--hui-radius-1)-2px)] border-[0.5px] border-[var(--hui-color-border-base-secondary)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-2)] font-sans text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] [line-height:var(--hui-line-height-small)] select-none"

export type HotkeyKeysProps = Omit<React.ComponentProps<"kbd">, "children"> & {
  /** A shortcut string such as `Mod+Shift+K`, or the parts of one. */
  hotkey: Hotkey | Partial<ParsedHotkey>
  platform?: HotkeyPlatform | undefined
}

/** Draws a shortcut as keycaps for the viewer's platform, such as ⇧ ⌘ K or Ctrl Shift K. */
function HotkeyKeys({ hotkey, platform: platformProp, className, ...props }: HotkeyKeysProps) {
  const platform = useHotkeyPlatform(platformProp)
  const parsed = typeof hotkey === "string" ? parseHotkey(hotkey) : hotkey
  if (!parsed) return null
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-[var(--hui-space-1)] font-sans", className)}
      {...props}
    >
      {hotkeyKeycaps(parsed, platform).map((cap) => (
        <kbd key={cap.id} data-slot="kbd" className={kbdClassName}>
          {cap.text}
        </kbd>
      ))}
    </kbd>
  )
}

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

export type HotkeyRecorderChangeDetails = {
  /** Another binding or a reserved shortcut that uses the same keys. */
  conflict: HotkeyConflict | null
}

type Message = { tone: "hint" | "warning" | "error"; text: string } | null

type HotkeyRecorderContextValue = {
  controlId: string
  labelId: string
  statusId: string
  value: Hotkey | null
  parsed: ParsedHotkey | null
  recording: boolean
  held: Omit<ParsedHotkey, "key"> | null
  platform: HotkeyPlatform
  disabled: boolean
  labels: HotkeyRecorderLabels
  message: Message
  start: () => void
  cancel: () => void
  clear: () => void
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void
  onKeyUp: (event: React.KeyboardEvent<HTMLButtonElement>) => void
}

const HotkeyRecorderContext = React.createContext<HotkeyRecorderContextValue | null>(null)

function useHotkeyRecorder(part: string) {
  const context = React.useContext(HotkeyRecorderContext)
  if (!context) throw new Error(`${part} must be used within a HotkeyRecorder.`)
  return context
}

export type HotkeyRecorderProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** The shortcut, in canonical form such as `Mod+Shift+K`. `null` is no shortcut. */
  value?: Hotkey | null | undefined
  defaultValue?: Hotkey | null | undefined
  onValueChange?: ((value: Hotkey | null, details: HotkeyRecorderChangeDetails) => void) | undefined
  /** Shortcuts already in use, checked for conflicts. */
  bindings?: readonly HotkeyBinding[] | undefined
  /** The id of the binding this field edits, so it does not conflict with itself. */
  bindingId?: string | undefined
  /** Shortcuts the app cannot use, such as `browserReservedHotkeys`. */
  reserved?: readonly HotkeyBinding[] | undefined
  /** `warn` saves a conflicting shortcut and says so; `block` refuses it. Defaults to `warn`. */
  conflicts?: "warn" | "block" | undefined
  /** Refuses shortcuts without ⌘, Ctrl, or Alt (function keys excepted), which would fire while someone types. Defaults to `true`. */
  requireModifier?: boolean | undefined
  /** Defaults to the viewer's platform. */
  platform?: HotkeyPlatform | undefined
  disabled?: boolean | undefined
  labels?: Partial<HotkeyRecorderLabels> | undefined
}

/**
 * Records a keyboard shortcut. Focus the field and press Enter or click it,
 * then press the combination. The value is one string that reads ⌘ on a Mac
 * and Ctrl elsewhere, and conflicts with other shortcuts are reported.
 */
function HotkeyRecorder({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  bindings,
  bindingId,
  reserved,
  conflicts = "warn",
  requireModifier = true,
  platform: platformProp,
  disabled = false,
  labels: labelsProp,
  className,
  children,
  ...props
}: HotkeyRecorderProps) {
  const id = React.useId()
  const labels = React.useMemo(() => ({ ...defaultHotkeyRecorderLabels, ...labelsProp }), [labelsProp])
  const platform = useHotkeyPlatform(platformProp)

  const [internal, setInternal] = React.useState(defaultValue)
  const value = valueProp === undefined ? internal : valueProp
  const parsed = value ? parseHotkey(value) : null

  const [recording, setRecording] = React.useState(false)
  const [held, setHeld] = React.useState<Omit<ParsedHotkey, "key"> | null>(null)
  const [refusal, setRefusal] = React.useState<string | null>(null)

  const conflict =
    value !== null ? findHotkeyConflict(value, { bindings, excludeId: bindingId, reserved, platform }) : null

  let message: Message = null
  if (refusal) message = { tone: "error", text: refusal }
  else if (recording) message = { tone: "hint", text: labels.recordingHint }
  else if (conflict) {
    message = {
      tone: "warning",
      text: conflict.kind === "binding" ? labels.conflict(conflict.binding) : labels.reserved(conflict.binding),
    }
  }

  const commit = (next: Hotkey | null) => {
    if (valueProp === undefined) setInternal(next)
    onValueChange?.(next, {
      conflict: next ? findHotkeyConflict(next, { bindings, excludeId: bindingId, reserved, platform }) : null,
    })
  }

  const stop = () => {
    setRecording(false)
    setHeld(null)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!recording) {
      if (event.key === "Backspace" || event.key === "Delete") {
        if (value !== null) {
          event.preventDefault()
          setRefusal(null)
          commit(null)
        }
      }
      return
    }

    const bare = !event.metaKey && !event.ctrlKey && !event.altKey
    // Tab still leaves the field, which cancels recording on blur.
    if (event.key === "Tab" && bare) return
    event.preventDefault()
    event.stopPropagation()

    if (bare && !event.shiftKey && event.key === "Escape") {
      setRefusal(null)
      stop()
      return
    }
    if (bare && !event.shiftKey && (event.key === "Backspace" || event.key === "Delete")) {
      setRefusal(null)
      stop()
      commit(null)
      return
    }

    const next = hotkeyFromEvent(event.nativeEvent, platform)
    if (!next) {
      setHeld(modifiersFromEvent(event.nativeEvent, platform))
      return
    }
    if (requireModifier && !hasCommandModifier(next) && !isFunctionKey(next.key)) {
      setHeld(null)
      setRefusal(labels.needsModifier(platform))
      return
    }

    const hotkey = stringifyHotkey(next)
    if (conflicts === "block") {
      const found = findHotkeyConflict(hotkey, { bindings, excludeId: bindingId, reserved, platform })
      if (found) {
        setHeld(null)
        setRefusal(found.kind === "binding" ? labels.conflict(found.binding) : labels.reserved(found.binding))
        return
      }
    }
    setRefusal(null)
    stop()
    commit(hotkey)
  }

  const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (recording) setHeld(modifiersFromEvent(event.nativeEvent, platform))
  }

  const context: HotkeyRecorderContextValue = {
    controlId: `${id}-control`,
    labelId: `${id}-label`,
    statusId: `${id}-status`,
    value,
    parsed,
    recording,
    held,
    platform,
    disabled,
    labels,
    message,
    start: () => {
      if (disabled) return
      setRefusal(null)
      setRecording(true)
    },
    cancel: () => {
      setRefusal(null)
      stop()
    },
    clear: () => {
      setRefusal(null)
      stop()
      commit(null)
    },
    onKeyDown: handleKeyDown,
    onKeyUp: handleKeyUp,
  }

  return (
    <HotkeyRecorderContext.Provider value={context}>
      <div
        data-slot="hotkey-recorder"
        data-recording={recording ? "" : undefined}
        data-conflict={conflict ? conflict.kind : undefined}
        className={cn("flex min-w-0 flex-col items-start", className)}
        {...props}
      >
        {children}
      </div>
    </HotkeyRecorderContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Parts                                                                      */
/* -------------------------------------------------------------------------- */

function HotkeyRecorderLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { controlId, labelId } = useHotkeyRecorder("HotkeyRecorderLabel")
  return (
    <Label
      id={labelId}
      htmlFor={controlId}
      data-slot="hotkey-recorder-label"
      className={cn("mb-[var(--hui-space-2)]", className)}
      {...props}
    />
  )
}

/** The field: the shortcut as keycaps, or the keys being held while recording, and a clear button. */
function HotkeyRecorderControl({ className, ...props }: Omit<React.ComponentProps<"div">, "children">) {
  const context = useHotkeyRecorder("HotkeyRecorderControl")
  const { parsed, recording, held, platform, labels, message, disabled } = context
  const spoken = parsed ? describeHotkey(parsed, platform, labels.keyName) : labels.placeholder

  return (
    <div
      data-slot="hotkey-recorder-control"
      data-recording={recording ? "" : undefined}
      data-invalid={message?.tone === "error" ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "relative flex h-9 w-full min-w-0 items-stretch overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-field,var(--hui-color-border-base-tertiary))] bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] motion-safe:[transition:border-color_var(--hui-duration-fast)_var(--hui-ease-out),box-shadow_var(--hui-duration-fast)_var(--hui-ease-out)]",
        "not-data-disabled:hover:border-[var(--hui-color-border-field-hover,var(--hui-color-border-base-secondary))]",
        "has-[button:focus-visible]:border-[var(--hui-color-border-accent-emphasis)]! has-[button:focus-visible]:shadow-[var(--hui-focus-ring-field)]",
        "data-recording:border-[var(--hui-color-border-accent-emphasis)]! data-recording:shadow-[var(--hui-focus-ring-field)]",
        "data-invalid:border-[var(--hui-color-border-danger-emphasis)]! data-invalid:shadow-[var(--hui-focus-ring-field-danger)]",
        "data-disabled:border-[var(--hui-color-border-base-primary)] data-disabled:bg-[var(--hui-color-background-base-secondary)]",
        className
      )}
      {...props}
    >
      <button
        type="button"
        id={context.controlId}
        disabled={disabled}
        aria-labelledby={`${context.labelId} ${context.controlId}`}
        aria-describedby={context.statusId}
        aria-pressed={recording}
        onClick={() => (recording ? context.cancel() : context.start())}
        onKeyDown={context.onKeyDown}
        onKeyUp={context.onKeyUp}
        onBlur={context.cancel}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-[var(--hui-space-3)] px-[var(--hui-space-3)] text-start outline-none disabled:cursor-not-allowed"
      >
        {recording ? (
          <>
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full bg-[var(--hui-color-background-accent-emphasis)] motion-safe:animate-pulse"
            />
            {held && hasCommandModifierOrShift(held) ? (
              <HotkeyKeys hotkey={held} platform={platform} aria-hidden="true" />
            ) : (
              <span className="truncate text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-control,13px)]">
                {labels.recording}
              </span>
            )}
            <span className="sr-only">{labels.recording}</span>
          </>
        ) : parsed ? (
          <>
            <HotkeyKeys hotkey={parsed} platform={platform} aria-hidden="true" />
            <span className="sr-only">
              {spoken}, {labels.change}
            </span>
          </>
        ) : (
          <span className="truncate text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-control,13px)]">
            {labels.placeholder}
            <span className="sr-only">, {labels.change}</span>
          </span>
        )}
      </button>
      {parsed && !recording && !disabled && (
        <button
          type="button"
          aria-label={labels.clear}
          onClick={context.clear}
          className="flex w-9 shrink-0 cursor-pointer items-center justify-center text-[var(--hui-color-foreground-base-secondary)] outline-none hover:bg-[var(--hui-color-background-base-primary-hover)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[-2px]"
        >
          <CloseIcon aria-hidden="true" className="size-3.5" />
        </button>
      )}
    </div>
  )
}

function hasCommandModifierOrShift(held: Omit<ParsedHotkey, "key">) {
  return hasCommandModifier(held) || held.shift
}

/**
 * Says how to record while recording, why a shortcut was refused, and which
 * binding a saved shortcut conflicts with. Keep it mounted so screen readers
 * announce the first message.
 */
function HotkeyRecorderStatus({ className, ...props }: Omit<React.ComponentProps<"p">, "children">) {
  const { statusId, message } = useHotkeyRecorder("HotkeyRecorderStatus")
  const Icon = message?.tone === "error" ? CircleAlertIcon : message?.tone === "warning" ? TriangleAlertIcon : null

  return (
    <p
      id={statusId}
      role="status"
      data-slot="hotkey-recorder-status"
      data-state={message?.tone ?? "empty"}
      className={cn(
        "m-0 flex min-w-0 items-start gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)] not-empty:mt-[var(--hui-space-2)] data-[state=error]:text-[var(--hui-color-foreground-base-primary)] data-[state=warning]:text-[var(--hui-color-foreground-base-primary)]",
        metaText,
        className
      )}
      {...props}
    >
      {Icon && (
        <Icon
          aria-hidden="true"
          className={cn(
            "mt-0.5 size-3.5 shrink-0",
            message?.tone === "error"
              ? "text-[var(--hui-color-foreground-danger-primary)]"
              : "text-[var(--hui-color-foreground-attention-primary)]"
          )}
        />
      )}
      {message && <span className="min-w-0 break-words">{message.text}</span>}
    </p>
  )
}

export { HotkeyKeys, HotkeyRecorder, HotkeyRecorderControl, HotkeyRecorderLabel, HotkeyRecorderStatus }
