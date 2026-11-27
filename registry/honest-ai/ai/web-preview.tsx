"use client"

import * as React from "react"
import {
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  ChevronRight as ChevronRightIcon,
  CircleAlert as CircleAlertIcon,
  ExternalLink as ExternalLinkIcon,
  Globe as GlobeIcon,
  LoaderCircle as LoaderCircleIcon,
  Monitor as MonitorIcon,
  RotateCw as RotateCwIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

export type WebPreviewDevice = "desktop" | "tablet" | "mobile"

export type WebPreviewLog = {
  level: "log" | "info" | "warn" | "error"
  message: string
  /** A short time, such as "12:04:31", shown before the message. */
  time?: string
}

export type WebPreviewLabels = {
  back: string
  forward: string
  reload: string
  openInNewTab: string
  address: string
  device: string
  desktop: string
  tablet: string
  mobile: string
  loading: string
  errorTitle: string
  tryAgain: string
  console: string
  noLogs: string
  logCount: (count: number) => string
  errorCount: (count: number) => string
}

export const defaultWebPreviewLabels: WebPreviewLabels = {
  back: "Back",
  forward: "Forward",
  reload: "Reload",
  openInNewTab: "Open in new tab",
  address: "Address",
  device: "Device width",
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
  loading: "Loading preview",
  errorTitle: "The preview did not load",
  tryAgain: "Try again",
  console: "Console",
  noLogs: "Nothing logged yet.",
  logCount: (count) => `${count} ${count === 1 ? "message" : "messages"}`,
  errorCount: (count) => `${count} ${count === 1 ? "error" : "errors"}`,
}

const deviceWidth: Record<WebPreviewDevice, string | undefined> = {
  desktop: undefined,
  tablet: "768px",
  mobile: "390px",
}

const deviceIcon: Record<WebPreviewDevice, typeof MonitorIcon> = {
  desktop: MonitorIcon,
  tablet: TabletIcon,
  mobile: SmartphoneIcon,
}

const logTone: Record<WebPreviewLog["level"], string> = {
  log: "text-[var(--hui-color-foreground-base-primary)]",
  info: "text-[var(--hui-color-foreground-base-primary)]",
  warn: "text-[var(--hui-color-foreground-attention-primary-hover)]",
  error: "text-[var(--hui-color-foreground-danger-primary)]",
}

const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const monoText =
  "font-mono [font-variant-ligatures:none] [font-size:var(--hui-font-size-mono-small)] [letter-spacing:var(--hui-letter-spacing-mono-small)] [line-height:var(--hui-line-height-mono-regular)]"
const iconButton =
  "text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-base-primary)] [&_svg]:size-3.5"

function isWebUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

export type WebPreviewProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The address shown in the bar, and loaded when `src` and `srcDoc` are missing. */
  url: string
  /** The page to load, when it differs from the address shown. */
  src?: string
  /** HTML to show in place of a page, such as a generated one. */
  srcDoc?: string
  /** A name for the frame, read by assistive technology. */
  title: string
  /**
   * The frame's sandbox. Defaults to scripts and forms only, so the page
   * cannot reach the hosting page, its storage, or its cookies.
   */
  sandbox?: string
  /** Leave it out to follow the frame's own load. Pass it when your app knows better. */
  status?: "loading" | "ready" | "error"
  /** What went wrong, shown under the error title. */
  error?: React.ReactNode
  /** Runs when the reader submits the address bar. Without it, the address is read-only. */
  onNavigate?: (url: string) => void
  onBack?: () => void
  onForward?: () => void
  /** Runs on Reload and Try again. The frame reloads either way. */
  onReload?: () => void
  canGoBack?: boolean
  canGoForward?: boolean
  device?: WebPreviewDevice
  defaultDevice?: WebPreviewDevice
  onDeviceChange?: (device: WebPreviewDevice) => void
  /** Messages the page logged. With them, a console opens under the page. */
  logs?: WebPreviewLog[]
  consoleOpen?: boolean
  defaultConsoleOpen?: boolean
  onConsoleOpenChange?: (open: boolean) => void
  /** The frame's height. Defaults to 360px. */
  height?: number | string
  labels?: Partial<WebPreviewLabels>
}

/**
 * A page the agent built, in a sandboxed frame under a browser-like bar:
 * history, reload, the address, a device width, and an optional console.
 */
