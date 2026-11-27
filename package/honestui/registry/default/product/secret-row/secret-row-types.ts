export type SecretRowStatus = "active" | "revoked" | "expired"

export type SecretRowSecret = {
  id: string
  /** What the person called the key, such as "Production server". */
  name: string
  /** The visible start of the key, such as `hk_live_`. Shown even while masked. */
  prefix?: string | undefined
  /** The last characters of the key. Shown even while masked. */
  last4?: string | undefined
  /**
   * The full value, when the page already has it. Leave it out and pass
   * `onReveal` to fetch it only when someone asks to see it.
   */
  value?: string | undefined
  createdAt: Date | string | number
  /** `null` means the key has never been used. */
  lastUsedAt?: Date | string | number | null | undefined
  expiresAt?: Date | string | number | null | undefined
  scopes?: readonly string[] | undefined
  status?: SecretRowStatus | undefined
}

/** What a rotation returns: the new value, shown once, and its new visible parts. */
export type SecretRotation = {
  value: string
  prefix?: string | undefined
  last4?: string | undefined
}

/**
 * Where the row is in its life: browsing, asking to confirm a rotation or a
 * revocation, waiting on one, or showing the new value once.
 */
export type SecretRowPhase =
  | { kind: "idle" }
  | { kind: "confirmRotate" }
  | { kind: "rotating" }
  | { kind: "rotated"; value: string }
  | { kind: "confirmRevoke" }
  | { kind: "revoking" }

export type SecretRowLabels = {
  reveal: (name: string) => string
  hide: (name: string) => string
  copy: (name: string) => string
  copied: string
  copyFailed: string
  revealFailed: string
  rotate: (name: string) => string
  revoke: (name: string) => string
  created: (date: string) => string
  lastUsed: (relative: string) => string
  neverUsed: string
  expires: (date: string) => string
  expired: string
  revoked: string
  scopes: string
  rotateTitle: string
  rotateDescription: string
  rotateConfirm: string
  rotating: string
  rotated: string
  rotateFailed: string
  newValueTitle: string
  newValueDescription: string
  copyNewValue: string
  done: string
  revokeTitle: string
  revokeDescription: string
  revokeConfirm: string
  revoking: string
  revokeFailed: string
  cancel: string
  /** Read in place of the bullets while the value is hidden. */
  masked: (prefix: string, last4: string) => string
  /** Short names shown in the tooltips over the row's icon buttons. */
  tooltips: { show: string; hide: string; copy: string; rotate: string; revoke: string }
}
