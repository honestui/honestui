"use client"

import * as React from "react"
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CircleAlert as CircleAlertIcon,
  File as FileIcon,
  Pencil as PencilIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"
import { Textarea } from "../../components/ui/textarea.js"

/** Whether the element's content is taller than its box, kept current as messages arrive and grow. */
function useOverflows(ref: React.RefObject<HTMLElement | null>) {
  const [overflows, setOverflows] = React.useState(false)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return
    if (typeof ResizeObserver === "undefined") return
    const measure = () => setOverflows(element.scrollHeight > element.clientHeight + 1)
    const resizes = new ResizeObserver(measure)
    const observeChildren = () => {
      resizes.disconnect()
      resizes.observe(element)
      for (const child of Array.from(element.children)) resizes.observe(child)
      measure()
    }
    observeChildren()
    // New messages add children; growing ones are caught by the resize observer.
    let frame = 0
    const mutations = new MutationObserver(() => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        observeChildren()
      })
    })
    mutations.observe(element, { childList: true })
    return () => {
      cancelAnimationFrame(frame)
      resizes.disconnect()
      mutations.disconnect()
    }
  }, [ref])

  return overflows
}

/** Tabular figures on the digits only, since LoveSans also widens letters and spaces. */
function TabularDigits({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d+)/).map((part, index) =>
        index % 2 === 1 ? (
          <span key={index} className="tabular-nums">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  )
}

// The Button primitive's disabled look, kept focusable with aria-disabled.
// Shared with Insight Cards' pager.
const pagerDisabled =
  "aria-disabled:cursor-not-allowed aria-disabled:bg-transparent aria-disabled:text-[var(--hui-color-foreground-base-tertiary)] aria-disabled:shadow-none aria-disabled:hover:bg-transparent aria-disabled:active:scale-100!"

export type ChatThreadProps = React.ComponentProps<"div"> & {
  /** Names the conversation for screen readers. */
  label: string
  /** Shown while there are no messages. */
  emptyMessage?: React.ReactNode
  /** Fixed under the messages. Put your Prompt Bar here. */
  footer?: React.ReactNode
}

/**
 * A scrolling conversation with a slot for the composer under it. It keeps
 * the newest message in view unless the person has scrolled up to read.
 */
function ChatThread({
  label,
  emptyMessage,
  footer,
  className,
  children,
  ...props
}: ChatThreadProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const isPinnedToEnd = React.useRef(true)
  const messageCount = React.Children.count(children)
  const overflows = useOverflows(scrollRef)

  React.useEffect(() => {
    const scroller = scrollRef.current
    if (scroller && isPinnedToEnd.current) scroller.scrollTop = scroller.scrollHeight
  })

  return (
    <div
      data-slot="chat-thread"
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[calc(var(--hui-radius-frame)+var(--hui-frame-padding))] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)]",
        className
      )}
      {...props}
    >
      {/* A log announces messages as they are added, in order. A Tab stop
          only while it scrolls, so it can be scrolled by keyboard. */}
      <div
        ref={scrollRef}
        role="log"
        aria-label={label}
        tabIndex={overflows ? 0 : undefined}
        onScroll={(event) => {
          const scroller = event.currentTarget
          isPinnedToEnd.current =
            scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 24
        }}
        // `relative` keeps absolutely positioned content, such as visually hidden
        // labels, inside this scroller. Without it they extend the page instead.
        className="relative flex min-h-0 flex-1 flex-col gap-[var(--hui-space-5)] overflow-y-auto rounded-[inherit] p-[var(--hui-space-4)] outline-none sm:p-[var(--hui-space-5)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]"
      >
        {messageCount === 0 && emptyMessage ? (
          <div className="m-auto text-center text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
      {/* The thread's corner is the composer's plus this inset, so they stay concentric. */}
      {footer && (
        <div data-slot="chat-thread-footer" className="shrink-0 p-[var(--hui-frame-padding)] pt-0">
          {footer}
        </div>
      )}
    </div>
  )
}

export type ChatAttachment = {
  name: string
  /** Makes the name a link to the file. */
  href?: string
  /** A short note after the name, such as "48 KB". */
  meta?: string
}

export type ChatMessageLabels = {
  attachments: string
  edit: string
  editField: string
  cancel: string
  resend: string
  editError: string
  previousVersion: string
  nextVersion: string
  version: (current: number, total: number) => string
}

