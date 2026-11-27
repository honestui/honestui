"use client"

import * as React from "react"
import {
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  ChevronDown as ChevronDownIcon,
  Pencil as PencilIcon,
  SendHorizontal as SendHorizontalIcon,
  X as XIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/registry/default/ui/collapsible"
import { Textarea } from "@/registry/default/ui/textarea"

export type QueueItem = {
  id: string
  /** The message or task, as it will be sent. */
  text: string
  /** A short note after the text, such as "2 files" or "from Slack". */
  meta?: string
}

export type QueueLabels = {
  /** The header, with the count, such as "3 queued". */
  title: (count: number) => string
  sendNow: string
  edit: string
  remove: string
  moveUp: string
  moveDown: string
  save: string
  cancel: string
  /** Names the edit field for screen readers. */
  editField: string
}

export const defaultQueueLabels: QueueLabels = {
  title: (count) => `${count} queued`,
  sendNow: "Send now",
  edit: "Edit",
  remove: "Remove",
  moveUp: "Move up",
  moveDown: "Move down",
  save: "Save",
  cancel: "Cancel",
  editField: "Edit queued message",
}

export type QueueProps = Omit<React.ComponentProps<"section">, "children"> & {
  /** What waits to be sent, first to last. */
  items: QueueItem[]
  /** Passing it shows Send now on the first item. */
  onSendNow?: (id: string) => void
  /** Passing it shows Remove on every item. */
  onRemove?: (id: string) => void
  /** Passing it shows Edit on every item. Called with the new text on Save. */
  onEdit?: (id: string, text: string) => void
  /** Passing it shows Move up and Move down. Called with the item's new index. */
  onMove?: (id: string, toIndex: number) => void
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  labels?: Partial<QueueLabels>
}

const regularText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

/**
 * Messages a person has queued while the agent is busy, in the order they
 * will go. It shows the items you pass and calls back on every change; it
 * renders nothing when the queue is empty.
 */
function Queue({
  items,
  onSendNow,
  onRemove,
  onEdit,
  onMove,
  defaultOpen = true,
  open,
  onOpenChange,
  labels: labelsProp,
  className,
  ...props
}: QueueProps) {
  const labels = { ...defaultQueueLabels, ...labelsProp }
  const titleId = React.useId()
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const listRef = React.useRef<HTMLOListElement>(null)

  // A moved item keeps focus on the button that moved it, or its pair at either end.
  const pendingFocus = React.useRef<{
    id: string
    action: "moveUp" | "moveDown" | "edit" | "remove"
  } | null>(null)
  React.useEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    pendingFocus.current = null
    const row = listRef.current?.querySelector<HTMLElement>(`[data-queue-id="${CSS.escape(target.id)}"]`)
    const button =
      row?.querySelector<HTMLButtonElement>(`[data-action="${target.action}"]:not([aria-disabled="true"])`) ??
      row?.querySelector<HTMLButtonElement>(`[data-action^="move"]:not([aria-disabled="true"])`) ??
      row?.querySelector<HTMLButtonElement>("[data-action]")
    button?.focus()
  })

  if (items.length === 0) return null

  return (
    <section
      aria-labelledby={titleId}
      data-slot="queue"
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        regularText,
        className
      )}
      {...props}
    >
      <Collapsible defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger
          data-slot="queue-trigger"
          className="group/queue flex min-h-10 w-full min-w-0 items-center gap-[var(--hui-space-3)] rounded-none border-0 bg-transparent px-[var(--hui-space-5)] py-[var(--hui-space-2)] text-left outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]"
        >
          <span
            id={titleId}
            className={cn(
              "min-w-0 flex-1 tabular-nums text-[var(--hui-color-foreground-base-secondary)] [font-weight:var(--hui-font-weight-medium)]",
              metaText
            )}
          >
            {labels.title(items.length)}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)] motion-safe:transition-transform motion-safe:duration-200 group-data-panel-open/queue:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <ol
            ref={listRef}
            aria-labelledby={titleId}
            data-slot="queue-items"
            className="m-0 flex list-none flex-col border-t-[0.5px] border-[var(--hui-color-border-base-primary)] p-0"
          >
            {items.map((item, index) => (
              <QueueRow
                key={item.id}
                item={item}
                index={index}
                count={items.length}
                labels={labels}
                isEditing={editingId === item.id}
                onStartEdit={onEdit ? () => setEditingId(item.id) : undefined}
                onEndEdit={(text) => {
                  if (text !== undefined && onEdit) onEdit(item.id, text)
                  setEditingId(null)
                  pendingFocus.current = { id: item.id, action: "edit" }
                }}
                onSendNow={index === 0 && onSendNow ? () => onSendNow(item.id) : undefined}
                onRemove={
                  onRemove
                    ? () => {
                        // Focus moves to the next item's Remove, or the previous one at the end.
                        const neighbor = items[index + 1] ?? items[index - 1]
                        pendingFocus.current = neighbor ? { id: neighbor.id, action: "remove" } : null
                        onRemove(item.id)
                      }
                    : undefined
                }
                onMove={
                  onMove
                    ? (toIndex) => {
                        if (toIndex < 0 || toIndex >= items.length) return
                        pendingFocus.current = {
                          id: item.id,
                          action: toIndex < index ? "moveUp" : "moveDown",
                        }
                        onMove(item.id, toIndex)
                      }
                    : undefined
                }
              />
            ))}
          </ol>
        </CollapsiblePanel>
      </Collapsible>
    </section>
  )
}

