"use client"

import * as React from "react"

import { Queue, type QueueItem } from "@/registry/honest-ai/ai/queue"

// Messages queued while the agent works.
const sampleItems: QueueItem[] = [
  { id: "a", text: "Also check the EU invoices from March" },
  { id: "b", text: "Then draft a summary for the finance channel", meta: "1 file" },
  { id: "c", text: "Skip anything under $50" },
]

/** No agent runs here. Every action changes the list as your handlers would. */
export default function QueueDemo() {
  const [items, setItems] = React.useState(sampleItems)
  const [sent, setSent] = React.useState<string | null>(null)

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-4)]">
      <Queue
        items={items}
        onSendNow={(id) => {
          setSent(items.find((item) => item.id === id)?.text ?? null)
          setItems((current) => current.filter((item) => item.id !== id))
        }}
        onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
        onEdit={(id, text) =>
          setItems((current) => current.map((item) => (item.id === id ? { ...item, text } : item)))
        }
        onMove={(id, toIndex) =>
          setItems((current) => {
            const next = current.filter((item) => item.id !== id)
            next.splice(toIndex, 0, current.find((item) => item.id === id)!)
            return next
          })
        }
      />
      <p
        aria-live="polite"
        className="m-0 min-h-5 px-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]"
      >
        {sent ? <>Sent: {sent}</> : items.length === 0 ? "The queue is empty." : null}
      </p>
    </div>
  )
}