export const defaultChatMessageLabels: ChatMessageLabels = {
  attachments: "Attachments",
  edit: "Edit message",
  editField: "Message",
  cancel: "Cancel",
  resend: "Send",
  editError: "The edit was not sent. Your changes are still here.",
  previousVersion: "Previous version",
  nextVersion: "Next version",
  version: (current, total) => `${current} of ${total}`,
}

const MAX_EDITOR_HEIGHT = 240

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

export type ChatMessageProps = React.ComponentProps<"div"> & {
  /** "user" sets the message in a bubble on the trailing side. */
  role: "user" | "assistant"
  /** Who is speaking, read before the message. Shown above assistant messages. */
  author: string
  /**
   * Hides the author and `meta` line from view. It is still read aloud, so a
   * screen reader can tell who is speaking. A user message always hides it.
   */
  hideAuthor?: boolean
  /** A short note beside the author, such as a time or a duration. */
  meta?: string
  /** The files sent with the message, listed above it. */
  attachments?: ChatAttachment[]
  /** The message as plain text, which fills the editor. Edit needs it and `onEdit`. */
  editText?: string
  /** Receives the edited text. Throw, or reject, to report that it was not sent. */
  onEdit?: (text: string) => void | Promise<void>
  /** Which version of the message is shown, counting from 1. */
  version?: number
  /** How many versions exist. More than one shows the buttons to move between them. */
  versionCount?: number
  onVersionChange?: (version: number) => void
  labels?: Partial<ChatMessageLabels>
}

/**
 * One message in a `ChatThread`, with its attachments, an editor, and a way
 * to move between its versions. Each of those appears only when you pass it.
 */