function QueueRow({
  item,
  index,
  count,
  labels,
  isEditing,
  onStartEdit,
  onEndEdit,
  onSendNow,
  onRemove,
  onMove,
}: {
  item: QueueItem
  index: number
  count: number
  labels: QueueLabels
  isEditing: boolean
  onStartEdit?: () => void
  onEndEdit: (text?: string) => void
  onSendNow?: () => void
  onRemove?: () => void
  onMove?: (toIndex: number) => void
}) {
  const iconButton =
    "text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-base-primary)]"

  return (
    <li
      data-slot="queue-item"
      data-queue-id={item.id}
      data-editing={isEditing || undefined}
      className="group/item flex min-w-0 items-start gap-[var(--hui-space-4)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-3)] last:border-b-0"
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-[2px] w-4 shrink-0 text-center tabular-nums text-[var(--hui-color-foreground-base-secondary)]",
          metaText
        )}
      >
        {index + 1}
      </span>

      {isEditing ? (
        <QueueEditForm text={item.text} labels={labels} onEndEdit={onEndEdit} />
      ) : (
        <>
          <div className="min-w-0 flex-1 py-[2px]">
            <p className="m-0 line-clamp-2 break-words" title={item.text}>
              {item.text}
            </p>
            {item.meta && (
              <p
                className={cn(
                  "m-0 mt-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)]",
                  metaText
                )}
              >
                {item.meta}
              </p>
            )}
          </div>
          {/* Centered on the first line of text, so one-line and two-line items line up. */}
          <div className="relative mt-[2px] flex min-h-5 shrink-0 items-center gap-[var(--hui-space-2)]">
            <div
              data-slot="queue-item-actions"
              // With a mouse, the actions float over the end of the text and stay hidden until the
              // row is hovered or one of them has focus, so they never squeeze the text. On touch
              // they sit in the row and are always shown.
              className="flex shrink-0 items-center gap-[var(--hui-space-1)] motion-safe:[transition:opacity_150ms] pointer-fine:absolute pointer-fine:end-full pointer-fine:top-1/2 pointer-fine:-translate-y-1/2 pointer-fine:bg-[linear-gradient(to_right,transparent,var(--hui-color-background-base-primary)_var(--hui-space-6))] pointer-fine:ps-[var(--hui-space-7)] pointer-fine:pe-[var(--hui-space-2)] pointer-fine:opacity-0 pointer-fine:group-hover/item:opacity-100 pointer-fine:group-focus-within/item:opacity-100"
            >
              {onMove && count > 1 && (
                <>
                  <Button
                    variant="link"
                    size="icon-sm"
                    data-action="moveUp"
                    aria-label={`${labels.moveUp}: ${item.text}`}
                    title={labels.moveUp}
                    // aria-disabled keeps focus on the button at either end.
                    aria-disabled={index === 0 || undefined}
                    className={cn(iconButton, "aria-disabled:opacity-40")}
                    onClick={() => onMove(index - 1)}
                  >
                    <ArrowUpIcon aria-hidden="true" />
                  </Button>
                  <Button
                    variant="link"
                    size="icon-sm"
                    data-action="moveDown"
                    aria-label={`${labels.moveDown}: ${item.text}`}
                    title={labels.moveDown}
                    aria-disabled={index === count - 1 || undefined}
                    className={cn(iconButton, "aria-disabled:opacity-40")}
                    onClick={() => onMove(index + 1)}
                  >
                    <ArrowDownIcon aria-hidden="true" />
                  </Button>
                </>
              )}
              {onStartEdit && (
                <Button
                  variant="link"
                  size="icon-sm"
                  data-action="edit"
                  aria-label={`${labels.edit}: ${item.text}`}
                  title={labels.edit}
                  className={iconButton}
                  onClick={onStartEdit}
                >
                  <PencilIcon aria-hidden="true" />
                </Button>
              )}
              {onRemove && (
                <Button
                  variant="link"
                  size="icon-sm"
                  data-action="remove"
                  aria-label={`${labels.remove}: ${item.text}`}
                  title={labels.remove}
                  className={iconButton}
                  onClick={onRemove}
                >
                  <XIcon aria-hidden="true" />
                </Button>
              )}
            </div>
            {onSendNow && (
              <Button
                variant="secondary"
                size="xs"
                data-action="sendNow"
                data-slot="queue-send-now"
                className="shrink-0"
                aria-label={`${labels.sendNow}: ${item.text}`}
                onClick={onSendNow}
              >
                <SendHorizontalIcon aria-hidden="true" />
                {labels.sendNow}
              </Button>
            )}
          </div>
        </>
      )}
    </li>
  )
}

function QueueEditForm({
  text: initialText,
  labels,
  onEndEdit,
}: {
  text: string
  labels: QueueLabels
  onEndEdit: (text?: string) => void
}) {
  // Mounted for each edit, so the draft starts from the item's current text.
  const [draft, setDraft] = React.useState(initialText)
  const fieldRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    const field = fieldRef.current
    field?.focus()
    field?.setSelectionRange(field.value.length, field.value.length)
  }, [])

  const save = () => {
    const text = draft.trim()
    onEndEdit(text && text !== initialText ? text : undefined)
  }

  return (
    <form
      className="flex min-w-0 flex-1 flex-col gap-[var(--hui-space-3)]"
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <Textarea
        ref={fieldRef}
        size="sm"
        rows={2}
        aria-label={labels.editField}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault()
            onEndEdit()
          } else if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            save()
          }
        }}
        className="resize-none [font-size:var(--hui-font-size-regular)]"
      />
      <div className="flex justify-end gap-[var(--hui-space-2)]">
        <Button type="button" variant="ghost" size="xs" onClick={() => onEndEdit()}>
          {labels.cancel}
        </Button>
        <Button type="submit" size="xs" disabled={!draft.trim()}>
          {labels.save}
        </Button>
      </div>
    </form>
  )
}

export { Queue }