function WebPreview({
  url,
  src,
  srcDoc,
  title,
  sandbox = "allow-scripts allow-forms",
  status: statusProp,
  error,
  onNavigate,
  onBack,
  onForward,
  onReload,
  canGoBack = false,
  canGoForward = false,
  device: deviceProp,
  defaultDevice = "desktop",
  onDeviceChange,
  logs,
  consoleOpen: consoleOpenProp,
  defaultConsoleOpen = false,
  onConsoleOpenChange,
  height = 360,
  labels: labelsProp,
  className,
  ...props
}: WebPreviewProps) {
  const labels = React.useMemo(() => ({ ...defaultWebPreviewLabels, ...labelsProp }), [labelsProp])

  // A new address from the app replaces whatever the reader was typing.
  const [draft, setDraft] = React.useState(url)
  const [shownUrl, setShownUrl] = React.useState(url)
  if (shownUrl !== url) {
    setShownUrl(url)
    setDraft(url)
  }

  const [deviceState, setDeviceState] = React.useState(defaultDevice)
  const device = deviceProp ?? deviceState
  const chooseDevice = (next: WebPreviewDevice) => {
    if (deviceProp === undefined) setDeviceState(next)
    onDeviceChange?.(next)
  }

  const [consoleState, setConsoleState] = React.useState(defaultConsoleOpen)
  const consoleOpen = consoleOpenProp ?? consoleState
  const toggleConsole = () => {
    if (consoleOpenProp === undefined) setConsoleState(!consoleOpen)
    onConsoleOpenChange?.(!consoleOpen)
  }

  // A new key remounts the frame, which reloads it, even for `srcDoc`.
  const [frameKey, setFrameKey] = React.useState(0)
  const frameSrc = srcDoc === undefined ? (src ?? url) : undefined
  // The frame counts as loaded only for the page it last finished loading.
  const loadKey = `${frameKey}\n${frameSrc ?? ""}\n${srcDoc ?? ""}`
  const [loadedKey, setLoadedKey] = React.useState<string>()
  const status = statusProp ?? (loadedKey === loadKey ? "ready" : "loading")
  const reload = () => {
    setFrameKey((key) => key + 1)
    onReload?.()
  }

  const errorCount = logs?.filter((log) => log.level === "error").length ?? 0
  const consoleId = React.useId()
  // The console keeps its newest message in view, without scrolling the page.
  const logListRef = React.useRef<HTMLOListElement>(null)
  React.useEffect(() => {
    const node = logListRef.current
    if (consoleOpen && node) node.scrollTop = node.scrollHeight
  }, [consoleOpen, logs?.length])

  const openable = isWebUrl(src ?? url)

  return (
    <div
      data-slot="web-preview"
      data-status={status}
      className={cn(
        "not-prose w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        className
      )}
      {...props}
    >
      <div
        data-slot="web-preview-bar"
        className="flex min-h-[var(--hui-space-10)] min-w-0 items-center gap-[var(--hui-space-2)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-3)]"
      >
        <div className="flex shrink-0 items-center">
          <Button type="button" variant="ghost" size="icon-sm" className={cn(iconButton, "rtl:[&_svg]:-scale-x-100")} aria-label={labels.back} title={labels.back} disabled={!canGoBack} onClick={onBack}>
            <ArrowLeftIcon aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className={cn(iconButton, "rtl:[&_svg]:-scale-x-100")} aria-label={labels.forward} title={labels.forward} disabled={!canGoForward} onClick={onForward}>
            <ArrowRightIcon aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className={iconButton} aria-label={labels.reload} title={labels.reload} onClick={reload}>
            <RotateCwIcon aria-hidden="true" />
          </Button>
        </div>
        <form
          className="min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault()
            const next = draft.trim()
            if (next && onNavigate) onNavigate(next)
          }}
        >
          <label className="flex h-7 min-w-0 items-center gap-[var(--hui-space-2)] rounded-full bg-[var(--hui-color-background-neutral-secondary)] px-[var(--hui-space-4)] focus-within:[outline:var(--hui-focus-ring)] focus-within:outline-offset-[var(--hui-focus-ring-offset-accent)]">
            {status === "loading" ? (
              <LoaderCircleIcon aria-hidden="true" className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)] motion-safe:animate-spin" />
            ) : (
              <GlobeIcon aria-hidden="true" className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]" />
            )}
            <span className="sr-only">{labels.address}</span>
            <input
              data-slot="web-preview-address"
              type="text"
              inputMode="url"
              spellCheck={false}
              autoComplete="off"
              value={draft}
              readOnly={!onNavigate}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setDraft(url)
              }}
              className={cn(
                "min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-[var(--hui-color-foreground-base-secondary)] outline-none focus:text-[var(--hui-color-foreground-base-primary)]",
                monoText
              )}
            />
          </label>
        </form>
        <div role="group" aria-label={labels.device} className="hidden shrink-0 items-center sm:flex">
          {(Object.keys(deviceWidth) as WebPreviewDevice[]).map((option) => {
            const Icon = deviceIcon[option]
            return (
              <Button
                key={option}
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={labels[option]}
                title={labels[option]}
                aria-pressed={device === option}
                className={cn(iconButton, device === option && "bg-[var(--hui-color-background-neutral-secondary)] text-[var(--hui-color-foreground-base-primary)]")}
                onClick={() => chooseDevice(option)}
              >
                <Icon aria-hidden="true" />
              </Button>
            )
          })}
        </div>
        {openable && (
          <a
            href={src ?? url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={labels.openInNewTab}
            title={labels.openInNewTab}
            className="inline-flex size-[var(--hui-control-height-sm,var(--hui-space-8))] shrink-0 items-center justify-center rounded-[calc(var(--hui-radius-2)-2px)] text-[var(--hui-color-foreground-base-secondary)] outline-none hover:bg-[var(--hui-color-background-base-primary-hover)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)]"
          >
            <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
          </a>
        )}
      </div>

      <div
        data-slot="web-preview-viewport"
        className="relative flex justify-center bg-[var(--hui-color-background-base-secondary)]"
        style={{ height }}
      >
        <iframe
          key={frameKey}
          data-slot="web-preview-frame"
          title={title}
          src={frameSrc}
          srcDoc={srcDoc}
          sandbox={sandbox}
          referrerPolicy="no-referrer"
          onLoad={() => setLoadedKey(loadKey)}
          className={cn(
            "h-full w-full max-w-full border-0 bg-white motion-safe:transition-[max-width] motion-safe:duration-200",
            device !== "desktop" && "border-x-[0.5px] border-[var(--hui-color-border-base-primary)]",
            status === "error" && "invisible"
          )}
          style={{ maxWidth: deviceWidth[device] }}
        />
        {status === "loading" && (
          <div
            role="status"
            className={cn(
              "absolute inset-0 flex items-center justify-center gap-[var(--hui-space-3)] bg-[var(--hui-color-background-base-secondary)] text-[var(--hui-color-foreground-base-secondary)]",
              metaText
            )}
          >
            <LoaderCircleIcon aria-hidden="true" className="size-4 motion-safe:animate-spin" />
            {labels.loading}
          </div>
        )}
        {status === "error" && (
          <div
            role="alert"
            data-slot="web-preview-error"
            className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--hui-space-3)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-7)] text-center"
          >
            <CircleAlertIcon aria-hidden="true" className="size-5 text-[var(--hui-color-foreground-danger-primary)]" />
            <div>
              <p className="m-0 font-medium [font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]">
                {labels.errorTitle}
              </p>
              {error && <p className={cn("m-0 mt-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)]", metaText)}>{error}</p>}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={reload}>
              <RotateCwIcon aria-hidden="true" />
              {labels.tryAgain}
            </Button>
          </div>
        )}
      </div>

      {logs && (
        <div data-slot="web-preview-console" className="border-t-[0.5px] border-[var(--hui-color-border-base-primary)]">
          <button
            type="button"
            aria-expanded={consoleOpen}
            aria-controls={consoleOpen ? consoleId : undefined}
            onClick={toggleConsole}
            className={cn(
              "flex min-h-[var(--hui-space-9)] w-full items-center gap-[var(--hui-space-2)] px-[var(--hui-space-5)] text-start text-[var(--hui-color-foreground-base-secondary)] outline-none hover:bg-[var(--hui-color-background-base-primary-hover)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]",
              metaText
            )}
          >
            <ChevronRightIcon
              aria-hidden="true"
              className={cn("size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)] motion-safe:transition-transform rtl:-scale-x-100", consoleOpen && "rotate-90 rtl:scale-x-100")}
            />
            <span className="font-medium text-[var(--hui-color-foreground-base-primary)]">{labels.console}</span>
            <span className="tabular-nums">{labels.logCount(logs.length)}</span>
            {errorCount > 0 && (
              <span className="ms-auto tabular-nums text-[var(--hui-color-foreground-danger-primary)]">{labels.errorCount(errorCount)}</span>
            )}
          </button>
          {consoleOpen && (
            <ol
              ref={logListRef}
              id={consoleId}
              aria-label={labels.console}
              tabIndex={0}
              className="m-0 max-h-40 list-none overflow-auto border-t-[0.5px] border-[var(--hui-color-border-base-primary)] p-0 py-[var(--hui-space-2)] outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]"
            >
              {logs.length === 0 && (
                <li className={cn("px-[var(--hui-space-5)] py-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)]", metaText)}>{labels.noLogs}</li>
              )}
              {logs.map((log, index) => (
                <li
                  key={index}
                  data-level={log.level}
                  className={cn("flex min-w-0 gap-[var(--hui-space-4)] px-[var(--hui-space-5)] py-[var(--hui-space-1)]", monoText)}
                >
                  {log.time && <span className="shrink-0 tabular-nums text-[var(--hui-color-foreground-base-secondary)]">{log.time}</span>}
                  <span className={cn("min-w-0 break-words whitespace-pre-wrap", logTone[log.level])}>{log.message}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}

export { WebPreview }
