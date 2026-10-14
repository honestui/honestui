"use client"

import * as React from "react"
import {
  CircleAlert as CircleAlertIcon,
  LoaderCircle as LoaderCircleIcon,
  Maximize2 as MaximizeIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import {
  Dialog,
  DialogBody,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog.js"

export type AgentScreenStatus = "connecting" | "live" | "offline"

export type AgentScreenLabels = {
  open: string
  connecting: string
  offline: string
}

export const defaultAgentScreenLabels: AgentScreenLabels = {
  open: "Open",
  connecting: "Connecting to the agent's screen…",
  offline: "The agent's screen is not available.",
}

export type AgentScreenProps = Omit<React.ComponentProps<"div">, "children" | "title"> & {
  /** Names the screen, such as "Research agent's screen". */
  title: string
  /** Defaults to "live". The media is shown only while live. */
  status?: AgentScreenStatus
  /** The capture or stream URL. */
  src?: string
  /** Set to "video" when `src` is a video. */
  mediaType?: "image" | "video"
  /** Describes what is on the screen, for people who cannot see it. */
  alt: string
  /** Controls shown in the viewer's header, such as a button to take over. */
  actions?: React.ReactNode
  labels?: Partial<AgentScreenLabels>
}

function ScreenMedia({
  src,
  mediaType,
  alt,
  isPreview = false,
  className,
}: Pick<AgentScreenProps, "src" | "mediaType" | "alt"> & {
  /** A still, unlabelled copy for the card. The viewer holds the real one. */
  isPreview?: boolean
  className?: string
}) {
  if (mediaType === "video") {
    // No autoplay: motion the person did not ask for should not start by itself.
    return isPreview ? (
      <video src={src} aria-hidden="true" muted playsInline preload="metadata" className={className} />
    ) : (
      <video src={src} aria-label={alt} controls muted playsInline className={className} />
    )
  }

  // A plain img keeps the copied component free of a framework image loader.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={isPreview ? "" : alt} className={className} />
}

/**
 * A framed view of what an agent sees, which opens in a larger viewer. It
 * shows the image or video you pass; connecting to the agent is your
 * application's work, reported through `status`.
 */
function AgentScreen({
  title,
  status = "live",
  src,
  mediaType = "image",
  alt,
  actions,
  labels: labelsProp,
  className,
  ...props
}: AgentScreenProps) {
  const labels = { ...defaultAgentScreenLabels, ...labelsProp }
  const isLive = status === "live" && Boolean(src)

  const frame =
    "relative block aspect-video w-full overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] p-0"

  return (
    <div
      data-slot="agent-screen"
      data-status={status}
      className={cn(
        "flex w-full min-w-0 flex-col gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]",
        className
      )}
      {...props}
    >
      {isLive ? (
        <Dialog>
          <DialogTrigger
            aria-label={`${labels.open}: ${title}`}
            className={cn(
              frame,
              "group/screen cursor-pointer outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:shadow-[var(--hui-shadow-lifted)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)]"
            )}
          >
            <ScreenMedia
              src={src}
              mediaType={mediaType}
              alt={alt}
              isPreview
              className="absolute inset-0 size-full object-cover"
            />
            {/* Always visible, so opening does not depend on hover. */}
            <span className="absolute end-[var(--hui-space-3)] bottom-[var(--hui-space-3)] inline-flex items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-3)] py-[var(--hui-space-2)] shadow-[var(--hui-shadow-soft)] [font-weight:var(--hui-font-weight-medium)]">
              <MaximizeIcon aria-hidden="true" className="size-3.5" />
              {labels.open}
            </span>
          </DialogTrigger>
          <DialogPopup className="w-[min(960px,90vw)] max-w-[90vw]">
            <DialogHeader className="flex flex-row items-center justify-between gap-[var(--hui-space-4)] pe-[var(--hui-space-10)]">
              <DialogTitle>{title}</DialogTitle>
              {actions && <div className="flex shrink-0 items-center gap-[var(--hui-space-2)]">{actions}</div>}
            </DialogHeader>
            <DialogBody>
              <ScreenMedia
                src={src}
                mediaType={mediaType}
                alt={alt}
                className="block h-auto max-h-[70vh] w-full rounded-[var(--hui-radius-2)] object-contain"
              />
            </DialogBody>
          </DialogPopup>
        </Dialog>
      ) : (
        <div className={cn(frame, "flex items-center justify-center p-[var(--hui-space-5)]")}>
          <p
            role="status"
            className="m-0 flex max-w-full items-center gap-[var(--hui-space-3)] text-center text-[var(--hui-color-foreground-base-secondary)]"
          >
            {status === "connecting" ? (
              <LoaderCircleIcon aria-hidden="true" className="size-4 shrink-0 motion-safe:animate-spin" />
            ) : (
              <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" className="size-4 shrink-0" />
            )}
            {status === "connecting" ? labels.connecting : labels.offline}
          </p>
        </div>
      )}
      <p className="m-0 truncate [font-weight:var(--hui-font-weight-medium)]">{title}</p>
    </div>
  )
}

export { AgentScreen }
