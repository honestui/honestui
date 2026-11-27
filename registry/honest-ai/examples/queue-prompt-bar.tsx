"use client"

import * as React from "react"

import { PromptBar } from "@/registry/honest-ai/ai/prompt-bar"
import { Queue, type QueueItem } from "@/registry/honest-ai/ai/queue"

/** While the agent is busy, what the person sends waits in a queue above the composer. */
export default function QueuePromptBar() {
  const [items, setItems] = React.useState<QueueItem[]>([
    { id: "seed", text: "Then open a pull request with the fix" },
  ])

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-3)]">
      <Queue
        items={items}
        onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
        onEdit={(id, text) =>
          setItems((current) => current.map((item) => (item.id === id ? { ...item, text } : item)))
        }
      />
      <PromptBar
        placeholder="Queue a follow-up…"
        onSubmit={({ text }) =>
          text && setItems((current) => [...current, { id: `${Date.now()}`, text }])
        }
      />
    </div>
  )
}
