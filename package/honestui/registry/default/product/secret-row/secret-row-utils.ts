import type { SecretRowLabels, SecretRowSecret } from "./secret-row-types"

export const defaultSecretRowLabels: SecretRowLabels = {
  reveal: (name) => `Show ${name}`,
  hide: (name) => `Hide ${name}`,
  copy: (name) => `Copy ${name}`,
  copied: "Copied to clipboard.",
  copyFailed: "Could not copy. Select the key and copy it by hand.",
  revealFailed: "The key could not be loaded. Try again.",
  rotate: (name) => `Rotate ${name}`,
  revoke: (name) => `Revoke ${name}`,
  created: (date) => `Created ${date}`,
  lastUsed: (relative) => `Last used ${relative}`,
  neverUsed: "Never used",
  expires: (date) => `Expires ${date}`,
  expired: "Expired",
  revoked: "Revoked",
  scopes: "Scopes",
  rotateTitle: "Rotate this key?",
  rotateDescription: "A new key replaces it, and the current one stops working right away.",
  rotateConfirm: "Rotate key",
  rotating: "Rotating…",
  rotated: "Key rotated. Copy the new key now.",
  rotateFailed: "The key was not rotated. It still works.",
  newValueTitle: "Copy your new key",
  newValueDescription: "This is the only time it is shown in full.",
  copyNewValue: "Copy new key",
  done: "Done",
  revokeTitle: "Revoke this key?",
  revokeDescription: "Anything using it stops working right away. This cannot be undone.",
  revokeConfirm: "Revoke key",
  revoking: "Revoking…",
  revokeFailed: "The key was not revoked. It still works.",
  cancel: "Cancel",
  masked: (prefix, last4) =>
    [prefix && `${prefix}, hidden`, last4 && `ending in ${last4}`].filter(Boolean).join(", ") || "Hidden",
  tooltips: { show: "Show", hide: "Hide", copy: "Copy", rotate: "Rotate", revoke: "Revoke" },
}

/** The mask character. A bullet reads as hidden text and keeps its width in monospace. */
export const SECRET_MASK = "•"

/**
 * The masked form of a key: its prefix, a fixed run of bullets, and its last
 * characters. The run does not follow the real length, so the mask does not
 * leak it.
 */
export function maskSecret(
  secret: Pick<SecretRowSecret, "prefix" | "last4" | "value">,
  maskLength = 12
): string {
  const prefix = secret.prefix ?? ""
  const last4 = secret.last4 ?? (secret.value ? secret.value.slice(-4) : "")
  return `${prefix}${SECRET_MASK.repeat(Math.max(0, maskLength))}${last4}`
}

export function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value)
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["week", 7 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
]

/** "just now", "5 minutes ago", "yesterday", "in 3 days", in the given locale. */
export function formatRelativeTime(
  date: Date | string | number,
  now: Date | number = Date.now(),
  locale?: string
): string {
  const difference = toDate(date).getTime() - (now instanceof Date ? now.getTime() : now)
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })

  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(difference) >= size) {
      return format.format(Math.round(difference / size), unit)
    }
  }
  return format.format(0, "second")
}

/** A calendar date without the time, such as "Mar 4, 2026". */
export function formatSecretDate(date: Date | string | number, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(
    toDate(date)
  )
}

/** A key past its expiry counts as expired even when the server still says active. */
export function getSecretStatus(
  secret: Pick<SecretRowSecret, "status" | "expiresAt">,
  now: Date | number = Date.now()
): NonNullable<SecretRowSecret["status"]> {
  if (secret.status === "revoked") return "revoked"
  if (secret.status === "expired") return "expired"
  if (secret.expiresAt != null) {
    const nowTime = now instanceof Date ? now.getTime() : now
    if (toDate(secret.expiresAt).getTime() <= nowTime) return "expired"
  }
  return "active"
}

/** Writes text to the clipboard, falling back to a hidden textarea where the API is missing. */
export async function copyText(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  if (typeof document === "undefined") throw new Error("No clipboard is available.")
  const area = document.createElement("textarea")
  area.value = text
  area.setAttribute("readonly", "")
  area.style.position = "fixed"
  area.style.opacity = "0"
  document.body.append(area)
  area.select()
  const ok = document.execCommand("copy")
  area.remove()
  if (!ok) throw new Error("The copy command was refused.")
}
