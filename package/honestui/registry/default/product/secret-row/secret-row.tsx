"use client"

import * as React from "react"
import {
  Check as CheckIcon,
  CircleAlert as CircleAlertIcon,
  Copy as CopyIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  KeyRound as KeyIcon,
  LoaderCircle as LoaderCircleIcon,
  RefreshCw as RotateIcon,
  Trash2 as RevokeIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/registry/default/ui/tooltip"

import type {
  SecretRotation,
  SecretRowLabels,
  SecretRowPhase,
  SecretRowSecret,
} from "./secret-row-types"
import {
  copyText,
  defaultSecretRowLabels,
  formatRelativeTime,
  formatSecretDate,
  getSecretStatus,
  maskSecret,
  toDate,
} from "./secret-row-utils"

export type {
  SecretRotation,
  SecretRowLabels,
  SecretRowPhase,
  SecretRowSecret,
  SecretRowStatus,
} from "./secret-row-types"
export {
  defaultSecretRowLabels,
  formatRelativeTime,
  formatSecretDate,
  getSecretStatus,
  maskSecret,
} from "./secret-row-utils"

const titleText =
  "[font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:20px]"
const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const monoText =
  "font-mono [font-size:var(--hui-font-size-small)] [line-height:20px] tracking-normal"

/** Square icon buttons in the row: quiet until hovered, with a tooltip naming them. */
const iconButton =
  "size-7 min-h-7 rounded-[var(--hui-radius-1)] text-[var(--hui-color-foreground-base-secondary)] shadow-none not-disabled:hover:text-[var(--hui-color-foreground-base-primary)] [&_svg]:size-3.5"

const panelButton =
  "min-h-7 gap-[6px] px-[var(--hui-space-3)] shadow-none [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] [font-weight:var(--hui-font-weight-medium)] [&_svg]:size-3.5"

/** Filled buttons lose their fill in forced colors, so they get an edge instead. */
const forcedColorsBorder = "forced-colors:border forced-colors:border-[ButtonText]"

/* -------------------------------------------------------------------------- */
/* List                                                                       */
/* -------------------------------------------------------------------------- */

const SecretListContext = React.createContext(false)

export type SecretListProps = React.ComponentProps<"ul">

/** Stacks rows into one bordered list. Give it an `aria-label`, such as "API keys". */
function SecretList({ className, ...props }: SecretListProps) {
  return (
    <SecretListContext.Provider value={true}>
      <ul
        data-slot="secret-list"
        className={cn(
          "m-0 w-full min-w-0 list-none overflow-hidden rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-0 shadow-[var(--hui-shadow-feather)]",
          "[&>*+*]:border-t-[0.5px] [&>*+*]:border-t-[var(--hui-color-border-base-primary)]",
          className
        )}
        {...props}
      />
    </SecretListContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Row                                                                        */
/* -------------------------------------------------------------------------- */

export type SecretRowProps = Omit<React.ComponentProps<"div">, "children"> & {
  secret: SecretRowSecret
  /**
   * Loads the full value when it is not in `secret.value`. Without either,
   * the row offers no Show or Copy.
   */
  onReveal?: ((secret: SecretRowSecret) => Promise<string> | string) | undefined
  /** Called after a successful copy, for an audit trail. */
  onCopy?: ((secret: SecretRowSecret) => void) | undefined
  /** Creates a replacement key. Passing it offers Rotate. */
  onRotate?: ((secret: SecretRowSecret) => Promise<SecretRotation>) | undefined
  /** Revokes the key. Passing it offers Revoke. */
  onRevoke?: ((secret: SecretRowSecret) => Promise<unknown>) | undefined
  /** The moment relative times are measured from. Pass it to render the same text on server and client. */
  now?: Date | number | undefined
  locale?: string | undefined
  labels?: Partial<SecretRowLabels> | undefined
}

/**
 * One API key or secret: its name, a masked value with its start and end
 * visible, when it was made and last used, and its scopes. Show, Copy, Rotate,
 * and Revoke appear only when the page can do them.
 */
function SecretRow({
  secret,
  onReveal,
  onCopy,
  onRotate,
  onRevoke,
  now: nowProp,
  locale,
  labels: labelsProp,
  className,
  ...props
}: SecretRowProps) {
  const inList = React.useContext(SecretListContext)
  const labels = React.useMemo(() => ({ ...defaultSecretRowLabels, ...labelsProp }), [labelsProp])
  const baseId = React.useId()
  const valueId = `${baseId}-value`
  const panelTitleId = `${baseId}-panel-title`
  const panelDescriptionId = `${baseId}-panel-description`

  const [loadedValue, setLoadedValue] = React.useState<string | null>(null)
  const [isRevealed, setIsRevealed] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [copied, setCopied] = React.useState<"value" | "new" | null>(null)
  const [phase, setPhase] = React.useState<SecretRowPhase>({ kind: "idle" })
  const [message, setMessage] = React.useState<{ text: string; tone: "neutral" | "danger" } | null>(
    null
  )
  const [rotatedParts, setRotatedParts] = React.useState<Omit<SecretRotation, "value"> | null>(null)
  const [isRevoked, setIsRevoked] = React.useState(false)

  const rotateTrigger = React.useRef<HTMLButtonElement>(null)
  const revokeTrigger = React.useRef<HTMLButtonElement>(null)
  const panelFocus = React.useRef<HTMLButtonElement>(null)
  const copiedTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(copiedTimer.current), [])

  // A newer secret (a refetch after rotation, say) replaces what was loaded for the old one.
  const valueKey = `${secret.id}:${secret.value ?? ""}:${secret.last4 ?? ""}`
  const [seenKey, setSeenKey] = React.useState(valueKey)
  if (seenKey !== valueKey) {
    setSeenKey(valueKey)
    setLoadedValue(null)
    setIsRevealed(false)
  }

  const visible = { ...secret, ...rotatedParts }
  const fullValue = secret.value ?? loadedValue
  const canReadValue = fullValue != null || onReveal !== undefined
  // Read once on mount: relative times do not tick, and render stays pure.
  const [mountedAt] = React.useState(() => Date.now())
  const now = nowProp ?? mountedAt
  const status = isRevoked ? "revoked" : getSecretStatus(secret, now)
  const isActive = status === "active"
  const isBusy = phase.kind === "rotating" || phase.kind === "revoking"

  const fetchValue = React.useCallback(async (): Promise<string | null> => {
    if (fullValue != null) return fullValue
    if (!onReveal) return null
    setIsLoading(true)
    try {
      const value = await onReveal(secret)
      setLoadedValue(value)
      return value
    } catch {
      setMessage({ text: labels.revealFailed, tone: "danger" })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fullValue, onReveal, secret, labels.revealFailed])

  const toggleReveal = async () => {
    if (isRevealed) {
      setIsRevealed(false)
      return
    }
    setMessage(null)
    const value = await fetchValue()
    if (value != null) setIsRevealed(true)
  }

  const copy = async (which: "value" | "new", text?: string) => {
    setMessage(null)
    const value = text ?? (await fetchValue())
    if (value == null) return
    try {
      await copyText(value)
      setCopied(which)
      setMessage({ text: labels.copied, tone: "neutral" })
      onCopy?.(secret)
      window.clearTimeout(copiedTimer.current)
      copiedTimer.current = window.setTimeout(() => {
        setCopied(null)
        setMessage((current) => (current?.text === labels.copied ? null : current))
      }, 2000)
    } catch {
      setMessage({ text: labels.copyFailed, tone: "danger" })
    }
  }

  const openPanel = (next: SecretRowPhase) => {
    setMessage(null)
    setPhase(next)
  }

  const closePanel = (returnTo: React.RefObject<HTMLButtonElement | null>) => {
    setPhase({ kind: "idle" })
    // The trigger is back once the panel is gone; give it focus after the render.
    window.requestAnimationFrame(() => returnTo.current?.focus())
  }

  const rotate = async () => {
    if (!onRotate) return
    setPhase({ kind: "rotating" })
    try {
      const rotation = await onRotate(secret)
      setLoadedValue(rotation.value)
      setRotatedParts({
        prefix: rotation.prefix ?? secret.prefix,
        last4: rotation.last4 ?? rotation.value.slice(-4),
      })
      setIsRevealed(false)
      setPhase({ kind: "rotated", value: rotation.value })
      setMessage({ text: labels.rotated, tone: "neutral" })
    } catch {
      setPhase({ kind: "confirmRotate" })
      setMessage({ text: labels.rotateFailed, tone: "danger" })
    }
  }

  const revoke = async () => {
    if (!onRevoke) return
    setPhase({ kind: "revoking" })
    try {
      await onRevoke(secret)
      setIsRevoked(true)
      setIsRevealed(false)
      setPhase({ kind: "idle" })
    } catch {
      setPhase({ kind: "confirmRevoke" })
      setMessage({ text: labels.revokeFailed, tone: "danger" })
    }
  }

  // Move focus into a panel when it opens, so Escape and Tab start there.
  React.useEffect(() => {
    if (phase.kind === "confirmRotate" || phase.kind === "confirmRevoke" || phase.kind === "rotated") {
      panelFocus.current?.focus()
    }
  }, [phase.kind])

  const shownValue = isRevealed && fullValue != null ? fullValue : maskSecret(visible)
  const created = formatSecretDate(secret.createdAt, locale)
  const lastUsed =
    secret.lastUsedAt == null
      ? labels.neverUsed
      : labels.lastUsed(formatRelativeTime(secret.lastUsedAt, now, locale))

  // Inside a list the row is a list item; its props are typed as a div either way.
  const Root = (inList ? "li" : "div") as "div"
  const panelOpen = phase.kind !== "idle"

  return (
    <Root
      data-slot="secret-row"
      data-status={status}
      aria-labelledby={`${baseId}-name`}
      className={cn(
        "flex w-full min-w-0 flex-col text-[var(--hui-color-foreground-base-primary)]",
        !inList &&
          "rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-feather)]",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-[var(--hui-space-4)] px-[var(--hui-space-5)] py-[var(--hui-space-4)]">
        <span
          aria-hidden="true"
          className="mt-[2px] flex size-8 shrink-0 items-center justify-center rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] text-[var(--hui-color-foreground-base-secondary)] [&_svg]:size-3.5"
        >
          <KeyIcon />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-[var(--hui-space-1)]">
          <div className="flex min-w-0 flex-wrap items-center gap-x-[var(--hui-space-3)] gap-y-[var(--hui-space-1)]">
            <span id={`${baseId}-name`} className={cn("min-w-0 truncate", titleText)}>
              {secret.name}
            </span>
            {status !== "active" && (
              <Badge
                variant={status === "revoked" ? "error" : "secondary"}
                size="sm"
                data-slot="secret-row-status"
              >
                {status === "revoked" ? labels.revoked : labels.expired}
              </Badge>
            )}
          </div>

          <div className="flex min-w-0 items-center gap-[var(--hui-space-2)]">
            <code
              id={valueId}
              data-slot="secret-row-value"
              data-revealed={isRevealed ? "" : undefined}
              className={cn(
                "min-w-0 select-all break-all rounded-[var(--hui-radius-1)] bg-transparent p-0",
                monoText,
                isRevealed
                  ? "text-[var(--hui-color-foreground-base-primary)]"
                  : "text-[var(--hui-color-foreground-base-secondary)]",
                !isActive && "line-through decoration-[var(--hui-color-border-base-primary)]"
              )}
            >
              {isRevealed ? (
                shownValue
              ) : (
                <>
                  {/* Bullets mean nothing read aloud; the visible parts are read instead. */}
                  <span aria-hidden="true">{shownValue}</span>
                  <span className="sr-only">{labels.masked(visible.prefix ?? "", visible.last4 ?? "")}</span>
                </>
              )}
            </code>
          </div>

          <p
            data-slot="secret-row-meta"
            className={cn(
              "m-0 flex min-w-0 flex-wrap items-center gap-x-[var(--hui-space-3)] gap-y-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)] tabular-nums",
              metaText
            )}
          >
            <time dateTime={toDate(secret.createdAt).toISOString()} suppressHydrationWarning>
              {labels.created(created)}
            </time>
            <span aria-hidden="true">·</span>
            {secret.lastUsedAt == null ? (
              <span>{lastUsed}</span>
            ) : (
              <time dateTime={toDate(secret.lastUsedAt).toISOString()} suppressHydrationWarning>
                {lastUsed}
              </time>
            )}
            {secret.expiresAt != null && status === "active" && (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={toDate(secret.expiresAt).toISOString()} suppressHydrationWarning>
                  {labels.expires(formatSecretDate(secret.expiresAt, locale))}
                </time>
              </>
            )}
          </p>

          {secret.scopes && secret.scopes.length > 0 && (
            <ul
              aria-label={labels.scopes}
              data-slot="secret-row-scopes"
              className="m-0 mt-[var(--hui-space-2)] flex list-none flex-wrap gap-[var(--hui-space-2)] p-0"
            >
              {secret.scopes.map((scope) => (
                <li key={scope}>
                  <Badge variant="outline" size="sm" className="font-mono tracking-normal">
                    {scope}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {isActive && !panelOpen && (
          <div
            data-slot="secret-row-actions"
            className="-me-[var(--hui-space-2)] flex shrink-0 items-center gap-[var(--hui-space-1)]"
          >
            {canReadValue && (
              <>
                <RowIconButton
                  label={isRevealed ? labels.hide(secret.name) : labels.reveal(secret.name)}
                  tooltip={isRevealed ? labels.tooltips.hide : labels.tooltips.show}
                  aria-pressed={isRevealed}
                  aria-controls={valueId}
                  aria-busy={isLoading || undefined}
                  onClick={() => void toggleReveal()}
                >
                  {isLoading ? (
                    <LoaderCircleIcon aria-hidden="true" className="motion-safe:animate-spin" />
                  ) : isRevealed ? (
                    <EyeOffIcon aria-hidden="true" />
                  ) : (
                    <EyeIcon aria-hidden="true" />
                  )}
                </RowIconButton>
                <RowIconButton
                  label={labels.copy(secret.name)}
                  tooltip={labels.tooltips.copy}
                  data-copied={copied === "value" ? "" : undefined}
                  onClick={() => void copy("value")}
                >
                  {copied === "value" ? (
                    <CheckIcon aria-hidden="true" className="text-[var(--hui-color-foreground-base-primary)]" />
                  ) : (
                    <CopyIcon aria-hidden="true" />
                  )}
                </RowIconButton>
              </>
            )}
            {onRotate && (
              <RowIconButton
                ref={rotateTrigger}
                label={labels.rotate(secret.name)}
                tooltip={labels.tooltips.rotate}
                onClick={() => openPanel({ kind: "confirmRotate" })}
              >
                <RotateIcon aria-hidden="true" />
              </RowIconButton>
            )}
            {onRevoke && (
              <RowIconButton
                ref={revokeTrigger}
                label={labels.revoke(secret.name)}
                tooltip={labels.tooltips.revoke}
                className="not-disabled:hover:text-[var(--hui-color-foreground-danger-primary)]"
                onClick={() => openPanel({ kind: "confirmRevoke" })}
              >
                <RevokeIcon aria-hidden="true" />
              </RowIconButton>
            )}
          </div>
        )}
      </div>

      {panelOpen && (
        <div
          role="group"
          aria-labelledby={panelTitleId}
          aria-describedby={panelDescriptionId}
          aria-busy={isBusy || undefined}
          data-slot="secret-row-panel"
          data-kind={phase.kind}
          onKeyDown={(event) => {
            if (event.key !== "Escape" || isBusy) return
            event.preventDefault()
            closePanel(phase.kind === "confirmRevoke" ? revokeTrigger : rotateTrigger)
          }}
          className="mx-[var(--hui-space-3)] mb-[var(--hui-space-3)] flex min-w-0 flex-col gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-4)]"
        >
          {phase.kind === "rotated" ? (
            <>
              <div className="flex min-w-0 flex-col gap-[2px]">
                <p id={panelTitleId} className={cn("m-0", titleText)}>
                  {labels.newValueTitle}
                </p>
                <p
                  id={panelDescriptionId}
                  className={cn("m-0 text-[var(--hui-color-foreground-base-secondary)]", metaText)}
                >
                  {labels.newValueDescription}
                </p>
              </div>
              <code
                data-slot="secret-row-new-value"
                className={cn(
                  "block min-w-0 select-all break-all rounded-[var(--hui-radius-1)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-3)] py-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)]",
                  monoText
                )}
              >
                {phase.value}
              </code>
              <div className="flex flex-wrap items-center justify-end gap-[var(--hui-space-2)]">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(panelButton, forcedColorsBorder)}
                  onClick={() => {
                    setMessage(null)
                    closePanel(rotateTrigger)
                  }}
                >
                  {labels.done}
                </Button>
                <Button
                  ref={panelFocus}
                  size="sm"
                  className={cn(panelButton, forcedColorsBorder)}
                  onClick={() => void copy("new", phase.value)}
                >
                  {copied === "new" ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
                  {labels.copyNewValue}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex min-w-0 flex-col gap-[2px]">
                <p id={panelTitleId} className={cn("m-0", titleText)}>
                  {phase.kind === "confirmRevoke" || phase.kind === "revoking"
                    ? labels.revokeTitle
                    : labels.rotateTitle}
                </p>
                <p
                  id={panelDescriptionId}
                  className={cn("m-0 text-[var(--hui-color-foreground-base-secondary)]", metaText)}
                >
                  {phase.kind === "confirmRevoke" || phase.kind === "revoking"
                    ? labels.revokeDescription
                    : labels.rotateDescription}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-[var(--hui-space-2)]">
                <Button
                  ref={panelFocus}
                  variant="ghost"
                  size="sm"
                  aria-disabled={isBusy || undefined}
                  className={cn(panelButton, forcedColorsBorder, "aria-disabled:opacity-50")}
                  onClick={() => {
                    if (isBusy) return
                    setMessage(null)
                    closePanel(
                      phase.kind === "confirmRevoke" ? revokeTrigger : rotateTrigger
                    )
                  }}
                >
                  {labels.cancel}
                </Button>
                {phase.kind === "confirmRevoke" || phase.kind === "revoking" ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    aria-disabled={isBusy || undefined}
                    className={cn(panelButton, forcedColorsBorder)}
                    onClick={() => {
                      if (!isBusy) void revoke()
                    }}
                  >
                    {phase.kind === "revoking" && (
                      <LoaderCircleIcon aria-hidden="true" className="motion-safe:animate-spin" />
                    )}
                    {phase.kind === "revoking" ? labels.revoking : labels.revokeConfirm}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    aria-disabled={isBusy || undefined}
                    className={cn(panelButton, forcedColorsBorder)}
                    onClick={() => {
                      if (!isBusy) void rotate()
                    }}
                  >
                    {phase.kind === "rotating" && (
                      <LoaderCircleIcon aria-hidden="true" className="motion-safe:animate-spin" />
                    )}
                    {phase.kind === "rotating" ? labels.rotating : labels.rotateConfirm}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Always mounted, so the first message is announced. */}
      <p
        role="status"
        data-slot="secret-row-message"
        className={cn(
          "m-0 flex items-center gap-[var(--hui-space-2)] px-[var(--hui-space-5)] empty:hidden",
          metaText,
          message?.tone === "danger"
            ? "text-[var(--hui-color-foreground-danger-primary)]"
            : "text-[var(--hui-color-foreground-base-secondary)]",
          message && "-mt-[var(--hui-space-2)] pb-[var(--hui-space-4)] ps-[calc(var(--hui-space-5)+32px+var(--hui-space-4))]",
          // The panel already says it on screen; keep the words for screen readers only,
          // unless it is a failure the panel does not show.
          message && panelOpen && (message.tone === "danger" ? "mt-0 ps-[var(--hui-space-5)]" : "sr-only")
        )}
      >
        {message && (
          <>
            {message.tone === "danger" && <CircleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />}
            {message.text}
          </>
        )}
      </p>
    </Root>
  )
}

type RowIconButtonProps = Omit<React.ComponentProps<typeof Button>, "aria-label"> & {
  label: string
  tooltip: string
}

function RowIconButton({ label, tooltip, className, ...props }: RowIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            className={cn(iconButton, className)}
            {...props}
          />
        }
      />
      <TooltipPopup showArrow={false} sideOffset={6}>
        {tooltip}
      </TooltipPopup>
    </Tooltip>
  )
}

export { SecretList, SecretRow }