function ChatMessage({
  role,
  author,
  hideAuthor = false,
  meta,
  attachments = [],
  editText,
  onEdit,
  version,
  versionCount = 1,
  onVersionChange,
  labels: labelsProp,
  className,
  children,
  ...props
}: ChatMessageProps) {
  const labels = { ...defaultChatMessageLabels, ...labelsProp }
  const isUser = role === "user"
  const canEdit = editText !== undefined && onEdit !== undefined
  const hasVersions = version !== undefined && versionCount > 1

  const [isEditing, setIsEditing] = React.useState(false)
  const [draft, setDraft] = React.useState("")
  const [phase, setPhase] = React.useState<"idle" | "sending" | "error">("idle")
  const editorRef = React.useRef<HTMLTextAreaElement>(null)
  const editButtonRef = React.useRef<HTMLButtonElement>(null)
  const hasEdited = React.useRef(false)

  // Opening the editor replaces the Edit button, and closing it brings the
  // button back. Focus follows, so it is never left on a removed control.
  React.useEffect(() => {
    if (isEditing) {
      const editor = editorRef.current
      editor?.focus()
      editor?.setSelectionRange(editor.value.length, editor.value.length)
      hasEdited.current = true
    } else if (hasEdited.current) {
      editButtonRef.current?.focus()
    }
  }, [isEditing])

  React.useLayoutEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    // Grow with the text up to a limit, then scroll.
    editor.style.height = "0px"
    editor.style.height = `${Math.min(editor.scrollHeight, MAX_EDITOR_HEIGHT)}px`
    editor.style.overflowY = editor.scrollHeight > MAX_EDITOR_HEIGHT ? "auto" : "hidden"
  }, [draft, isEditing])

  const startEditing = () => {
    setDraft(editText ?? "")
    setPhase("idle")
    setIsEditing(true)
  }

  const text = draft.trim()
  const isSending = phase === "sending"

  const sendEdit = async () => {
    if (!onEdit || text === "" || isSending) return

    setPhase("sending")
    try {
      await onEdit(text)
      setPhase("idle")
      setIsEditing(false)
    } catch {
      setPhase("error")
    }
  }

  return (
    <div
      data-slot="chat-message"
      data-role={role}
      className={cn("group/message flex min-w-0 flex-col gap-[var(--hui-space-2)]", isUser && "items-end ps-[var(--hui-space-7)] sm:ps-[var(--hui-space-10)]", className)}
      {...props}
    >
      <p
        className={cn(
          "m-0 flex items-baseline gap-[var(--hui-space-2)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]",
          (isUser || hideAuthor) && "sr-only"
        )}
      >
        <span className="[font-weight:var(--hui-font-weight-medium)]">{author}</span>
        {meta && <span className="text-[var(--hui-color-foreground-base-secondary)]">{meta}</span>}
      </p>

      {attachments.length > 0 && (
        <ul
          role="list"
          aria-label={labels.attachments}
          data-slot="chat-message-attachments"
          className={cn(
            "m-0 flex max-w-full list-none flex-wrap gap-[var(--hui-space-2)] p-0",
            isUser && "justify-end"
          )}
        >
          {attachments.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className={cn(
                "flex min-w-0 max-w-full items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-neutral-primary)] px-[var(--hui-space-3)] py-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)]",
                smallText
              )}
            >
              <FileIcon aria-hidden="true" className="size-3.5 shrink-0" />
              {file.href ? (
                <a
                  href={file.href}
                  className="min-w-0 truncate rounded-[var(--hui-radius-1)] text-[var(--hui-color-foreground-base-primary)] underline underline-offset-2 outline-none focus-visible:[outline:var(--hui-focus-ring)]"
                >
                  {file.name}
                </a>
              ) : (
                <span className="min-w-0 truncate text-[var(--hui-color-foreground-base-primary)]">{file.name}</span>
              )}
              {file.meta && <span className="shrink-0">{file.meta}</span>}
            </li>
          ))}
        </ul>
      )}

      {isEditing ? (
        <form
          data-slot="chat-message-editor"
          className="flex w-full min-w-0 flex-col gap-[var(--hui-space-2)]"
          onSubmit={(event) => {
            event.preventDefault()
            void sendEdit()
          }}
        >
          <Textarea
            ref={editorRef}
            rows={1}
            value={draft}
            disabled={isSending}
            aria-label={labels.editField}
            onChange={(event) => {
              setDraft(event.target.value)
              if (phase === "error") setPhase("idle")
            }}
            onKeyDown={(event) => {
              // Enter confirms an in-progress IME composition; it must not send.
              if (event.nativeEvent.isComposing) return
              if (event.key === "Escape") {
                event.preventDefault()
                setIsEditing(false)
              } else if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                void sendEdit()
              }
            }}
            className="block min-w-0 resize-none rounded-[var(--hui-radius-4)] px-[var(--hui-space-4)] py-[var(--hui-space-3)] [font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [overflow-wrap:anywhere]"
          />
          {phase === "error" && (
            <p role="alert" className={cn("m-0 flex items-start gap-[var(--hui-space-2)]", smallText)}>
              <CircleAlertIcon
                strokeWidth={1.5}
                strokeLinecap="round"
                aria-hidden="true"
                className="mt-px size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
              />
              <span className="min-w-0 break-words">{labels.editError}</span>
            </p>
          )}
          <div className="flex items-center justify-end gap-[var(--hui-space-2)]">
            <Button variant="ghost" size="sm" disabled={isSending} onClick={() => setIsEditing(false)}>
              {labels.cancel}
            </Button>
            <Button type="submit" size="sm" disabled={isSending || text === ""}>
              {labels.resend}
            </Button>
          </div>
        </form>
      ) : (
        <div
          className={cn(
            "min-w-0 max-w-full break-words [font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]",
            isUser &&
              "rounded-[var(--hui-radius-5)] bg-[var(--hui-color-background-neutral-secondary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]"
          )}
        >
          {children}
        </div>
      )}

      {!isEditing && (canEdit || hasVersions) && (
        <div
          data-slot="chat-message-footer"
          // With a fine pointer the controls appear on hover or focus, as in most chat apps.
          // Touch screens have no hover, so the controls stay visible there.
          className={cn(
            "flex min-w-0 items-center gap-[var(--hui-space-2)] pointer-fine:opacity-0 pointer-fine:group-hover/message:opacity-100 pointer-fine:focus-within:opacity-100 motion-safe:[transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out)]",
            smallText
          )}
        >
          {hasVersions && (
            <div data-slot="chat-message-versions" className="flex items-center gap-[var(--hui-space-1)]">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={labels.previousVersion}
                // aria-disabled keeps focus on the button at either end.
                aria-disabled={version <= 1}
                className={pagerDisabled}
                onClick={() => {
                  if (version > 1) onVersionChange?.(version - 1)
                }}
              >
                <ChevronLeftIcon aria-hidden="true" />
              </Button>
              <span className="text-[var(--hui-color-foreground-base-secondary)]">
                <TabularDigits text={labels.version(version, versionCount)} />
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={labels.nextVersion}
                aria-disabled={version >= versionCount}
                className={pagerDisabled}
                onClick={() => {
                  if (version < versionCount) onVersionChange?.(version + 1)
                }}
              >
                <ChevronRightIcon aria-hidden="true" />
              </Button>
            </div>
          )}
          {canEdit && (
            <Button
              ref={editButtonRef}
              variant="ghost"
              size="icon-sm"
              aria-label={labels.edit}
              title={labels.edit}
              onClick={startEditing}
            >
              <PencilIcon aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export { ChatThread, ChatMessage }
